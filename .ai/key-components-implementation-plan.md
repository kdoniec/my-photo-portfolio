# Plan implementacji kluczowych komponentów - My Photo Portfolio

## 1. Przegląd

Ten dokument opisuje szczegółowy plan implementacji kluczowych komponentów frontendowych aplikacji My Photo Portfolio. Komponenty podzielone są na trzy główne kategorie:

1. **Komponenty Astro (SSR)** - statyczne komponenty renderowane po stronie serwera: SEO, nawigacja
2. **Komponenty React (CSR)** - interaktywne komponenty renderowane po stronie klienta: galeria, lightbox, upload zdjęć, dialogi edycji
3. **Konteksty i hooki** - zarządzanie stanem globalnym i logika współdzielona

Celem jest stworzenie spójnego systemu komponentów zgodnego z PRD, wspierającego responsywność (mobile-first) oraz dostępność (WCAG).

## 2. Routing widoków

| Ścieżka             | Opis                                           | Komponenty główne                                               |
| ------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| `/`                 | Strona główna - kafelki kategorii              | `CategoryGrid`, `SEOHead`, `Navigation`                         |
| `/kategoria/[slug]` | Galeria zdjęć w kategorii                      | `PhotoMasonry`, `PhotoLightbox`, `SEOHead`, `Navigation`        |
| `/o-mnie`           | Strona "O mnie"                                | `ContactInfo`, `SEOHead`, `Navigation`                          |
| `/admin`            | Przekierowanie do `/admin/login` lub dashboard | `AdminLayoutClient`                                             |
| `/admin/login`      | Strona logowania                               | `LoginForm`                                                     |
| `/admin/categories` | Zarządzanie kategoriami                        | `CategoriesManager`, `CategoryDialog`                           |
| `/admin/photos`     | Zarządzanie zdjęciami                          | `PhotosManager`, `PhotoUploadZone`, `PhotoEditDialog`           |
| `/admin/profile`    | Edycja profilu                                 | `ProfileManager`, `ProfileForm`, `SeoSettingsForm`, `StatsCard` |
| `/404`              | Strona błędu                                   | `EmptyState`                                                    |

## 3. Struktura komponentów

```
src/
├── components/
│   ├── seo/
│   │   └── SEOHead.astro              # Meta tags i Open Graph
│   ├── navigation/
│   │   ├── Navigation.astro           # Nawigacja publiczna (Astro)
│   │   ├── PublicNavbar.tsx           # Nawigacja publiczna (React)
│   │   ├── AdminNavbar.tsx            # Nawigacja admina
│   │   ├── MobileMenu.tsx             # Menu mobilne (hamburger)
│   │   ├── MobileSheet.tsx            # Sheet dla mobilnej nawigacji
│   │   ├── Logo.tsx                   # Logo/nazwa strony
│   │   ├── NavLink.tsx                # Link nawigacyjny
│   │   └── UserMenu.tsx               # Menu użytkownika (avatar + dropdown)
│   ├── category/
│   │   ├── CategoryCard.tsx           # Kafelek kategorii (publiczny)
│   │   └── CategoryGrid.tsx           # Siatka kategorii (publiczna)
│   ├── gallery/
│   │   ├── PhotoMasonry.tsx           # Masonry layout + infinite scroll
│   │   ├── PhotoCard.tsx              # Karta zdjęcia w galerii
│   │   ├── PhotoLightbox.tsx          # Fullscreen viewer
│   │   └── GallerySkeleton.tsx        # Loading skeleton
│   ├── profile/
│   │   └── ContactInfo.astro          # Dane kontaktowe (publiczne)
│   ├── shared/
│   │   ├── EmptyState.tsx             # Stan pusty (generyczny)
│   │   └── ErrorState.tsx             # Stan błędu z retry
│   ├── admin/
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Zarządzanie sesją
│   │   │   └── StatsContext.tsx       # Tracking limitów
│   │   ├── layout/
│   │   │   └── AdminLayoutClient.tsx  # Layout admina (client-side)
│   │   ├── shared/
│   │   │   ├── AdminHeader.tsx        # Header sekcji admina
│   │   │   ├── LimitBadge.tsx         # Badge z limitem (X/Y)
│   │   │   └── UserMenu.tsx           # Menu użytkownika admina
│   │   ├── auth/
│   │   │   └── LoginForm.tsx          # Formularz logowania
│   │   ├── categories/
│   │   │   ├── CategoriesPage.tsx     # Strona kategorii
│   │   │   ├── CategoriesManager.tsx  # Manager kategorii
│   │   │   ├── CategoriesGrid.tsx     # Siatka kategorii admina
│   │   │   ├── CategoryCard.tsx       # Karta kategorii admina
│   │   │   └── CategoryDialog.tsx     # Dialog tworzenia/edycji
│   │   ├── photos/
│   │   │   ├── PhotosPage.tsx         # Strona zdjęć
│   │   │   ├── PhotosManager.tsx      # Manager zdjęć
│   │   │   ├── PhotosGrid.tsx         # Siatka zdjęć admina
│   │   │   ├── PhotoCard.tsx          # Karta zdjęcia admina
│   │   │   ├── PhotoUploadZone.tsx    # Drag & drop upload
│   │   │   ├── PhotoEditDialog.tsx    # Dialog edycji zdjęcia
│   │   │   ├── UploadProgressList.tsx # Lista progress barów
│   │   │   └── UploadProgressItem.tsx # Pojedynczy progress bar
│   │   └── profile/
│   │       ├── ProfilePage.tsx        # Strona profilu
│   │       ├── ProfileManager.tsx     # Manager profilu
│   │       ├── ProfileForm.tsx        # Formularz profilu
│   │       ├── SeoSettingsForm.tsx    # Formularz SEO
│   │       └── StatsCard.tsx          # Karta statystyk
│   └── ui/                            # Shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── alert-dialog.tsx
│       ├── select.tsx
│       ├── switch.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── badge.tsx
│       ├── progress.tsx
│       ├── sheet.tsx
│       ├── dropdown-menu.tsx
│       ├── skeleton.tsx
│       ├── alert.tsx
│       └── sonner.tsx
├── hooks/
│   ├── useInfiniteScroll.ts           # Intersection Observer
│   ├── useBodyScrollLock.ts           # Lock scroll dla lightbox
│   └── useLightbox.ts                 # Logika lightboxa
└── components/hooks/                  # Admin-specific hooks
    ├── useCategories.ts               # CRUD kategorii
    ├── usePhotos.ts                   # CRUD zdjęć
    ├── usePhotoUpload.ts              # Logika uploadu
    └── useNavigation.ts               # Stan nawigacji
```

## 4. Szczegóły komponentów

### 4.1 SEOHead.astro

- **Opis:** Komponent Astro generujący meta tagi SEO i Open Graph w `<head>`
- **Główne elementy:**
  - `<title>` - tytuł strony
  - `<meta name="description">` - opis strony
  - `<meta property="og:*">` - Open Graph tags
  - `<meta property="twitter:*">` - Twitter Cards
  - `<link rel="canonical">` - URL kanoniczny
- **Obsługiwane interakcje:** Brak (komponent statyczny)
- **Obsługiwana walidacja:** Brak
- **Typy:**
  ```typescript
  interface Props {
    title: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogType?: "website" | "article";
    canonicalUrl?: string;
  }
  ```
- **Propsy:**
  - `title` (required) - tytuł strony
  - `description` (optional) - opis strony
  - `ogImage` (optional) - URL obrazu dla Open Graph
  - `ogType` (default: "website") - typ Open Graph

---

### 4.2 Navigation.astro

- **Opis:** Nawigacja publicznej galerii renderowana po stronie serwera
- **Główne elementy:**
  - `<header>` z rolą `banner`
  - `<nav>` z `aria-label="Main navigation"`
  - Logo/nazwa strony (link do `/`)
  - Desktop: lista linków w `<ul>`
  - Mobile: komponent `MobileMenu` (React, client:load)
- **Obsługiwane interakcje:**
  - Kliknięcie logo → przekierowanie do `/`
  - Kliknięcie linku → nawigacja do odpowiedniej strony
  - Mobile: hamburger → otwarcie Sheet
- **Obsługiwana walidacja:** Brak
- **Typy:**
  ```typescript
  interface Props {
    siteName: string;
    currentPath: string;
  }
  ```
- **Propsy:**
  - `siteName` - nazwa strony/fotografa
  - `currentPath` - aktualna ścieżka (dla active indicator)

---

### 4.3 EmptyState.tsx

- **Opis:** Generyczny komponent empty state do użycia w różnych kontekstach
- **Główne elementy:**
  - Ikona (Lucide) w kółku z tłem `bg-muted`
  - Nagłówek `<h2>` z tytułem
  - Opcjonalny opis `<p>`
  - Opcjonalny przycisk akcji (Button + link)
- **Obsługiwane interakcje:**
  - Kliknięcie przycisku akcji → nawigacja do `href`
- **Obsługiwana walidacja:** Brak
- **Typy:**
  ```typescript
  interface EmptyStateProps {
    title: string;
    description?: string;
    action?: {
      label: string;
      href: string;
    };
  }
  ```
- **Propsy:**
  - `title` (required) - nagłówek
  - `description` (optional) - opis
  - `action` (optional) - obiekt z `label` i `href`

---

### 4.4 PhotoLightbox.tsx

- **Opis:** Fullscreen viewer zdjęć z nawigacją
- **Główne elementy:**
  - React Portal do `document.body`
  - Backdrop (`bg-black/95 backdrop-blur-sm`)
  - Przycisk zamknięcia (X) w prawym górnym rogu
  - Counter "X z Y" w lewym górnym rogu
  - Główny obraz (`<img>` z `object-contain`)
  - Przyciski nawigacji (ChevronLeft/ChevronRight)
- **Obsługiwane interakcje:**
  - Kliknięcie X → `onClose()`
  - Escape key → `onClose()`
  - Arrow Left/Right → nawigacja między zdjęciami
  - Swipe (mobile) → nawigacja (react-swipeable)
  - Kliknięcie poza zdjęciem → `onClose()`
- **Obsługiwana walidacja:**
  - Disable arrow left gdy `currentIndex === 0`
  - Disable arrow right gdy `currentIndex === photos.length - 1`
- **Typy:**
  ```typescript
  interface PhotoLightboxProps {
    photos: PublicPhotoDTO[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
  }
  ```
- **Propsy:**
  - `photos` - tablica zdjęć
  - `currentIndex` - aktualny indeks
  - `onClose` - callback zamknięcia
  - `onNavigate` - callback nawigacji

---

### 4.5 PhotoUploadZone.tsx

- **Opis:** Drag & drop upload z progress tracking, wrapped w Dialog
- **Główne elementy:**
  - Shadcn Dialog z HeaderTitle "Dodaj zdjęcia"
  - Dropzone (react-dropzone): border-dashed, ikona Upload
  - Ustawienia uploadu: Select kategorii, Switch "Opublikuj od razu"
  - UploadProgressList: lista plików z progress barami
  - Footer: Button "Wyczyść listę", Button "Zamknij", Button "Wyślij"
- **Obsługiwane interakcje:**
  - Drag & drop plików → dodanie do listy
  - Kliknięcie dropzone → otwarcie file picker
  - Wybór kategorii → aktualizacja `settings.category_id`
  - Toggle publikacji → aktualizacja `settings.is_published`
  - Kliknięcie "Wyczyść listę" → `clearFiles()`
  - Kliknięcie "Wyślij" → `processUpload()`
  - Kliknięcie X na pliku → `removeFile(id)`
  - Kliknięcie "Retry" → `retryFile(id)`
- **Obsługiwana walidacja:**
  - Format: tylko JPEG (.jpg, .jpeg)
  - Rozmiar: max 50MB (kompresja client-side)
  - Limit: max 100 plików na raz
  - Limit globalny: nie przekroczyć 200 zdjęć
- **Typy:**

  ```typescript
  interface PhotoUploadZoneProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    categories: CategoryDTO[];
    currentPhotoCount: number;
    photoLimit: number;
    onUploadComplete: () => void;
  }

  interface PhotoUploadFile {
    id: string;
    file: File;
    preview: string;
    status: "pending" | "validating" | "compressing" | "uploading" | "success" | "error";
    progress: number;
    error?: string;
  }

  interface PhotoUploadSettings {
    category_id: string | null;
    is_published: boolean;
  }
  ```

- **Propsy:**
  - `isOpen` - czy dialog jest otwarty
  - `onOpenChange` - callback zmiany stanu
  - `categories` - dostępne kategorie
  - `currentPhotoCount` - aktualna liczba zdjęć
  - `photoLimit` - limit zdjęć (200)
  - `onUploadComplete` - callback po ukończeniu uploadu

---

### 4.6 PhotoMasonry.tsx

- **Opis:** Masonry layout z infinite scroll dla publicznej galerii
- **Główne elementy:**
  - react-masonry-css Masonry component
  - Lista PhotoCard dla każdego zdjęcia
  - GallerySkeleton podczas ładowania
  - ErrorState z retry przy błędzie
  - Sentinel div dla Intersection Observer
  - Komunikat "To wszystkie zdjęcia" na końcu
  - PhotoLightbox (conditional render)
- **Obsługiwane interakcje:**
  - Kliknięcie zdjęcia → otwarcie lightboxa
  - Scroll do sentinel → `loadMorePhotos()`
  - Kliknięcie "Spróbuj ponownie" → retry fetch
- **Obsługiwana walidacja:** Brak (dane z API)
- **Typy:**
  ```typescript
  interface PhotoMasonryProps {
    categorySlug: string;
    initialPhotos: PublicPhotoDTO[];
    initialPagination: PaginationDTO;
  }
  ```
- **Propsy:**
  - `categorySlug` - slug kategorii dla fetch
  - `initialPhotos` - początkowe zdjęcia (SSR)
  - `initialPagination` - początkowa paginacja

---

### 4.7 CategoryDialog.tsx

- **Opis:** Modal do tworzenia/edycji kategorii
- **Główne elementy:**
  - Shadcn Dialog z HeaderTitle "Dodaj kategorię" / "Edytuj kategorię"
  - Form z react-hook-form + Zod validation
  - Input "Nazwa" (required)
  - Input "Slug" (readonly, auto-generated)
  - Textarea "Opis" (optional)
  - CoverPhotoSelector (tylko edit mode z zdjęciami)
  - Footer: Button "Anuluj", Button "Zapisz"
- **Obsługiwane interakcje:**
  - Zmiana nazwy → aktualizacja slug preview
  - Kliknięcie "Zapisz" → submit form
  - Kliknięcie "Anuluj" → zamknięcie dialogu
- **Obsługiwana walidacja:**
  - Nazwa: required, max 100 znaków
  - Opis: max 500 znaków
  - Slug: auto-generated, unique (sprawdzane po stronie API)
- **Typy:**

  ```typescript
  interface CategoryDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    category?: CategoryDTO | null;
    onSubmit: (data: CategoryFormData) => Promise<void>;
  }

  interface CategoryFormData {
    name: string;
    description?: string | null;
    cover_photo_id?: string | null;
  }
  ```

- **Propsy:**
  - `isOpen` - czy dialog jest otwarty
  - `onOpenChange` - callback zmiany stanu
  - `mode` - tryb: "create" lub "edit"
  - `category` - kategoria do edycji (tylko edit mode)
  - `onSubmit` - callback zapisu

---

### 4.8 PhotoEditDialog.tsx

- **Opis:** Modal do edycji metadanych zdjęcia
- **Główne elementy:**
  - Shadcn Dialog z HeaderTitle "Edytuj zdjęcie"
  - Miniaturka zdjęcia (64x64px)
  - Informacje: wymiary, ID
  - Form z react-hook-form + Zod
  - Input "Tytuł" (optional)
  - Select "Kategoria" (optional)
  - Switch "Opublikowane"
  - Footer: Button "Anuluj", Button "Zapisz zmiany"
- **Obsługiwane interakcje:**
  - Zmiana kategorii → aktualizacja form state
  - Toggle publikacji → aktualizacja form state
  - Kliknięcie "Zapisz zmiany" → submit form
  - Kliknięcie "Anuluj" → zamknięcie dialogu
- **Obsługiwana walidacja:**
  - Tytuł: max 200 znaków
  - Kategoria: valid UUID lub null
- **Typy:**

  ```typescript
  interface PhotoEditDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    photo: PhotoDTO | null;
    categories: CategoryDTO[];
    onSubmit: (data: PhotoFormData) => Promise<void>;
  }

  interface PhotoFormData {
    title?: string | null;
    category_id?: string | null;
    is_published?: boolean;
  }
  ```

- **Propsy:**
  - `isOpen` - czy dialog jest otwarty
  - `onOpenChange` - callback zmiany stanu
  - `photo` - zdjęcie do edycji
  - `categories` - dostępne kategorie
  - `onSubmit` - callback zapisu

---

### 4.9 CoverPhotoSelector.tsx (do implementacji)

- **Opis:** Popover z grid miniaturek do wyboru okładki kategorii
- **Główne elementy:**
  - Shadcn Popover z trigger Button
  - Grid 3-4 kolumny miniaturek
  - ScrollArea z max-height 400px
  - Border highlight dla wybranej okładki
  - EmptyState jeśli brak zdjęć
- **Obsługiwane interakcje:**
  - Kliknięcie miniaturki → `onSelect(photoId)`
  - Otwarcie popover → fetch zdjęć kategorii
- **Obsługiwana walidacja:** Brak
- **Typy:**
  ```typescript
  interface CoverPhotoSelectorProps {
    categoryId: string;
    currentCoverId?: string;
    onSelect: (photoId: string) => void;
  }
  ```
- **Propsy:**
  - `categoryId` - ID kategorii
  - `currentCoverId` - ID aktualnej okładki
  - `onSelect` - callback wyboru

---

### 4.10 AuthContext.tsx

- **Opis:** Context provider zarządzający sesją użytkownika
- **Główne elementy:**
  - `AuthContext` z createContext
  - `AuthProvider` component
  - `useAuth` hook
- **Provides:**
  - `user: User | null` - aktualny użytkownik
  - `isLoading: boolean` - stan ładowania
  - `signIn(email, password)` - logowanie
  - `signOut()` - wylogowanie
- **Logika:**
  - Integracja z Supabase Auth
  - Auto-redirect do `/admin/login` po wylogowaniu
- **Użycie:** `AdminLayoutClient`, protected pages

---

### 4.11 StatsContext.tsx

- **Opis:** Context provider tracking limitów zdjęć i kategorii
- **Główne elementy:**
  - `StatsContext` z createContext
  - `StatsProvider` component
  - `useStats` hook
- **Provides:**
  - `stats: StatsDTO | null` - statystyki
  - `isLoading: boolean` - stan ładowania
  - `error: string | null` - błąd
  - `refreshStats()` - odświeżenie statystyk
- **Data source:** `GET /api/stats`
- **Refresh strategy:** Wywoływane po mutacjach (upload, delete, create)
- **Użycie:** `PhotoUploadZone`, `StatsCard`, `LimitBadge`

---

## 5. Typy

### 5.1 Istniejące typy DTO (z src/types.ts)

```typescript
// Profile
interface ProfileDTO {
  id: string;
  display_name: string;
  bio: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

interface PublicProfileDTO {
  display_name: string;
  bio: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

// Settings
interface SettingsDTO {
  id: string;
  photographer_id: string;
  site_title: string | null;
  site_description: string | null;
  created_at: string;
  updated_at: string;
}

interface PublicSettingsDTO {
  site_title: string | null;
  site_description: string | null;
}

// Category
interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_photo_id: string | null;
  cover_photo_url: string | null;
  display_order: number;
  photos_count: number;
  created_at: string;
  updated_at: string;
}

interface PublicCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_photo_url: string | null;
  display_order: number;
  photos_count: number;
}

// Photo
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

interface PublicPhotoDTO {
  id: string;
  title: string | null;
  thumbnail_url: string;
  preview_url: string;
  original_width: number;
  original_height: number;
}

// Pagination
interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Stats
interface StatsDTO {
  photos: {
    count: number;
    limit: number;
    published_count: number | null;
  };
  categories: {
    count: number;
    limit: number;
  };
  storage_used_bytes: number | null;
}
```

### 5.2 Typy specyficzne dla komponentów (z src/components/admin/types.ts)

```typescript
// Upload
type UploadStatus = "pending" | "validating" | "compressing" | "uploading" | "success" | "error";

interface PhotoUploadFile {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

interface PhotoUploadSettings {
  category_id: string | null;
  is_published: boolean;
}
```

### 5.3 Typy formularzy (Zod schemas)

```typescript
// Category form
interface CategoryFormData {
  name: string;
  description?: string | null;
  cover_photo_id?: string | null;
}

// Photo form
interface PhotoFormData {
  title?: string | null;
  category_id?: string | null;
  is_published?: boolean;
}

// Profile form
interface ProfileFormData {
  display_name: string;
  bio?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

// Settings form
interface SettingsFormData {
  site_title?: string | null;
  site_description?: string | null;
}

// Login form
interface LoginFormData {
  email: string;
  password: string;
}
```

## 6. Zarządzanie stanem

### 6.1 Context Providers

| Context        | Zakres     | Stan                          | Odświeżanie              |
| -------------- | ---------- | ----------------------------- | ------------------------ |
| `AuthContext`  | `/admin/*` | `user`, `isLoading`           | Po logowaniu/wylogowaniu |
| `StatsContext` | `/admin/*` | `stats`, `isLoading`, `error` | Po mutacjach CRUD        |

### 6.2 Lokalne stany komponentów

| Komponent         | Stan                                              | Opis                      |
| ----------------- | ------------------------------------------------- | ------------------------- |
| `PhotoMasonry`    | `photos`, `page`, `hasMore`, `isLoading`, `error` | Infinite scroll           |
| `PhotoLightbox`   | (props only)                                      | Kontrolowany przez parent |
| `PhotoUploadZone` | via `usePhotoUpload`                              | Upload state              |
| `CategoryDialog`  | form state (react-hook-form)                      | Formularz                 |
| `PhotoEditDialog` | form state (react-hook-form)                      | Formularz                 |

### 6.3 Custom Hooks

#### useInfiniteScroll

```typescript
interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

interface UseInfiniteScrollReturn {
  sentinelRef: React.RefObject<HTMLDivElement>;
}
```

Użycie: `PhotoMasonry` - sentinel div na końcu listy

#### useLightbox

```typescript
interface UseLightboxOptions {
  photos: PublicPhotoDTO[];
}

interface UseLightboxReturn {
  isOpen: boolean;
  currentIndex: number;
  currentPhoto: PublicPhotoDTO | null;
  open: (index: number) => void;
  close: () => void;
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
}
```

Użycie: `PhotoMasonry` - zarządzanie lightboxem

#### useBodyScrollLock

```typescript
function useBodyScrollLock(isLocked: boolean): void;
```

Użycie: `PhotoLightbox` - blokada scroll body

#### usePhotoUpload

```typescript
interface UsePhotoUploadReturn {
  files: PhotoUploadFile[];
  settings: PhotoUploadSettings;
  setSettings: React.Dispatch<React.SetStateAction<PhotoUploadSettings>>;
  isUploading: boolean;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  processUpload: () => Promise<BatchPhotoUploadResponseDTO>;
  retryFile: (id: string) => Promise<void>;
  canUpload: boolean;
}
```

Użycie: `PhotoUploadZone` - logika uploadu

## 7. Integracja API

### 7.1 Publiczne endpointy

| Endpoint                              | Metoda | Request         | Response                        | Komponent         |
| ------------------------------------- | ------ | --------------- | ------------------------------- | ----------------- |
| `/api/public/profile`                 | GET    | -               | `PublicProfileDTO`              | ContactInfo       |
| `/api/public/settings`                | GET    | -               | `PublicSettingsDTO`             | SEOHead           |
| `/api/public/categories`              | GET    | -               | `{ data: PublicCategoryDTO[] }` | CategoryGrid      |
| `/api/public/categories/:slug`        | GET    | -               | `PublicCategoryDetailDTO`       | PhotoMasonry page |
| `/api/public/categories/:slug/photos` | GET    | `?page=&limit=` | `PublicPhotoListResponseDTO`    | PhotoMasonry      |

### 7.2 Chronione endpointy (admin)

| Endpoint                  | Metoda | Request                                    | Response                    | Komponent         |
| ------------------------- | ------ | ------------------------------------------ | --------------------------- | ----------------- |
| `/api/profile`            | GET    | -                                          | `ProfileDTO`                | ProfileForm       |
| `/api/profile`            | PUT    | `UpdateProfileCommand`                     | `ProfileDTO`                | ProfileForm       |
| `/api/settings`           | GET    | -                                          | `SettingsDTO`               | SeoSettingsForm   |
| `/api/settings`           | PUT    | `UpdateSettingsCommand`                    | `SettingsDTO`               | SeoSettingsForm   |
| `/api/categories`         | GET    | `?sort=&order=`                            | `CategoryListResponseDTO`   | CategoriesManager |
| `/api/categories`         | POST   | `CreateCategoryCommand`                    | `CategoryDTO`               | CategoryDialog    |
| `/api/categories/:id`     | PUT    | `UpdateCategoryCommand`                    | `CategoryDTO`               | CategoryDialog    |
| `/api/categories/:id`     | DELETE | -                                          | `DeleteCategoryResponseDTO` | CategoriesManager |
| `/api/photos`             | GET    | `?category_id=&is_published=&page=&limit=` | `PhotoListResponseDTO`      | PhotosManager     |
| `/api/photos`             | POST   | FormData (thumbnail, preview, metadata)    | `PhotoDTO`                  | PhotoUploadZone   |
| `/api/photos/:id`         | PUT    | `UpdatePhotoCommand`                       | `PhotoDTO`                  | PhotoEditDialog   |
| `/api/photos/:id`         | DELETE | -                                          | `MessageResponseDTO`        | PhotosManager     |
| `/api/photos/:id/publish` | PATCH  | `PublishPhotoCommand`                      | `PublishPhotoResponseDTO`   | PhotoCard         |
| `/api/stats`              | GET    | -                                          | `StatsDTO`                  | StatsContext      |

## 8. Interakcje użytkownika

### 8.1 Publiczna galeria

| Interakcja                   | Komponent     | Wynik                            |
| ---------------------------- | ------------- | -------------------------------- |
| Kliknięcie kafelka kategorii | CategoryGrid  | Nawigacja do `/kategoria/[slug]` |
| Kliknięcie zdjęcia w galerii | PhotoMasonry  | Otwarcie PhotoLightbox           |
| Scroll do końca galerii      | PhotoMasonry  | Załadowanie kolejnych zdjęć      |
| Kliknięcie X w lightbox      | PhotoLightbox | Zamknięcie lightboxa             |
| Arrow keys w lightbox        | PhotoLightbox | Nawigacja między zdjęciami       |
| Swipe w lightbox (mobile)    | PhotoLightbox | Nawigacja między zdjęciami       |

### 8.2 Panel admina

| Interakcja                       | Komponent         | Wynik                            |
| -------------------------------- | ----------------- | -------------------------------- |
| Submit formularza logowania      | LoginForm         | Logowanie, redirect do dashboard |
| Kliknięcie "Dodaj kategorię"     | CategoriesManager | Otwarcie CategoryDialog (create) |
| Kliknięcie "Edytuj" na kategorii | CategoriesManager | Otwarcie CategoryDialog (edit)   |
| Kliknięcie "Usuń" na kategorii   | CategoriesManager | Otwarcie AlertDialog (confirm)   |
| Drag & drop plików               | PhotoUploadZone   | Dodanie plików do listy          |
| Kliknięcie "Wyślij"              | PhotoUploadZone   | Start uploadu                    |
| Toggle publikacji na zdjęciu     | PhotoCard         | PATCH /api/photos/:id/publish    |
| Kliknięcie "Edytuj" na zdjęciu   | PhotosManager     | Otwarcie PhotoEditDialog         |
| Kliknięcie "Usuń" na zdjęciu     | PhotosManager     | Otwarcie AlertDialog (confirm)   |
| Zmiana filtra kategorii          | PhotosManager     | Filtrowanie listy zdjęć          |

## 9. Warunki i walidacja

### 9.1 Walidacja po stronie klienta

| Warunek                      | Komponent       | Efekt UI                         |
| ---------------------------- | --------------- | -------------------------------- |
| Nazwa kategorii wymagana     | CategoryDialog  | Error message, button disabled   |
| Nazwa max 100 znaków         | CategoryDialog  | Error message przy przekroczeniu |
| Opis max 500 znaków          | CategoryDialog  | Error message przy przekroczeniu |
| Tytuł zdjęcia max 200 znaków | PhotoEditDialog | Error message przy przekroczeniu |
| Email format                 | ProfileForm     | Error message przy niepoprawnym  |
| Password wymagane            | LoginForm       | Error message, button disabled   |
| Plik JPEG only               | PhotoUploadZone | Toast error, plik odrzucony      |
| Plik max 50MB                | PhotoUploadZone | Toast error, plik odrzucony      |

### 9.2 Walidacja limitów

| Warunek                          | Komponent         | Efekt UI                         |
| -------------------------------- | ----------------- | -------------------------------- |
| Kategorie 10/10                  | CategoriesManager | Button "Dodaj" disabled, tooltip |
| Zdjęcia 200/200                  | PhotosManager     | Button "Dodaj" disabled, tooltip |
| Przekroczenie limitu przy upload | PhotoUploadZone   | Pliki ponad limit odrzucone      |

### 9.3 Walidacja po stronie API

| Warunek         | Response        | Efekt UI                   |
| --------------- | --------------- | -------------------------- |
| Duplicate slug  | 400 Bad Request | Toast error                |
| Limit kategorii | 409 Conflict    | Toast error                |
| Limit zdjęć     | 409 Conflict    | Toast error                |
| Unauthorized    | 401             | Redirect do /admin/login   |
| Not found       | 404             | Toast error lub strona 404 |

## 10. Obsługa błędów

### 10.1 Błędy sieciowe

| Scenariusz                      | Komponent       | Obsługa                          |
| ------------------------------- | --------------- | -------------------------------- |
| Network error w infinite scroll | PhotoMasonry    | ErrorState z retry               |
| Network error w upload          | PhotoUploadZone | Per-file error, retry button     |
| Network timeout                 | Wszystkie       | Toast "Przekroczono limit czasu" |
| Server error (500)              | Wszystkie       | Toast "Coś poszło nie tak"       |

### 10.2 Błędy autentykacji

| Scenariusz                | Obsługa                               |
| ------------------------- | ------------------------------------- |
| Nieprawidłowe credentials | Alert "Nieprawidłowy email lub hasło" |
| Session expired           | Auto-redirect do /admin/login + Toast |
| 401 w trakcie używania    | Auto-redirect do /admin/login         |

### 10.3 Błędy walidacji

| Scenariusz            | Obsługa                         |
| --------------------- | ------------------------------- |
| Form validation error | Inline error messages           |
| API validation error  | Toast error z message z API     |
| File validation error | Toast error z listą odrzuconych |

### 10.4 Stany puste

| Scenariusz              | Komponent         | UI                                   |
| ----------------------- | ----------------- | ------------------------------------ |
| Brak kategorii (public) | CategoryGrid      | EmptyState "Galeria w przygotowaniu" |
| Brak zdjęć w kategorii  | PhotoMasonry      | EmptyState "Brak zdjęć"              |
| Brak kategorii (admin)  | CategoriesManager | EmptyState + button "Dodaj"          |
| Brak zdjęć (admin)      | PhotosManager     | EmptyState + button "Dodaj"          |

## 11. Kroki implementacji

### Faza 1: Infrastruktura i komponenty bazowe

1. **Skonfigurować Shadcn/ui components**
   - Zainstalować brakujące komponenty: `Popover`, `ScrollArea`, `Tooltip`
   - Zweryfikować style variant "new-york"

2. **Zaimplementować custom hooks**
   - `useInfiniteScroll` ✅ (istnieje)
   - `useLightbox` ✅ (istnieje)
   - `useBodyScrollLock` ✅ (istnieje)
   - `usePhotoUpload` ✅ (istnieje)

3. **Zaimplementować Context Providers**
   - `AuthContext` ✅ (istnieje)
   - `StatsContext` ✅ (istnieje)

### Faza 2: Komponenty publicznej galerii

4. **SEOHead.astro** ✅ (istnieje)
   - Zweryfikować wszystkie meta tagi

5. **Navigation.astro** ✅ (istnieje)
   - Zweryfikować responsive behavior
   - Zweryfikować ARIA attributes

6. **EmptyState.tsx** ✅ (istnieje)
   - Dodać wariant z custom icon (jeśli potrzebny)

7. **PhotoMasonry.tsx** ✅ (istnieje)
   - Zweryfikować infinite scroll
   - Zweryfikować error handling

8. **PhotoLightbox.tsx** ✅ (istnieje)
   - Dodać preloading sąsiednich zdjęć
   - Zweryfikować mobile swipe gestures

### Faza 3: Komponenty panelu admina

9. **LoginForm.tsx** ✅ (istnieje)
   - Zweryfikować error handling
   - Zweryfikować redirect po logowaniu

10. **CategoryDialog.tsx** ✅ (istnieje)
    - Dodać CoverPhotoSelector (nowy komponent)

11. **CoverPhotoSelector.tsx** (do implementacji)
    - Popover z grid miniaturek
    - Fetch zdjęć kategorii
    - Highlight selected

12. **PhotoUploadZone.tsx** ✅ (istnieje)
    - Zweryfikować compression logic
    - Zweryfikować retry functionality

13. **PhotoEditDialog.tsx** ✅ (istnieje)
    - Zweryfikować form validation

14. **ProfileForm.tsx i SeoSettingsForm.tsx** ✅ (istnieją)
    - Zweryfikować validation
    - Zweryfikować toast notifications

### Faza 4: Integracja i testy

15. **Zintegrować wszystkie komponenty**
    - Połączyć z API endpoints
    - Zweryfikować flow danych

16. **Testy responsywności**
    - Mobile (< 768px)
    - Tablet (768-1024px)
    - Desktop (> 1024px)

17. **Testy accessibility**
    - Keyboard navigation
    - Screen reader testing
    - ARIA attributes

18. **Testy edge cases**
    - Network errors
    - Empty states
    - Limit handling

### Faza 5: Optymalizacja

19. **Performance optimization**
    - Lazy loading images
    - Code splitting
    - Bundle size analysis

20. **Error boundary implementation**
    - Global error boundary
    - Component-level error boundaries

21. **Final polish**
    - Loading states
    - Transitions/animations
    - Toast notifications consistency
