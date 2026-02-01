/**
 * Get Supabase credentials from Cloudflare runtime env or fallback to import.meta.env (for local dev)
 */
export function getSupabaseCredentials(locals?: App.Locals): { url: string; key: string } {
  const runtime = (locals as { runtime?: { env?: Record<string, string> } } | undefined)?.runtime;
  const url = runtime?.env?.SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
  const key = runtime?.env?.SUPABASE_KEY ?? import.meta.env.SUPABASE_KEY;

  return { url, key };
}
