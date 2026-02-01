-- ============================================================================
-- migration: fix_function_search_path
-- purpose: set immutable search_path on functions to prevent search path injection
-- functions: update_updated_at, set_category_display_order, update_category_cover_on_photo_delete
-- notes:
--   - fixes security warning: function_search_path_mutable
--   - uses 'set search_path = ''' to lock search path
-- ============================================================================

-- ----------------------------------------------------------------------------
-- function: update_updated_at
-- purpose: automatically update updated_at timestamp on row modification
-- ----------------------------------------------------------------------------
create or replace function update_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- function: set_category_display_order
-- purpose: automatically set display_order for new categories
-- ----------------------------------------------------------------------------
create or replace function set_category_display_order()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- if display_order not provided, set it to max + 1
  if new.display_order is null then
    select coalesce(max(display_order), 0) + 1 into new.display_order
    from public.categories
    where photographer_id = new.photographer_id;
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- function: update_category_cover_on_photo_delete
-- purpose: update category cover when its cover photo is deleted
-- ----------------------------------------------------------------------------
create or replace function update_category_cover_on_photo_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- if deleted photo was a cover, select new cover from remaining published photos
  update public.categories
  set cover_photo_id = (
    select id from public.photos
    where category_id = public.categories.id
    and is_published = true
    and id != old.id
    order by created_at desc
    limit 1
  )
  where cover_photo_id = old.id;

  return old;
end;
$$;

-- ============================================================================
-- end of migration
-- ============================================================================
