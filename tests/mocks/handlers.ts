import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:3000";

export const handlers = [
  // Example: GET /api/categories
  http.get(`${BASE_URL}/api/categories`, () => {
    return HttpResponse.json([
      { id: "1", name: "Landscape", slug: "landscape", order: 1 },
      { id: "2", name: "Portrait", slug: "portrait", order: 2 },
    ]);
  }),

  // Example: GET /api/photos
  http.get(`${BASE_URL}/api/photos`, () => {
    return HttpResponse.json([
      {
        id: "1",
        title: "Mountain View",
        category_id: "1",
        thumbnail_url: "/images/thumb-1.jpg",
        preview_url: "/images/preview-1.jpg",
      },
    ]);
  }),

  // Example: POST /api/auth/login
  http.post(`${BASE_URL}/api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };

    if (body.email === "admin@example.com" && body.password === "password") {
      return HttpResponse.json({ success: true });
    }

    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),
];
