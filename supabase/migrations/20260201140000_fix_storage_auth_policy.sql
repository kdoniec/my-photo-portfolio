-- ============================================================================
-- migration: fix_storage_auth_policy
-- purpose: fix authenticated users not being able to access their own files
-- affected: storage.objects policy for authenticated users
--
-- the previous policy using storage.foldername(name)[1] might not work
-- correctly in all cases. this migration uses a simpler LIKE pattern match.
-- ============================================================================

-- drop the existing authenticated select policy
drop policy if exists "photos_bucket_select_authenticated" on storage.objects;

-- create a fixed policy using LIKE pattern for folder matching
-- this allows authenticated users to read any file in their folder
-- (files starting with their user id followed by a slash)
create policy "photos_bucket_select_authenticated"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'photos'
  and name like auth.uid()::text || '/%'
);
