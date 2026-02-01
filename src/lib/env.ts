/**
 * Get Supabase credentials from multiple sources:
 * - Production (Cloudflare): use runtime.env
 * - Local dev: use process.env (set in astro.config from mode-specific .env files)
 */
export function getSupabaseCredentials(locals?: App.Locals): { url: string; key: string } {
  const runtime = (locals as { runtime?: { env?: Record<string, string> } } | undefined)?.runtime;

  // Check if we're on actual Cloudflare Workers (not local dev with Cloudflare adapter)
  const isCloudflareProduction = typeof globalThis.caches !== "undefined";

  let url: string;
  let key: string;

  if (isCloudflareProduction && runtime?.env?.SUPABASE_URL) {
    // On Cloudflare Workers, use runtime env bindings
    url = runtime.env.SUPABASE_URL;
    key = runtime.env.SUPABASE_KEY;
  } else if (typeof process !== "undefined" && process.env.SUPABASE_URL) {
    // Local dev: use process.env (populated from mode-specific .env files in astro.config)
    url = process.env.SUPABASE_URL;
    key = process.env.SUPABASE_KEY ?? "";
  } else {
    // Fallback to import.meta.env
    url = import.meta.env.SUPABASE_URL;
    key = import.meta.env.SUPABASE_KEY;
  }

  return { url, key };
}
