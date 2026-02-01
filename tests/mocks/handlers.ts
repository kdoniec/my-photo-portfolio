import { http, HttpResponse } from "msw";
import type { StatsDTO } from "@/types";

const BASE_URL = "http://localhost:3000";

export const handlers = [
  // GET /api/stats
  http.get(`${BASE_URL}/api/stats`, () => {
    const stats: StatsDTO = {
      photos: {
        count: 50,
        limit: 200,
        published_count: 30,
      },
      categories: {
        count: 5,
        limit: 10,
      },
      storage_used_bytes: 1024000,
    };
    return HttpResponse.json(stats);
  }),

  // GET /api/categories
  http.get(`${BASE_URL}/api/categories`, () => {
    return HttpResponse.json({
      data: [
        {
          id: "cat-1",
          name: "Landscape",
          slug: "landscape",
          display_order: 1,
          photo_count: 10,
          cover_photo_url: null,
        },
        {
          id: "cat-2",
          name: "Portrait",
          slug: "portrait",
          display_order: 2,
          photo_count: 5,
          cover_photo_url: null,
        },
      ],
    });
  }),

  // POST /api/categories
  http.post(`${BASE_URL}/api/categories`, async ({ request }) => {
    const body = (await request.json()) as { name?: string; description?: string };
    return HttpResponse.json({
      id: "cat-new",
      name: body.name || "New Category",
      slug: (body.name || "new-category").toLowerCase().replace(/\s+/g, "-"),
      display_order: 3,
      photo_count: 0,
      cover_photo_url: null,
    });
  }),

  // PUT /api/categories/:id
  http.put(`${BASE_URL}/api/categories/:id`, async ({ request, params }) => {
    const body = (await request.json()) as { name?: string; description?: string };
    return HttpResponse.json({
      id: params.id,
      name: body.name || "Updated Category",
      slug: (body.name || "updated-category").toLowerCase().replace(/\s+/g, "-"),
      display_order: 1,
      photo_count: 10,
      cover_photo_url: null,
    });
  }),

  // DELETE /api/categories/:id
  http.delete(`${BASE_URL}/api/categories/:id`, () => {
    return HttpResponse.json({
      message: "Category deleted",
      affected_photos_count: 5,
    });
  }),

  // GET /api/photos
  http.get(`${BASE_URL}/api/photos`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    return HttpResponse.json({
      data: [
        {
          id: "photo-1",
          title: "Mountain View",
          category_id: "cat-1",
          category_name: "Landscape",
          thumbnail_url: "/images/thumb-1.jpg",
          preview_url: "/images/preview-1.jpg",
          is_published: true,
          original_width: 1920,
          original_height: 1080,
          created_at: new Date().toISOString(),
        },
        {
          id: "photo-2",
          title: "Ocean Sunset",
          category_id: "cat-1",
          category_name: "Landscape",
          thumbnail_url: "/images/thumb-2.jpg",
          preview_url: "/images/preview-2.jpg",
          is_published: false,
          original_width: 1920,
          original_height: 1080,
          created_at: new Date().toISOString(),
        },
      ],
      pagination: {
        page,
        limit,
        total: 50,
        total_pages: Math.ceil(50 / limit),
      },
    });
  }),

  // PUT /api/photos/:id
  http.put(`${BASE_URL}/api/photos/:id`, async ({ request, params }) => {
    const body = (await request.json()) as { title?: string; category_id?: string };
    return HttpResponse.json({
      id: params.id,
      title: body.title || "Updated Photo",
      category_id: body.category_id || "cat-1",
      category_name: "Landscape",
      thumbnail_url: "/images/thumb-1.jpg",
      preview_url: "/images/preview-1.jpg",
      is_published: true,
      original_width: 1920,
      original_height: 1080,
      created_at: new Date().toISOString(),
    });
  }),

  // PATCH /api/photos/:id/publish
  http.patch(`${BASE_URL}/api/photos/:id/publish`, async ({ request }) => {
    const body = (await request.json()) as { is_published?: boolean };
    return HttpResponse.json({
      is_published: body.is_published,
      updated_at: new Date().toISOString(),
    });
  }),

  // DELETE /api/photos/:id
  http.delete(`${BASE_URL}/api/photos/:id`, () => {
    return HttpResponse.json({ success: true });
  }),

  // POST /api/auth/login
  http.post(`${BASE_URL}/api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };

    if (body.email === "admin@example.com" && body.password === "password") {
      return HttpResponse.json({
        success: true,
        user: {
          id: "user-123",
          email: "admin@example.com",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        },
      });
    }

    if (body.email === "unconfirmed@example.com") {
      return HttpResponse.json({ error: "Email not confirmed" }, { status: 400 });
    }

    return HttpResponse.json({ error: "Invalid login credentials" }, { status: 401 });
  }),

  // POST /api/auth/logout
  http.post(`${BASE_URL}/api/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // POST /api/auth/reset-password
  http.post(`${BASE_URL}/api/auth/reset-password`, async ({ request }) => {
    const body = (await request.json()) as { email?: string };

    if (body.email === "valid@example.com") {
      return HttpResponse.json({ success: true });
    }

    if (body.email === "ratelimited@example.com") {
      return HttpResponse.json(
        { error: "For security purposes, you can only request this once every 60 seconds" },
        { status: 429 }
      );
    }

    return HttpResponse.json({ success: true });
  }),

  // POST /api/auth/set-password
  http.post(`${BASE_URL}/api/auth/set-password`, async ({ request }) => {
    const body = (await request.json()) as { password?: string; accessToken?: string };

    if (body.accessToken === "valid-token") {
      return HttpResponse.json({ success: true });
    }

    if (body.accessToken === "expired-token") {
      return HttpResponse.json({ error: "Token has expired or is invalid" }, { status: 401 });
    }

    return HttpResponse.json({ error: "Auth session missing!" }, { status: 401 });
  }),
];
