# API Endpoint Implementation Plan: Public Endpoints & Stats

## 1. Przegląd punktów końcowych

Ten plan obejmuje implementację 6 endpointów API:

### Public Endpoints (bez autoryzacji)

- **GET /api/public/profile** - Publiczny profil fotografa
- **GET /api/public/settings** - Ustawienia SEO dla meta tagów
- **GET /api/public/categories** - Lista kategorii z opublikowanymi zdjęciami
- **GET /api/public/categories/:slug** - Szczegóły kategorii po slug
- **GET /api/public/categories/:slug/photos** - Lista opublikowanych zdjęć w kategorii

### Authenticated Endpoint

- **GET /api/stats** - Statystyki użycia i limity (wymaga autoryzacji)

---

## 2. Szczegóły żądań

### 2.1 GET /api/public/profile

| Właściwość   | Wartość               |
| ------------ | --------------------- |
| Metoda HTTP  | GET                   |
| URL          | `/api/public/profile` |
| Autoryzacja  | Nie wymagana          |
| Parametry    | Brak                  |
| Request Body | Brak                  |

### 2.2 GET /api/public/settings

| Właściwość   | Wartość                |
| ------------ | ---------------------- |
| Metoda HTTP  | GET                    |
| URL          | `/api/public/settings` |
| Autoryzacja  | Nie wymagana           |
| Parametry    | Brak                   |
| Request Body | Brak                   |

### 2.3 GET /api/public/categories

| Właściwość   | Wartość                  |
| ------------ | ------------------------ |
| Metoda HTTP  | GET                      |
| URL          | `/api/public/categories` |
| Autoryzacja  | Nie wymagana             |
| Parametry    | Brak                     |
| Request Body | Brak                     |

### 2.4 GET /api/public/categories/:slug

| Właściwość   | Wartość                                  |
| ------------ | ---------------------------------------- |
| Metoda HTTP  | GET                                      |
| URL          | `/api/public/categories/:slug`           |
| Autoryzacja  | Nie wymagana                             |
| Parametry    | `slug` (path parameter) - slug kategorii |
| Request Body | Brak                                     |

### 2.5 GET /api/public/categories/:slug/photos

| Właściwość      | Wartość                                                                     |
| --------------- | --------------------------------------------------------------------------- |
| Metoda HTTP     | GET                                                                         |
| URL             | `/api/public/categories/:slug/photos`                                       |
| Autoryzacja     | Nie wymagana                                                                |
| Parametry Query | `page` (opcjonalny, default: 1), `limit` (opcjonalny, default: 20, max: 50) |
| Request Body    | Brak                                                                        |

### 2.6 GET /api/stats

| Właściwość   | Wartość               |
| ------------ | --------------------- |
| Metoda HTTP  | GET                   |
| URL          | `/api/stats`          |
| Autoryzacja  | Bearer token wymagany |
| Parametry    | Brak                  |
| Request Body | Brak                  |

---

## 3. Wykorzystywane typy

### 3.1 DTOs z `src/types.ts`

```typescript
// Profile
export type PublicProfileDTO = Pick<ProfileRow, "display_name" | "bio" | "contact_email" | "contact_phone">;

// Settings
export type PublicSettingsDTO = Pick<SettingsRow, "site_title" | "site_description">;

// Categories
export interface PublicCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_photo_url: string | null;
  display_order: number;
  photos_count: number;
}

export interface PublicCategoryListResponseDTO {
  data: PublicCategoryDTO[];
}

export type PublicCategoryDetailDTO = Pick<
  PublicCategoryDTO,
  "id" | "name" | "slug" | "description" | "cover_photo_url"
>;

// Photos
export interface PublicPhotoDTO {
  id: string;
  title: string | null;
  thumbnail_url: string;
  preview_url: string;
  original_width: number;
  original_height: number;
}

export interface PublicPhotoListResponseDTO {
  data: PublicPhotoDTO[];
  pagination: PaginationDTO;
}

// Stats
export interface ResourceStats {
  count: number;
  limit: number;
}

export interface StatsDTO {
  photos: ResourceStats;
  categories: ResourceStats;
  storage_used_bytes: number | null;
}
```

### 3.2 Query Parameters

```typescript
export interface PublicPhotoListQuery {
  page?: number;
  limit?: number;
}
```

### 3.3 Zod Schemas (do utworzenia)

```typescript
// src/lib/schemas/public.schemas.ts

import { z } from "zod";

export const publicPhotoListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const categorySlugSchema = z.string().min(1).max(100);
```

---

## 4. Szczegóły odpowiedzi

### 4.1 GET /api/public/profile

**Success (200):**

```json
{
  "display_name": "string",
  "bio": "string | null",
  "contact_email": "string | null",
  "contact_phone": "string | null"
}
```

### 4.2 GET /api/public/settings

**Success (200):**

```json
{
  "site_title": "string | null",
  "site_description": "string | null"
}
```

### 4.3 GET /api/public/categories

**Success (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "description": "string | null",
      "cover_photo_url": "string | null",
      "display_order": 1,
      "photos_count": 10
    }
  ]
}
```

### 4.4 GET /api/public/categories/:slug

**Success (200):**

```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string | null",
  "cover_photo_url": "string | null"
}
```

**Error (404):**

```json
{
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category not found or has no published photos"
  }
}
```

### 4.5 GET /api/public/categories/:slug/photos

**Success (200):**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string | null",
      "thumbnail_url": "string",
      "preview_url": "string",
      "original_width": 1920,
      "original_height": 1080
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Error (404):**

```json
{
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category not found"
  }
}
```

### 4.6 GET /api/stats

**Success (200):**

```json
{
  "photos": {
    "count": 150,
    "limit": 200
  },
  "categories": {
    "count": 8,
    "limit": 10
  },
  "storage_used_bytes": 524288000
}
```

**Error (401):**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Not authenticated"
  }
}
```

---

## 5. Przepływ danych

### 5.1 GET /api/public/profile

```
Request → API Route → Supabase (anon) → profiles table (RLS: anon select)
                    → Return first profile
                    → Transform to PublicProfileDTO
                    → Response 200
```

**Uwaga:** Ponieważ aplikacja jest single-tenant (jeden fotograf), pobieramy pierwszy dostępny profil. W przyszłości można rozszerzyć o parametr identyfikujący fotografa.

### 5.2 GET /api/public/settings

```
Request → API Route → Supabase (anon) → photographer_settings table (RLS: anon select)
                    → Return first settings record
                    → Transform to PublicSettingsDTO
                    → Response 200
```

### 5.3 GET /api/public/categories

```
Request → API Route → Supabase (anon) → categories table (RLS: anon select with published photos filter)
                    → For each category:
                        → Count published photos
                        → Get cover_photo_url from photos table
                    → Sort by display_order
                    → Transform to PublicCategoryDTO[]
                    → Response 200
```

**Zapytanie SQL (realizowane przez RLS + query):**

```sql
SELECT c.*,
       COUNT(p.id) as photos_count,
       (SELECT thumbnail_path FROM photos WHERE id = c.cover_photo_id) as cover_photo_path
FROM categories c
LEFT JOIN photos p ON p.category_id = c.id AND p.is_published = true
WHERE EXISTS (
  SELECT 1 FROM photos
  WHERE photos.category_id = c.id AND photos.is_published = true
)
GROUP BY c.id
ORDER BY c.display_order ASC;
```

### 5.4 GET /api/public/categories/:slug

```
Request → Validate slug → API Route → Supabase (anon)
        → categories table WHERE slug = :slug
        → Check if category has published photos (RLS handles this)
        → If not found → 404
        → Get cover_photo_url
        → Transform to PublicCategoryDetailDTO
        → Response 200
```

### 5.5 GET /api/public/categories/:slug/photos

```
Request → Validate query params (page, limit)
        → API Route → Supabase (anon)
        → Find category by slug
        → If not found → 404
        → photos table WHERE category_id = category.id AND is_published = true
        → Paginate (offset, limit)
        → Count total
        → Transform paths to URLs
        → Transform to PublicPhotoListResponseDTO
        → Response 200
```

### 5.6 GET /api/stats

```
Request → Verify Bearer token → If invalid → 401
        → Get user from session
        → API Route → Supabase (authenticated)
        → Count photos WHERE photographer_id = user.id
        → Count categories WHERE photographer_id = user.id
        → Calculate storage used (optional: sum of file_size_bytes)
        → Transform to StatsDTO
        → Response 200
```

---

## 6. Względy bezpieczeństwa

### 6.1 Row Level Security (RLS)

Wszystkie publiczne endpointy wykorzystują RLS skonfigurowane w bazie danych:

| Tabela                | Rola | Operacja | Warunek                                           |
| --------------------- | ---- | -------- | ------------------------------------------------- |
| profiles              | anon | SELECT   | `true` (wszystkie profile)                        |
| photographer_settings | anon | SELECT   | `true` (wszystkie ustawienia)                     |
| categories            | anon | SELECT   | EXISTS (published photos in category)             |
| photos                | anon | SELECT   | `is_published = true AND category_id IS NOT NULL` |

### 6.2 Autoryzacja

- **Public endpoints:** Nie wymagają autoryzacji, używają `context.locals.supabase` z rolą `anon`
- **Stats endpoint:** Wymaga Bearer token, weryfikacja przez Supabase Auth

### 6.3 Walidacja danych wejściowych

- Slug kategorii: walidacja formatu (alfanumeryczny z myślnikami)
- Query params: walidacja Zod dla `page` i `limit`
- Limit `limit` parametru do 50 aby zapobiec nadmiernemu obciążeniu

### 6.4 Rate Limiting

Rozważyć implementację rate limiting dla publicznych endpointów (opcjonalnie w middleware).

### 6.5 Sensitive Data

Publiczne endpointy nie ujawniają:

- `photographer_id`
- `created_at`, `updated_at` (poza endpoint profile)
- Ścieżek storage (`thumbnail_path`, `preview_path`) - transformowane na pełne URLs

---

## 7. Obsługa błędów

### 7.1 Tabela błędów

| Endpoint                            | Kod błędu            | HTTP Status | Warunek                                         |
| ----------------------------------- | -------------------- | ----------- | ----------------------------------------------- |
| /api/public/profile                 | PROFILE_NOT_FOUND    | 404         | Brak profilu w bazie                            |
| /api/public/settings                | SETTINGS_NOT_FOUND   | 404         | Brak ustawień w bazie                           |
| /api/public/categories/:slug        | CATEGORY_NOT_FOUND   | 404         | Kategoria nie istnieje lub bez published photos |
| /api/public/categories/:slug/photos | CATEGORY_NOT_FOUND   | 404         | Kategoria nie istnieje                          |
| /api/public/categories/:slug/photos | INVALID_QUERY_PARAMS | 400         | Nieprawidłowe page/limit                        |
| /api/stats                          | UNAUTHORIZED         | 401         | Brak lub nieprawidłowy token                    |
| Wszystkie                           | INTERNAL_ERROR       | 500         | Błąd bazy danych lub serwera                    |

### 7.2 Format odpowiedzi błędu

```typescript
interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### 7.3 Logowanie błędów

Wszystkie błędy 500 powinny być logowane z:

- Timestamp
- Endpoint
- Error message
- Stack trace (w dev mode)

---

## 8. Rozważania dotyczące wydajności

### 8.1 Indeksy bazy danych

Wykorzystywane indeksy (już zdefiniowane w db-plan.md):

```sql
-- Partial index dla galerii publicznej
CREATE INDEX idx_photos_published_by_category
ON photos (category_id, created_at DESC)
WHERE is_published = true AND category_id IS NOT NULL;

-- Indeks dla routingu URL
CREATE INDEX idx_categories_photographer_slug
ON categories (photographer_id, slug);

-- Indeks dla sortowania kategorii
CREATE INDEX idx_categories_display_order
ON categories (photographer_id, display_order);
```

### 8.2 Optymalizacje zapytań

1. **GET /api/public/categories:**
   - Użyć pojedynczego zapytania z JOIN i agregacją zamiast N+1
   - Cache'ować wynik (kategorie zmieniają się rzadko)

2. **GET /api/public/categories/:slug/photos:**
   - Użyć `LIMIT` i `OFFSET` dla paginacji
   - Indeks partial na `is_published = true` optymalizuje zapytanie

### 8.3 Caching (opcjonalnie)

Rozważyć HTTP cache headers dla publicznych endpointów:

- `Cache-Control: public, max-age=300` (5 minut) dla kategorii
- `Cache-Control: public, max-age=60` (1 minuta) dla zdjęć

### 8.4 URL Generation

Funkcja pomocnicza do generowania URLs z paths:

```typescript
function getStoragePublicUrl(supabase: SupabaseClient, path: string): string {
  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return data.publicUrl;
}
```

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematów Zod

**Plik:** `src/lib/schemas/public.schemas.ts`

```typescript
import { z } from "zod";

export const publicPhotoListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type PublicPhotoListQueryInput = z.input<typeof publicPhotoListQuerySchema>;
```

### Krok 2: Utworzenie serwisu PublicService

**Plik:** `src/lib/services/public.service.ts`

Metody:

- `getPublicProfile(supabase: SupabaseClient): Promise<PublicProfileDTO | null>`
- `getPublicSettings(supabase: SupabaseClient): Promise<PublicSettingsDTO | null>`
- `getPublicCategories(supabase: SupabaseClient): Promise<PublicCategoryDTO[]>`
- `getPublicCategoryBySlug(supabase: SupabaseClient, slug: string): Promise<PublicCategoryDetailDTO | null>`
- `getPublicPhotosByCategory(supabase: SupabaseClient, slug: string, query: PublicPhotoListQuery): Promise<PublicPhotoListResponseDTO | null>`

### Krok 3: Utworzenie serwisu StatsService

**Plik:** `src/lib/services/stats.service.ts`

Metody:

- `getStats(supabase: SupabaseClient, userId: string): Promise<StatsDTO>`

### Krok 4: Implementacja endpointów API

#### 4.1 GET /api/public/profile

**Plik:** `src/pages/api/public/profile.ts`

```typescript
import type { APIRoute } from "astro";
import { PublicService } from "@/lib/services/public.service";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;

  const profile = await PublicService.getPublicProfile(supabase);

  if (!profile) {
    return new Response(
      JSON.stringify({
        error: { code: "PROFILE_NOT_FOUND", message: "Profile not found" },
      }),
      { status: 404 }
    );
  }

  return new Response(JSON.stringify(profile), { status: 200 });
};
```

#### 4.2 GET /api/public/settings

**Plik:** `src/pages/api/public/settings.ts`

#### 4.3 GET /api/public/categories

**Plik:** `src/pages/api/public/categories/index.ts`

#### 4.4 GET /api/public/categories/:slug

**Plik:** `src/pages/api/public/categories/[slug]/index.ts`

#### 4.5 GET /api/public/categories/:slug/photos

**Plik:** `src/pages/api/public/categories/[slug]/photos.ts`

#### 4.6 GET /api/stats

**Plik:** `src/pages/api/stats.ts`

### Krok 5: Implementacja funkcji pomocniczych

**Plik:** `src/lib/utils/storage.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";

export function getPhotoPublicUrl(supabase: SupabaseClient, path: string): string {
  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return data.publicUrl;
}
```

### Krok 6: Testowanie

1. **Unit tests** dla serwisów (PublicService, StatsService)
2. **Integration tests** dla endpointów API
3. **Manual testing** z Bruno/Postman

### Krok 7: Dokumentacja

Zaktualizować dokumentację API (Bruno collection) o nowe endpointy.

---

## 10. Struktura plików

```
src/
├── lib/
│   ├── schemas/
│   │   └── public.schemas.ts          # Nowy
│   ├── services/
│   │   ├── public.service.ts          # Nowy
│   │   └── stats.service.ts           # Nowy
│   └── utils/
│       └── storage.ts                 # Nowy (lub rozszerzenie istniejącego)
├── pages/
│   └── api/
│       ├── public/
│       │   ├── profile.ts             # Nowy
│       │   ├── settings.ts            # Nowy
│       │   └── categories/
│       │       ├── index.ts           # Nowy
│       │       └── [slug]/
│       │           ├── index.ts       # Nowy
│       │           └── photos.ts      # Nowy
│       └── stats.ts                   # Nowy
```

---

## 11. Checklist przed wdrożeniem

- [ ] Schematy Zod utworzone i wyeksportowane
- [ ] PublicService zaimplementowany z wszystkimi metodami
- [ ] StatsService zaimplementowany
- [ ] Funkcje pomocnicze dla URL storage utworzone
- [ ] Wszystkie 6 endpointów API zaimplementowanych
- [ ] RLS polityki zweryfikowane w bazie danych
- [ ] Obsługa błędów zgodna z ErrorResponseDTO
- [ ] Testy manualne wszystkich endpointów
- [ ] Dokumentacja Bruno zaktualizowana
