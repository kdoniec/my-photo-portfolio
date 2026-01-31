import { defineMiddleware } from "astro:middleware";
import { createServerClient, parseCookieHeader, type CookieOptions } from "@supabase/ssr";
import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.request.headers.get("Cookie") ?? "").map((cookie) => ({
          name: cookie.name,
          value: cookie.value ?? "",
        }));
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  });

  context.locals.supabase = supabase;

  // Try to get user from Bearer token first, then from session
  const authHeader = context.request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    context.locals.user = user;
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    context.locals.user = user;
  }

  // Protect /admin/* routes (except /admin/login)
  const url = new URL(context.request.url);
  const isAdminRoute = url.pathname.startsWith("/admin");
  const isLoginPage = url.pathname === "/admin/login";

  if (isAdminRoute && !isLoginPage && !context.locals.user) {
    return context.redirect("/admin/login");
  }

  // Redirect to /admin/photos if user is already logged in and tries to access /admin/login
  if (isLoginPage && context.locals.user) {
    return context.redirect("/admin/photos");
  }

  return next();
});
