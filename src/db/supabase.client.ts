import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "../db/database.types.ts";

export type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

// Lazy initialization - only create client when accessed (browser-only)
let _client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_client) {
    return _client;
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Make sure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set in .env file."
    );
  }

  _client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return _client;
}

// Export as a getter that lazily initializes the client
export const supabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
