import { defineMiddleware } from "astro:middleware";
import { createServerClient, parseCookieHeader, type CookieOptions } from "@supabase/ssr";
import type { Database } from "../db/database.types";

// Public admin routes that don't require authentication
const PUBLIC_ADMIN_ROUTES = ["/admin/login", "/admin/reset-password", "/admin/set-password"];

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

  const url = new URL(context.request.url);
  const isAdminRoute = url.pathname.startsWith("/admin");
  const isPublicAdminRoute = PUBLIC_ADMIN_ROUTES.includes(url.pathname);

  // Try to get user from Bearer token first, then from session
  const authHeader = context.request.headers.get("Authorization");
  let authError: Error | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const { data, error } = await supabase.auth.getUser(token);
    context.locals.user = data.user;
    authError = error;
  } else {
    const { data, error } = await supabase.auth.getUser();
    context.locals.user = data.user;
    authError = error;
  }

  // Check for session expiration on protected admin routes
  if (isAdminRoute && !isPublicAdminRoute && authError && !context.locals.user) {
    const isExpired =
      authError.message?.includes("expired") ||
      authError.message?.includes("invalid") ||
      authError.name === "AuthSessionMissingError";

    if (isExpired) {
      const returnTo = encodeURIComponent(url.pathname + url.search);
      return context.redirect(`/admin/login?expired=true&returnTo=${returnTo}`);
    }
  }

  // Protect admin routes - redirect to login with returnTo parameter
  if (isAdminRoute && !isPublicAdminRoute && !context.locals.user) {
    const returnTo = encodeURIComponent(url.pathname + url.search);
    return context.redirect(`/admin/login?returnTo=${returnTo}`);
  }

  // Redirect to /admin/photos if user is already logged in and tries to access public auth pages
  if (isPublicAdminRoute && context.locals.user) {
    return context.redirect("/admin/photos");
  }

  return next();
});
