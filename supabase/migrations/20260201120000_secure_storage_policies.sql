-- ============================================================================
-- migration: secure_storage_policies
-- purpose: restrict access to unpublished photos in storage
-- affected: storage.buckets, storage.objects policies for 'photos' bucket
--
-- this migration fixes the security issue where unpublished photos were
-- accessible via direct url. the bucket is changed from public to private,
-- which means the /object/public/ endpoint will no longer work and RLS
-- policies will be enforced.
--
-- IMPORTANT: application must now use signed URLs for photo access
-- ============================================================================

-- ============================================================================
-- step 1: make the photos bucket private
-- public buckets bypass RLS policies on the /object/public/ endpoint
-- by setting public = false, all access goes through RLS
-- ============================================================================
update storage.buckets
set public = false
where id = 'photos';

-- ============================================================================
-- step 2: drop existing overly permissive policies
-- these policies allowed anyone to access any file in the photos bucket
-- ============================================================================

-- dropping: allows all select on photos bucket (security issue)
drop policy if exists "photos_bucket_select_all" on storage.objects;

-- dropping: allows all insert on photos bucket (security issue)
drop policy if exists "photos_bucket_insert_all" on storage.objects;

-- dropping: allows all update on photos bucket (security issue)
drop policy if exists "photos_bucket_update_all" on storage.objects;

-- dropping: allows all delete on photos bucket (security issue)
drop policy if exists "photos_bucket_delete_all" on storage.objects;

-- ============================================================================
-- step 2: create secure select policies
-- ============================================================================

-- policy: anon can only read files for published photos
-- extracts photo_id from filename (format: thumb_{uuid}.jpg or preview_{uuid}.jpg)
-- and checks if that photo is published and has a category assigned
create policy "photos_bucket_select_anon"
on storage.objects
for select
to anon
using (
  bucket_id = 'photos'
  and exists (
    select 1 from public.photos
    where photos.is_published = true
    and photos.category_id is not null
    and (
      photos.thumbnail_path = name
      or photos.preview_path = name
    )
  )
);

-- policy: authenticated users can read files in their own folder
-- folder structure: {photographer_id}/filename.jpg
-- this allows photographers to see all their photos (published and unpublished)
create policy "photos_bucket_select_authenticated"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- step 3: create secure insert policy
-- ============================================================================

-- policy: authenticated users can only upload to their own folder
create policy "photos_bucket_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- step 4: create secure update policy
-- ============================================================================

-- policy: authenticated users can only update files in their own folder
create policy "photos_bucket_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- step 5: create secure delete policy
-- ============================================================================

-- policy: authenticated users can only delete files from their own folder
create policy "photos_bucket_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
