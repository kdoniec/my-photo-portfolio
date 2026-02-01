import type { APIRoute } from "astro";
import { getSupabaseCredentials } from "@/lib/env";

export const prerender = false;

export const GET: APIRoute = async ({ locals, request }) => {
  const runtime = (locals as { runtime?: { env?: Record<string, string> } }).runtime;
  const { url, key } = getSupabaseCredentials(locals);

  const debug = {
    timestamp: new Date().toISOString(),
    runtime: typeof globalThis.caches !== "undefined" ? "cloudflare-workers" : "node",
    env: {
      "import.meta.env.SUPABASE_URL": import.meta.env.SUPABASE_URL ? "✓ set" : "✗ missing",
      "import.meta.env.SUPABASE_KEY": import.meta.env.SUPABASE_KEY ? "✓ set" : "✗ missing",
      "runtime.env.SUPABASE_URL": runtime?.env?.SUPABASE_URL ? "✓ set" : "✗ missing",
      "runtime.env.SUPABASE_KEY": runtime?.env?.SUPABASE_KEY ? "✓ set" : "✗ missing",
      "resolved.url": url ? "✓ set" : "✗ missing",
      "resolved.key": key ? "✓ set" : "✗ missing",
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
