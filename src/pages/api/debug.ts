import type { APIRoute } from "astro";
import { getSupabaseCredentials } from "@/lib/env";

export const prerender = false;

export const GET: APIRoute = async ({ locals, request }) => {
  const runtime = (locals as { runtime?: { env?: Record<string, string> } }).runtime;
  const { url, key } = getSupabaseCredentials(locals);

  const debug = {
    timestamp: new Date().toISOString(),
    mode: import.meta.env.MODE,
    runtime: typeof globalThis.caches !== "undefined" ? "cloudflare-workers" : "node",
    env: {
      "process.env.SUPABASE_URL": process.env.SUPABASE_URL ? `✓ ${process.env.SUPABASE_URL.substring(0, 25)}...` : "✗ missing",
      "import.meta.env.SUPABASE_URL": import.meta.env.SUPABASE_URL ? `✓ ${String(import.meta.env.SUPABASE_URL).substring(0, 25)}...` : "✗ missing",
      "runtime.env.SUPABASE_URL": runtime?.env?.SUPABASE_URL ? `✓ ${runtime.env.SUPABASE_URL.substring(0, 25)}...` : "✗ missing",
      "resolved.url": url ? `✓ ${url.substring(0, 25)}...` : "✗ missing",
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
