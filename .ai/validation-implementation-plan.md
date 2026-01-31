# API Validation and Business Logic Implementation Plan

## 1. Przegląd

Ten dokument zawiera szczegółowy plan implementacji walidacji i logiki biznesowej dla REST API aplikacji My Photo Portfolio. Plan obejmuje:

- Reguły walidacji dla wszystkich encji (Profile, Settings, Category, Photo)
- Logikę biznesową (generowanie slug, limity, przetwarzanie obrazów)
- Obsługę błędów i spójność odpowiedzi API
- Integrację z istniejącymi wzorcami w kodzie

### Status implementacji

| Komponent | Status | Lokalizacja |
|-----------|--------|-------------|
| Profile Schema | ✅ Zaimplementowane | `src/lib/schemas/profile.schema.ts` |
| Settings Schema | ✅ Zaimplementowane | `src/lib/schemas/settings.schema.ts` |
| Category Schema | ✅ Zaimplementowane | `src/lib/schemas/category.schema.ts` |
| Photo Schema | ✅ Zaimplementowane | `src/lib/schemas/photo.schema.ts` |
| Slug Generation | ✅ Zaimplementowane | `src/lib/utils/slug.ts` |
| Limits Enforcement | ✅ Zaimplementowane | Services (CategoryService, PhotoService) |
| API Response Utils | ✅ Zaimplementowane | `src/lib/api-utils.ts` |

---

## 2. Szczegóły walidacji

### 2.1 Profile Validation

**Lokalizacja:** `src/lib/schemas/profile.schema.ts`

| Pole | Typ | Ograniczenia | Zod Schema |
|------|-----|--------------|------------|
| `display_name` | string | Required, max 100 znaków | `.min(1).max(100)` |
| `bio` | string | Optional, bez limitu | `.nullish()` |
| `contact_email` | string | Optional, valid email, max 255 | `.email().max(255).nullish()` |
| `contact_phone` | string | Optional, max 20 znaków | `.max(20).nullish()` |

**Istniejąca implementacja:**
```typescript
// src/lib/schemas/profile.schema.ts
export const updateProfileSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(100),
  bio: z.string().nullish(),
  contact_email: z.string().email("Invalid email format").max(255).nullish(),
  contact_phone: z.string().max(20).nullish(),
});
```

### 2.2 Settings Validation

**Lokalizacja:** `src/lib/schemas/settings.schema.ts`

| Pole | Typ | Ograniczenia | Zod Schema |
|------|-----|--------------|------------|
| `site_title` | string | Optional, max 100 znaków | `.max(100).nullish()` |
| `site_description` | string | Optional, max 300 znaków | `.max(300).nullish()` |

**Istniejąca implementacja:**
```typescript
// src/lib/schemas/settings.schema.ts
export const updateSettingsSchema = z.object({
  site_title: z.string().max(100).nullish(),
  site_description: z.string().max(300).nullish(),
});
```

### 2.3 Category Validation

**Lokalizacja:** `src/lib/schemas/category.schema.ts`

| Pole | Typ | Ograniczenia | Zod Schema |
|------|-----|--------------|------------|
| `name` | string | Required, max 100 znaków | `.min(1).max(100)` |
| `slug` | string | Auto-generated, unique per photographer | N/A (generowany przez service) |
| `description` | string | Optional, max 500 znaków | `.max(500).nullish()` |
| `cover_photo_id` | uuid | Optional, musi należeć do fotografa | `.uuid().nullish()` |
| `display_order` | integer | Auto-assigned | N/A (generowany przez service) |

**Istniejące schematy:**
```typescript
// src/lib/schemas/category.schema.ts
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullish(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullish(),
  cover_photo_id: z.string().uuid().nullish(),
});

export const reorderCategorySchema = z.object({
  order: z.array(z.object({
    id: z.string().uuid(),
    display_order: z.number().int().min(0),
  })).min(1),
});

export const categoryIdSchema = z.string().uuid();

export const categoryListQuerySchema = z.object({
  sort: z.enum(["display_order", "name", "created_at"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
```

### 2.4 Photo Validation

**Lokalizacja:** `src/lib/schemas/photo.schema.ts`

| Pole | Typ | Ograniczenia | Zod Schema / Helper |
|------|-----|--------------|---------------------|
| `file` | file | Required, JPEG only, max 10MB | `validatePhotoFile()` |
| `title` | string | Optional, max 200 znaków | `.max(200).nullish()` |
| `category_id` | uuid | Optional, musi należeć do fotografa | `.uuid().nullish()` |
| `is_published` | boolean | Default: false | `.boolean().default(false)` |

**Istniejące schematy i helpery:**
```typescript
// Stałe
export const ALLOWED_MIME_TYPES = ["image/jpeg"] as const;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_PHOTOS = 200;

// Typy błędów walidacji pliku
export type FileValidationErrorCode = "REQUIRED" | "INVALID_TYPE" | "FILE_TOO_LARGE";
export interface FileValidationError {
  code: FileValidationErrorCode;
  message: string;
}

// Walidacja pliku (zwraca obiekt z kodem błędu dla właściwego HTTP status)
export function validatePhotoFile(
  file: File | null | undefined,
  fieldName: string
): { success: true; data: File } | { success: false; error: FileValidationError } {
  if (!file || !(file instanceof File)) {
    return { success: false, error: { code: "REQUIRED", message: `${fieldName} is required` } };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return { success: false, error: { code: "INVALID_TYPE", message: `${fieldName} must be JPEG` } };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: { code: "FILE_TOO_LARGE", message: `${fieldName} must be at most 10MB` } };
  }
  return { success: true, data: file };
}

// Schematy
export const createPhotoMetadataSchema = z.object({
  title: z.string().max(200).nullish(),
  category_id: z.string().uuid().nullish(),
  is_published: z.coerce.boolean().default(false),
});

export const updatePhotoSchema = z.object({
  title: z.string().max(200).nullish(),
  category_id: z.string().uuid().nullish(),
  is_published: z.boolean().optional(),
});

export const publishPhotoSchema = z.object({
  is_published: z.boolean({ required_error: "is_published is required" }),
});

export const photoListQuerySchema = z.object({
  category_id: z.union([z.string().uuid(), z.literal("uncategorized")]).optional(),
  is_published: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["created_at", "title"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
```

---

## 3. Wykorzystywane typy

### 3.1 DTOs (Data Transfer Objects)

**Lokalizacja:** `src/types.ts`

```typescript
// Profile
export type ProfileDTO = ProfileRow;
export type PublicProfileDTO = Pick<ProfileRow, "display_name" | "bio" | "contact_email" | "contact_phone">;

// Settings
export type SettingsDTO = SettingsRow;
export type PublicSettingsDTO = Pick<SettingsRow, "site_title" | "site_description">;

// Category
export interface CategoryDTO extends Omit<CategoryRow, "photographer_id"> {
  cover_photo_url: string | null;
  photos_count: number;
}
export interface CategoryListResponseDTO {
  data: CategoryDTO[];
  total: number;
  limit: number;
}
export interface DeleteCategoryResponseDTO extends MessageResponseDTO {
  affected_photos_count: number;
}

// Photo
export interface PhotoDTO extends Omit<PhotoRow, "photographer_id" | "thumbnail_path" | "preview_path"> {
  thumbnail_url: string;
  preview_url: string;
  category_name: string | null;
}
export interface PhotoListResponseDTO {
  data: PhotoDTO[];
  pagination: PaginationDTO;
}
export interface PublishPhotoResponseDTO {
  id: string;
  is_published: boolean;
  updated_at: string;
}
export interface BatchPhotoUploadResponseDTO {
  uploaded: BatchUploadedPhoto[];
  failed: BatchFailedPhoto[];
  summary: BatchUploadSummary;
}
```

### 3.2 Command Models

```typescript
// Profile
export interface UpdateProfileCommand {
  display_name: string;
  bio?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

// Settings
export interface UpdateSettingsCommand {
  site_title?: string | null;
  site_description?: string | null;
}

// Category
export interface CreateCategoryCommand {
  name: string;
  description?: string | null;
}
export interface UpdateCategoryCommand {
  name: string;
  description?: string | null;
  cover_photo_id?: string | null;
}
export interface ReorderCategoryCommand {
  order: CategoryOrderItem[];
}

// Photo
export interface CreatePhotoCommand {
  title?: string | null;
  category_id?: string | null;
  is_published?: boolean;
}
export interface UpdatePhotoCommand {
  title?: string | null;
  category_id?: string | null;
  is_published?: boolean;
}
export interface PublishPhotoCommand {
  is_published: boolean;
}
```

### 3.3 Common Types

```typescript
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface MessageResponseDTO {
  message: string;
}
```

---

## 4. Logika biznesowa

### 4.1 Generowanie Slug

**Lokalizacja:** `src/lib/utils/slug.ts`

**Algorytm:**
1. Konwersja na małe litery
2. Normalizacja Unicode (NFD) - rozdzielenie znaków diakrytycznych
3. Usunięcie znaków diakrytycznych ([\u0300-\u036f])
4. Zamiana znaków specjalnych na myślniki
5. Usunięcie myślników z początku/końca
6. Limit długości do 100 znaków

**Istniejąca implementacja:**
```typescript
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-")     // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, "")         // Remove leading/trailing dashes
    .substring(0, 100);               // Limit length
}
```

**Obsługa polskich znaków:**
| Wejście | Wyjście |
|---------|---------|
| "Ślub i Wesele" | "slub-i-wesele" |
| "Zdjęcia Rodzinne" | "zdjecia-rodzinne" |
| "Portrety Dzieci" | "portrety-dzieci" |

### 4.2 Egzekwowanie Limitów

**Lokalizacja:** Services (CategoryService, PhotoService)

| Zasób | Limit | Błąd |
|-------|-------|------|
| Photos | 200 per photographer | `409 Conflict` - LIMIT_REACHED |
| Categories | 10 per photographer | `409 Conflict` - LIMIT_REACHED |

**Implementacja w CategoryService:**
```typescript
async createCategory(userId: string, command: CreateCategoryCommand): Promise<CategoryDTO> {
  // Check category limit
  const { count, error: countError } = await this.supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("photographer_id", userId);

  if ((count || 0) >= MAX_CATEGORIES) {
    const error = new Error("Category limit reached (max 10)");
    (error as Error & { code: string }).code = "LIMIT_REACHED";
    throw error;
  }
  // ...
}
```

**Implementacja w PhotoService:**
```typescript
async createPhoto(userId: string, input: CreatePhotoInput): Promise<PhotoDTO> {
  const photoCount = await this.countUserPhotos(userId);
  if (photoCount >= MAX_PHOTOS) {
    const error = new Error(`Photo limit reached (max ${MAX_PHOTOS})`);
    (error as Error & { code: string }).code = "LIMIT_REACHED";
    throw error;
  }
  // ...
}
```

### 4.3 Przetwarzanie Obrazów

**Strona klienta** (browser-image-compression):
- Thumbnail: 400px szerokości, zachowanie proporcji
- Preview: 1200px szerokości, zachowanie proporcji
- Oryginał nie jest przechowywany (oszczędność miejsca)

**Walidacja na serwerze:**
- Tylko format JPEG (`image/jpeg`)
- Maksymalny rozmiar: 10MB
- Wymiary przesyłane jako metadane (original_width, original_height)

### 4.4 Cover Photo kategorii

**Logika:**
- Kategoria może mieć jedno zdjęcie okładkowe (`cover_photo_id`)
- Cover musi należeć do tej samej kategorii
- Walidacja własności zdjęcia w CategoryService:

```typescript
// Validate cover_photo_id if provided
if (command.cover_photo_id) {
  const { data: photo, error: photoError } = await this.supabase
    .from("photos")
    .select("id")
    .eq("photographer_id", userId)
    .eq("id", command.cover_photo_id)
    .single();

  if (photoError || !photo) {
    const error = new Error("Photo not found");
    (error as Error & { code: string }).code = "INVALID_PHOTO";
    throw error;
  }
}
```

**Trigger bazodanowy** (gdy cover photo jest usuwane):
```sql
-- Istniejący trigger w bazie
create trigger after_photo_delete
before delete on photos
for each row execute function update_category_cover_on_photo_delete();
```

### 4.5 Publikacja Zdjęć

**Reguły:**
- Niepublikowane zdjęcia (`is_published = false`) są ukryte z publicznych endpointów
- Zdjęcia bez kategorii (`category_id = null`) są ukryte z publicznych (nawet jeśli opublikowane)
- Zmiana statusu przez `PATCH /api/photos/:id/publish` lub `PUT /api/photos/:id`

**RLS Policy:**
```sql
-- Publiczny dostęp tylko do opublikowanych zdjęć z kategorią
create policy "photos_select_anon" on photos
for select to anon
using (is_published = true and category_id is not null);
```

### 4.6 Kaskadowe Usuwanie

| Operacja | Efekt |
|----------|-------|
| Profile deletion | Cascades to: settings, categories, photos (DB FK) |
| Category deletion | Photos get `category_id = null` (soft unassign, DB FK) |
| Photo deletion | Files removed from storage (application logic) |

**Usuwanie plików Storage (PhotoService):**
```typescript
async deletePhoto(userId: string, photoId: string) {
  // Get file paths
  const { data: photo } = await this.supabase
    .from("photos")
    .select("id, thumbnail_path, preview_path")
    .eq("photographer_id", userId)
    .eq("id", photoId)
    .single();

  // Delete files from storage
  await this.deleteFiles([photo.thumbnail_path, photo.preview_path]);

  // Delete photo record
  await this.supabase.from("photos").delete()
    .eq("photographer_id", userId)
    .eq("id", photoId);
}
```

### 4.7 Display Order

**Automatyczne przypisanie (trigger bazodanowy):**
```sql
create trigger before_category_insert
before insert on categories
for each row execute function set_category_display_order();
```

**Zmiana kolejności (CategoryService):**
```typescript
async reorderCategories(userId: string, order: CategoryOrderItem[]): Promise<void> {
  for (const item of order) {
    await this.supabase
      .from("categories")
      .update({ display_order: item.display_order })
      .eq("photographer_id", userId)
      .eq("id", item.id);
  }
}
```

---

## 5. Przepływ danych

### 5.1 Wzorzec Request → Response

```
Request
    ↓
[Middleware: Auth Check]
    ↓
[API Endpoint: Extract & Validate Input]
    ↓
[Zod Schema: Parse & Validate]
    ↓
[Service Layer: Business Logic]
    ↓
[Supabase Client: Database/Storage Operations]
    ↓
[Service Layer: Transform to DTO]
    ↓
[API Endpoint: Format Response]
    ↓
Response
```

### 5.2 Przykład: Tworzenie Kategorii

```typescript
// POST /api/categories
export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  // 1. Auth check
  if (!user) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  // 2. Parse body
  const body = await request.json();

  // 3. Validate with Zod
  const validation = createCategorySchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return errorResponse("VALIDATION_ERROR", firstError.message, 400, {
      field: firstError.path.join("."),
      errors: validation.error.errors,
    });
  }

  try {
    // 4. Call service
    const service = new CategoryService(supabase);
    const category = await service.createCategory(user.id, validation.data);

    // 5. Return success
    return jsonResponse(category, 201);
  } catch (error) {
    // 6. Handle custom errors
    const err = error as Error & { code?: string };
    if (err.code === "LIMIT_REACHED") {
      return errorResponse("LIMIT_REACHED", err.message, 409);
    }
    if (err.code === "DUPLICATE_SLUG") {
      return errorResponse("DUPLICATE_SLUG", err.message, 400);
    }

    // 7. Generic error
    console.error("Failed to create category:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
```

---

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie

- **Middleware** sprawdza Bearer token lub session cookies
- Użytkownik dostępny przez `context.locals.user`
- Brak użytkownika → `401 Unauthorized`

### 6.2 Autoryzacja (RLS)

- Row Level Security na wszystkich tabelach
- Każde zapytanie filtrowane przez `photographer_id = auth.uid()`
- Publiczne endpointy używają roli `anon` z ograniczonymi politykami

### 6.3 Walidacja Własności

- Category: `cover_photo_id` musi należeć do fotografa
- Photo: `category_id` musi należeć do fotografa
- Walidacja na poziomie service przed operacją

### 6.4 Walidacja Wejścia

- Wszystkie dane wejściowe walidowane przez Zod
- Pliki walidowane przez `validatePhotoFile()`
- Parametry ścieżki walidowane przez UUID schema

### 6.5 Storage Security

- Bucket `photos` jest publiczny (read-only dla wszystkich)
- Upload tylko do własnego folderu: `{photographer_id}/...`
- Ścieżki generowane server-side (nie z inputu użytkownika)

---

## 7. Obsługa błędów

### 7.1 Kody błędów

| Kod HTTP | Error Code | Znaczenie |
|----------|------------|-----------|
| 200 | - | Sukces GET/PUT/PATCH/DELETE |
| 201 | - | Sukces POST (zasób utworzony) |
| 400 | VALIDATION_ERROR | Błąd walidacji, nieprawidłowe dane |
| 400 | DUPLICATE_SLUG | Kategoria o tej nazwie już istnieje |
| 400 | INVALID_CATEGORY | Kategoria nie istnieje lub nie należy do użytkownika |
| 400 | INVALID_PHOTO | Zdjęcie nie istnieje lub nie należy do użytkownika |
| 401 | UNAUTHORIZED | Brak lub nieprawidłowe uwierzytelnienie |
| 403 | FORBIDDEN | Uwierzytelniony ale bez uprawnień |
| 404 | NOT_FOUND | Zasób nie istnieje |
| 409 | LIMIT_REACHED | Przekroczony limit zasobów |
| 413 | FILE_TOO_LARGE | Plik przekracza limit rozmiaru |
| 500 | INTERNAL_ERROR | Nieoczekiwany błąd serwera |
| 500 | UPLOAD_FAILED | Błąd uploadu do Storage |

### 7.2 Format Odpowiedzi Błędu

```typescript
// src/lib/api-utils.ts
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  const body: ErrorResponseDTO = {
    error: { code, message, ...(details && { details }) },
  };
  return jsonResponse(body, status);
}
```

**Przykład odpowiedzi:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required",
    "details": {
      "field": "name",
      "errors": [{ "path": ["name"], "message": "Name is required" }]
    }
  }
}
```

### 7.3 Obsługa Błędów Supabase

```typescript
// PGRST116 = not found (single row expected but none returned)
if (error.code === "PGRST116") {
  return null; // lub errorResponse("NOT_FOUND", ...)
}
```

---

## 8. Wydajność

### 8.1 Indeksy Bazodanowe

Zdefiniowane w schemacie bazy:
- `idx_photos_published_by_category` - partial index dla galerii publicznej
- `idx_photos_by_photographer` - filtrowanie w panelu admina
- `idx_categories_photographer_slug` - routing URL
- `idx_categories_display_order` - sortowanie kategorii

### 8.2 Optymalizacje Query

- Użycie `count: "exact", head: true` dla zliczania bez pobierania danych
- Paginacja z `range(from, to)` zamiast `limit/offset`
- Select tylko potrzebnych kolumn

### 8.3 Parallel Processing

- Batch upload przetwarza zdjęcia sekwencyjnie (wymóg limitu)
- Promise.all dla niezależnych operacji (np. pobieranie cover_photo_url dla wielu kategorii)

---

## 9. Kroki implementacji

### Faza 1: Audyt istniejących schematów ✅

1. ✅ Sprawdzić zgodność `profile.schema.ts` ze specyfikacją
2. ✅ Sprawdzić zgodność `settings.schema.ts` ze specyfikacją
3. ✅ Sprawdzić zgodność `category.schema.ts` ze specyfikacją
4. ✅ Sprawdzić zgodność `photo.schema.ts` ze specyfikacją

**Status:** Wszystkie schematy są zgodne ze specyfikacją API.

### Faza 2: Weryfikacja logiki biznesowej w services ✅

1. ✅ CategoryService
   - ✅ Limit 10 kategorii
   - ✅ Generowanie slug z polskimi znakami
   - ✅ Unikalność slug per photographer
   - ✅ Walidacja cover_photo_id
   - ✅ Auto-assign display_order

2. ✅ PhotoService
   - ✅ Limit 200 zdjęć
   - ✅ Walidacja category_id
   - ✅ Upload cleanup on error
   - ✅ Batch upload z partial failure

3. ✅ ProfileService / SettingsService
   - ✅ Podstawowe CRUD

**Status:** Logika biznesowa jest w pełni zaimplementowana.

### Faza 3: Weryfikacja obsługi błędów w endpointach ✅

1. ✅ Sprawdzono mapowanie error codes w każdym endpoincie:
   - ✅ `src/pages/api/profile.ts` - naprawiono brakujące uwierzytelnianie
   - ✅ `src/pages/api/settings.ts`
   - ✅ `src/pages/api/categories/*.ts`
   - ✅ `src/pages/api/photos/*.ts`

2. ✅ Wszystkie custom error codes są mapowane na odpowiednie HTTP status codes

3. ✅ Dodano obsługę FILE_TOO_LARGE (413):
   - Zaktualizowano `validatePhotoFile()` w `photo.schema.ts` - zwraca obiekt `{ code, message }`
   - `photos/index.ts` - POST zwraca 413 dla zbyt dużych plików
   - `photos/batch.ts` - zaktualizowano do nowego formatu błędu

**Status:** Wszystkie endpointy mają poprawną obsługę błędów zgodną ze specyfikacją.

### Faza 4: Testy walidacji ✅

1. ✅ Konfiguracja Vitest (`vitest.config.ts`)
2. ✅ Testy jednostkowe dla schematów Zod:
   - `src/lib/schemas/__tests__/photo.schema.test.ts` (36 testów)
   - `src/lib/schemas/__tests__/category.schema.test.ts` (23 testy)
   - `src/lib/schemas/__tests__/profile.schema.test.ts` (12 testów)
   - `src/lib/schemas/__tests__/settings.schema.test.ts` (10 testów)
3. ⏳ Testy integracyjne dla services (poza zakresem MVP)
4. ⏳ Testy E2E dla endpointów API (poza zakresem MVP)

**Status:** 81 testów jednostkowych przechodzi pomyślnie.

### Faza 5: Dokumentacja API

1. Aktualizacja `.ai/api-plan.md` z przykładami request/response
2. Kolekcja Bruno do testowania API (już istnieje)

---

## 10. Potencjalne ulepszenia (poza zakresem MVP)

1. **Rate limiting** - ograniczenie liczby requestów per user
2. **Request validation middleware** - centralna walidacja zamiast per-endpoint
3. **Error logging service** - logowanie błędów do zewnętrznego systemu
4. **Input sanitization** - dodatkowe oczyszczanie HTML/script injection
5. **Audit logging** - logowanie operacji CRUD dla celów audytu
