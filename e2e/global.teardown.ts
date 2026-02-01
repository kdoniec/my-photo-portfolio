/* eslint-disable no-console */
import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";

teardown("cleanup database", async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing SUPABASE_URL or SUPABASE_KEY - skipping database cleanup");
    return;
  }

  if (!testEmail || !testPassword) {
    console.warn("Missing TEST_USER_EMAIL or TEST_USER_PASSWORD - skipping database cleanup");
    return;
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  // Authenticate as test user to bypass RLS
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    console.error("Failed to authenticate for cleanup:", authError.message);
    return;
  }

  console.log("Cleaning up test data from database...");

  // First, get IDs of test categories to clean up related photos
  const { data: testCategories } = await supabase.from("categories").select("id").like("name", "Test%");

  if (testCategories && testCategories.length > 0) {
    const categoryIds = testCategories.map((c) => c.id);

    // Remove category references from photos (set category_id to null)
    const { error: photosUpdateError } = await supabase
      .from("photos")
      .update({ category_id: null })
      .in("category_id", categoryIds);

    if (photosUpdateError) {
      console.error("Error updating photos:", photosUpdateError.message);
    }

    // Remove cover_photo_id references from test categories
    const { error: coverPhotoError } = await supabase
      .from("categories")
      .update({ cover_photo_id: null })
      .in("id", categoryIds);

    if (coverPhotoError) {
      console.error("Error clearing cover photos:", coverPhotoError.message);
    }
  }

  // Delete test categories
  const { error: categoriesError, count } = await supabase
    .from("categories")
    .delete({ count: "exact" })
    .like("name", "Test%");

  if (categoriesError) {
    console.error("Error deleting test categories:", categoriesError.message);
  } else {
    console.log(`Deleted ${count ?? 0} test categories`);
  }
});
