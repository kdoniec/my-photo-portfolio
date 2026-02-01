-- ============================================================================
-- migration: enable_rls_policies
-- purpose: enable row level security on all public tables
-- tables: profiles, photographer_settings, categories, photos
-- notes:
--   - enables rls which was disabled during development
--   - creates granular policies per operation and role
-- ============================================================================

-- ============================================================================
-- section 1: enable row level security
-- ============================================================================

alter table profiles enable row level security;
alter table photographer_settings enable row level security;
alter table categories enable row level security;
alter table photos enable row level security;

-- ============================================================================
-- section 2: rls policies for profiles table
-- ============================================================================

-- policy: authenticated users can read their own profile
-- rationale: photographers need access to their own profile data
create policy "profiles_select_own"
on profiles
for select
to authenticated
using (id = auth.uid());

-- policy: anonymous users can read all profiles
-- rationale: public "about me" page needs profile data
create policy "profiles_select_anon"
on profiles
for select
to anon
using (true);

-- policy: authenticated users can update their own profile
-- rationale: photographers can edit their own profile information
create policy "profiles_update_own"
on profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- note: insert is handled by trigger on auth.users, not by application
-- note: delete is not allowed (account deletion via supabase auth)

-- ============================================================================
-- section 3: rls policies for photographer_settings table
-- ============================================================================

-- policy: authenticated users can read their own settings
-- rationale: photographers need access to their seo settings
create policy "settings_select_own"
on photographer_settings
for select
to authenticated
using (photographer_id = auth.uid());

-- policy: anonymous users can read all settings
-- rationale: public pages need seo meta tags
create policy "settings_select_anon"
on photographer_settings
for select
to anon
using (true);

-- policy: authenticated users can update their own settings
-- rationale: photographers can edit their seo settings
create policy "settings_update_own"
on photographer_settings
for update
to authenticated
using (photographer_id = auth.uid())
with check (photographer_id = auth.uid());

-- note: insert is handled by trigger on auth.users
-- note: delete cascades when profile is deleted

-- ============================================================================
-- section 4: rls policies for categories table
-- ============================================================================

-- policy: authenticated users can read their own categories
-- rationale: photographers need access to manage their categories
create policy "categories_select_own"
on categories
for select
to authenticated
using (photographer_id = auth.uid());

-- policy: anonymous users can read categories that have published photos
-- rationale: public gallery shows only categories with visible content
create policy "categories_select_anon"
on categories
for select
to anon
using (
  exists (
    select 1 from photos
    where photos.category_id = categories.id
    and photos.is_published = true
  )
);

-- policy: authenticated users can create categories for themselves
-- rationale: photographers can organize their portfolio into categories
create policy "categories_insert_own"
on categories
for insert
to authenticated
with check (photographer_id = auth.uid());

-- policy: authenticated users can update their own categories
-- rationale: photographers can edit category names, descriptions, etc.
create policy "categories_update_own"
on categories
for update
to authenticated
using (photographer_id = auth.uid())
with check (photographer_id = auth.uid());

-- policy: authenticated users can delete their own categories
-- rationale: photographers can remove unwanted categories
create policy "categories_delete_own"
on categories
for delete
to authenticated
using (photographer_id = auth.uid());

-- ============================================================================
-- section 5: rls policies for photos table
-- ============================================================================

-- policy: authenticated users can read their own photos
-- rationale: photographers need access to manage all their photos
create policy "photos_select_own"
on photos
for select
to authenticated
using (photographer_id = auth.uid());

-- policy: anonymous users can read only published photos with a category
-- rationale: public gallery shows only published photos in categories
create policy "photos_select_anon"
on photos
for select
to anon
using (is_published = true and category_id is not null);

-- policy: authenticated users can upload photos for themselves
-- rationale: photographers can add new photos to their portfolio
create policy "photos_insert_own"
on photos
for insert
to authenticated
with check (photographer_id = auth.uid());

-- policy: authenticated users can update their own photos
-- rationale: photographers can edit photo metadata, publish/unpublish, etc.
create policy "photos_update_own"
on photos
for update
to authenticated
using (photographer_id = auth.uid())
with check (photographer_id = auth.uid());

-- policy: authenticated users can delete their own photos
-- rationale: photographers can remove photos from their portfolio
create policy "photos_delete_own"
on photos
for delete
to authenticated
using (photographer_id = auth.uid());

-- ============================================================================
-- end of migration
-- ============================================================================
