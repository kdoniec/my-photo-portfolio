-- ============================================================================
-- migration: initial_schema
-- purpose: create the complete database schema for my photo portfolio
-- tables: profiles, photographer_settings, categories, photos
-- features: rls policies, triggers, functions, storage bucket
-- notes:
--   - handles circular dependency between categories and photos
--   - creates trigger for automatic profile creation on user signup
--   - sets up storage bucket with rls policies
-- ============================================================================

-- ============================================================================
-- section 1: helper functions
-- ============================================================================

-- function: automatically update updated_at timestamp on row modification
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- section 2: create tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- table: profiles
-- purpose: stores photographer business data, linked 1:1 with auth.users
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name varchar(100) not null,
  bio text null,
  contact_email varchar(255) null,
  contact_phone varchar(20) null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add comment to table
comment on table profiles is 'photographer business profiles, linked 1:1 with auth.users';

-- enable rls on profiles
alter table profiles enable row level security;

-- trigger: auto-update updated_at on profiles
create trigger set_profiles_updated_at
before update on profiles
for each row execute function update_updated_at();

-- ----------------------------------------------------------------------------
-- table: photographer_settings
-- purpose: stores seo settings for photographer, linked 1:1 with profiles
-- ----------------------------------------------------------------------------
create table photographer_settings (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null unique references profiles(id) on delete cascade,
  site_title varchar(100) null,
  site_description varchar(300) null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add comment to table
comment on table photographer_settings is 'seo and site settings for each photographer';

-- enable rls on photographer_settings
alter table photographer_settings enable row level security;

-- trigger: auto-update updated_at on photographer_settings
create trigger set_settings_updated_at
before update on photographer_settings
for each row execute function update_updated_at();

-- ----------------------------------------------------------------------------
-- table: categories
-- purpose: stores photo categories for organizing photographer's portfolio
-- note: cover_photo_id fk will be added after photos table is created
-- ----------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references profiles(id) on delete cascade,
  name varchar(100) not null,
  slug varchar(100) not null,
  description text null,
  cover_photo_id uuid null, -- fk added later due to circular dependency
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- unique constraint: each photographer can have only one category with given slug
  constraint categories_photographer_slug_unique unique (photographer_id, slug)
);

-- add comment to table
comment on table categories is 'photo categories for organizing photographer portfolio';

-- enable rls on categories
alter table categories enable row level security;

-- trigger: auto-update updated_at on categories
create trigger set_categories_updated_at
before update on categories
for each row execute function update_updated_at();

-- ----------------------------------------------------------------------------
-- table: photos
-- purpose: stores photo metadata with references to supabase storage
-- ----------------------------------------------------------------------------
create table photos (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references profiles(id) on delete cascade,
  category_id uuid null references categories(id) on delete set null,
  title varchar(200) null,
  thumbnail_path text not null,
  preview_path text not null,
  original_width integer not null,
  original_height integer not null,
  file_size_bytes integer not null,
  mime_type varchar(50) not null default 'image/jpeg',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add comment to table
comment on table photos is 'photo metadata with references to storage paths';

-- enable rls on photos
alter table photos enable row level security;

-- trigger: auto-update updated_at on photos
create trigger set_photos_updated_at
before update on photos
for each row execute function update_updated_at();

-- ----------------------------------------------------------------------------
-- resolve circular dependency: add fk from categories.cover_photo_id to photos
-- ----------------------------------------------------------------------------
alter table categories
add constraint categories_cover_photo_id_fkey
foreign key (cover_photo_id) references photos(id) on delete set null;

-- ============================================================================
-- section 3: indexes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- indexes for photos table
-- ----------------------------------------------------------------------------

-- partial index: for public gallery (published photos in a category)
-- optimizes queries filtering by category and ordering by date
create index idx_photos_published_by_category
on photos (category_id, created_at desc)
where is_published = true and category_id is not null;

-- index: for admin panel (all photos by photographer)
create index idx_photos_by_photographer
on photos (photographer_id, created_at desc);

-- partial index: for filtering by category in admin panel
create index idx_photos_category_id
on photos (category_id)
where category_id is not null;

-- ----------------------------------------------------------------------------
-- indexes for categories table
-- ----------------------------------------------------------------------------

-- index: for url routing (lookup by slug)
create index idx_categories_photographer_slug
on categories (photographer_id, slug);

-- index: for sorting categories by display order
create index idx_categories_display_order
on categories (photographer_id, display_order);

-- ============================================================================
-- section 4: triggers and functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- function: handle_new_user
-- purpose: automatically create profile and settings when user signs up
-- security: definer to allow insert into profiles from auth trigger context
-- ----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- create profile with display_name from metadata or default
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Fotograf'));

  -- create default settings for the new photographer
  insert into public.photographer_settings (photographer_id)
  values (new.id);

  return new;
end;
$$;

-- trigger: execute handle_new_user after user signup
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- function: set_category_display_order
-- purpose: automatically set display_order for new categories
-- ----------------------------------------------------------------------------
create or replace function set_category_display_order()
returns trigger
language plpgsql
as $$
begin
  -- if display_order not provided, set it to max + 1
  if new.display_order is null then
    select coalesce(max(display_order), 0) + 1 into new.display_order
    from categories
    where photographer_id = new.photographer_id;
  end if;
  return new;
end;
$$;

-- trigger: set display_order before inserting new category
create trigger before_category_insert
before insert on categories
for each row execute function set_category_display_order();

-- ----------------------------------------------------------------------------
-- function: update_category_cover_on_photo_delete
-- purpose: update category cover when its cover photo is deleted
-- ----------------------------------------------------------------------------
create or replace function update_category_cover_on_photo_delete()
returns trigger
language plpgsql
as $$
begin
  -- if deleted photo was a cover, select new cover from remaining published photos
  update categories
  set cover_photo_id = (
    select id from photos
    where category_id = categories.id
    and is_published = true
    and id != old.id
    order by created_at desc
    limit 1
  )
  where cover_photo_id = old.id;

  return old;
end;
$$;

-- trigger: update cover photo before photo deletion
create trigger after_photo_delete
before delete on photos
for each row execute function update_category_cover_on_photo_delete();

-- ============================================================================
-- section 5: row level security (rls) policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- rls policies for profiles table
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- rls policies for photographer_settings table
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- rls policies for categories table
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- rls policies for photos table
-- ----------------------------------------------------------------------------

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
-- section 6: storage bucket and policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- create storage bucket for photos
-- public: true means files can be accessed without authentication
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true);

-- ----------------------------------------------------------------------------
-- storage rls policies
-- ----------------------------------------------------------------------------

-- policy: anonymous users can read all files in photos bucket
-- rationale: public gallery needs to display images
create policy "photos_bucket_select_anon"
on storage.objects
for select
to anon
using (bucket_id = 'photos');

-- policy: authenticated users can read all files in photos bucket
-- rationale: photographers need to see images in admin panel
create policy "photos_bucket_select_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'photos');

-- policy: authenticated users can upload to their own folder
-- rationale: photographers can only upload to {user_id}/ folder
-- structure: photos/{photographer_id}/thumb_{photo_id}.jpg
create policy "photos_bucket_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- policy: authenticated users can delete from their own folder
-- rationale: photographers can only delete their own files
create policy "photos_bucket_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- end of migration
-- ============================================================================
