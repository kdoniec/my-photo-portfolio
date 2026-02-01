import type { APIRoute } from "astro";
import { createServerClient, parseCookieHeader, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/db/database.types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email jest wymagany" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("Cookie") ?? "").map((cookie) => ({
            name: cookie.name,
            value: cookie.value ?? "",
          }));
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies.set(name, value, options);
          });
        },
      },
    });

    const redirectTo = `${url.origin}/admin/set-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      // For security, don't reveal if email exists
      // But still return error for rate limiting messages
      if (error.message.includes("60 seconds")) {
        return new Response(
          JSON.stringify({ error: "Ze względów bezpieczeństwa możesz wysłać żądanie raz na 60 sekund" }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      // For other errors, pretend success (security best practice)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
