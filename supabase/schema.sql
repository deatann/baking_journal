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
-- Row Level Security: every row is only visible/writable by the user who owns it
-- ---------------------------------------------------------------------------
alter table public.recipes enable row level security;
alter table public.bakes enable row level security;
alter table public.ingredient_densities enable row level security;
alter table public.api_usage enable row level security;

drop policy if exists "recipes: owner full access" on public.recipes;
create policy "recipes: owner full access"
  on public.recipes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "bakes: owner full access" on public.bakes;
create policy "bakes: owner full access"
  on public.bakes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

-- ---------------------------------------------------------------------------
-- Storage buckets: recipe screenshots (for OCR) + bake result photos
-- Both private; accessed only via signed URLs generated for the logged-in owner.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('recipe-scans', 'recipe-scans', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('bake-photos', 'bake-photos', false)
  on conflict (id) do nothing;

-- Storage RLS: each user can only touch files under a folder named after their own user id
-- (the app uploads to `<user_id>/<filename>`, enforced here too).
drop policy if exists "recipe-scans: owner access" on storage.objects;
create policy "recipe-scans: owner access"
  on storage.objects
  for all
  using (bucket_id = 'recipe-scans' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'recipe-scans' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "bake-photos: owner access" on storage.objects;
create policy "bake-photos: owner access"
  on storage.objects
  for all
  using (bucket_id = 'bake-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'bake-photos' and auth.uid()::text = (storage.foldername(name))[1]);
