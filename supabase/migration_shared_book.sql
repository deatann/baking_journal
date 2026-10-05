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
