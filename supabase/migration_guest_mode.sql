-- Guest mode + recipe cover photos migration.
-- Run once in the Supabase SQL editor AFTER migration_shared_book.sql. Safe to re-run.
-- What it does:
--   1. recipes.is_public / bakes.is_public (default false = private) and recipes.cover_path
--   2. signed-out visitors (role "anon") can read ONLY rows marked public
--   3. signed-out visitors can read the photos of public bakes, nothing else in private buckets
--   4. signed-out visitors can read the name + chibi of people who published something
--   5. public "recipe-covers" bucket for cover photos (write only in own folder)
-- Original recipe screenshots (recipe-scans) stay fully private.

-- 1. columns ----------------------------------------------------------------
alter table public.recipes add column if not exists is_public boolean not null default false;
alter table public.recipes add column if not exists cover_path text;
alter table public.bakes   add column if not exists is_public boolean not null default false;

create index if not exists recipes_is_public_idx on public.recipes (is_public) where is_public;
create index if not exists bakes_is_public_idx   on public.bakes   (is_public) where is_public;

-- 2. anon can read public rows ---------------------------------------------
drop policy if exists "recipes: public read" on public.recipes;
create policy "recipes: public read" on public.recipes
  for select to anon using (is_public);

drop policy if exists "bakes: public read" on public.bakes;
create policy "bakes: public read" on public.bakes
  for select to anon using (is_public);

-- 3. anon can read photos that belong to public bakes -----------------------
drop policy if exists "bake-photos: public bakes read" on storage.objects;
create policy "bake-photos: public bakes read" on storage.objects
  for select to anon
  using (
    bucket_id = 'bake-photos'
    and exists (
      select 1 from public.bakes b
      where b.is_public and storage.objects.name = any (b.photo_paths)
    )
  );

-- 4. anon can read profiles of people who published something ---------------
drop policy if exists "profiles: public authors read" on public.profiles;
create policy "profiles: public authors read" on public.profiles
  for select to anon
  using (
    exists (select 1 from public.recipes r where r.user_id = profiles.id and r.is_public)
    or exists (select 1 from public.bakes b where b.user_id = profiles.id and b.is_public)
  );

-- 5. recipe-covers: public read, write only in own folder -------------------
insert into storage.buckets (id, name, public)
  values ('recipe-covers', 'recipe-covers', true)
  on conflict (id) do update set public = true;

drop policy if exists "recipe-covers: public read" on storage.objects;
drop policy if exists "recipe-covers: owner insert" on storage.objects;
drop policy if exists "recipe-covers: owner update" on storage.objects;
drop policy if exists "recipe-covers: owner delete" on storage.objects;
create policy "recipe-covers: public read" on storage.objects
  for select using (bucket_id = 'recipe-covers');
create policy "recipe-covers: owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recipe-covers' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "recipe-covers: owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'recipe-covers' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'recipe-covers' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "recipe-covers: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recipe-covers' and auth.uid()::text = (storage.foldername(name))[1]);
