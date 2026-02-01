import type { APIRoute } from "astro";
import { createServerClient, parseCookieHeader, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/db/database.types";
import { getSupabaseCredentials } from "@/lib/env";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const { password, accessToken } = await request.json();

    if (!password) {
      return new Response(JSON.stringify({ error: "Hasło jest wymagane" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Brak tokenu autoryzacji" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { url: supabaseUrl, key: supabaseKey } = getSupabaseCredentials(locals);
    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
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

    // Set the session using the access token from the recovery link
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: "",
    });

    if (sessionError) {
      return new Response(
        JSON.stringify({ error: "Link resetujący wygasł lub jest nieprawidłowy. Wygeneruj nowy link." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      let errorMessage = "Wystąpił błąd podczas zmiany hasła";
      if (updateError.message.includes("same as")) {
        errorMessage = "Nowe hasło musi być inne niż poprzednie";
      } else if (updateError.message.includes("weak")) {
        errorMessage = "Hasło jest zbyt słabe";
      }
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sign out
    await supabase.auth.signOut();

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
