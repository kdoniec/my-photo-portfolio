# Plan implementacji widoku Panel Administracyjny

## 1. Przegląd

Panel administracyjny to zestaw widoków umożliwiających fotografowi zarządzanie portfolio. Składa się z pięciu głównych części:

1. **Logowanie** (`/admin/login`) - autentykacja użytkownika
2. **Redirect** (`/admin`) - przekierowanie do głównego widoku
3. **Kategorie** (`/admin/categories`) - zarządzanie kategoriami zdjęć
4. **Zdjęcia** (`/admin/photos`) - główny widok zarządzania zdjęciami
5. **Profil** (`/admin/profile`) - edycja danych profilowych i ustawień SEO

Panel jest chroniony przed nieautoryzowanym dostępem poprzez middleware Astro i Supabase Auth. Wszystkie operacje CRUD są zabezpieczone przez Row Level Security (RLS) w Supabase.

## 2. Routing widoku

| Ścieżka             | Plik                               | Opis                                           |
| ------------------- | ---------------------------------- | ---------------------------------------------- |
| `/admin/login`      | `src/pages/admin/login.astro`      | Strona logowania                               |
| `/admin`            | `src/pages/admin/index.astro`      | Redirect do `/admin/photos` lub `/admin/login` |
| `/admin/categories` | `src/pages/admin/categories.astro` | Zarządzanie kategoriami                        |
| `/admin/photos`     | `src/pages/admin/photos.astro`     | Zarządzanie zdjęciami                          |
| `/admin/profile`    | `src/pages/admin/profile.astro`    | Profil i ustawienia                            |

## 3. Struktura komponentów

```
src/
├── layouts/
│   └── AdminLayout.astro              # Layout dla panelu admina
├── pages/admin/
│   ├── index.astro                    # Redirect
│   ├── login.astro                    # Strona logowania
│   ├── categories.astro               # Strona kategorii
│   ├── photos.astro                   # Strona zdjęć
│   └── profile.astro                  # Strona profilu
├── components/
│   ├── admin/
│   │   ├── auth/
│   │   │   └── LoginForm.tsx
│   │   ├── categories/
│   │   │   ├── CategoriesManager.tsx
│   │   │   ├── CategoriesGrid.tsx
│   │   │   ├── CategoryCard.tsx
│   │   │   ├── CategoryDialog.tsx
│   │   │   └── CoverPhotoSelector.tsx
│   │   ├── photos/
│   │   │   ├── PhotosManager.tsx
│   │   │   ├── PhotosGrid.tsx
│   │   │   ├── PhotoCard.tsx
│   │   │   ├── PhotoUploadZone.tsx
│   │   │   ├── UploadProgressList.tsx
│   │   │   ├── UploadProgressItem.tsx
│   │   │   └── PhotoEditDialog.tsx
│   │   ├── profile/
│   │   │   ├── ProfileManager.tsx
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── SeoSettingsForm.tsx
│   │   │   └── StatsCard.tsx
│   │   ├── shared/
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   └── LimitBadge.tsx
│   │   └── context/
│   │       ├── AuthContext.tsx
│   │       └── StatsContext.tsx
│   └── hooks/
│       ├── useAuth.ts
│       ├── useCategories.ts
│       ├── usePhotos.ts
│       ├── usePhotoUpload.ts
│       └── useStats.ts
```

### Hierarchia komponentów

```
AdminLayout.astro
├── AdminHeader.tsx
│   ├── Navigation (Kategorie, Zdjęcia, Profil)
│   └── UserMenu.tsx (avatar, logout)
└── <slot /> (content)

/admin/login
└── LoginForm.tsx
    ├── Input[email]
    ├── Input[password]
    ├── Button[submit]
    └── Alert[error]

/admin/categories
└── CategoriesManager.tsx
    ├── Header (h1 + LimitBadge + Button)
    ├── CategoriesGrid.tsx
    │   └── CategoryCard.tsx[]
    ├── CategoryDialog.tsx
    │   └── CoverPhotoSelector.tsx
    └── AlertDialog[delete]

/admin/photos
└── PhotosManager.tsx
    ├── Toolbar (Select + Button + LimitBadge)
    ├── PhotosGrid.tsx
    │   └── PhotoCard.tsx[]
    ├── PhotoUploadZone.tsx
    │   └── UploadProgressList.tsx
    │       └── UploadProgressItem.tsx[]
    ├── PhotoEditDialog.tsx
    └── AlertDialog[delete]

/admin/profile
└── ProfileManager.tsx
    ├── ProfileForm.tsx
    ├── SeoSettingsForm.tsx
    └── StatsCard.tsx
```

## 4. Szczegóły komponentów

### AdminLayout.astro

- **Opis:** Główny layout dla wszystkich stron panelu administracyjnego. Zawiera topbar z nawigacją i user menu. Wymaga autoryzacji.
- **Główne elementy:**
  - `<header>` z AdminHeader.tsx (client:load)
  - `<main>` ze slotem na zawartość strony
  - `<Toaster />` z Sonner dla powiadomień
- **Obsługiwane interakcje:** Brak bezpośrednich (delegowane do dzieci)
- **Obsługiwana walidacja:** Sprawdzenie sesji w middleware
- **Typy:** Brak dedykowanych
- **Propsy:**
  - `title: string` - tytuł strony dla `<title>`
  - `activeNav?: 'categories' | 'photos' | 'profile'`

### AdminHeader.tsx

- **Opis:** Topbar z logo, nawigacją główną i menu użytkownika.
- **Główne elementy:**
  - Logo/nazwa aplikacji (link do `/admin/photos`)
  - `<nav>` z linkami: Zdjęcia, Kategorie, Profil
  - UserMenu.tsx
- **Obsługiwane interakcje:**
  - Click na link → Nawigacja
  - Click na UserMenu → Dropdown
- **Obsługiwana walidacja:** Brak
- **Typy:** `User` z Supabase
- **Propsy:**
  - `activeNav?: 'categories' | 'photos' | 'profile'`
  - `user: User | null`

### UserMenu.tsx

- **Opis:** Dropdown z avatarem użytkownika i opcją wylogowania.
- **Główne elementy:**
  - DropdownMenu (Shadcn/ui)
  - Avatar z inicjałami lub domyślną ikoną
  - DropdownMenuItem "Wyloguj"
- **Obsługiwane interakcje:**
  - Click avatar → Toggle dropdown
  - Click "Wyloguj" → Supabase signOut → Redirect do `/admin/login`
- **Obsługiwana walidacja:** Brak
- **Typy:** `User` z Supabase
- **Propsy:**
  - `user: User`

### LimitBadge.tsx

- **Opis:** Badge wyświetlający aktualne wykorzystanie limitu (np. "45/200").
- **Główne elementy:**
  - Badge (Shadcn/ui) z tekstem "X/Y"
  - Kolor dynamiczny: green (<70%), yellow (70-90%), red (>90%)
- **Obsługiwane interakcje:** Brak (read-only)
- **Obsługiwana walidacja:** Brak
- **Typy:** `ResourceStats`
- **Propsy:**
  - `current: number`
  - `limit: number`
  - `className?: string`

---

### LoginForm.tsx

- **Opis:** Formularz logowania z email i hasłem. Używa react-hook-form z walidacją Zod.
- **Główne elementy:**
  - Form container
  - Input[type=email] z label "Email"
  - Input[type=password] z label "Hasło"
  - Button[type=submit] "Zaloguj"
  - Alert dla błędów (conditional)
- **Obsługiwane interakcje:**
  - Input change → Aktualizacja formularza
  - Form submit → Walidacja → Supabase Auth → Redirect lub Error
  - Enter key → Submit
- **Obsługiwana walidacja:**
  - Email: wymagany, poprawny format email
  - Hasło: wymagane, min 1 znak
- **Typy:** `LoginFormData`, `LoginFormState`
- **Propsy:** Brak

---

### CategoriesManager.tsx

- **Opis:** Główny komponent zarządzania kategoriami. Orkiestruje grid, dialogi i operacje CRUD.
- **Główne elementy:**
  - Header section: `<h1>`, LimitBadge, Button "Dodaj kategorię"
  - CategoriesGrid.tsx
  - CategoryDialog.tsx (create/edit mode)
  - AlertDialog (delete confirmation)
- **Obsługiwane interakcje:**
  - Click "Dodaj kategorię" → Open CategoryDialog (create mode)
  - Edit category → Open CategoryDialog (edit mode)
  - Delete category → Open AlertDialog → Confirm → Delete
- **Obsługiwana walidacja:**
  - Limit 10 kategorii - disable button gdy osiągnięty
- **Typy:** `CategoryDTO[]`, `CategoryDialogState`, `DeleteConfirmationState`
- **Propsy:**
  - `initialCategories: CategoryDTO[]`
  - `stats: StatsDTO`

### CategoriesGrid.tsx

- **Opis:** Responsywny grid kart kategorii (1-2 kolumny).
- **Główne elementy:**
  - Grid container (`grid grid-cols-1 md:grid-cols-2 gap-4`)
  - CategoryCard.tsx dla każdej kategorii
  - Empty state gdy brak kategorii
- **Obsługiwane interakcje:**
  - Delegowane do CategoryCard
- **Obsługiwana walidacja:** Brak
- **Typy:** `CategoryDTO[]`
- **Propsy:**
  - `categories: CategoryDTO[]`
  - `onEdit: (category: CategoryDTO) => void`
  - `onDelete: (category: CategoryDTO) => void`

### CategoryCard.tsx

- **Opis:** Karta pojedynczej kategorii z okładką, informacjami i akcjami.
- **Główne elementy:**
  - Card (Shadcn/ui)
  - Miniaturka okładki (80x80px) lub placeholder
  - Nazwa kategorii (h3)
  - Opis (truncated, max 2 linie)
  - Badge z liczbą zdjęć
  - Przyciski akcji: Edit (Pencil icon), Delete (Trash icon)
- **Obsługiwane interakcje:**
  - Click Edit → `onEdit(category)`
  - Click Delete → `onDelete(category)`
  - Hover → Pokaż akcje (opcjonalnie always visible na mobile)
- **Obsługiwana walidacja:** Brak
- **Typy:** `CategoryDTO`
- **Propsy:**
  - `category: CategoryDTO`
  - `onEdit: () => void`
  - `onDelete: () => void`

### CategoryDialog.tsx

- **Opis:** Dialog do tworzenia/edycji kategorii z formularzem react-hook-form.
- **Główne elementy:**
  - Dialog (Shadcn/ui)
  - DialogHeader z tytułem "Dodaj kategorię" / "Edytuj kategorię"
  - Form:
    - Input "Nazwa" (required)
    - Readonly text "Slug" (auto-generated preview)
    - Textarea "Opis" (optional)
    - CoverPhotoSelector (tylko w edit mode, gdy są zdjęcia)
  - DialogFooter: Button "Anuluj", Button "Zapisz"
- **Obsługiwane interakcje:**
  - Input change → Update form + slug preview
  - Select cover photo → Update form
  - Submit → Validate → API call → Close + Toast
  - Cancel → Close dialog
- **Obsługiwana walidacja:**
  - Nazwa: wymagana, max 100 znaków
  - Opis: opcjonalny, max 500 znaków
  - Cover photo: opcjonalne, musi należeć do kategorii
- **Typy:** `CategoryFormData`, `CategoryDTO`, `CreateCategoryCommand`, `UpdateCategoryCommand`
- **Propsy:**
  - `isOpen: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `mode: 'create' | 'edit'`
  - `category?: CategoryDTO`
  - `onSubmit: (data: CategoryFormData) => Promise<void>`

### CoverPhotoSelector.tsx

- **Opis:** Popover z gridem miniaturek do wyboru okładki kategorii.
- **Główne elementy:**
  - Button trigger "Wybierz okładkę" lub miniaturka aktualnej
  - Popover (Shadcn/ui) z:
    - Grid miniaturek (3-4 kolumny, max-height 400px, scroll)
    - Empty state "Brak zdjęć w tej kategorii"
- **Obsługiwane interakcje:**
  - Click trigger → Open popover
  - Click miniaturka → Select + highlight + close
- **Obsługiwana walidacja:** Brak (zdjęcia już przefiltrowane)
- **Typy:** `PhotoDTO[]`
- **Propsy:**
  - `categoryId: string`
  - `currentPhotoId?: string | null`
  - `photos: PhotoDTO[]`
  - `onSelect: (photoId: string) => void`

---

### PhotosManager.tsx

- **Opis:** Główny komponent zarządzania zdjęciami. Orkiestruje grid, toolbar, dialogi i operacje CRUD.
- **Główne elementy:**
  - Toolbar section: Select (filtr kategorii), Button "Dodaj zdjęcia", LimitBadge
  - PhotosGrid.tsx
  - PhotoUploadZone.tsx (Dialog)
  - PhotoEditDialog.tsx (Dialog)
  - AlertDialog (delete confirmation)
- **Obsługiwane interakcje:**
  - Select filter → Update grid (re-fetch lub client-side filter)
  - Click "Dodaj zdjęcia" → Open PhotoUploadZone
  - Edit photo → Open PhotoEditDialog
  - Toggle publish → Optimistic update + API
  - Delete photo → AlertDialog → Confirm → Delete
- **Obsługiwana walidacja:**
  - Limit 200 zdjęć - disable upload button gdy osiągnięty
- **Typy:** `PhotoDTO[]`, `CategoryDTO[]`, `StatsDTO`
- **Propsy:**
  - `initialPhotos: PhotoListResponseDTO`
  - `categories: CategoryDTO[]`
  - `stats: StatsDTO`

### PhotosGrid.tsx

- **Opis:** Responsywny grid kart zdjęć (1/2/3/4/5 kolumn).
- **Główne elementy:**
  - Grid container (responsive columns)
  - PhotoCard.tsx dla każdego zdjęcia
  - Empty state gdy brak zdjęć
- **Obsługiwane interakcje:**
  - Delegowane do PhotoCard
- **Obsługiwana walidacja:** Brak
- **Typy:** `PhotoDTO[]`
- **Propsy:**
  - `photos: PhotoDTO[]`
  - `onEdit: (photo: PhotoDTO) => void`
  - `onDelete: (photo: PhotoDTO) => void`
  - `onTogglePublish: (photo: PhotoDTO, isPublished: boolean) => void`

### PhotoCard.tsx

- **Opis:** Karta pojedynczego zdjęcia z miniaturką, metadanymi i akcjami.
- **Główne elementy:**
  - Card z miniaturką (aspect-ratio preserved)
  - Overlay lub poniżej:
    - Tytuł (jeśli istnieje, truncated)
    - Badge kategorii lub "Bez kategorii"
    - Switch "Opublikowane" z label
  - Akcje (hover): Edit icon, Delete icon
- **Obsługiwane interakcje:**
  - Click Edit → `onEdit(photo)`
  - Click Delete → `onDelete(photo)`
  - Toggle Switch → `onTogglePublish(photo, newValue)`
- **Obsługiwana walidacja:** Brak
- **Typy:** `PhotoDTO`
- **Propsy:**
  - `photo: PhotoDTO`
  - `onEdit: () => void`
  - `onDelete: () => void`
  - `onTogglePublish: (isPublished: boolean) => void`

### PhotoUploadZone.tsx

- **Opis:** Dialog z drag & drop do uploadu zdjęć. Obsługuje walidację, kompresję i upload wielu plików.
- **Główne elementy:**
  - Dialog (Shadcn/ui)
  - DialogHeader "Dodaj zdjęcia"
  - Dropzone (react-dropzone):
    - Tekst zachęty
    - Akceptuje: image/jpeg
    - Multiple: true
    - Max 20 plików
  - UploadProgressList.tsx (lista plików)
  - Controls:
    - Select kategorii
    - Switch "Opublikuj od razu"
    - Button "Wyczyść listę"
    - Button "Wyślij"
- **Obsługiwane interakcje:**
  - Drop/select files → Validate → Preview → Add to list
  - Change category/publish → Update settings
  - Click "Wyczyść" → Clear file list
  - Click "Wyślij" → Process upload (compress + upload)
  - Close dialog → Reset state
- **Obsługiwana walidacja:**
  - Format: tylko JPEG (image/jpeg)
  - Rozmiar: max 10MB per plik
  - Ilość: max 20 plików per batch
  - Limit globalny: nie przekroczyć 200 zdjęć łącznie
- **Typy:** `PhotoUploadFile[]`, `PhotoUploadSettings`, `CategoryDTO[]`
- **Propsy:**
  - `isOpen: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `categories: CategoryDTO[]`
  - `currentPhotoCount: number`
  - `photoLimit: number`
  - `onUploadComplete: () => void`

### UploadProgressList.tsx

- **Opis:** Lista plików w trakcie uploadu z progress barami i statusami.
- **Główne elementy:**
  - ScrollArea (max-height ~300px)
  - UploadProgressItem.tsx dla każdego pliku
- **Obsługiwane interakcje:**
  - Remove file → `onRemove(index)`
  - Retry file → `onRetry(index)`
- **Obsługiwana walidacja:** Brak
- **Typy:** `PhotoUploadFile[]`
- **Propsy:**
  - `files: PhotoUploadFile[]`
  - `onRemove: (index: number) => void`
  - `onRetry: (index: number) => void`

### UploadProgressItem.tsx

- **Opis:** Pojedynczy element listy z preview, nazwą, progress barem i statusem.
- **Główne elementy:**
  - Miniaturka (FileReader preview, 48x48px)
  - Nazwa pliku (truncated)
  - Rozmiar pliku
  - Dual Progress bar:
    - Kompresja: 0-50%
    - Upload: 50-100%
  - Status indicator (kolor: pending-gray, uploading-blue, success-green, error-red)
  - Error message (jeśli błąd)
  - Buttons: Remove (X), Retry (jeśli error)
- **Obsługiwane interakcje:**
  - Click Remove → `onRemove()`
  - Click Retry → `onRetry()`
- **Obsługiwana walidacja:** Brak (wizualizacja stanu)
- **Typy:** `PhotoUploadFile`
- **Propsy:**
  - `file: PhotoUploadFile`
  - `onRemove: () => void`
  - `onRetry: () => void`

### PhotoEditDialog.tsx

- **Opis:** Dialog do edycji metadanych zdjęcia.
- **Główne elementy:**
  - Dialog (Shadcn/ui)
  - Miniaturka zdjęcia (60x60px)
  - Form:
    - Input "Tytuł" (optional)
    - Select "Kategoria"
    - Switch "Opublikowane"
  - DialogFooter: Button "Anuluj", Button "Zapisz"
- **Obsługiwane interakcje:**
  - Input change → Update form
  - Submit → Validate → API PUT → Close + Toast
  - Cancel → Close
- **Obsługiwana walidacja:**
  - Tytuł: opcjonalny, max 200 znaków
  - Kategoria: opcjonalna, valid UUID
- **Typy:** `PhotoFormData`, `PhotoDTO`, `UpdatePhotoCommand`, `CategoryDTO[]`
- **Propsy:**
  - `isOpen: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `photo: PhotoDTO | null`
  - `categories: CategoryDTO[]`
  - `onSubmit: (data: PhotoFormData) => Promise<void>`

---

### ProfileManager.tsx

- **Opis:** Główny komponent strony profilu. Zawiera dwa formularze i kartę statystyk.
- **Główne elementy:**
  - ProfileForm.tsx (Card)
  - SeoSettingsForm.tsx (Card)
  - StatsCard.tsx (Card)
- **Obsługiwane interakcje:**
  - Submit form → API call → Toast
- **Obsługiwana walidacja:** Delegowane do formularzy
- **Typy:** `ProfileDTO`, `SettingsDTO`, `StatsDTO`
- **Propsy:**
  - `initialProfile: ProfileDTO`
  - `initialSettings: SettingsDTO`
  - `stats: StatsDTO`

### ProfileForm.tsx

- **Opis:** Formularz edycji danych profilowych fotografa.
- **Główne elementy:**
  - Card z tytułem "Dane profilowe"
  - Form (react-hook-form):
    - Input "Nazwa wyświetlana" (required)
    - Textarea "Bio" (optional)
    - Input "Email kontaktowy" (optional, email format)
    - Input "Telefon" (optional)
  - Button "Zapisz zmiany"
- **Obsługiwane interakcje:**
  - Input change → Update form
  - Submit → Validate → PUT /api/profile → Toast
- **Obsługiwana walidacja:**
  - Display name: wymagane, max 100 znaków
  - Bio: opcjonalne
  - Email: opcjonalne, poprawny format email, max 255 znaków
  - Telefon: opcjonalny, max 20 znaków
- **Typy:** `ProfileFormData`, `ProfileDTO`, `UpdateProfileCommand`
- **Propsy:**
  - `initialData: ProfileDTO`
  - `onSubmitSuccess?: () => void`

### SeoSettingsForm.tsx

- **Opis:** Formularz edycji ustawień SEO.
- **Główne elementy:**
  - Card z tytułem "Ustawienia SEO"
  - Opis: "Te dane będą używane w meta tagach..."
  - Form (react-hook-form):
    - Input "Tytuł strony" (optional, placeholder)
    - Textarea "Opis strony" (optional, placeholder)
  - Button "Zapisz zmiany"
- **Obsługiwane interakcje:**
  - Input change → Update form
  - Submit → Validate → PUT /api/settings → Toast
- **Obsługiwana walidacja:**
  - Site title: opcjonalne, max 100 znaków
  - Site description: opcjonalne, max 300 znaków
- **Typy:** `SeoFormData`, `SettingsDTO`, `UpdateSettingsCommand`
- **Propsy:**
  - `initialData: SettingsDTO`
  - `onSubmitSuccess?: () => void`

### StatsCard.tsx

- **Opis:** Karta z progress barami pokazującymi wykorzystanie limitów.
- **Główne elementy:**
  - Card z tytułem "Wykorzystanie limitów"
  - Progress bar "Zdjęcia" (X z 200)
  - Progress bar "Kategorie" (X z 10)
  - Kolory: green (<70%), yellow (70-90%), red (>90%)
- **Obsługiwane interakcje:** Brak (read-only)
- **Obsługiwana walidacja:** Brak
- **Typy:** `StatsDTO`
- **Propsy:**
  - `stats: StatsDTO`

---

## 5. Typy

### Typy z backendu (src/types.ts)

```typescript
// Już zdefiniowane - używane bezpośrednio
interface ProfileDTO { ... }
interface UpdateProfileCommand { ... }
interface SettingsDTO { ... }
interface UpdateSettingsCommand { ... }
interface CategoryDTO { ... }
interface CategoryListResponseDTO { ... }
interface CreateCategoryCommand { ... }
interface UpdateCategoryCommand { ... }
interface PhotoDTO { ... }
interface PhotoListResponseDTO { ... }
interface UpdatePhotoCommand { ... }
interface PublishPhotoCommand { ... }
interface PublishPhotoResponseDTO { ... }
interface BatchPhotoUploadResponseDTO { ... }
interface StatsDTO { ... }
interface ResourceStats { ... }
interface PaginationDTO { ... }
interface ErrorResponseDTO { ... }
```

### Nowe typy frontendowe (src/components/admin/types.ts)

```typescript
// === Auth ===

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormState {
  isLoading: boolean;
  error: string | null;
}

// === Categories ===

interface CategoryFormData {
  name: string;
  description: string | null;
  cover_photo_id: string | null;
}

interface CategoryDialogState {
  isOpen: boolean;
  mode: "create" | "edit";
  category: CategoryDTO | null;
}

interface DeleteCategoryConfirmation {
  isOpen: boolean;
  category: CategoryDTO | null;
}

// === Photos ===

type UploadStatus = "pending" | "validating" | "compressing" | "uploading" | "success" | "error";

interface PhotoUploadFile {
  id: string; // Unique ID dla key w React
  file: File; // Oryginalny plik
  preview: string; // Data URL dla preview
  status: UploadStatus;
  progress: number; // 0-100 (0-50 kompresja, 50-100 upload)
  error?: string; // Komunikat błędu
}

interface PhotoUploadSettings {
  category_id: string | null;
  is_published: boolean;
}

interface PhotoFormData {
  title: string | null;
  category_id: string | null;
  is_published: boolean;
}

interface PhotoDialogState {
  isOpen: boolean;
  photo: PhotoDTO | null;
}

interface DeletePhotoConfirmation {
  isOpen: boolean;
  photo: PhotoDTO | null;
}

interface PhotoFilterState {
  category_id: string | "all" | "uncategorized";
  page: number;
  limit: number;
}

// === Profile ===

interface ProfileFormData {
  display_name: string;
  bio: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface SeoFormData {
  site_title: string | null;
  site_description: string | null;
}

// === Shared ===

interface ToastNotification {
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}
```

### Zod Schemas (src/lib/schemas/)

```typescript
// login.schema.ts
export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

// category.schema.ts (frontend validation)
export const categoryFormSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(100, "Nazwa może mieć maksymalnie 100 znaków"),
  description: z.string().max(500, "Opis może mieć maksymalnie 500 znaków").nullish(),
  cover_photo_id: z.string().uuid().nullish(),
});

// photo.schema.ts (frontend validation)
export const photoFormSchema = z.object({
  title: z.string().max(200, "Tytuł może mieć maksymalnie 200 znaków").nullish(),
  category_id: z.string().uuid().nullish(),
  is_published: z.boolean(),
});

// profile.schema.ts (frontend validation)
export const profileFormSchema = z.object({
  display_name: z.string().min(1, "Nazwa wyświetlana jest wymagana").max(100, "Nazwa może mieć maksymalnie 100 znaków"),
  bio: z.string().nullish(),
  contact_email: z
    .string()
    .email("Nieprawidłowy format email")
    .max(255, "Email może mieć maksymalnie 255 znaków")
    .nullish()
    .or(z.literal("")),
  contact_phone: z.string().max(20, "Telefon może mieć maksymalnie 20 znaków").nullish(),
});

// seo.schema.ts (frontend validation)
export const seoFormSchema = z.object({
  site_title: z.string().max(100, "Tytuł może mieć maksymalnie 100 znaków").nullish(),
  site_description: z.string().max(300, "Opis może mieć maksymalnie 300 znaków").nullish(),
});
```

## 6. Zarządzanie stanem

### AuthContext

```typescript
// src/components/admin/context/AuthContext.tsx

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, initialUser }: { children: React.ReactNode; initialUser: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  // signIn, signOut implementation using Supabase Auth
  // ...
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

### StatsContext

```typescript
// src/components/admin/context/StatsContext.tsx

interface StatsContextValue {
  stats: StatsDTO | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export const StatsContext = createContext<StatsContextValue | null>(null);

export function StatsProvider({ children, initialStats }: {
  children: React.ReactNode;
  initialStats: StatsDTO;
}) {
  const [stats, setStats] = useState<StatsDTO>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError("Nie udało się pobrać statystyk");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StatsContext.Provider value={{ stats, isLoading, error, refreshStats }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (!context) throw new Error("useStats must be used within StatsProvider");
  return context;
}
```

### Custom Hooks

```typescript
// src/components/hooks/useCategories.ts

export function useCategories(initialData: CategoryDTO[]) {
  const [categories, setCategories] = useState<CategoryDTO[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshStats } = useStats();

  const fetchCategories = async () => { ... };

  const createCategory = async (data: CreateCategoryCommand): Promise<CategoryDTO> => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Nie udało się utworzyć kategorii');
    const newCategory = await response.json();
    setCategories(prev => [...prev, newCategory]);
    await refreshStats();
    return newCategory;
  };

  const updateCategory = async (id: string, data: UpdateCategoryCommand): Promise<CategoryDTO> => { ... };

  const deleteCategory = async (id: string): Promise<DeleteCategoryResponseDTO> => { ... };

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
```

```typescript
// src/components/hooks/usePhotos.ts

export function usePhotos(initialData: PhotoListResponseDTO, categories: CategoryDTO[]) {
  const [photos, setPhotos] = useState<PhotoDTO[]>(initialData.data);
  const [pagination, setPagination] = useState<PaginationDTO>(initialData.pagination);
  const [filter, setFilter] = useState<PhotoFilterState>({
    category_id: 'all',
    page: 1,
    limit: 20,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { refreshStats } = useStats();

  const fetchPhotos = async (query?: Partial<PhotoFilterState>) => { ... };

  const updatePhoto = async (id: string, data: UpdatePhotoCommand): Promise<PhotoDTO> => { ... };

  const togglePublish = async (id: string, isPublished: boolean): Promise<void> => {
    // Optimistic update
    setPhotos(prev => prev.map(p =>
      p.id === id ? { ...p, is_published: isPublished } : p
    ));

    try {
      await fetch(`/api/photos/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: isPublished }),
      });
    } catch (err) {
      // Revert on error
      setPhotos(prev => prev.map(p =>
        p.id === id ? { ...p, is_published: !isPublished } : p
      ));
      throw err;
    }
  };

  const deletePhoto = async (id: string): Promise<void> => { ... };

  return {
    photos,
    pagination,
    filter,
    setFilter,
    isLoading,
    fetchPhotos,
    updatePhoto,
    togglePublish,
    deletePhoto,
  };
}
```

```typescript
// src/components/hooks/usePhotoUpload.ts

export function usePhotoUpload(currentCount: number, limit: number) {
  const [files, setFiles] = useState<PhotoUploadFile[]>([]);
  const [settings, setSettings] = useState<PhotoUploadSettings>({
    category_id: null,
    is_published: false,
  });
  const [isUploading, setIsUploading] = useState(false);
  const { refreshStats } = useStats();

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles
      .filter(f => f.type === 'image/jpeg')
      .filter(f => f.size <= 10 * 1024 * 1024)
      .slice(0, 20 - files.length)
      .slice(0, limit - currentCount - files.length);

    const uploadFiles: PhotoUploadFile[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: '', // Will be set by FileReader
      status: 'pending',
      progress: 0,
    }));

    // Generate previews
    uploadFiles.forEach(uf => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFiles(prev => prev.map(f =>
          f.id === uf.id ? { ...f, preview: e.target?.result as string } : f
        ));
      };
      reader.readAsDataURL(uf.file);
    });

    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => { ... };
  const clearFiles = () => setFiles([]);

  const processUpload = async (): Promise<BatchPhotoUploadResponseDTO> => {
    setIsUploading(true);
    // Sequential processing: validate → compress → upload
    // Update progress for each file
    // ...
    await refreshStats();
    setIsUploading(false);
  };

  const retryFile = async (id: string) => { ... };

  return {
    files,
    settings,
    setSettings,
    isUploading,
    addFiles,
    removeFile,
    clearFiles,
    processUpload,
    retryFile,
    canUpload: files.length > 0 && files.some(f => f.status !== 'error'),
  };
}
```

## 7. Integracja API

### Autentykacja (Supabase Auth)

```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Logout
await supabase.auth.signOut();

// Get session (middleware)
const {
  data: { user },
} = await supabase.auth.getUser();
```

### Profile API

| Operacja          | Metoda | Endpoint       | Request                | Response     |
| ----------------- | ------ | -------------- | ---------------------- | ------------ |
| Pobierz profil    | GET    | `/api/profile` | -                      | `ProfileDTO` |
| Aktualizuj profil | PUT    | `/api/profile` | `UpdateProfileCommand` | `ProfileDTO` |

### Settings API

| Operacja              | Metoda | Endpoint        | Request                 | Response      |
| --------------------- | ------ | --------------- | ----------------------- | ------------- |
| Pobierz ustawienia    | GET    | `/api/settings` | -                       | `SettingsDTO` |
| Aktualizuj ustawienia | PUT    | `/api/settings` | `UpdateSettingsCommand` | `SettingsDTO` |

### Categories API

| Operacja             | Metoda | Endpoint                  | Request                  | Response                    |
| -------------------- | ------ | ------------------------- | ------------------------ | --------------------------- |
| Lista kategorii      | GET    | `/api/categories`         | Query: `sort`, `order`   | `CategoryListResponseDTO`   |
| Pojedyncza kategoria | GET    | `/api/categories/:id`     | -                        | `CategoryDTO`               |
| Utwórz kategorię     | POST   | `/api/categories`         | `CreateCategoryCommand`  | `CategoryDTO`               |
| Aktualizuj kategorię | PUT    | `/api/categories/:id`     | `UpdateCategoryCommand`  | `CategoryDTO`               |
| Zmień kolejność      | PUT    | `/api/categories/reorder` | `ReorderCategoryCommand` | `MessageResponseDTO`        |
| Usuń kategorię       | DELETE | `/api/categories/:id`     | -                        | `DeleteCategoryResponseDTO` |

### Photos API

| Operacja           | Metoda | Endpoint                  | Request                                                                | Response                      |
| ------------------ | ------ | ------------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| Lista zdjęć        | GET    | `/api/photos`             | Query: `category_id`, `is_published`, `page`, `limit`, `sort`, `order` | `PhotoListResponseDTO`        |
| Pojedyncze zdjęcie | GET    | `/api/photos/:id`         | -                                                                      | `PhotoDTO`                    |
| Upload zdjęcia     | POST   | `/api/photos`             | FormData                                                               | `PhotoDTO`                    |
| Batch upload       | POST   | `/api/photos/batch`       | FormData                                                               | `BatchPhotoUploadResponseDTO` |
| Aktualizuj zdjęcie | PUT    | `/api/photos/:id`         | `UpdatePhotoCommand`                                                   | `PhotoDTO`                    |
| Toggle publikacji  | PATCH  | `/api/photos/:id/publish` | `PublishPhotoCommand`                                                  | `PublishPhotoResponseDTO`     |
| Usuń zdjęcie       | DELETE | `/api/photos/:id`         | -                                                                      | `MessageResponseDTO`          |

### Stats API

| Operacja           | Metoda | Endpoint     | Request | Response   |
| ------------------ | ------ | ------------ | ------- | ---------- |
| Pobierz statystyki | GET    | `/api/stats` | -       | `StatsDTO` |

### Przykład implementacji fetch

```typescript
// Generyczna funkcja API
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error: ErrorResponseDTO = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}

// Użycie
const categories = await apiRequest<CategoryListResponseDTO>("/api/categories");
```

## 8. Interakcje użytkownika

### Login

1. **Wprowadzenie danych**
   - User wypełnia email i hasło
   - Walidacja on-blur i on-submit
   - Błędne pola oznaczone czerwonym border i komunikatem

2. **Submit formularza**
   - Click "Zaloguj" lub Enter
   - Button disabled + spinner
   - Sukces → Redirect do `/admin/photos`
   - Błąd → Alert z komunikatem (np. "Nieprawidłowy email lub hasło")

### Kategorie

1. **Dodanie kategorii**
   - Click "Dodaj kategorię" (disabled przy 10/10)
   - Dialog create mode
   - Wypełnienie formularza (slug generowany na żywo)
   - Submit → Toast sukcesu → Dialog zamknięty → Grid odświeżony

2. **Edycja kategorii**
   - Click Edit icon na karcie
   - Dialog edit mode z danymi
   - Opcjonalnie: wybór okładki (CoverPhotoSelector)
   - Submit → Toast sukcesu → Grid odświeżony

3. **Usunięcie kategorii**
   - Click Delete icon na karcie
   - AlertDialog z informacją o liczbie zdjęć
   - Confirm → Toast sukcesu → Grid odświeżony

### Zdjęcia

1. **Filtrowanie**
   - Select kategorii w toolbar
   - Zmiana → Re-fetch zdjęć z filtrem

2. **Upload zdjęć**
   - Click "Dodaj zdjęcia" (disabled przy 200/200)
   - Drag & drop lub click → Wybór plików
   - Walidacja (format, rozmiar) → Toast error dla invalid
   - Preview list z progress
   - Opcjonalnie: wybór kategorii, toggle publikacji
   - Click "Wyślij" → Sekwencyjna kompresja + upload
   - Podsumowanie → Stats refresh

3. **Edycja zdjęcia**
   - Click Edit icon na karcie
   - Dialog z formularzem
   - Submit → Toast sukcesu → Karta odświeżona

4. **Toggle publikacji**
   - Toggle Switch na karcie
   - Optimistic update (natychmiastowa zmiana UI)
   - Background API call
   - Błąd → Revert + Toast error

5. **Usunięcie zdjęcia**
   - Click Delete icon na karcie
   - AlertDialog z miniaturką
   - Confirm → Toast sukcesu → Grid odświeżony

### Profil

1. **Edycja danych profilowych**
   - Modyfikacja pól formularza
   - Click "Zapisz zmiany"
   - Submit → Toast "Profil zaktualizowany"

2. **Edycja ustawień SEO**
   - Modyfikacja pól formularza
   - Click "Zapisz zmiany"
   - Submit → Toast "Ustawienia SEO zaktualizowane"

## 9. Warunki i walidacja

### Walidacja po stronie klienta (Zod)

| Pole             | Warunki                           | Komunikat błędu                                                 |
| ---------------- | --------------------------------- | --------------------------------------------------------------- |
| Email (login)    | Wymagane, format email            | "Nieprawidłowy format email"                                    |
| Hasło (login)    | Wymagane                          | "Hasło jest wymagane"                                           |
| Nazwa kategorii  | Wymagane, 1-100 znaków            | "Nazwa jest wymagana", "Nazwa może mieć maksymalnie 100 znaków" |
| Opis kategorii   | Opcjonalne, max 500 znaków        | "Opis może mieć maksymalnie 500 znaków"                         |
| Tytuł zdjęcia    | Opcjonalne, max 200 znaków        | "Tytuł może mieć maksymalnie 200 znaków"                        |
| Display name     | Wymagane, 1-100 znaków            | "Nazwa wyświetlana jest wymagana"                               |
| Contact email    | Opcjonalne, format email, max 255 | "Nieprawidłowy format email"                                    |
| Contact phone    | Opcjonalne, max 20 znaków         | "Telefon może mieć maksymalnie 20 znaków"                       |
| Site title       | Opcjonalne, max 100 znaków        | "Tytuł może mieć maksymalnie 100 znaków"                        |
| Site description | Opcjonalne, max 300 znaków        | "Opis może mieć maksymalnie 300 znaków"                         |

### Walidacja plików (upload)

| Warunek         | Sprawdzenie                      | Reakcja                      |
| --------------- | -------------------------------- | ---------------------------- |
| Format JPEG     | `file.type === 'image/jpeg'`     | Toast error, plik odrzucony  |
| Rozmiar ≤ 10MB  | `file.size <= 10 * 1024 * 1024`  | Toast error, plik odrzucony  |
| Max 20 plików   | `files.length <= 20`             | Nadmiarowe pliki odrzucone   |
| Limit 200 zdjęć | `currentCount + newCount <= 200` | Toast error, upload disabled |

### Walidacja limitów

| Zasób     | Limit | Warunek disable           | UI feedback                                                 |
| --------- | ----- | ------------------------- | ----------------------------------------------------------- |
| Kategorie | 10    | `categories.length >= 10` | Button disabled + tooltip "Osiągnięto limit kategorii (10)" |
| Zdjęcia   | 200   | `photos.count >= 200`     | Button disabled + tooltip "Osiągnięto limit zdjęć (200)"    |

### Wpływ walidacji na UI

1. **Formularze:**
   - Pola z błędami: czerwony border, komunikat pod polem
   - `aria-invalid="true"` dla accessibility
   - Button submit disabled gdy formularz invalid

2. **Limity:**
   - LimitBadge zmienia kolor (green → yellow → red)
   - Przyciski "Dodaj" disabled gdy limit osiągnięty
   - Tooltip wyjaśnia przyczynę

3. **Upload:**
   - Invalid files odrzucone przed dodaniem do listy
   - Toast z listą odrzuconych plików
   - Limit overflow automatycznie obcięty

## 10. Obsługa błędów

### Błędy autentykacji

| Scenariusz                   | Handling                                            |
| ---------------------------- | --------------------------------------------------- |
| Nieprawidłowe dane logowania | Alert w formularzu: "Nieprawidłowy email lub hasło" |
| Wygasła sesja                | Redirect do `/admin/login`                          |
| Brak autoryzacji (401)       | Redirect do `/admin/login`                          |

### Błędy API

| Kod                | Obsługa                                            |
| ------------------ | -------------------------------------------------- |
| 400 Bad Request    | Toast error z komunikatem walidacji                |
| 401 Unauthorized   | Redirect do login                                  |
| 404 Not Found      | Toast error "Nie znaleziono zasobu"                |
| 409 Conflict       | Toast error z komunikatem (np. "Osiągnięto limit") |
| 500 Internal Error | Toast error "Wystąpił nieoczekiwany błąd"          |

### Błędy sieciowe

| Scenariusz      | Handling                                    |
| --------------- | ------------------------------------------- |
| Brak połączenia | Toast error "Brak połączenia z serwerem"    |
| Timeout         | Toast error "Przekroczono czas oczekiwania" |
| Upload failure  | Per-file error message + Retry button       |

### Błędy formularzy

```typescript
// react-hook-form error handling
const onSubmit = async (data: FormData) => {
  try {
    await apiCall(data);
    toast.success("Zapisano pomyślnie");
  } catch (error) {
    if (error instanceof ZodError) {
      // Field-level errors handled by react-hook-form
    } else {
      toast.error(error.message || "Wystąpił błąd");
    }
  }
};
```

### Optimistic update rollback

```typescript
const togglePublish = async (id: string, isPublished: boolean) => {
  const previousState = photos.find((p) => p.id === id)?.is_published;

  // Optimistic update
  setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, is_published: isPublished } : p)));

  try {
    await api.patch(`/api/photos/${id}/publish`, { is_published: isPublished });
    toast.success("Status publikacji zaktualizowany");
  } catch (error) {
    // Rollback
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, is_published: previousState } : p)));
    toast.error("Nie udało się zaktualizować statusu");
  }
};
```

## 11. Kroki implementacji

### Faza 1: Infrastruktura i Autentykacja

1. **Konfiguracja middleware Astro**
   - Sprawdzanie sesji dla ścieżek `/admin/*`
   - Redirect do `/admin/login` gdy brak autoryzacji
   - Przekazanie user do `Astro.locals`

2. **AuthContext i AuthProvider**
   - Utworzenie kontekstu autentykacji
   - Integracja z Supabase Auth
   - Hook `useAuth()`

3. **Strona logowania**
   - `src/pages/admin/login.astro`
   - `LoginForm.tsx` z react-hook-form + Zod
   - Integracja z Supabase `signInWithPassword`
   - Obsługa błędów i redirect

4. **Redirect `/admin`**
   - `src/pages/admin/index.astro`
   - Logika przekierowania w middleware

### Faza 2: Layout i Nawigacja

5. **AdminLayout.astro**
   - Struktura HTML z header i main
   - Integracja Sonner (Toaster)
   - Slot dla zawartości

6. **AdminHeader.tsx**
   - Nawigacja (Zdjęcia, Kategorie, Profil)
   - Active state dla linków
   - Responsywny design (hamburger na mobile)

7. **UserMenu.tsx**
   - Dropdown z avatarem
   - Opcja wylogowania

8. **LimitBadge.tsx**
   - Badge z kolorami progress
   - Reużywalny komponent

### Faza 3: StatsContext

9. **StatsContext i StatsProvider**
   - Kontekst dla limitów
   - Funkcja `refreshStats()`
   - Hook `useStats()`

### Faza 4: Kategorie

10. **Strona kategorii**
    - `src/pages/admin/categories.astro`
    - SSR: fetch kategorii i stats
    - Client component: CategoriesManager

11. **CategoriesManager.tsx**
    - Stan dialogów i potwierdzenia usunięcia
    - Integracja z useCategories hook

12. **CategoriesGrid.tsx i CategoryCard.tsx**
    - Grid layout
    - Karta z cover, info, akcje

13. **CategoryDialog.tsx**
    - Formularz create/edit
    - Generowanie slug
    - Walidacja Zod

14. **CoverPhotoSelector.tsx**
    - Popover z gridiem miniaturek
    - Fetch zdjęć kategorii

15. **useCategories hook**
    - CRUD operations
    - Integracja ze StatsContext

### Faza 5: Zdjęcia

16. **Strona zdjęć**
    - `src/pages/admin/photos.astro`
    - SSR: fetch zdjęć, kategorii, stats
    - Client component: PhotosManager

17. **PhotosManager.tsx**
    - Toolbar z filtrem
    - Stan dialogów
    - Integracja z usePhotos hook

18. **PhotosGrid.tsx i PhotoCard.tsx**
    - Grid responsywny
    - Karta z miniaturką, switch publikacji, akcje

19. **PhotoUploadZone.tsx**
    - Dialog z react-dropzone
    - Walidacja plików
    - Kontrole (kategoria, publikacja)

20. **UploadProgressList.tsx i UploadProgressItem.tsx**
    - Lista plików z progress
    - Dual progress bar
    - Status indicators

21. **PhotoEditDialog.tsx**
    - Formularz edycji metadanych
    - Select kategorii

22. **usePhotos hook**
    - Fetch z filtrowaniem
    - CRUD operations
    - Optimistic update dla publish

23. **usePhotoUpload hook**
    - Zarządzanie listą plików
    - Kompresja client-side (browser-image-compression)
    - Upload sekwencyjny
    - Retry logic

### Faza 6: Profil

24. **Strona profilu**
    - `src/pages/admin/profile.astro`
    - SSR: fetch profile, settings, stats
    - Client component: ProfileManager

25. **ProfileManager.tsx**
    - Layout trzech sekcji

26. **ProfileForm.tsx**
    - Formularz danych profilowych
    - react-hook-form + Zod
    - PUT /api/profile

27. **SeoSettingsForm.tsx**
    - Formularz SEO
    - react-hook-form + Zod
    - PUT /api/settings

28. **StatsCard.tsx**
    - Progress bary z kolorami
    - Dane ze StatsContext

### Faza 7: Testy i Polish

29. **Testy manualne**
    - Wszystkie user stories
    - Edge cases
    - Responsywność

30. **Accessibility audit**
    - ARIA labels
    - Keyboard navigation
    - Screen reader testing

31. **Performance optimization**
    - Lazy loading images
    - Code splitting
    - Bundle analysis
