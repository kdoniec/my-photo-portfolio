# API Endpoint Implementation Plan: Profile

## 1. Przegląd punktu końcowego

Endpoint `/api/profile` obsługuje zarządzanie profilem zalogowanego użytkownika (fotografa). Składa się z dwóch operacji:

- **GET /api/profile** - Pobieranie danych profilu bieżącego użytkownika
- **PUT /api/profile** - Aktualizacja danych profilu bieżącego użytkownika

Profil jest powiązany 1:1 z kontem użytkownika w `auth.users` i tworzony automatycznie przez trigger przy rejestracji. Endpoint wymaga autoryzacji - tylko zalogowany użytkownik może odczytywać i modyfikować swój własny profil.

## 2. Szczegóły żądania

### GET /api/profile

| Parametr      | Lokalizacja | Wymagany | Opis                        |
| ------------- | ----------- | -------- | --------------------------- |
| Authorization | Header      | Tak      | Bearer token (access_token) |

**Request Body:** Brak

### PUT /api/profile

| Parametr      | Lokalizacja | Wymagany | Opis                        |
| ------------- | ----------- | -------- | --------------------------- |
| Authorization | Header      | Tak      | Bearer token (access_token) |

**Request Body:**

```json
{
  "display_name": "string (required, max 100 chars)",
  "bio": "string | null (optional)",
  "contact_email": "string | null (optional, valid email, max 255 chars)",
  "contact_phone": "string | null (optional, max 20 chars)"
}
```

## 3. Wykorzystywane typy

### Istniejące typy (src/types.ts)

```typescript
// Response DTO - alias dla row z bazy danych
export type ProfileDTO = ProfileRow;

// Command Model dla PUT
export interface UpdateProfileCommand {
  display_name: string;
  bio?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

// Standardowa struktura błędu
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Schemat walidacji Zod (do utworzenia)

```typescript
// src/lib/schemas/profile.schema.ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(100, "Display name must be at most 100 characters"),
  bio: z.string().nullish(),
  contact_email: z.string().email("Invalid email format").max(255, "Email must be at most 255 characters").nullish(),
  contact_phone: z.string().max(20, "Phone must be at most 20 characters").nullish(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

## 4. Szczegóły odpowiedzi

### GET /api/profile

**Sukces (200 OK):**

```json
{
  "id": "uuid",
  "display_name": "string",
  "bio": "string | null",
  "contact_email": "string | null",
  "contact_phone": "string | null",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Błędy:**

| Kod | Opis                         | Struktura                                                     |
| --- | ---------------------------- | ------------------------------------------------------------- |
| 401 | Brak lub nieprawidłowy token | `{ "error": { "code": "UNAUTHORIZED", "message": "..." } }`   |
| 404 | Profil nie istnieje          | `{ "error": { "code": "NOT_FOUND", "message": "..." } }`      |
| 500 | Błąd serwera                 | `{ "error": { "code": "INTERNAL_ERROR", "message": "..." } }` |

### PUT /api/profile

**Sukces (200 OK):** Taka sama struktura jak GET

**Błędy:**

| Kod | Opis                         | Struktura                                                                         |
| --- | ---------------------------- | --------------------------------------------------------------------------------- |
| 400 | Błąd walidacji               | `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {...} } }` |
| 401 | Brak lub nieprawidłowy token | `{ "error": { "code": "UNAUTHORIZED", "message": "..." } }`                       |
| 500 | Błąd serwera                 | `{ "error": { "code": "INTERNAL_ERROR", "message": "..." } }`                     |

## 5. Przepływ danych

### GET /api/profile

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Client    │────►│  Middleware  │────►│  API Endpoint   │────►│   Service    │
│             │     │  (auth check)│     │  profile.ts     │     │  profile.ts  │
└─────────────┘     └──────────────┘     └─────────────────┘     └──────────────┘
                                                                        │
                                                                        ▼
                                                                 ┌──────────────┐
                                                                 │   Supabase   │
                                                                 │   (RLS)      │
                                                                 └──────────────┘
```

1. Klient wysyła żądanie z tokenem Bearer w nagłówku
2. Middleware weryfikuje token i wyciąga dane użytkownika
3. API endpoint wywołuje serwis z ID użytkownika
4. Serwis wykonuje zapytanie do Supabase (RLS zapewnia dostęp tylko do własnego profilu)
5. Dane są zwracane do klienta

### PUT /api/profile

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client    │────►│  Middleware  │────►│  API Endpoint   │────►│  Validation  │────►│   Service    │
│  (+ body)   │     │  (auth check)│     │  profile.ts     │     │  (Zod)       │     │  profile.ts  │
└─────────────┘     └──────────────┘     └─────────────────┘     └──────────────┘     └──────────────┘
                                                                                             │
                                                                                             ▼
                                                                                      ┌──────────────┐
                                                                                      │   Supabase   │
                                                                                      │   (RLS)      │
                                                                                      └──────────────┘
```

1. Klient wysyła żądanie z tokenem i danymi do aktualizacji
2. Middleware weryfikuje token
3. API endpoint parsuje body żądania
4. Walidacja Zod sprawdza poprawność danych
5. Serwis wykonuje update w Supabase
6. Zaktualizowane dane są zwracane do klienta

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

- Token Bearer w nagłówku `Authorization` jest wymagany dla obu operacji
- Token jest weryfikowany przez Supabase Auth
- Middleware musi weryfikować sesję przed przekazaniem do endpointu

### Autoryzacja

- Row Level Security (RLS) w Supabase zapewnia, że użytkownik może odczytywać/modyfikować tylko swój profil
- Polityki RLS zdefiniowane w bazie:
  - `profiles_select_own`: `using (id = auth.uid())`
  - `profiles_update_own`: `using (id = auth.uid()) with check (id = auth.uid())`

### Walidacja danych

- Schemat Zod waliduje wszystkie pola wejściowe przed zapisem
- Długości pól są ograniczone zgodnie ze schematem bazy danych:
  - `display_name`: max 100 znaków
  - `contact_email`: max 255 znaków, format email
  - `contact_phone`: max 20 znaków
- Pola `bio`, `contact_email`, `contact_phone` akceptują `null`

### Sanityzacja

- Dane wejściowe są automatycznie escapowane przez Supabase SDK (parametryzowane zapytania)
- Brak ryzyka SQL injection

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz                          | Kod HTTP | Kod błędu        | Komunikat                                   |
| ----------------------------------- | -------- | ---------------- | ------------------------------------------- |
| Brak nagłówka Authorization         | 401      | UNAUTHORIZED     | Authentication required                     |
| Nieprawidłowy/wygasły token         | 401      | UNAUTHORIZED     | Invalid or expired token                    |
| Profil nie istnieje (GET)           | 404      | NOT_FOUND        | Profile not found                           |
| Brak wymaganego pola display_name   | 400      | VALIDATION_ERROR | Display name is required                    |
| display_name przekracza 100 znaków  | 400      | VALIDATION_ERROR | Display name must be at most 100 characters |
| Nieprawidłowy format email          | 400      | VALIDATION_ERROR | Invalid email format                        |
| contact_email przekracza 255 znaków | 400      | VALIDATION_ERROR | Email must be at most 255 characters        |
| contact_phone przekracza 20 znaków  | 400      | VALIDATION_ERROR | Phone must be at most 20 characters         |
| Błąd połączenia z bazą danych       | 500      | INTERNAL_ERROR   | An unexpected error occurred                |

### Struktura odpowiedzi błędu

```typescript
// Funkcja pomocnicza do tworzenia odpowiedzi błędu
function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  const body: ErrorResponseDTO = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
```

## 8. Rozważania dotyczące wydajności

### Obecna architektura

- Proste zapytanie SELECT/UPDATE na pojedynczym wierszu - bardzo szybkie
- RLS dodaje minimalny narzut (sprawdzenie `id = auth.uid()`)
- Brak potrzeby cachowania dla operacji na pojedynczym profilu

### Optymalizacje

- Indeks na `profiles.id` (PRIMARY KEY) zapewnia O(1) dostęp
- Trigger `set_profiles_updated_at` automatycznie aktualizuje `updated_at`
- Brak JOIN-ów - bezpośredni dostęp do tabeli

### Potencjalne wąskie gardła

- Walidacja tokena przez Supabase Auth (zewnętrzne wywołanie)
- Rozwiązanie: token jest cachowany po stronie klienta, weryfikacja jest szybka

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji

Utworzyć plik `src/lib/schemas/profile.schema.ts`:

```typescript
import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(100, "Display name must be at most 100 characters"),
  bio: z.string().nullish(),
  contact_email: z.string().email("Invalid email format").max(255, "Email must be at most 255 characters").nullish(),
  contact_phone: z.string().max(20, "Phone must be at most 20 characters").nullish(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

### Krok 2: Utworzenie serwisu profilu

Utworzyć plik `src/lib/services/profile.service.ts`:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { ProfileDTO, UpdateProfileCommand } from "../../types";

export class ProfileService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getProfile(userId: string): Promise<ProfileDTO | null> {
    const { data, error } = await this.supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw error;
    }

    return data;
  }

  async updateProfile(userId: string, command: UpdateProfileCommand): Promise<ProfileDTO> {
    const { data, error } = await this.supabase
      .from("profiles")
      .update({
        display_name: command.display_name,
        bio: command.bio ?? null,
        contact_email: command.contact_email ?? null,
        contact_phone: command.contact_phone ?? null,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
```

### Krok 3: Aktualizacja middleware

Zaktualizować `src/middleware/index.ts` aby obsługiwał autoryzację:

```typescript
import { defineMiddleware } from "astro:middleware";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { Database } from "../db/database.types";

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.request.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  });

  context.locals.supabase = supabase;

  // Pobierz sesję użytkownika
  const {
    data: { user },
  } = await supabase.auth.getUser();
  context.locals.user = user;

  return next();
});
```

Zaktualizować `src/env.d.ts`:

```typescript
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user: User | null;
    }
  }
}
```

### Krok 4: Utworzenie endpointu API

Utworzyć plik `src/pages/api/profile.ts`:

```typescript
import type { APIRoute } from "astro";
import { ProfileService } from "../../lib/services/profile.service";
import { updateProfileSchema } from "../../lib/schemas/profile.schema";
import type { ErrorResponseDTO } from "../../types";

export const prerender = false;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(code: string, message: string, status: number, details?: Record<string, unknown>): Response {
  const body: ErrorResponseDTO = {
    error: { code, message, ...(details && { details }) },
  };
  return jsonResponse(body, status);
}

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const profileService = new ProfileService(supabase);
    const profile = await profileService.getProfile(user.id);

    if (!profile) {
      return errorResponse("NOT_FOUND", "Profile not found", 404);
    }

    return jsonResponse(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};

export const PUT: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      });
    }

    const profileService = new ProfileService(supabase);
    const updatedProfile = await profileService.updateProfile(user.id, validation.data);

    return jsonResponse(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
```

### Krok 5: Instalacja zależności

Upewnić się, że wymagane pakiety są zainstalowane:

```bash
npm install @supabase/ssr zod
```

### Krok 6: Testy manualne

1. **Test GET bez autoryzacji:**

   ```bash
   curl -X GET http://localhost:3000/api/profile
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test GET z autoryzacją:**

   ```bash
   curl -X GET http://localhost:3000/api/profile \
     -H "Authorization: Bearer <token>"
   # Oczekiwany: 200 OK z danymi profilu
   ```

3. **Test PUT z walidacją:**

   ```bash
   curl -X PUT http://localhost:3000/api/profile \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"display_name": ""}'
   # Oczekiwany: 400 Bad Request (display_name wymagany)
   ```

4. **Test PUT poprawny:**
   ```bash
   curl -X PUT http://localhost:3000/api/profile \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"display_name": "Jan Kowalski", "bio": "Fotograf przyrody"}'
   # Oczekiwany: 200 OK z zaktualizowanymi danymi
   ```

### Krok 7: Struktura plików po implementacji

```
src/
├── lib/
│   ├── schemas/
│   │   └── profile.schema.ts      # Nowy: schemat walidacji Zod
│   └── services/
│       └── profile.service.ts     # Nowy: logika biznesowa profilu
├── pages/
│   └── api/
│       └── profile.ts             # Nowy: endpoint API
├── middleware/
│   └── index.ts                   # Zaktualizowany: obsługa auth
└── env.d.ts                       # Zaktualizowany: user w locals
```
