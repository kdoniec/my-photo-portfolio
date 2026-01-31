# API Endpoint Implementation Plan: Photos API

## 1. Przegląd punktu końcowego

Photos API obsługuje pełne zarządzanie zdjęciami fotografa - od przesyłania plików, przez listowanie z filtrowaniem i paginacją, po aktualizację metadanych i usuwanie. API składa się z 7 endpointów:

| Endpoint                  | Metoda | Opis                                                |
| ------------------------- | ------ | --------------------------------------------------- |
| `/api/photos`             | GET    | Lista zdjęć z filtrowaniem, paginacją i sortowaniem |
| `/api/photos`             | POST   | Upload pojedynczego zdjęcia (thumbnail + preview)   |
| `/api/photos/:id`         | GET    | Pobierz pojedyncze zdjęcie                          |
| `/api/photos/:id`         | PUT    | Aktualizuj metadane zdjęcia                         |
| `/api/photos/:id`         | DELETE | Usuń zdjęcie i pliki ze storage                     |
| `/api/photos/:id/publish` | PATCH  | Przełącz status publikacji                          |
| `/api/photos/batch`       | POST   | Masowe przesyłanie wielu zdjęć                      |

## 2. Szczegóły żądania

### GET /api/photos

**Nagłówki:**

- `Authorization: Bearer <access_token>` (wymagane)

**Query Parameters:**
| Parametr | Typ | Domyślnie | Opis |
|----------|-----|-----------|------|
| `category_id` | `uuid \| "uncategorized"` | - | Filtruj po kategorii |
| `is_published` | `"true" \| "false"` | - | Filtruj po statusie publikacji |
| `page` | `number` | 1 | Numer strony |
| `limit` | `number` | 20 | Elementów na stronę (max 50) |
| `sort` | `"created_at" \| "title"` | `created_at` | Pole sortowania |
| `order` | `"asc" \| "desc"` | `desc` | Kierunek sortowania |

### POST /api/photos

**Nagłówki:**

- `Authorization: Bearer <access_token>` (wymagane)
- `Content-Type: multipart/form-data`

**Form Data:**
| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `thumbnail` | File | Tak | Miniaturka (400px, JPEG, max 10MB) |
| `preview` | File | Tak | Podgląd (1200px, JPEG, max 10MB) |
| `original_width` | number | Tak | Oryginalna szerokość |
| `original_height` | number | Tak | Oryginalna wysokość |
| `file_size_bytes` | number | Tak | Rozmiar oryginalnego pliku |
| `title` | string | Nie | Tytuł (max 200 znaków) |
| `category_id` | uuid | Nie | ID kategorii |
| `is_published` | boolean | Nie | Status publikacji (domyślnie: false) |

### GET /api/photos/:id

**Nagłówki:**

- `Authorization: Bearer <access_token>` (wymagane)

**Path Parameters:**

- `id` - UUID zdjęcia

### PUT /api/photos/:id

**Nagłówki:**

- `Authorization: Bearer <access_token>` (wymagane)

**Request Body (JSON):**

```json
{
  "title": "string | null",
  "category_id": "uuid | null",
  "is_published": "boolean"
}
```

### DELETE /api/photos/:id

**Nagłówki:**

- `Authorization: Bearer <access_token>` (wymagane)

### PATCH /api/photos/:id/publish

**Nagłówki:**

- `Authorization: Bearer <access_token>` (wymagane)

**Request Body (JSON):**

```json
{
  "is_published": "boolean"
}
```

### POST /api/photos/batch

**Nagłówki:**

- `Authorization: Bearer <access_token>` (wymagane)
- `Content-Type: multipart/form-data`

**Form Data (dla każdego zdjęcia, indeksowane 0, 1, 2...):**
| Pole | Typ | Wymagane |
|------|-----|----------|
| `thumbnail_{index}` | File | Tak |
| `preview_{index}` | File | Tak |
| `original_width_{index}` | number | Tak |
| `original_height_{index}` | number | Tak |
| `file_size_bytes_{index}` | number | Tak |
| `title_{index}` | string | Nie |
| `category_id` | uuid | Nie (wspólne dla wszystkich) |
| `is_published` | boolean | Nie (wspólne dla wszystkich) |

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`

```typescript
// DTO odpowiedzi
interface PhotoDTO {
  id: string;
  title: string | null;
  category_id: string | null;
  category_name: string | null;
  thumbnail_url: string;
  preview_url: string;
  original_width: number;
  original_height: number;
  file_size_bytes: number;
  mime_type: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface PhotoListResponseDTO {
  data: PhotoDTO[];
  pagination: PaginationDTO;
}

interface PublishPhotoResponseDTO {
  id: string;
  is_published: boolean;
  updated_at: string;
}

interface BatchPhotoUploadResponseDTO {
  uploaded: BatchUploadedPhoto[];
  failed: BatchFailedPhoto[];
  summary: BatchUploadSummary;
}

// Command modele
interface CreatePhotoCommand {
  title?: string | null;
  category_id?: string | null;
  is_published?: boolean;
}

interface UpdatePhotoCommand {
  title?: string | null;
  category_id?: string | null;
  is_published?: boolean;
}

interface PublishPhotoCommand {
  is_published: boolean;
}

// Query parameters
interface PhotoListQuery {
  category_id?: string | "uncategorized";
  is_published?: boolean;
  page?: number;
  limit?: number;
  sort?: PhotoSortField;
  order?: SortOrder;
}
```

### Nowe typy do utworzenia w `src/lib/schemas/photo.schema.ts`

```typescript
// Walidacja form data dla uploadu
interface PhotoFileInput {
  thumbnail: File;
  preview: File;
  original_width: number;
  original_height: number;
  file_size_bytes: number;
}
```

## 4. Szczegóły odpowiedzi

### GET /api/photos - 200 OK

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string | null",
      "category_id": "uuid | null",
      "category_name": "string | null",
      "thumbnail_url": "https://...",
      "preview_url": "https://...",
      "original_width": 1920,
      "original_height": 1080,
      "file_size_bytes": 2048576,
      "mime_type": "image/jpeg",
      "is_published": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
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

### POST /api/photos - 201 Created

```json
{
  "id": "uuid",
  "title": "string | null",
  "category_id": "uuid | null",
  "category_name": "string | null",
  "thumbnail_url": "https://...",
  "preview_url": "https://...",
  "original_width": 1920,
  "original_height": 1080,
  "file_size_bytes": 2048576,
  "mime_type": "image/jpeg",
  "is_published": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### POST /api/photos/batch - 201 Created

```json
{
  "uploaded": [{ "id": "uuid", "thumbnail_url": "https://...", "preview_url": "https://..." }],
  "failed": [{ "filename": "photo3.jpg", "error": "File exceeds 10MB limit" }],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}
```

### PATCH /api/photos/:id/publish - 200 OK

```json
{
  "id": "uuid",
  "is_published": true,
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### DELETE /api/photos/:id - 200 OK

```json
{
  "message": "Photo deleted successfully"
}
```

### Błędy

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { "field": "category_id", "errors": [...] }
  }
}
```

## 5. Przepływ danych

### Upload zdjęcia (POST /api/photos)

```
1. Request → Middleware (auth)
2. Walidacja Content-Type (multipart/form-data)
3. Parsowanie FormData
4. Walidacja plików (Zod: typ JPEG, rozmiar ≤10MB)
5. Walidacja metadanych (Zod)
6. PhotoService.createPhoto():
   a. Sprawdź limit zdjęć (max 200)
   b. Waliduj category_id (jeśli podane)
   c. Generuj photo_id (UUID)
   d. Upload thumbnail → Storage: {userId}/thumb_{photoId}.jpg
   e. Upload preview → Storage: {userId}/preview_{photoId}.jpg
   f. Jeśli upload fail → cleanup + throw error
   g. INSERT do tabeli photos
   h. Pobierz category_name (jeśli category_id)
   i. Wygeneruj URLs z paths
   j. Zwróć PhotoDTO
7. Response 201 + JSON
```

### Lista zdjęć (GET /api/photos)

```
1. Request → Middleware (auth)
2. Parsowanie query params
3. Walidacja query params (Zod)
4. PhotoService.getPhotos():
   a. Buduj query z filtrami (category_id, is_published)
   b. Dodaj sortowanie
   c. Dodaj paginację (.range)
   d. Wykonaj query z joinem do categories
   e. Osobno pobierz total count
   f. Mapuj rows → PhotoDTO (generuj URLs)
   g. Zwróć PhotoListResponseDTO
5. Response 200 + JSON
```

### Usunięcie zdjęcia (DELETE /api/photos/:id)

```
1. Request → Middleware (auth)
2. Walidacja photo_id (UUID)
3. PhotoService.deletePhoto():
   a. Pobierz zdjęcie (sprawdź ownership)
   b. Jeśli nie znalezione → return null
   c. Usuń pliki ze Storage (thumbnail + preview)
   d. DELETE z tabeli photos
   e. Trigger automatycznie przypisuje nową okładkę kategorii
   f. Zwróć success message
4. Response 200 + JSON
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

- Wszystkie endpointy wymagają Bearer token w nagłówku `Authorization`
- Token weryfikowany przez middleware via `supabase.auth.getUser(token)`
- Brak tokenu → 401 Unauthorized

### Autoryzacja

- RLS w Supabase zapewnia dostęp tylko do własnych zdjęć
- Dodatkowa walidacja `photographer_id = auth.uid()` w każdym query
- Walidacja ownership kategorii przy przypisywaniu `category_id`

### Walidacja danych

- Zod schemas dla wszystkich inputów (query params, body, form data)
- Walidacja typu pliku: tylko `image/jpeg`
- Walidacja rozmiaru pliku: max 10MB
- Walidacja UUID dla `photo_id` i `category_id`
- Sanityzacja i max length dla `title` (200 znaków)

### Storage

- Pliki przechowywane w strukturze `{photographer_id}/...` - izolacja per użytkownik
- Storage RLS policies pozwalają na upload/delete tylko w własnym folderze
- Bucket publiczny - pliki dostępne bez auth (akceptowalne dla MVP)

## 7. Obsługa błędów

| Kod błędu           | HTTP Status | Scenariusz                                           |
| ------------------- | ----------- | ---------------------------------------------------- |
| `UNAUTHORIZED`      | 401         | Brak lub nieprawidłowy token                         |
| `VALIDATION_ERROR`  | 400         | Nieprawidłowe dane wejściowe (Zod)                   |
| `NOT_FOUND`         | 404         | Zdjęcie nie istnieje lub nie należy do użytkownika   |
| `LIMIT_REACHED`     | 409         | Osiągnięto limit 200 zdjęć                           |
| `INVALID_CATEGORY`  | 400         | Kategoria nie istnieje lub nie należy do użytkownika |
| `UPLOAD_FAILED`     | 500         | Błąd uploadu do Supabase Storage                     |
| `INVALID_FILE_TYPE` | 400         | Plik nie jest JPEG                                   |
| `FILE_TOO_LARGE`    | 413         | Plik przekracza 10MB                                 |
| `INTERNAL_ERROR`    | 500         | Nieoczekiwany błąd serwera                           |

### Cleanup przy błędach uploadu

```typescript
try {
  await uploadThumbnail();
  try {
    await uploadPreview();
  } catch (error) {
    // Cleanup thumbnail jeśli preview failed
    await deleteFiles([thumbnailPath]);
    throw error;
  }
  // Insert to database...
} catch (error) {
  throw error;
}
```

## 8. Rozważania dotyczące wydajności

### Paginacja

- Użycie `.range(from, to)` zamiast ładowania wszystkich rekordów
- Osobne query dla count z `head: true` (tylko metadata)
- Domyślny limit 20, max 50 rekordów na stronę

### Indeksy bazy danych (już zdefiniowane w db-plan.md)

```sql
-- Partial index dla galerii publicznej
CREATE INDEX idx_photos_published_by_category
ON photos (category_id, created_at DESC)
WHERE is_published = true AND category_id IS NOT NULL;

-- Index dla panelu admina
CREATE INDEX idx_photos_by_photographer
ON photos (photographer_id, created_at DESC);
```

### Optymalizacja query

- Join z `categories` dla `category_name` zamiast N+1 queries
- Użycie `select()` tylko potrzebnych kolumn

### Storage

- Generowanie URL synchroniczne (bez dodatkowych requestów)
- Bucket publiczny - brak potrzeby signed URLs

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematów walidacji

**Plik:** `src/lib/schemas/photo.schema.ts`

```typescript
import { z } from "zod";

export const photoIdSchema = z.string().uuid("Invalid photo ID");

export const photoListQuerySchema = z.object({
  category_id: z.union([z.string().uuid("Invalid category ID"), z.literal("uncategorized")]).optional(),
  is_published: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["created_at", "title"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const createPhotoMetadataSchema = z.object({
  title: z.string().max(200, "Title must be at most 200 characters").nullish(),
  category_id: z.string().uuid("Invalid category ID").nullish(),
  is_published: z.coerce.boolean().default(false),
});

export const photoFileSchema = z.object({
  thumbnail: z
    .instanceof(File)
    .refine((f) => f.type === "image/jpeg", "Thumbnail must be JPEG")
    .refine((f) => f.size <= 10 * 1024 * 1024, "Thumbnail must be at most 10MB"),
  preview: z
    .instanceof(File)
    .refine((f) => f.type === "image/jpeg", "Preview must be JPEG")
    .refine((f) => f.size <= 10 * 1024 * 1024, "Preview must be at most 10MB"),
  original_width: z.coerce.number().int().positive(),
  original_height: z.coerce.number().int().positive(),
  file_size_bytes: z.coerce.number().int().positive(),
});

export const updatePhotoSchema = z.object({
  title: z.string().max(200).nullish(),
  category_id: z.string().uuid("Invalid category ID").nullish(),
  is_published: z.boolean().optional(),
});

export const publishPhotoSchema = z.object({
  is_published: z.boolean(),
});

export type PhotoListQueryInput = z.infer<typeof photoListQuerySchema>;
export type CreatePhotoMetadataInput = z.infer<typeof createPhotoMetadataSchema>;
export type PhotoFileInput = z.infer<typeof photoFileSchema>;
export type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>;
export type PublishPhotoInput = z.infer<typeof publishPhotoSchema>;
```

### Krok 2: Utworzenie serwisu

**Plik:** `src/lib/services/photo.service.ts`

Metody do zaimplementowania:

1. `getPhotos(userId, query)` - lista z filtrowaniem i paginacją
2. `getPhotoById(userId, photoId)` - pojedyncze zdjęcie
3. `createPhoto(userId, files, metadata)` - upload z walidacją limitu
4. `createPhotoBatch(userId, photos)` - masowy upload
5. `updatePhoto(userId, photoId, command)` - aktualizacja metadanych
6. `publishPhoto(userId, photoId, isPublished)` - zmiana statusu
7. `deletePhoto(userId, photoId)` - usunięcie z cleanup storage

Metody pomocnicze:

- `getPhotoUrl(path)` - generowanie URL ze ścieżki storage
- `getCategoryName(categoryId)` - pobieranie nazwy kategorii
- `validateCategory(userId, categoryId)` - walidacja ownership
- `countUserPhotos(userId)` - liczenie zdjęć użytkownika
- `mapToPhotoDTO(row, categoryName)` - mapowanie row → DTO
- `uploadFile(path, file)` - upload do storage
- `deleteFiles(paths)` - usuwanie ze storage

### Krok 3: Endpoint listy i uploadu pojedynczego zdjęcia

**Plik:** `src/pages/api/photos/index.ts`

- `GET` - parsowanie query params, walidacja, wywołanie service
- `POST` - parsowanie FormData, walidacja plików i metadanych, wywołanie service

### Krok 4: Endpoint pojedynczego zdjęcia

**Plik:** `src/pages/api/photos/[id].ts`

- `GET` - walidacja ID, pobranie zdjęcia, 404 jeśli nie znalezione
- `PUT` - walidacja ID i body, aktualizacja metadanych
- `DELETE` - walidacja ID, usunięcie zdjęcia i plików

### Krok 5: Endpoint zmiany statusu publikacji

**Plik:** `src/pages/api/photos/[id]/publish.ts`

- `PATCH` - walidacja ID i body, zmiana is_published

### Krok 6: Endpoint masowego uploadu

**Plik:** `src/pages/api/photos/batch.ts`

- `POST` - parsowanie indeksowanych pól z FormData, przetwarzanie każdego zdjęcia, zwrot podsumowania

## 10. Pliki do modyfikacji/utworzenia

| Plik                                   | Akcja  | Opis                   |
| -------------------------------------- | ------ | ---------------------- |
| `src/lib/schemas/photo.schema.ts`      | CREATE | Schematy walidacji Zod |
| `src/lib/services/photo.service.ts`    | CREATE | Logika biznesowa       |
| `src/pages/api/photos/index.ts`        | CREATE | GET + POST             |
| `src/pages/api/photos/[id].ts`         | CREATE | GET + PUT + DELETE     |
| `src/pages/api/photos/[id]/publish.ts` | CREATE | PATCH                  |
| `src/pages/api/photos/batch.ts`        | CREATE | POST batch upload      |

## 11. Weryfikacja implementacji

### Testy manualne (Bruno/Postman)

1. **Lista zdjęć:**
   - GET bez parametrów → wszystkie zdjęcia
   - GET z `category_id=uuid` → filtrowanie
   - GET z `category_id=uncategorized` → bez kategorii
   - GET z `is_published=true` → tylko opublikowane
   - GET z `page=2&limit=10` → paginacja

2. **Upload:**
   - POST z poprawnymi plikami → 201
   - POST bez plików → 400
   - POST z plikiem >10MB → 413
   - POST z PNG → 400
   - POST gdy limit osiągnięty → 409

3. **Operacje CRUD:**
   - GET /:id istniejącego → 200
   - GET /:id nieistniejącego → 404
   - PUT z poprawnymi danymi → 200
   - DELETE → 200 + sprawdź czy pliki usunięte

4. **Autoryzacja:**
   - Wszystkie requesty bez tokenu → 401
   - Dostęp do cudzego zdjęcia → 404 (RLS)

### Weryfikacja Storage

```bash
# Sprawdź czy pliki zostały utworzone
# Po uploadu sprawdź w Supabase Dashboard > Storage > photos bucket

# Sprawdź czy pliki zostały usunięte po DELETE
```

### Weryfikacja bazy danych

```sql
-- Sprawdź rekord po insercie
SELECT * FROM photos WHERE photographer_id = 'user-uuid' ORDER BY created_at DESC LIMIT 1;

-- Sprawdź count po batch upload
SELECT COUNT(*) FROM photos WHERE photographer_id = 'user-uuid';
```
