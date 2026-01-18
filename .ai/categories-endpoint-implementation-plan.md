# API Endpoint Implementation Plan: Categories

<analysis>

## 1. Kluczowe punkty specyfikacji API

Endpoint kategorii obsługuje pełny CRUD dla kategorii fotografa:

- **GET /api/categories** - Lista wszystkich kategorii z sortowaniem
- **GET /api/categories/:id** - Pojedyncza kategoria po ID
- **POST /api/categories** - Tworzenie nowej kategorii
- **PUT /api/categories/:id** - Aktualizacja kategorii
- **PUT /api/categories/reorder** - Zmiana kolejności kategorii
- **DELETE /api/categories/:id** - Usunięcie kategorii

Wszystkie endpointy wymagają autoryzacji Bearer token.

## 2. Wymagane i opcjonalne parametry

### GET /api/categories

- **Opcjonalne**: `sort` (display_order|name|created_at), `order` (asc|desc)

### GET /api/categories/:id

- **Wymagane**: `id` (UUID w ścieżce)

### POST /api/categories

- **Wymagane**: `name` (string, max 100 znaków)
- **Opcjonalne**: `description` (string|null)

### PUT /api/categories/:id

- **Wymagane**: `id` (UUID w ścieżce), `name` (string, max 100 znaków)
- **Opcjonalne**: `description` (string|null), `cover_photo_id` (UUID|null)

### PUT /api/categories/reorder

- **Wymagane**: `order` (tablica obiektów {id, display_order})

### DELETE /api/categories/:id

- **Wymagane**: `id` (UUID w ścieżce)

## 3. Niezbędne typy DTO i Command Modele

Typy już zdefiniowane w `src/types.ts`:

- `CategoryDTO` - odpowiedź z rozszerzonymi polami (cover_photo_url, photos_count)
- `CategoryListResponseDTO` - {data, total, limit}
- `CreateCategoryCommand` - {name, description?}
- `UpdateCategoryCommand` - {name, description?, cover_photo_id?}
- `ReorderCategoryCommand` - {order: CategoryOrderItem[]}
- `CategoryOrderItem` - {id, display_order}
- `DeleteCategoryResponseDTO` - {message, affected_photos_count}
- `CategoryListQuery` - {sort?, order?}

## 4. Ekstrakcja logiki do service

Utworzenie nowego serwisu `CategoryService` w `src/lib/services/category.service.ts`:

- `getCategories(userId, query)` - lista z sortowaniem
- `getCategoryById(userId, categoryId)` - pojedyncza kategoria
- `createCategory(userId, command)` - tworzenie z walidacją limitu
- `updateCategory(userId, categoryId, command)` - aktualizacja z regeneracją slug
- `reorderCategories(userId, order)` - zmiana kolejności
- `deleteCategory(userId, categoryId)` - usunięcie z liczeniem affected photos

Funkcje pomocnicze:

- `generateSlug(name)` - generowanie slug z nazwy
- `getCoverPhotoUrl(coverPhotoId)` - URL zdjęcia okładkowego
- `countPhotosInCategory(categoryId)` - liczenie zdjęć

## 5. Walidacja danych wejściowych

Zod schemas w `src/lib/schemas/category.schema.ts`:

- `createCategorySchema` - walidacja name (1-100 znaków), description (opcjonalne)
- `updateCategorySchema` - walidacja name, description, cover_photo_id (UUID)
- `reorderCategorySchema` - walidacja tablicy order z id i display_order
- `categoryListQuerySchema` - walidacja sort i order
- `categoryIdParamSchema` - walidacja UUID w ścieżce

## 6. Potencjalne zagrożenia bezpieczeństwa

- **Brak autoryzacji**: Wszystkie endpointy wymagają Bearer token
- **RLS**: Supabase RLS zapewnia izolację danych per fotograf
- **Walidacja UUID**: Zapobieganie SQL injection przez walidację Zod
- **Limit kategorii**: Walidacja max 10 kategorii przed INSERT
- **IDOR**: RLS zapobiega dostępowi do kategorii innych użytkowników
- **Slug collision**: Walidacja unikalności slug per fotograf

## 7. Scenariusze błędów

| Scenariusz                     | Kod | Komunikat                          |
| ------------------------------ | --- | ---------------------------------- |
| Brak tokenu/nieprawidłowy      | 401 | Unauthorized                       |
| Kategoria nie znaleziona       | 404 | Category not found                 |
| Nieprawidłowe dane wejściowe   | 400 | Validation error + szczegóły       |
| Duplikat slug                  | 400 | Category with this name exists     |
| Limit kategorii osiągnięty     | 409 | Category limit reached (max 10)    |
| cover_photo_id nie istnieje    | 400 | Photo not found                    |
| Nieprawidłowy JSON             | 400 | Invalid JSON body                  |
| Błąd serwera                   | 500 | An unexpected error occurred       |

</analysis>

## 1. Przegląd punktu końcowego

Endpoint `/api/categories` zapewnia pełne zarządzanie kategoriami zdjęć dla zalogowanego fotografa. Obsługuje operacje CRUD (Create, Read, Update, Delete) oraz zmianę kolejności kategorii. Kategorie służą do organizacji portfolio fotografa z limitem 10 kategorii na użytkownika.

Kluczowe funkcjonalności:

- Listowanie kategorii z sortowaniem
- Pobieranie szczegółów pojedynczej kategorii
- Tworzenie nowych kategorii z automatyczną generacją slug
- Aktualizacja kategorii z możliwością ustawienia zdjęcia okładkowego
- Zmiana kolejności wyświetlania kategorii (drag & drop)
- Usuwanie kategorii z obsługą powiązanych zdjęć

## 2. Szczegóły żądania

### GET /api/categories

- **Metoda HTTP**: GET
- **URL**: `/api/categories`
- **Headers**: `Authorization: Bearer <access_token>` (wymagany)
- **Query Parameters**:
  - `sort` (opcjonalny): `display_order` (domyślny) | `name` | `created_at`
  - `order` (opcjonalny): `asc` (domyślny) | `desc`

### GET /api/categories/:id

- **Metoda HTTP**: GET
- **URL**: `/api/categories/:id`
- **Headers**: `Authorization: Bearer <access_token>` (wymagany)
- **Path Parameters**: `id` - UUID kategorii

### POST /api/categories

- **Metoda HTTP**: POST
- **URL**: `/api/categories`
- **Headers**: `Authorization: Bearer <access_token>` (wymagany)
- **Request Body**:

```json
{
  "name": "string (wymagane, 1-100 znaków)",
  "description": "string | null (opcjonalne)"
}
```

### PUT /api/categories/:id

- **Metoda HTTP**: PUT
- **URL**: `/api/categories/:id`
- **Headers**: `Authorization: Bearer <access_token>` (wymagany)
- **Path Parameters**: `id` - UUID kategorii
- **Request Body**:

```json
{
  "name": "string (wymagane, 1-100 znaków)",
  "description": "string | null (opcjonalne)",
  "cover_photo_id": "uuid | null (opcjonalne)"
}
```

### PUT /api/categories/reorder

- **Metoda HTTP**: PUT
- **URL**: `/api/categories/reorder`
- **Headers**: `Authorization: Bearer <access_token>` (wymagany)
- **Request Body**:

```json
{
  "order": [
    { "id": "uuid", "display_order": "number" }
  ]
}
```

### DELETE /api/categories/:id

- **Metoda HTTP**: DELETE
- **URL**: `/api/categories/:id`
- **Headers**: `Authorization: Bearer <access_token>` (wymagany)
- **Path Parameters**: `id` - UUID kategorii

## 3. Wykorzystywane typy

### DTOs (z `src/types.ts`)

```typescript
// Odpowiedź dla pojedynczej kategorii
interface CategoryDTO extends Omit<CategoryRow, "photographer_id"> {
  cover_photo_url: string | null;
  photos_count: number;
}

// Odpowiedź dla listy kategorii
interface CategoryListResponseDTO {
  data: CategoryDTO[];
  total: number;
  limit: number;
}

// Odpowiedź dla usunięcia kategorii
interface DeleteCategoryResponseDTO extends MessageResponseDTO {
  affected_photos_count: number;
}
```

### Command Models (z `src/types.ts`)

```typescript
// Tworzenie kategorii
interface CreateCategoryCommand {
  name: string;
  description?: string | null;
}

// Aktualizacja kategorii
interface UpdateCategoryCommand {
  name: string;
  description?: string | null;
  cover_photo_id?: string | null;
}

// Zmiana kolejności
interface CategoryOrderItem {
  id: string;
  display_order: number;
}

interface ReorderCategoryCommand {
  order: CategoryOrderItem[];
}
```

### Query Types (z `src/types.ts`)

```typescript
type CategorySortField = "display_order" | "name" | "created_at";
type SortOrder = "asc" | "desc";

interface CategoryListQuery {
  sort?: CategorySortField;
  order?: SortOrder;
}
```

## 4. Szczegóły odpowiedzi

### GET /api/categories - Success (200)

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Wesela",
      "slug": "wesela",
      "description": "Fotografie ślubne",
      "cover_photo_id": "uuid | null",
      "cover_photo_url": "https://storage.supabase.co/... | null",
      "display_order": 1,
      "photos_count": 25,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5,
  "limit": 10
}
```

### GET /api/categories/:id - Success (200)

```json
{
  "id": "uuid",
  "name": "Wesela",
  "slug": "wesela",
  "description": "Fotografie ślubne",
  "cover_photo_id": "uuid | null",
  "cover_photo_url": "https://storage.supabase.co/... | null",
  "display_order": 1,
  "photos_count": 25,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### POST /api/categories - Success (201)

```json
{
  "id": "uuid",
  "name": "Portrety",
  "slug": "portrety",
  "description": null,
  "cover_photo_id": null,
  "cover_photo_url": null,
  "display_order": 6,
  "photos_count": 0,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### PUT /api/categories/:id - Success (200)

```json
{
  "id": "uuid",
  "name": "Portrety studyjne",
  "slug": "portrety-studyjne",
  "description": "Sesje portretowe w studio",
  "cover_photo_id": "uuid",
  "cover_photo_url": "https://storage.supabase.co/...",
  "display_order": 6,
  "photos_count": 15,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-16T14:20:00Z"
}
```

### PUT /api/categories/reorder - Success (200)

```json
{
  "message": "Categories reordered successfully"
}
```

### DELETE /api/categories/:id - Success (200)

```json
{
  "message": "Category deleted successfully",
  "affected_photos_count": 15
}
```

### Error Responses

```json
// 400 Bad Request - Validation Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required",
    "details": {
      "field": "name",
      "errors": [...]
    }
  }
}

// 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}

// 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Category not found"
  }
}

// 409 Conflict - Limit Reached
{
  "error": {
    "code": "LIMIT_REACHED",
    "message": "Category limit reached (max 10)"
  }
}
```

## 5. Przepływ danych

### GET /api/categories

```
Request → Middleware (auth) → API Route
                                  ↓
                           Validate query params
                                  ↓
                           CategoryService.getCategories()
                                  ↓
                           Supabase query (RLS filtered)
                                  ↓
                           Enrich with cover_photo_url & photos_count
                                  ↓
                           Return CategoryListResponseDTO
```

### POST /api/categories

```
Request → Middleware (auth) → API Route
                                  ↓
                           Parse & validate body (Zod)
                                  ↓
                           CategoryService.createCategory()
                                  ↓
                           Check category count limit (max 10)
                                  ↓
                           Generate slug from name
                                  ↓
                           Insert to database (trigger sets display_order)
                                  ↓
                           Return CategoryDTO (201)
```

### PUT /api/categories/:id

```
Request → Middleware (auth) → API Route
                                  ↓
                           Validate path param & body (Zod)
                                  ↓
                           CategoryService.updateCategory()
                                  ↓
                           Verify category exists (RLS filtered)
                                  ↓
                           If name changed → regenerate slug
                                  ↓
                           If cover_photo_id set → verify photo exists
                                  ↓
                           Update database
                                  ↓
                           Return CategoryDTO (200)
```

### DELETE /api/categories/:id

```
Request → Middleware (auth) → API Route
                                  ↓
                           Validate path param (Zod)
                                  ↓
                           CategoryService.deleteCategory()
                                  ↓
                           Count affected photos
                                  ↓
                           Delete category (FK sets photos.category_id = null)
                                  ↓
                           Return DeleteCategoryResponseDTO (200)
```

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

- Wszystkie endpointy wymagają Bearer token w nagłówku `Authorization`
- Middleware wyciąga token i waliduje przez Supabase Auth
- Brak tokenu lub nieprawidłowy token → 401 Unauthorized

### Autoryzacja (Row Level Security)

- RLS na tabeli `categories` zapewnia, że użytkownik widzi tylko swoje kategorie
- Policy `categories_select_own`: `photographer_id = auth.uid()`
- Policy `categories_insert_own`: `photographer_id = auth.uid()`
- Policy `categories_update_own`: `photographer_id = auth.uid()`
- Policy `categories_delete_own`: `photographer_id = auth.uid()`

### Walidacja danych

- Wszystkie dane wejściowe walidowane przez Zod przed przetwarzaniem
- UUID walidowane jako poprawny format (zapobiega injection)
- Długość pól zgodna z ograniczeniami bazy danych

### Ochrona przed atakami

- **IDOR**: RLS zapobiega dostępowi do kategorii innych użytkowników
- **SQL Injection**: Parametryzowane zapytania Supabase
- **Mass Assignment**: Tylko dozwolone pola w Command Models

### Limity biznesowe

- Maksymalnie 10 kategorii per fotograf (walidacja w service)
- Sprawdzenie przed INSERT, nie przez constraint DB

## 7. Obsługa błędów

### Hierarchia obsługi błędów

1. **Warstwa API Route**:
   - Walidacja JSON body (SyntaxError → 400)
   - Walidacja Zod (ValidationError → 400)
   - Sprawdzenie autoryzacji (brak user → 401)

2. **Warstwa Service**:
   - Not found (PGRST116 → return null → 404 w API)
   - Duplicate slug (23505 → throw → 400 w API)
   - Limit reached (custom check → throw → 409 w API)
   - Photo not found for cover (custom check → throw → 400 w API)

3. **Warstwa DB**:
   - Constraint violations → propagate to service
   - RLS violations → return empty result

### Mapowanie błędów

| Błąd źródłowy | Kod HTTP | Kod błędu | Komunikat |
|---------------|----------|-----------|-----------|
| Brak/nieprawidłowy token | 401 | UNAUTHORIZED | Authentication required |
| Zod validation failed | 400 | VALIDATION_ERROR | [szczegóły z Zod] |
| Invalid JSON | 400 | VALIDATION_ERROR | Invalid JSON body |
| PGRST116 (not found) | 404 | NOT_FOUND | Category not found |
| 23505 (unique violation) | 400 | DUPLICATE_SLUG | Category with this name already exists |
| Category count >= 10 | 409 | LIMIT_REACHED | Category limit reached (max 10) |
| Photo not found | 400 | INVALID_PHOTO | Photo not found |
| Unexpected error | 500 | INTERNAL_ERROR | An unexpected error occurred |

## 8. Rozważania dotyczące wydajności

### Indeksy wykorzystywane

- `idx_categories_photographer_slug` - wyszukiwanie po slug
- `idx_categories_display_order` - sortowanie po kolejności
- Unique constraint na `(photographer_id, slug)` - szybkie sprawdzanie duplikatów

### Optymalizacje zapytań

- **Lista kategorii**: Jeden zapytanie z JOIN do zliczania zdjęć
- **Cover photo URL**: Budowanie URL z path bez dodatkowego zapytania
- **Reorder**: Batch update w jednej transakcji

### Potencjalne wąskie gardła

- Zliczanie zdjęć per kategoria przy dużej liczbie kategorii
- Rozwiązanie: Użycie subquery lub agregacji w głównym zapytaniu

### Zalecane podejście do zliczania zdjęć

```sql
select c.*,
  coalesce(p.photos_count, 0) as photos_count
from categories c
left join (
  select category_id, count(*) as photos_count
  from photos
  group by category_id
) p on p.category_id = c.id
where c.photographer_id = $1
```

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematów walidacji Zod

Plik: `src/lib/schemas/category.schema.ts`

```typescript
import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  description: z.string().max(500).nullish(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  description: z.string().max(500).nullish(),
  cover_photo_id: z.string().uuid("Invalid photo ID").nullish(),
});

export const reorderCategorySchema = z.object({
  order: z
    .array(
      z.object({
        id: z.string().uuid("Invalid category ID"),
        display_order: z.number().int().min(0),
      })
    )
    .min(1, "Order array cannot be empty"),
});

export const categoryIdSchema = z.string().uuid("Invalid category ID");

export const categoryListQuerySchema = z.object({
  sort: z.enum(["display_order", "name", "created_at"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
```

### Krok 2: Utworzenie serwisu CategoryService

Plik: `src/lib/services/category.service.ts`

Metody do zaimplementowania:

1. `getCategories(userId: string, query: CategoryListQuery): Promise<CategoryListResponseDTO>`
2. `getCategoryById(userId: string, categoryId: string): Promise<CategoryDTO | null>`
3. `createCategory(userId: string, command: CreateCategoryCommand): Promise<CategoryDTO>`
4. `updateCategory(userId: string, categoryId: string, command: UpdateCategoryCommand): Promise<CategoryDTO | null>`
5. `reorderCategories(userId: string, order: CategoryOrderItem[]): Promise<void>`
6. `deleteCategory(userId: string, categoryId: string): Promise<DeleteCategoryResponseDTO | null>`

Funkcje pomocnicze:

- `generateSlug(name: string): string` - konwersja nazwy na URL-friendly slug
- `buildCoverPhotoUrl(path: string | null): string | null` - budowanie URL ze ścieżki Storage

### Krok 3: Utworzenie endpointów API

#### Plik: `src/pages/api/categories/index.ts`

Obsługa:

- `GET` - lista kategorii
- `POST` - tworzenie kategorii

#### Plik: `src/pages/api/categories/[id].ts`

Obsługa:

- `GET` - pojedyncza kategoria
- `PUT` - aktualizacja kategorii
- `DELETE` - usunięcie kategorii

#### Plik: `src/pages/api/categories/reorder.ts`

Obsługa:

- `PUT` - zmiana kolejności

### Krok 4: Implementacja pomocniczych funkcji

Plik: `src/lib/utils/slug.ts`

```typescript
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-")     // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, "")         // Remove leading/trailing dashes
    .substring(0, 100);              // Limit length
}
```

### Krok 5: Testy manualne

1. Testowanie autoryzacji (brak tokenu, nieprawidłowy token)
2. Testowanie walidacji (nieprawidłowe dane wejściowe)
3. Testowanie CRUD (tworzenie, odczyt, aktualizacja, usuwanie)
4. Testowanie limitu kategorii (próba utworzenia 11. kategorii)
5. Testowanie reorderowania
6. Testowanie RLS (próba dostępu do kategorii innego użytkownika)

### Krok 6: Dokumentacja

1. Aktualizacja dokumentacji API w `.ai/api-plan.md` (jeśli potrzebne)
2. Dodanie przykładów użycia do Bruno/Postman

## 10. Struktura plików

```
src/
├── pages/api/categories/
│   ├── index.ts          # GET (list), POST (create)
│   ├── [id].ts           # GET (single), PUT (update), DELETE
│   └── reorder.ts        # PUT (reorder)
├── lib/
│   ├── services/
│   │   └── category.service.ts
│   ├── schemas/
│   │   └── category.schema.ts
│   └── utils/
│       └── slug.ts
└── types.ts              # (już istnieje - typy DTO i Command)
```
