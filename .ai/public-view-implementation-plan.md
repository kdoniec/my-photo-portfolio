# Plan implementacji widoków publicznej galerii

## 1. Przegląd

Publiczna galeria to zestaw widoków przeznaczonych dla odwiedzających portfolio fotografa. Składa się z czterech głównych stron:

1. **Strona główna (/)** - prezentacja kategorii jako grid kart z okładkami
2. **Galeria kategorii (/kategoria/[slug])** - masonry grid zdjęć z infinite scroll i lightbox
3. **Strona "O mnie" (/o-mnie)** - profil fotografa z danymi kontaktowymi
4. **Strona 404** - obsługa błędnych URL

Widoki wykorzystują hybrydowe renderowanie: SSR dla pierwszego ładowania (SEO) oraz CSR dla interaktywnych elementów (infinite scroll, lightbox). Aplikacja jest single-tenant (jeden fotograf).

## 2. Routing widoków

| Ścieżka             | Plik                               | Opis                             |
| ------------------- | ---------------------------------- | -------------------------------- |
| `/`                 | `src/pages/index.astro`            | Strona główna z gridem kategorii |
| `/kategoria/[slug]` | `src/pages/kategoria/[slug].astro` | Galeria zdjęć w kategorii        |
| `/o-mnie`           | `src/pages/o-mnie.astro`           | Strona z profilem fotografa      |
| `/*` (fallback)     | `src/pages/404.astro`              | Strona błędu 404                 |

## 3. Struktura komponentów

```
src/
├── layouts/
│   └── PublicLayout.astro          # Główny layout publiczny
├── components/
│   ├── navigation/
│   │   ├── Navigation.astro        # Nawigacja desktop
│   │   └── MobileMenu.tsx          # Hamburger menu (React)
│   ├── seo/
│   │   └── SEOHead.astro           # Meta tagi i Open Graph
│   ├── category/
│   │   ├── CategoryGrid.tsx        # Grid kontener (React)
│   │   └── CategoryCard.tsx        # Pojedyncza karta kategorii
│   ├── gallery/
│   │   ├── PhotoMasonry.tsx        # Masonry layout ze scrollem
│   │   ├── PhotoCard.tsx           # Pojedyncze zdjęcie w grid
│   │   ├── PhotoLightbox.tsx       # Fullscreen viewer
│   │   └── GallerySkeleton.tsx     # Loading state
│   ├── profile/
│   │   └── ContactInfo.astro       # Dane kontaktowe
│   └── shared/
│       ├── EmptyState.tsx          # Stan pustej galerii
│       └── ErrorState.tsx          # Stan błędu z retry
├── hooks/
│   ├── useInfiniteScroll.ts        # Infinite scroll logic
│   ├── useLightbox.ts              # Lightbox state management
│   └── useBodyScrollLock.ts        # Blokada scroll podczas lightbox
└── pages/
    ├── index.astro                 # Strona główna
    ├── o-mnie.astro                # Strona "O mnie"
    ├── 404.astro                   # Strona 404
    └── kategoria/
        └── [slug].astro            # Galeria kategorii
```

### Drzewo komponentów

```
PublicLayout.astro
├── SEOHead.astro
│   └── (meta tags, Open Graph)
├── Navigation.astro
│   ├── Logo/Site name
│   ├── Desktop links (Galeria, O mnie)
│   └── MobileMenu.tsx
│       └── Hamburger + Sheet
├── <slot /> (treść strony)
└── Footer (opcjonalny)

Strona główna (/)
└── PublicLayout.astro
    └── CategoryGrid.tsx
        ├── CategoryCard.tsx[] (dla każdej kategorii)
        └── EmptyState.tsx (gdy brak kategorii)

Galeria (/kategoria/[slug])
└── PublicLayout.astro
    ├── CategoryHeader (h1 + opis)
    └── PhotoMasonry.tsx
        ├── PhotoCard.tsx[] (zdjęcia)
        ├── GallerySkeleton.tsx (loading)
        ├── ErrorState.tsx (błąd)
        └── PhotoLightbox.tsx (React Portal)

O mnie (/o-mnie)
└── PublicLayout.astro
    ├── ProfileHeader (h1 - display_name)
    ├── Bio (paragraf)
    └── ContactInfo.astro

404
└── MinimalLayout
    ├── "404" heading
    ├── Komunikat
    └── Button (link do /)
```

## 4. Szczegóły komponentów

### 4.1 PublicLayout.astro

**Opis:** Główny layout dla wszystkich publicznych stron. Zawiera nawigację, SEO head i slot na treść.

**Główne elementy:**

- `<SEOHead>` - dynamiczne meta tagi
- `<Navigation>` - nagłówek z nawigacją
- `<main>` - slot na treść strony
- `<footer>` - opcjonalny footer

**Obsługiwane interakcje:** Brak (statyczny layout)

**Walidacja:** Brak

**Typy:**

```typescript
interface PublicLayoutProps {
  title: string;
  description?: string;
  ogImage?: string;
  canonicalUrl?: string;
}
```

**Propsy:**

- `title: string` - tytuł strony (wymagany)
- `description?: string` - opis dla SEO
- `ogImage?: string` - URL obrazka Open Graph
- `canonicalUrl?: string` - kanoniczny URL strony

---

### 4.2 SEOHead.astro

**Opis:** Komponent odpowiedzialny za generowanie meta tagów SEO i Open Graph.

**Główne elementy:**

- `<title>` - tytuł strony
- `<meta name="description">` - opis
- `<meta property="og:*">` - Open Graph tags
- `<link rel="canonical">` - kanoniczny URL

**Obsługiwane interakcje:** Brak

**Walidacja:** Brak

**Typy:**

```typescript
interface SEOHeadProps {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  canonicalUrl?: string;
}
```

**Propsy:**

- `title: string` - tytuł strony
- `description?: string` - meta description
- `ogTitle?: string` - Open Graph title (domyślnie = title)
- `ogDescription?: string` - OG description
- `ogImage?: string` - URL obrazka OG
- `ogType?: string` - typ strony (domyślnie "website")
- `canonicalUrl?: string` - kanoniczny URL

---

### 4.3 Navigation.astro

**Opis:** Nawigacja strony z logo/nazwą, linkami desktop i hamburger menu na mobile.

**Główne elementy:**

- `<header>` z `role="banner"`
- `<nav>` z `aria-label="Main navigation"`
- Logo/nazwa strony (link do `/`)
- Lista linków desktop (ukryte na mobile)
- `<MobileMenu>` komponent React (widoczny na mobile)

**Obsługiwane interakcje:**

- Kliknięcie logo → nawigacja do `/`
- Kliknięcie linku → nawigacja do odpowiedniej strony

**Walidacja:** Brak

**Typy:**

```typescript
interface NavigationProps {
  siteName: string;
  currentPath: string;
}
```

**Propsy:**

- `siteName: string` - nazwa strony/fotografa
- `currentPath: string` - aktualny URL (do podświetlenia aktywnego linku)

---

### 4.4 MobileMenu.tsx

**Opis:** Hamburger menu dla urządzeń mobilnych. Wykorzystuje Shadcn Sheet component.

**Główne elementy:**

- `<Button>` z ikoną hamburger (Lucide Menu)
- `<Sheet>` - wysuwane menu
- `<SheetContent>` - lista linków nawigacyjnych

**Obsługiwane interakcje:**

- Kliknięcie hamburger → otwórz Sheet
- Kliknięcie linku → nawiguj i zamknij Sheet
- Kliknięcie poza Sheet → zamknij

**Walidacja:** Brak

**Typy:**

```typescript
interface MobileMenuProps {
  siteName: string;
  currentPath: string;
}
```

**Propsy:**

- `siteName: string` - nazwa do wyświetlenia w menu
- `currentPath: string` - aktualny URL

---

### 4.5 CategoryGrid.tsx

**Opis:** Responsywny grid kontener dla kart kategorii. Obsługuje stan pusty.

**Główne elementy:**

- `<section>` z `role="region"` i `aria-label="Kategorie portfolio"`
- Grid CSS (1 kolumna mobile, 2 tablet, 3 desktop)
- `<CategoryCard>` dla każdej kategorii
- `<EmptyState>` gdy brak kategorii

**Obsługiwane interakcje:** Brak bezpośrednich (delegowane do CategoryCard)

**Walidacja:** Brak

**Typy:**

```typescript
interface CategoryGridProps {
  categories: PublicCategoryDTO[];
}
```

**Propsy:**

- `categories: PublicCategoryDTO[]` - lista kategorii do wyświetlenia

---

### 4.6 CategoryCard.tsx

**Opis:** Pojedyncza karta kategorii z okładką, nazwą, opisem i badge liczbą zdjęć.

**Główne elementy:**

- `<article>` jako kontener
- `<a>` link do `/kategoria/[slug]`
- `<img>` okładka (aspect ratio 4:3, lazy loading)
- `<div>` overlay z nazwą i opisem
- `<span>` badge z liczbą zdjęć

**Obsługiwane interakcje:**

- Hover → efekt scale/brightness na obrazku
- Kliknięcie → nawigacja do galerii kategorii

**Walidacja:** Brak

**Typy:**

```typescript
interface CategoryCardProps {
  category: PublicCategoryDTO;
}
```

**Propsy:**

- `category: PublicCategoryDTO` - dane kategorii

---

### 4.7 PhotoMasonry.tsx

**Opis:** Główny komponent galerii zdjęć z masonry layout, infinite scroll i integracją lightbox.

**Główne elementy:**

- `<div>` masonry container (react-masonry-css)
- `<PhotoCard>` dla każdego zdjęcia
- `<GallerySkeleton>` podczas ładowania
- `<ErrorState>` przy błędzie
- Intersection Observer trigger na końcu listy
- `<PhotoLightbox>` (React Portal)
- Komunikat "To wszystkie zdjęcia" na końcu

**Obsługiwane interakcje:**

- Scroll do końca → załaduj więcej zdjęć (infinite scroll)
- Kliknięcie zdjęcia → otwórz lightbox
- Retry button → ponów nieudane żądanie

**Walidacja:** Brak bezpośredniej (API waliduje page/limit)

**Typy:**

```typescript
interface PhotoMasonryProps {
  categorySlug: string;
  initialPhotos: PublicPhotoDTO[];
  initialPagination: PaginationDTO;
}
```

**Propsy:**

- `categorySlug: string` - slug kategorii do API calls
- `initialPhotos: PublicPhotoDTO[]` - początkowe zdjęcia (SSR)
- `initialPagination: PaginationDTO` - informacje o paginacji

---

### 4.8 PhotoCard.tsx

**Opis:** Pojedyncze zdjęcie w masonry grid z blokadą pobierania.

**Główne elementy:**

- `<figure>` jako kontener
- `<img>` z lazy loading, thumbnail URL
- `<figcaption>` z tytułem (opcjonalnie, visually hidden)

**Obsługiwane interakcje:**

- Kliknięcie → callback do otwarcia lightbox
- Right-click → preventDefault (blokada)
- Drag → preventDefault (blokada)
- Hover → efekt wizualny

**Walidacja:** Brak

**Typy:**

```typescript
interface PhotoCardProps {
  photo: PublicPhotoDTO;
  onClick: () => void;
}
```

**Propsy:**

- `photo: PublicPhotoDTO` - dane zdjęcia
- `onClick: () => void` - callback do otwarcia lightbox

---

### 4.9 PhotoLightbox.tsx

**Opis:** Fullscreen viewer dla zdjęć z nawigacją, obsługą klawiatury i gestów swipe.

**Główne elementy:**

- React Portal do `document.body`
- `<div>` backdrop z blur
- `<dialog>` lub `<div role="dialog" aria-modal="true">`
- `<img>` preview w maksymalnym rozmiarze
- Przyciski nawigacji (poprzednie/następne)
- Przycisk zamknięcia (X)
- Counter "3 z 15"

**Obsługiwane interakcje:**

- Strzałki ← → → nawigacja między zdjęciami
- Escape → zamknij lightbox
- Kliknięcie X → zamknij
- Kliknięcie poza zdjęciem → zamknij
- Swipe left/right (mobile) → nawigacja
- Focus trap wewnątrz lightbox

**Walidacja:** Brak

**Typy:**

```typescript
interface PhotoLightboxProps {
  photos: PublicPhotoDTO[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}
```

**Propsy:**

- `photos: PublicPhotoDTO[]` - wszystkie zdjęcia (do nawigacji)
- `currentIndex: number` - indeks aktualnie wyświetlanego
- `onClose: () => void` - callback zamknięcia
- `onNavigate: (index: number) => void` - callback nawigacji

---

### 4.10 GallerySkeleton.tsx

**Opis:** Loading state dla infinite scroll - szkielety kart zdjęć.

**Główne elementy:**

- Grid szkieletów (aspect ratio różne, losowe lub stałe)
- Animacja pulse

**Obsługiwane interakcje:** Brak

**Walidacja:** Brak

**Typy:**

```typescript
interface GallerySkeletonProps {
  count?: number;
}
```

**Propsy:**

- `count?: number` - liczba szkieletów (domyślnie 6)

---

### 4.11 EmptyState.tsx

**Opis:** Komunikat wyświetlany gdy brak kategorii lub zdjęć.

**Główne elementy:**

- Ikona (np. ImageOff z Lucide)
- Nagłówek
- Opis
- Opcjonalny CTA button

**Obsługiwane interakcje:** Brak lub kliknięcie CTA

**Walidacja:** Brak

**Typy:**

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

**Propsy:**

- `title: string` - nagłówek komunikatu
- `description?: string` - dodatkowy opis
- `action?: object` - opcjonalny przycisk akcji

---

### 4.12 ErrorState.tsx

**Opis:** Komunikat błędu z możliwością ponowienia.

**Główne elementy:**

- Ikona błędu (AlertCircle z Lucide)
- Komunikat błędu
- Button "Spróbuj ponownie"

**Obsługiwane interakcje:**

- Kliknięcie "Spróbuj ponownie" → callback retry

**Walidacja:** Brak

**Typy:**

```typescript
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}
```

**Propsy:**

- `message?: string` - treść błędu
- `onRetry?: () => void` - callback retry

---

### 4.13 ContactInfo.astro

**Opis:** Sekcja z danymi kontaktowymi fotografa.

**Główne elementy:**

- `<address>` container
- Email z `<a href="mailto:">` i ikoną Mail
- Telefon z `<a href="tel:">` i ikoną Phone

**Obsługiwane interakcje:**

- Kliknięcie email → otwarcie klienta email
- Kliknięcie telefon → inicjacja połączenia (mobile)

**Walidacja:** Brak

**Typy:**

```typescript
interface ContactInfoProps {
  email: string | null;
  phone: string | null;
}
```

**Propsy:**

- `email: string | null` - adres email
- `phone: string | null` - numer telefonu

## 5. Typy

### 5.1 Istniejące typy z src/types.ts

```typescript
// DTO dla publicznego profilu
interface PublicProfileDTO {
  display_name: string;
  bio: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

// DTO dla ustawień SEO
interface PublicSettingsDTO {
  site_title: string | null;
  site_description: string | null;
}

// DTO dla kategorii publicznej
interface PublicCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_photo_url: string | null;
  display_order: number;
  photos_count: number;
}

// Lista kategorii
interface PublicCategoryListResponseDTO {
  data: PublicCategoryDTO[];
}

// Szczegóły kategorii
type PublicCategoryDetailDTO = Pick<PublicCategoryDTO, "id" | "name" | "slug" | "description" | "cover_photo_url">;

// DTO dla publicznego zdjęcia
interface PublicPhotoDTO {
  id: string;
  title: string | null;
  thumbnail_url: string;
  preview_url: string;
  original_width: number;
  original_height: number;
}

// Lista zdjęć z paginacją
interface PublicPhotoListResponseDTO {
  data: PublicPhotoDTO[];
  pagination: PaginationDTO;
}

// Paginacja
interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Query parameters
interface PublicPhotoListQuery {
  page?: number;
  limit?: number;
}
```

### 5.2 Nowe typy ViewModel

```typescript
// src/types/views.ts

/**
 * ViewModel dla strony głównej
 */
interface HomePageViewModel {
  siteName: string;
  siteDescription: string | null;
  categories: PublicCategoryDTO[];
}

/**
 * ViewModel dla strony kategorii
 */
interface CategoryPageViewModel {
  siteName: string;
  category: PublicCategoryDetailDTO;
  initialPhotos: PublicPhotoDTO[];
  pagination: PaginationDTO;
}

/**
 * ViewModel dla strony "O mnie"
 */
interface AboutPageViewModel {
  siteName: string;
  profile: PublicProfileDTO;
}

/**
 * Stan lightboxa
 */
interface LightboxState {
  isOpen: boolean;
  currentIndex: number;
  photos: PublicPhotoDTO[];
}

/**
 * Stan infinite scroll
 */
interface InfiniteScrollState {
  photos: PublicPhotoDTO[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Nawigacja links
 */
interface NavigationLink {
  label: string;
  href: string;
  isActive: boolean;
}
```

## 6. Zarządzanie stanem

### 6.1 Stan globalny

Brak potrzeby globalnego state managera (Redux/Zustand). Każda strona jest niezależna.

### 6.2 Stan lokalny komponentów

#### PhotoMasonry.tsx - Infinite Scroll State

```typescript
// Wewnętrzny stan komponentu
const [photos, setPhotos] = useState<PublicPhotoDTO[]>(initialPhotos);
const [page, setPage] = useState(initialPagination.page);
const [hasMore, setHasMore] = useState(initialPagination.page < initialPagination.total_pages);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);

// Lightbox state
const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
```

### 6.3 Custom Hooks

#### useInfiniteScroll.ts

```typescript
interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number; // px od końca viewport
}

interface UseInfiniteScrollReturn {
  sentinelRef: RefObject<HTMLDivElement>;
}

function useInfiniteScroll(options: UseInfiniteScrollOptions): UseInfiniteScrollReturn;
```

**Cel:** Wykrywanie momentu gdy użytkownik scrolluje blisko końca listy i wywoływanie callback do załadowania więcej danych.

**Implementacja:** Intersection Observer API na sentinel element.

#### useLightbox.ts

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

function useLightbox(options: UseLightboxOptions): UseLightboxReturn;
```

**Cel:** Centralne zarządzanie stanem lightboxa z nawigacją.

#### useBodyScrollLock.ts

```typescript
function useBodyScrollLock(isLocked: boolean): void;
```

**Cel:** Blokowanie scrollowania body gdy lightbox jest otwarty.

**Implementacja:** Ustawienie `overflow: hidden` na body.

#### useSwipe.ts (opcjonalnie, lub użyj react-swipeable)

```typescript
interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

function useSwipe(ref: RefObject<HTMLElement>, options: UseSwipeOptions): void;
```

**Cel:** Obsługa gestów swipe na urządzeniach mobilnych.

## 7. Integracja API

### 7.1 Endpointy wykorzystywane przez widoki

| Endpoint                               | Metoda | Typ odpowiedzi                  | Użycie                             |
| -------------------------------------- | ------ | ------------------------------- | ---------------------------------- |
| `/api/public/settings`                 | GET    | `PublicSettingsDTO`             | SEO meta tags (wszystkie strony)   |
| `/api/public/profile`                  | GET    | `PublicProfileDTO`              | Strona "O mnie", nazwa w nawigacji |
| `/api/public/categories`               | GET    | `PublicCategoryListResponseDTO` | Strona główna                      |
| `/api/public/categories/[slug]`        | GET    | `PublicCategoryDetailDTO`       | Header kategorii                   |
| `/api/public/categories/[slug]/photos` | GET    | `PublicPhotoListResponseDTO`    | Galeria zdjęć                      |

### 7.2 Wywołania API w stronach Astro (SSR)

```typescript
// src/pages/index.astro
---
import { PublicService } from "../lib/services/public.service";

const publicService = new PublicService(Astro.locals.supabase);

const [settings, categories] = await Promise.all([
  publicService.getPublicSettings(),
  publicService.getPublicCategories(),
]);

const siteName = settings?.site_title || "Portfolio";
const siteDescription = settings?.site_description || null;
---
```

### 7.3 Wywołania API w React (CSR - infinite scroll)

```typescript
// W PhotoMasonry.tsx
const loadMorePhotos = async () => {
  if (isLoading || !hasMore) return;

  setIsLoading(true);
  setError(null);

  try {
    const nextPage = page + 1;
    const response = await fetch(`/api/public/categories/${categorySlug}/photos?page=${nextPage}&limit=20`);

    if (!response.ok) {
      throw new Error("Failed to load photos");
    }

    const data: PublicPhotoListResponseDTO = await response.json();

    setPhotos((prev) => [...prev, ...data.data]);
    setPage(nextPage);
    setHasMore(nextPage < data.pagination.total_pages);
  } catch (err) {
    setError(err instanceof Error ? err : new Error("Unknown error"));
  } finally {
    setIsLoading(false);
  }
};
```

### 7.4 Obsługa błędów API

- **404 Not Found** - kategoria nie istnieje → przekierowanie na stronę 404
- **Network Error** - wyświetl ErrorState z opcją retry
- **5xx Server Error** - wyświetl ogólny komunikat błędu

## 8. Interakcje użytkownika

### 8.1 Strona główna

| Interakcja                    | Element           | Rezultat                                  |
| ----------------------------- | ----------------- | ----------------------------------------- |
| Kliknięcie karty kategorii    | CategoryCard      | Nawigacja do `/kategoria/[slug]`          |
| Hover na karcie               | CategoryCard      | Efekt scale(1.02) i brightness na obrazku |
| Kliknięcie "O mnie"           | Navigation link   | Nawigacja do `/o-mnie`                    |
| Kliknięcie logo               | Navigation logo   | Nawigacja do `/`                          |
| Kliknięcie hamburger (mobile) | MobileMenu button | Otwarcie Sheet z menu                     |

### 8.2 Galeria kategorii

| Interakcja                      | Element      | Rezultat                       |
| ------------------------------- | ------------ | ------------------------------ |
| Scroll do końca                 | PhotoMasonry | Załadowanie kolejnych 20 zdjęć |
| Kliknięcie zdjęcia              | PhotoCard    | Otwarcie lightboxa             |
| Prawy przycisk myszy na zdjęciu | PhotoCard    | Zablokowane (preventDefault)   |
| Przeciąganie zdjęcia            | PhotoCard    | Zablokowane (preventDefault)   |
| Hover na zdjęciu                | PhotoCard    | Efekt brightness/scale         |

### 8.3 Lightbox

| Interakcja               | Element         | Rezultat                          |
| ------------------------ | --------------- | --------------------------------- |
| Kliknięcie strzałki →    | Next button     | Przejście do następnego zdjęcia   |
| Kliknięcie strzałki ←    | Previous button | Przejście do poprzedniego zdjęcia |
| Naciśnięcie →            | Keyboard        | Przejście do następnego zdjęcia   |
| Naciśnięcie ←            | Keyboard        | Przejście do poprzedniego zdjęcia |
| Naciśnięcie Escape       | Keyboard        | Zamknięcie lightboxa              |
| Kliknięcie X             | Close button    | Zamknięcie lightboxa              |
| Kliknięcie poza zdjęciem | Backdrop        | Zamknięcie lightboxa              |
| Swipe left (mobile)      | Touch gesture   | Przejście do następnego zdjęcia   |
| Swipe right (mobile)     | Touch gesture   | Przejście do poprzedniego zdjęcia |

### 8.4 Strona "O mnie"

| Interakcja          | Element    | Rezultat                              |
| ------------------- | ---------- | ------------------------------------- |
| Kliknięcie email    | Email link | Otwarcie klienta email (mailto:)      |
| Kliknięcie telefonu | Phone link | Inicjacja połączenia (tel:) na mobile |

### 8.5 Strona 404

| Interakcja                          | Element | Rezultat         |
| ----------------------------------- | ------- | ---------------- |
| Kliknięcie "Wróć do strony głównej" | Button  | Nawigacja do `/` |

## 9. Warunki i walidacja

### 9.1 Walidacja po stronie API (już zaimplementowana)

| Warunek                                  | Endpoint                               | Efekt na frontend    |
| ---------------------------------------- | -------------------------------------- | -------------------- |
| `page` musi być > 0                      | `/api/public/categories/[slug]/photos` | Domyślnie 1          |
| `limit` musi być 1-50                    | `/api/public/categories/[slug]/photos` | Domyślnie 20, max 50 |
| Kategoria musi istnieć                   | `/api/public/categories/[slug]`        | 404 → przekierowanie |
| Kategoria musi mieć opublikowane zdjęcia | `/api/public/categories/[slug]`        | 404 → przekierowanie |

### 9.2 Walidacja po stronie frontendu

| Komponent     | Warunek                   | Rezultat                               |
| ------------- | ------------------------- | -------------------------------------- | ------------------------------ | ---------------------- |
| CategoryGrid  | `categories.length === 0` | Wyświetl EmptyState                    |
| PhotoMasonry  | `photos.length === 0`     | Wyświetl EmptyState dla pustej galerii |
| PhotoMasonry  | `!hasMore && !isLoading`  | Wyświetl "To wszystkie zdjęcia"        |
| PhotoLightbox | `currentIndex < 0         |                                        | currentIndex >= photos.length` | Nie renderuj / zamknij |
| Navigation    | `currentPath === href`    | Oznacz link jako aktywny               |

### 9.3 Warunkowe renderowanie

```typescript
// CategoryGrid
{categories.length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {categories.map(category => (
      <CategoryCard key={category.id} category={category} />
    ))}
  </div>
) : (
  <EmptyState
    title="Galeria w przygotowaniu"
    description="Wkrótce pojawią się tutaj zdjęcia"
  />
)}

// PhotoMasonry - end of list
{!hasMore && !isLoading && photos.length > 0 && (
  <p className="text-center text-muted-foreground py-8">
    To wszystkie zdjęcia w tej kategorii
  </p>
)}

// PhotoMasonry - loading
{isLoading && <GallerySkeleton count={6} />}

// PhotoMasonry - error
{error && (
  <ErrorState
    message="Nie udało się załadować zdjęć"
    onRetry={loadMorePhotos}
  />
)}
```

## 10. Obsługa błędów

### 10.1 Scenariusze błędów i ich obsługa

| Scenariusz                         | Komponent                | Obsługa                              |
| ---------------------------------- | ------------------------ | ------------------------------------ |
| Kategoria nie istnieje (404)       | Strona kategorii         | Astro redirect do `/404`             |
| Błąd sieci podczas infinite scroll | PhotoMasonry             | ErrorState z retry button            |
| Błąd ładowania obrazka             | PhotoCard / CategoryCard | Placeholder lub broken image         |
| Brak kategorii                     | CategoryGrid             | EmptyState "Galeria w przygotowaniu" |
| Brak zdjęć w kategorii             | PhotoMasonry             | EmptyState "Brak zdjęć"              |
| Timeout żądania                    | PhotoMasonry             | ErrorState z retry                   |
| Brak profilu                       | Strona "O mnie"          | Fallback na domyślne wartości        |
| Brak ustawień SEO                  | Wszystkie strony         | Fallback na domyślne tytuły          |

### 10.2 Implementacja obsługi błędów

```typescript
// src/pages/kategoria/[slug].astro
---
const { slug } = Astro.params;

const publicService = new PublicService(Astro.locals.supabase);

const category = await publicService.getPublicCategoryBySlug(slug!);

// Jeśli kategoria nie istnieje, przekieruj na 404
if (!category) {
  return Astro.redirect("/404", 302);
}

const photosResponse = await publicService.getPublicPhotosByCategory(slug!, {
  page: 1,
  limit: 20
});

if (!photosResponse) {
  return Astro.redirect("/404", 302);
}
---
```

```typescript
// PhotoMasonry.tsx - error handling
const loadMorePhotos = async () => {
  try {
    // ... fetch logic
  } catch (err) {
    console.error("Failed to load photos:", err);
    setError(err instanceof Error ? err : new Error("Wystąpił błąd"));
  }
};

// Render
{error && (
  <div className="flex flex-col items-center py-8">
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <p className="text-destructive mb-4">{error.message}</p>
    <Button onClick={() => { setError(null); loadMorePhotos(); }}>
      Spróbuj ponownie
    </Button>
  </div>
)}
```

### 10.3 Fallbacki dla brakujących danych

```typescript
// SEO fallbacks
const siteName = settings?.site_title || "Portfolio fotograficzne";
const siteDescription = settings?.site_description || "Profesjonalne portfolio fotograficzne";

// Profile fallbacks
const displayName = profile?.display_name || "Fotograf";
const bio = profile?.bio || "";

// Image fallbacks
const coverUrl = category.cover_photo_url || "/images/placeholder-cover.jpg";
```

## 11. Kroki implementacji

### Faza 1: Przygotowanie infrastruktury

1. **Instalacja dodatkowych zależności npm**

   ```bash
   npx shadcn@latest add sheet
   npm install react-masonry-css react-swipeable lucide-react
   ```

2. **Utworzenie struktury katalogów**

   ```
   src/components/navigation/
   src/components/seo/
   src/components/category/
   src/components/gallery/
   src/components/profile/
   src/components/shared/
   src/hooks/
   src/types/views.ts
   ```

3. **Dodanie nowych typów ViewModel do `src/types/views.ts`**

### Faza 2: Komponenty bazowe

4. **Implementacja SEOHead.astro**
   - Meta tagi, Open Graph
   - Przyjmowanie propsów z danych API

5. **Implementacja Navigation.astro**
   - Logo/nazwa strony
   - Linki desktop
   - Integracja z MobileMenu

6. **Implementacja MobileMenu.tsx**
   - Shadcn Sheet component
   - Hamburger button
   - Lista linków

7. **Implementacja PublicLayout.astro**
   - Integracja SEOHead
   - Integracja Navigation
   - Slot na treść
   - Podstawowe style (min-h-screen, flex col)

### Faza 3: Komponenty współdzielone

8. **Implementacja EmptyState.tsx**
   - Ikona, nagłówek, opis
   - Opcjonalny CTA

9. **Implementacja ErrorState.tsx**
   - Komunikat błędu
   - Przycisk retry

10. **Implementacja GallerySkeleton.tsx**
    - Grid szkieletów z animacją pulse

### Faza 4: Strona główna

11. **Implementacja CategoryCard.tsx**
    - Karta z obrazkiem, overlay, badge
    - Efekty hover
    - Link do kategorii

12. **Implementacja CategoryGrid.tsx**
    - Responsywny grid
    - Mapowanie kategorii
    - Obsługa pustego stanu

13. **Implementacja strony index.astro**
    - Pobranie danych SSR (categories, settings)
    - Integracja z PublicLayout
    - Renderowanie CategoryGrid

### Faza 5: Galeria kategorii

14. **Implementacja custom hooków**
    - `useInfiniteScroll.ts`
    - `useLightbox.ts`
    - `useBodyScrollLock.ts`

15. **Implementacja PhotoCard.tsx**
    - Obrazek z lazy loading
    - Blokada right-click i drag
    - Callback onClick

16. **Implementacja PhotoLightbox.tsx**
    - React Portal
    - Nawigacja (strzałki, klawiatura, swipe)
    - Zamykanie (X, Escape, backdrop)
    - Counter
    - Focus trap
    - Body scroll lock

17. **Implementacja PhotoMasonry.tsx**
    - react-masonry-css layout
    - Infinite scroll z Intersection Observer
    - Integracja z lightbox
    - Obsługa loading/error states

18. **Implementacja strony kategoria/[slug].astro**
    - Pobranie danych SSR (category, photos)
    - Walidacja slug (redirect 404)
    - Integracja z PublicLayout
    - Renderowanie PhotoMasonry

### Faza 6: Strona "O mnie"

19. **Implementacja ContactInfo.astro**
    - Email (mailto:)
    - Telefon (tel:)
    - Ikony Lucide

20. **Implementacja strony o-mnie.astro**
    - Pobranie profilu SSR
    - Renderowanie bio
    - Integracja ContactInfo

### Faza 7: Strona 404

21. **Implementacja strony 404.astro**
    - Minimalistyczny design
    - Nagłówek "404"
    - Komunikat
    - Przycisk powrotu

### Faza 8: Finalizacja

22. **Testy manualne**
    - Wszystkie ścieżki nawigacji
    - Infinite scroll
    - Lightbox na desktop i mobile
    - Responsywność (mobile, tablet, desktop)
    - Blokada pobierania zdjęć
    - Obsługa błędów

23. **Optymalizacja**
    - Lazy loading obrazków
    - Preloading sąsiednich zdjęć w lightbox
    - Debouncing scroll events

24. **Accessibility audit**
    - Sprawdzenie ARIA labels
    - Keyboard navigation
    - Screen reader testing
    - Focus management

25. **SEO verification**
    - Meta tagi na każdej stronie
    - Open Graph preview
    - Semantyczny HTML

### Diagram sekwencji - Infinite Scroll

```
User scrolls     PhotoMasonry      useInfiniteScroll       API
    |                  |                   |                 |
    |--scroll down---->|                   |                 |
    |                  |--observe sentinel->|                |
    |                  |                   |--intersection-->|
    |                  |<--onLoadMore------|                 |
    |                  |--setLoading(true)->|                |
    |                  |                   |                 |
    |                  |--fetch------------+---------------->|
    |                  |                   |                 |
    |                  |<--response--------+-----------------|
    |                  |--setPhotos------->|                 |
    |                  |--setPage--------->|                 |
    |                  |--setHasMore------>|                 |
    |                  |--setLoading(false)|                 |
    |<--render new-----|                   |                 |
```

### Diagram sekwencji - Lightbox

```
User clicks photo    PhotoCard    PhotoMasonry    PhotoLightbox
       |                |              |               |
       |--click-------->|              |               |
       |                |--onClick---->|               |
       |                |              |--open(index)->|
       |                |              |               |--lock body scroll
       |                |              |               |--render portal
       |<--display------|--------------|---------------|
       |                |              |               |
       |--press Escape->|              |               |
       |                |              |<--onClose-----|
       |                |              |--close()----->|
       |                |              |               |--unlock body
       |<--close--------|--------------|---------------|
```
