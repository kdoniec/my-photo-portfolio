import { defineMiddleware } from "astro:middleware";
import { createServerClient, parseCookieHeader, type CookieOptions } from "@supabase/ssr";
import type { Database } from "../db/database.types";

// Public admin routes that don't require authentication
const PUBLIC_ADMIN_ROUTES = ["/admin/login", "/admin/signup", "/admin/reset-password", "/admin/set-password"];

export const onRequest = defineMiddleware(async (context, next) => {
  // Get environment variables from Cloudflare runtime or fallback to import.meta.env
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runtime = (context.locals as any).runtime;
  const supabaseUrl = runtime?.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = runtime?.env?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  // Validate that we have the required environment variables
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      hasRuntime: !!runtime,
    });
    return new Response("Configuration error: Missing environment variables", { status: 500 });
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
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

    // Set session on Supabase client so storage operations are authenticated
    if (!error && data.user) {
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: token, // Use same token as refresh (not ideal but works for API calls)
      });
    }
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
