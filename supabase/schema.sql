-- Baking journal schema.
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Safe to re-run: uses "if not exists" / "or replace" where possible.

-- ---------------------------------------------------------------------------
-- shared helper: keep updated_at current on any table that uses it below
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- recipes: your modified/master recipes
-- ---------------------------------------------------------------------------
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text default 'uncategorized',
  base_yield_qty numeric,
  base_yield_unit text,           -- e.g. "cookies", "loaf", "9-inch cake"
  ingredients jsonb not null default '[]'::jsonb,
  -- ingredients shape: [{ "id": "...", "name": "flour", "qty": 250, "unit": "g", "note": "sifted" }, ...]
  steps jsonb not null default '[]'::jsonb,
  -- steps shape: ["Cream butter and sugar", "Add eggs one at a time", ...]
  prep_time_min integer,
  cook_time_min integer,
  oven_temp_c integer,
  tags text[] default array[]::text[],
  notes text default '',
  source_type text default 'manual',   -- 'manual' | 'scanned'
  source_image_path text,               -- storage path of the original screenshot, if scanned
  is_favorite boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_user_id_idx on public.recipes(user_id);
create index if not exists recipes_category_idx on public.recipes(category);

-- ---------------------------------------------------------------------------
-- bakes: journal entries / baking log, one per time you actually baked something
-- ---------------------------------------------------------------------------
create table if not exists public.bakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete set null,
  recipe_title_snapshot text,      -- kept even if the recipe is later edited/deleted
  baked_on date not null default current_date,
  scale_factor numeric not null default 1,
  rating smallint check (rating between 1 and 5),
  notes text default '',
  photo_paths text[] default array[]::text[],   -- storage paths in the "bake-photos" bucket
  created_at timestamptz not null default now()
);

create index if not exists bakes_user_id_idx on public.bakes(user_id);
create index if not exists bakes_recipe_id_idx on public.bakes(recipe_id);
create index if not exists bakes_baked_on_idx on public.bakes(baked_on desc);

-- ---------------------------------------------------------------------------
-- ingredient_densities: your own learned cup<->gram conversions.
-- Cup-to-metric conversion depends on ingredient density, which the app
-- can only guess at for anything you scoop (flour, brown sugar, etc). The
-- first time you weigh an ingredient yourself, that value is saved here,
-- keyed by ingredient name, and reused across every recipe that uses the
-- same name from then on.
-- ---------------------------------------------------------------------------
create table if not exists public.ingredient_densities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_key text not null,       -- lowercased, trimmed ingredient name
  grams_per_cup numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ingredient_key)
);

create index if not exists ingredient_densities_user_id_idx on public.ingredient_densities(user_id);

drop trigger if exists ingredient_densities_set_updated_at on public.ingredient_densities;
create trigger ingredient_densities_set_updated_at
  before update on public.ingredient_densities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- keep updated_at current on recipes
-- ---------------------------------------------------------------------------
drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- api_usage: server-side rate limiting for the paid OCR/AI-parse routes.
-- Guards against a stolen session, a buggy retry loop, or anything else
-- hammering the Vision/Gemini APIs and running up a bill. Two sliding
-- windows per (user, endpoint): a short one (catches bursts) and a daily
-- one (catches sustained abuse). increment_api_usage() does an atomic
-- upsert so concurrent requests can't race past the limit.
-- ---------------------------------------------------------------------------
create table if not exists public.api_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  window_kind text not null check (window_kind in ('short', 'day')),
  bucket_start timestamptz not null,
  count integer not null default 0,
  primary key (user_id, endpoint, window_kind, bucket_start)
);

create or replace function public.increment_api_usage(
  p_endpoint text,
  p_window_kind text,
  p_bucket_start timestamptz
) returns integer
language plpgsql
security invoker
as $$
declare
  new_count integer;
begin
  insert into public.api_usage (user_id, endpoint, window_kind, bucket_start, count)
  values (auth.uid(), p_endpoint, p_window_kind, p_bucket_start, 1)
  on conflict (user_id, endpoint, window_kind, bucket_start)
  do update set count = public.api_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security. recipes, bakes, profiles and storage are defined in the
-- shared-book block at the bottom (read: any signed-in user, write: owner only).
-- Densities and api_usage stay private to each user.
-- ---------------------------------------------------------------------------
alter table public.recipes enable row level security;
alter table public.bakes enable row level security;
alter table public.ingredient_densities enable row level security;
alter table public.api_usage enable row level security;

drop policy if exists "ingredient_densities: owner full access" on public.ingredient_densities;
create policy "ingredient_densities: owner full access"
  on public.ingredient_densities
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "api_usage: owner full access" on public.api_usage;
create policy "api_usage: owner full access"
  on public.api_usage
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage buckets (all three; avatars is public, the others are private)
insert into storage.buckets (id, name, public)
  values ('recipe-scans', 'recipe-scans', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('bake-photos', 'bake-photos', false)
  on conflict (id) do nothing;

-- ===========================================================================
-- SHARED FAMILY BOOK (same content as migration_shared_book.sql)
-- ===========================================================================

-- Shared family book migration.
-- Run once in the Supabase SQL editor. Safe to re-run.
-- What it does:
--   1. profiles table (display name + chibi path), auto-created for every account
--   2. recipes + bakes become readable by every signed-in user, editable only by their owner
--   3. recipe-scans / bake-photos storage readable by every signed-in user, writable only in own folder
--   4. public "avatars" bucket for chibis (write only in own folder)
-- Existing recipes and bakes stay owned by the account that created them.

-- 1. profiles ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read all" on public.profiles;
create policy "profiles: read all"
  on public.profiles for select to authenticated using (true);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      initcap(split_part(new.email, '@', 1))
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- give every existing account a profile
insert into public.profiles (id, display_name)
select id, initcap(split_part(email, '@', 1)) from auth.users
on conflict (id) do nothing;

-- 2. recipes + bakes: read all, write own ----------------------------------
drop policy if exists "recipes: owner full access" on public.recipes;
drop policy if exists "recipes: family read" on public.recipes;
drop policy if exists "recipes: owner insert" on public.recipes;
drop policy if exists "recipes: owner update" on public.recipes;
drop policy if exists "recipes: owner delete" on public.recipes;
create policy "recipes: family read" on public.recipes
  for select to authenticated using (true);
create policy "recipes: owner insert" on public.recipes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "recipes: owner update" on public.recipes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recipes: owner delete" on public.recipes
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "bakes: owner full access" on public.bakes;
drop policy if exists "bakes: family read" on public.bakes;
drop policy if exists "bakes: owner insert" on public.bakes;
drop policy if exists "bakes: owner update" on public.bakes;
drop policy if exists "bakes: owner delete" on public.bakes;
create policy "bakes: family read" on public.bakes
  for select to authenticated using (true);
create policy "bakes: owner insert" on public.bakes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "bakes: owner update" on public.bakes
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bakes: owner delete" on public.bakes
  for delete to authenticated using (auth.uid() = user_id);

-- 3. storage: family can read scans and bake photos, only owner writes -------
drop policy if exists "recipe-scans: owner access" on storage.objects;
drop policy if exists "recipe-scans: family read" on storage.objects;
drop policy if exists "recipe-scans: owner insert" on storage.objects;
drop policy if exists "recipe-scans: owner update" on storage.objects;
drop policy if exists "recipe-scans: owner delete" on storage.objects;
create policy "recipe-scans: family read" on storage.objects
  for select to authenticated using (bucket_id = 'recipe-scans');
create policy "recipe-scans: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recipe-scans' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "recipe-scans: owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'recipe-scans' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'recipe-scans' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "recipe-scans: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recipe-scans' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "bake-photos: owner access" on storage.objects;
drop policy if exists "bake-photos: family read" on storage.objects;
drop policy if exists "bake-photos: owner insert" on storage.objects;
drop policy if exists "bake-photos: owner update" on storage.objects;
drop policy if exists "bake-photos: owner delete" on storage.objects;
create policy "bake-photos: family read" on storage.objects
  for select to authenticated using (bucket_id = 'bake-photos');
create policy "bake-photos: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bake-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "bake-photos: owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'bake-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'bake-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "bake-photos: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bake-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- 4. avatars (chibis): public read, write only in own folder -----------------
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do update set public = true;

drop policy if exists "avatars: public read" on storage.objects;
drop policy if exists "avatars: owner insert" on storage.objects;
drop policy if exists "avatars: owner update" on storage.objects;
drop policy if exists "avatars: owner delete" on storage.objects;
create policy "avatars: public read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars: owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
