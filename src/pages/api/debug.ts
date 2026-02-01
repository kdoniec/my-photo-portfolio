import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ locals, request }) => {
  const debug = {
    timestamp: new Date().toISOString(),
    runtime: typeof globalThis.caches !== "undefined" ? "cloudflare-workers" : "node",
    env: {
      SUPABASE_URL: import.meta.env.SUPABASE_URL ? "✓ set" : "✗ missing",
      SUPABASE_KEY: import.meta.env.SUPABASE_KEY ? "✓ set" : "✗ missing",
    },
    supabase: {
      clientExists: !!locals.supabase,
    },
    request: {
      url: request.url,
      method: request.method,
    },
  };

  return new Response(JSON.stringify(debug, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
