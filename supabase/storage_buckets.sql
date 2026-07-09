-- =============================================================================
-- TruckDash + Cluckin Chaos · Supabase Storage buckets
-- Run in Supabase Dashboard → SQL Editor (once per project)
-- =============================================================================

-- 1) Buckets (public = anonymous read via /storage/v1/object/public/...)
-- allowed_mime_types = null → accept any content type (avoids JSON mime rejections)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'menu-data',
    'menu-data',
    true,
    5242880,
    null
  ),
  (
    'menu-images',
    'menu-images',
    true,
    10485760,
    null
  )
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = null;

-- Force public + open mime on every re-run
update storage.buckets
set public = true, allowed_mime_types = null
where id in ('menu-data', 'menu-images');

-- 2) RLS on storage.objects
-- Drop old policies (all name variants we have used)
drop policy if exists "Public read menu-data" on storage.objects;
drop policy if exists "Public read menu-images" on storage.objects;
drop policy if exists "Owners insert menu-data" on storage.objects;
drop policy if exists "Owners update menu-data" on storage.objects;
drop policy if exists "Owners delete menu-data" on storage.objects;
drop policy if exists "Owners insert menu-images" on storage.objects;
drop policy if exists "Owners update menu-images" on storage.objects;
drop policy if exists "Owners delete menu-images" on storage.objects;
drop policy if exists "Authenticated all menu-data" on storage.objects;
drop policy if exists "Authenticated all menu-images" on storage.objects;

-- Public read (required for Cluckin Chaos + CDN public URLs)
create policy "Public read menu-data"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-data');

create policy "Public read menu-images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-images');

-- Authenticated owners: full write access (insert/update/delete for upsert + overwrite)
create policy "Authenticated all menu-data"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'menu-data')
  with check (bucket_id = 'menu-data');

create policy "Authenticated all menu-images"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'menu-images')
  with check (bucket_id = 'menu-images');

-- Explicit insert/update/delete (some Supabase versions prefer these over FOR ALL)
create policy "Owners insert menu-data"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-data');

create policy "Owners update menu-data"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-data')
  with check (bucket_id = 'menu-data');

create policy "Owners delete menu-data"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-data');

create policy "Owners insert menu-images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-images');

create policy "Owners update menu-images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-images')
  with check (bucket_id = 'menu-images');

create policy "Owners delete menu-images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-images');
