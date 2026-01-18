# API Endpoint Implementation Plan: Settings (SEO)

## 1. Przegląd punktu końcowego

Endpoint `/api/settings` służy do zarządzania ustawieniami SEO fotografa. Umożliwia pobieranie (GET) oraz aktualizację (PUT) danych takich jak tytuł strony i opis strony. Dane są przechowywane w tabeli `photographer_settings` i powiązane 1:1 z profilem użytkownika poprzez `photographer_id`.

Endpoint wymaga uwierzytelnienia za pomocą Bearer token. Każdy użytkownik może odczytywać i modyfikować tylko swoje własne ustawienia (zabezpieczone przez RLS).

## 2. Szczegóły żądania

### GET /api/settings

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/settings`
- **Parametry:**
  - Wymagane: Brak
  - Opcjonalne: Brak
- **Nagłówki:**
  - `Authorization: Bearer <access_token>` (wymagany)
- **Request Body:** Brak

### PUT /api/settings

- **Metoda HTTP:** PUT
- **Struktura URL:** `/api/settings`
- **Parametry:**
  - Wymagane: Brak
  - Opcjonalne: Brak
- **Nagłówki:**
  - `Authorization: Bearer <access_token>` (wymagany)
- **Request Body:**

```json
{
  "site_title": "string | null (max 100 znaków, opcjonalne)",
  "site_description": "string | null (max 300 znaków, opcjonalne)"
}
```

## 3. Wykorzystywane typy

### DTO (Data Transfer Object)

```typescript
// Z src/types.ts - już zdefiniowane
export type SettingsDTO = SettingsRow;
// Mapuje do: { id, photographer_id, site_title, site_description, created_at, updated_at }
```

### Command Model

```typescript
// Z src/types.ts - już zdefiniowane
export interface UpdateSettingsCommand {
  site_title?: string | null;
  site_description?: string | null;
}
```

### Zod Schema (do utworzenia)

```typescript
// src/lib/schemas/settings.schema.ts
import { z } from "zod";

export const updateSettingsSchema = z.object({
  site_title: z
    .string()
    .max(100, "Site title must be at most 100 characters")
    .nullish(),
  site_description: z
    .string()
    .max(300, "Site description must be at most 300 characters")
    .nullish(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
```

## 4. Szczegóły odpowiedzi

### GET /api/settings

**Success Response (200 OK):**

```json
{
  "id": "uuid",
  "photographer_id": "uuid",
  "site_title": "string | null",
  "site_description": "string | null",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**

| Status | Kod błędu       | Opis                    |
| ------ | --------------- | ----------------------- |
| 401    | UNAUTHORIZED    | Brak uwierzytelnienia   |
| 404    | NOT_FOUND       | Ustawienia nie istnieją |
| 500    | INTERNAL_ERROR  | Błąd serwera            |

### PUT /api/settings

**Success Response (200 OK):**

```json
{
  "id": "uuid",
  "photographer_id": "uuid",
  "site_title": "Updated Title",
  "site_description": "Updated description",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T12:45:00Z"
}
```

**Error Responses:**

| Status | Kod błędu        | Opis                             |
| ------ | ---------------- | -------------------------------- |
| 400    | VALIDATION_ERROR | Nieprawidłowe dane wejściowe     |
| 401    | UNAUTHORIZED     | Brak uwierzytelnienia            |
| 500    | INTERNAL_ERROR   | Błąd serwera                     |

## 5. Przepływ danych

### GET /api/settings

```
1. Request → Middleware (auth extraction)
2. Middleware → API Route (user w locals)
3. API Route → Sprawdzenie auth (user !== null)
4. API Route → SettingsService.getSettings(userId)
5. SettingsService → Supabase (SELECT FROM photographer_settings WHERE photographer_id = userId)
6. Supabase → RLS Policy (settings_select_own)
7. SettingsService → API Route (SettingsDTO | null)
8. API Route → Response (200 OK lub 404 Not Found)
```

### PUT /api/settings

```
1. Request → Middleware (auth extraction)
2. Middleware → API Route (user w locals)
3. API Route → Sprawdzenie auth (user !== null)
4. API Route → Parse JSON body
5. API Route → Zod validation (updateSettingsSchema)
6. API Route → SettingsService.updateSettings(userId, command)
7. SettingsService → Supabase (UPDATE photographer_settings SET ... WHERE photographer_id = userId)
8. Supabase → RLS Policy (settings_update_own)
9. Supabase → Trigger (update_updated_at)
10. SettingsService → API Route (SettingsDTO)
11. API Route → Response (200 OK)
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

- Bearer token wymagany w nagłówku `Authorization`
- Token weryfikowany przez middleware (`src/middleware/index.ts`)
- User dostępny w `context.locals.user`

### Autoryzacja

- RLS policies w Supabase:
  - `settings_select_own`: SELECT tylko dla `photographer_id = auth.uid()`
  - `settings_update_own`: UPDATE tylko dla `photographer_id = auth.uid()`
- Dodatkowa walidacja w API route: sprawdzenie czy `user !== null`

### Walidacja danych

- Zod schema dla walidacji request body
- Ograniczenia długości pól zgodne z bazą danych:
  - `site_title`: max 100 znaków
  - `site_description`: max 300 znaków
- Obsługa `null` i `undefined` dla opcjonalnych pól

### Ochrona przed atakami

- Brak ryzyka SQL injection (Supabase SDK z parametryzowanymi zapytaniami)
- Brak ryzyka XSS (dane nie są renderowane jako HTML w API)
- Rate limiting do rozważenia w przyszłości

## 7. Obsługa błędów

### Scenariusze błędów

| Scenariusz                    | Status | Kod błędu        | Wiadomość                        |
| ----------------------------- | ------ | ---------------- | -------------------------------- |
| Brak tokenu auth              | 401    | UNAUTHORIZED     | Authentication required          |
| Nieprawidłowy token           | 401    | UNAUTHORIZED     | Authentication required          |
| Ustawienia nie znalezione     | 404    | NOT_FOUND        | Settings not found               |
| Nieprawidłowy JSON            | 400    | VALIDATION_ERROR | Invalid JSON body                |
| Walidacja Zod nieudana        | 400    | VALIDATION_ERROR | [Szczegóły błędu walidacji]      |
| Błąd bazy danych              | 500    | INTERNAL_ERROR   | An unexpected error occurred     |
| Nieoczekiwany błąd            | 500    | INTERNAL_ERROR   | An unexpected error occurred     |

### Logowanie błędów

```typescript
// Logowanie do konsoli (w przyszłości można rozszerzyć o zewnętrzny system)
console.error("Error fetching settings:", error);
console.error("Error updating settings:", error);
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje

- **Single query**: Operacje GET i PUT używają pojedynczych zapytań SQL
- **Indeksy**: `photographer_id` ma UNIQUE constraint, który tworzy indeks automatycznie
- **RLS**: Polityki są proste i nie wymagają złożonych subquery

### Potencjalne wąskie gardła

- Brak zidentyfikowanych wąskich gardeł dla tego prostego endpointu
- W przypadku dużego ruchu rozważyć caching (np. Redis) dla GET

### Monitoring

- Logowanie czasów odpowiedzi do przyszłej analizy
- Supabase Dashboard dla monitoringu bazy danych

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Zod schema

Plik: `src/lib/schemas/settings.schema.ts`

```typescript
import { z } from "zod";

export const updateSettingsSchema = z.object({
  site_title: z
    .string()
    .max(100, "Site title must be at most 100 characters")
    .nullish(),
  site_description: z
    .string()
    .max(300, "Site description must be at most 300 characters")
    .nullish(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
```

### Krok 2: Utworzenie SettingsService

Plik: `src/lib/services/settings.service.ts`

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { SettingsDTO, UpdateSettingsCommand } from "../../types";

export class SettingsService {
  constructor(private supabase: SupabaseClient) {}

  async getSettings(userId: string): Promise<SettingsDTO | null> {
    const { data, error } = await this.supabase
      .from("photographer_settings")
      .select("*")
      .eq("photographer_id", userId)
      .single();

    if (error) {
      // PGRST116 = Row not found
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  async updateSettings(
    userId: string,
    command: UpdateSettingsCommand
  ): Promise<SettingsDTO> {
    const { data, error } = await this.supabase
      .from("photographer_settings")
      .update({
        site_title: command.site_title ?? null,
        site_description: command.site_description ?? null,
      })
      .eq("photographer_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
```

### Krok 3: Utworzenie API Route

Plik: `src/pages/api/settings.ts`

```typescript
import type { APIRoute } from "astro";
import { SettingsService } from "../../lib/services/settings.service";
import { updateSettingsSchema } from "../../lib/schemas/settings.schema";
import { jsonResponse, errorResponse } from "../../lib/api-utils";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;

  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const settingsService = new SettingsService(supabase);
    const settings = await settingsService.getSettings(user.id);

    if (!settings) {
      return errorResponse("NOT_FOUND", "Settings not found", 404);
    }

    return jsonResponse(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
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
    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
        field: firstError.path.join("."),
        errors: validation.error.errors,
      });
    }

    const settingsService = new SettingsService(supabase);
    const updatedSettings = await settingsService.updateSettings(
      user.id,
      validation.data
    );

    return jsonResponse(updatedSettings);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON body", 400);
    }
    console.error("Error updating settings:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
```

### Krok 4: Testowanie

1. **Test GET bez auth:**
   ```bash
   curl -X GET http://localhost:3000/api/settings
   # Oczekiwany: 401 Unauthorized
   ```

2. **Test GET z auth:**
   ```bash
   curl -X GET http://localhost:3000/api/settings \
     -H "Authorization: Bearer <token>"
   # Oczekiwany: 200 OK z SettingsDTO
   ```

3. **Test PUT z walidacją:**
   ```bash
   curl -X PUT http://localhost:3000/api/settings \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"site_title": "My Portfolio", "site_description": "Professional photography"}'
   # Oczekiwany: 200 OK z zaktualizowanym SettingsDTO
   ```

4. **Test PUT z błędem walidacji:**
   ```bash
   curl -X PUT http://localhost:3000/api/settings \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"site_title": "x".repeat(101)}'
   # Oczekiwany: 400 Bad Request z VALIDATION_ERROR
   ```

### Krok 5: Dokumentacja

- Dodać endpoint do dokumentacji API (jeśli istnieje)
- Zaktualizować Postman/Bruno collection z nowymi endpointami
