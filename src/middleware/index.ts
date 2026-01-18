import { defineMiddleware } from "astro:middleware";
import { createServerClient, parseCookieHeader, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.request.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet: CookieOptionsWithName[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  });

  context.locals.supabase = supabase;

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  context.locals.user = user;

  return next();
});
