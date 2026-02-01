-- ============================================================================
-- migration: make_photos_bucket_private
-- purpose: change photos bucket from public to private to enforce RLS
-- affected: storage.buckets
--
-- when a bucket is public, the /object/public/ endpoint bypasses RLS policies.
-- by making the bucket private, all access must go through authenticated
-- endpoints which respect RLS policies.
--
-- IMPORTANT: application must now use signed URLs or authenticated access
-- ============================================================================

update storage.buckets
set public = false
where id = 'photos';
