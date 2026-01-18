-- ============================================================================
-- migration: enable_storage_policies
-- purpose: allow all operations on photos bucket for development
-- ============================================================================

-- policy: allow all select on photos bucket
create policy "photos_bucket_select_all"
on storage.objects
for select
using (bucket_id = 'photos');

-- policy: allow all insert on photos bucket
create policy "photos_bucket_insert_all"
on storage.objects
for insert
with check (bucket_id = 'photos');

-- policy: allow all update on photos bucket
create policy "photos_bucket_update_all"
on storage.objects
for update
using (bucket_id = 'photos');

-- policy: allow all delete on photos bucket
create policy "photos_bucket_delete_all"
on storage.objects
for delete
using (bucket_id = 'photos');
