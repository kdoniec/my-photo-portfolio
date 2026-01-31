# Plan implementacji widoku Layouty i Nawigacja

## 1. Przegląd

System layoutów i nawigacji stanowi fundamentalną warstwę UI aplikacji My Photo Portfolio. Składa się z dwóch głównych kontekstów:

1. **PublicLayout** - layout dla publicznej galerii dostępnej dla odwiedzających (potencjalnych klientów)
2. **AdminLayout** - layout dla panelu administracyjnego dostępnego tylko dla zalogowanego fotografa

Oba layouty implementują responsywną nawigację topbar z obsługą mobile (hamburger menu) oraz desktop (horizontal navigation). System wykorzystuje View Transitions API dla płynnych przejść między stronami w obrębie tego samego layoutu.

## 2. Routing widoku

### PublicLayout (galeria publiczna)
- `/` - Strona główna (kafelki kategorii)
- `/kategoria/[slug]` - Galeria zdjęć w kategorii
- `/o-mnie` - Strona "O mnie"
- Dowolny nieistniejący URL → strona 404

### AdminLayout (panel administracyjny)
- `/admin` - Redirect do `/admin/photos` (jeśli zalogowany) lub `/admin/login`
- `/admin/login` - Strona logowania
- `/admin/categories` - Zarządzanie kategoriami
- `/admin/photos` - Zarządzanie zdjęciami
- `/admin/profile` - Edycja profilu i ustawień SEO

## 3. Struktura komponentów

```
src/
├── layouts/
│   ├── PublicLayout.astro          # Layout publiczny
│   └── AdminLayout.astro           # Layout administracyjny
├── components/
│   ├── navigation/
│   │   ├── PublicNavbar.tsx        # Nawigacja publiczna (React)
│   │   ├── AdminNavbar.tsx         # Nawigacja admin (React)
│   │   ├── MobileSheet.tsx         # Menu mobilne (Shadcn Sheet)
│   │   ├── NavLink.tsx             # Link nawigacyjny z active state
│   │   ├── UserMenu.tsx            # Dropdown użytkownika (admin)
│   │   └── Logo.tsx                # Logo/nazwa fotografa
│   └── ui/
│       ├── sheet.tsx               # Shadcn Sheet (jeśli brak)
│       └── dropdown-menu.tsx       # Shadcn DropdownMenu (jeśli brak)
└── components/hooks/
    └── useNavigation.ts            # Hook do detekcji aktywnej strony
```

### Hierarchia komponentów

```
PublicLayout.astro
└── PublicNavbar (React, client:load)
    ├── Logo
    ├── NavLink (Galeria)
    ├── NavLink (O mnie)
    └── MobileSheet
        ├── NavLink (Galeria)
        └── NavLink (O mnie)

AdminLayout.astro
└── AdminNavbar (React, client:load)
    ├── Logo
    ├── NavLink (Kategorie)
    ├── NavLink (Zdjęcia)
    ├── NavLink (Profil)
    ├── UserMenu
    │   ├── DropdownMenuTrigger (Avatar + nazwa)
    │   └── DropdownMenuContent
    │       ├── DropdownMenuItem (Profil)
    │       └── DropdownMenuItem (Wyloguj)
    └── MobileSheet
        ├── NavLink (Kategorie)
        ├── NavLink (Zdjęcia)
        ├── NavLink (Profil)
        ├── Separator
        └── Button (Wyloguj)
```

## 4. Szczegóły komponentów

### 4.1 PublicLayout.astro

**Opis:** Główny layout Astro dla wszystkich stron publicznej galerii. Zawiera strukturę HTML, meta tagi, global styles oraz slot dla treści strony.

**Główne elementy:**
- `<html>` z atrybutem `lang="pl"`
- `<head>` z meta tagami SEO i Open Graph
- `<body>` z PublicNavbar i `<slot>` dla treści
- View Transitions API (`<ViewTransitions />`)

**Obsługiwane interakcje:** Brak (statyczny layout)

**Walidacja:** Brak

**Typy:**
```typescript
interface Props {
  title?: string;
  description?: string;
  ogImage?: string;
}
```

**Propsy:**
- `title` - Tytuł strony (opcjonalny, domyślnie z API)
- `description` - Opis meta (opcjonalny)
- `ogImage` - URL obrazu Open Graph (opcjonalny)

---

### 4.2 PublicNavbar.tsx

**Opis:** Responsywny komponent nawigacji dla publicznej galerii. Na desktop wyświetla horizontal menu, na mobile hamburger icon z Sheet.

**Główne elementy:**
- `<nav>` z `aria-label="Main navigation"`
- Logo component (link do `/`)
- Desktop: horizontal `<ul>` z NavLink components
- Mobile: hamburger button + MobileSheet

**Obsługiwane interakcje:**
- Kliknięcie logo → nawigacja do `/`
- Kliknięcie linku → nawigacja do odpowiedniej strony
- Kliknięcie hamburger → otwarcie MobileSheet
- Keyboard navigation (Tab, Enter)

**Walidacja:** Brak

**Typy:**
```typescript
interface PublicNavbarProps {
  photographerName: string;
  currentPath: string;
}
```

**Propsy:**
- `photographerName` - Nazwa fotografa do wyświetlenia w logo
- `currentPath` - Aktualna ścieżka URL dla określenia aktywnego linku

---

### 4.3 AdminLayout.astro

**Opis:** Główny layout Astro dla panelu administracyjnego. Zawiera AdminNavbar, ochronę przed nieautoryzowanym dostępem oraz slot dla treści.

**Główne elementy:**
- `<html>` z atrybutem `lang="pl"` i klasą `dark` (opcjonalnie)
- `<head>` z meta tagami (noindex dla admin)
- `<body>` z AdminNavbar i `<slot>` dla treści
- View Transitions API

**Obsługiwane interakcje:** Brak (statyczny layout)

**Walidacja:**
- Sprawdzenie sesji użytkownika w middleware
- Redirect do `/admin/login` jeśli brak sesji

**Typy:**
```typescript
interface Props {
  title?: string;
}
```

**Propsy:**
- `title` - Tytuł strony (opcjonalny)

---

### 4.4 AdminNavbar.tsx

**Opis:** Responsywny komponent nawigacji dla panelu administracyjnego. Zawiera linki do sekcji admina oraz UserMenu z opcją wylogowania.

**Główne elementy:**
- `<nav>` z `aria-label="Admin navigation"`
- Logo component (link do `/admin/photos`)
- Desktop: horizontal `<ul>` z NavLink + UserMenu
- Mobile: hamburger button + MobileSheet z nav links + logout

**Obsługiwane interakcje:**
- Kliknięcie logo → nawigacja do `/admin/photos`
- Kliknięcie linku → nawigacja do odpowiedniej sekcji
- Kliknięcie hamburger → otwarcie MobileSheet
- Kliknięcie "Wyloguj" → wywołanie signOut() i redirect

**Walidacja:** Brak

**Typy:**
```typescript
interface AdminNavbarProps {
  user: {
    displayName: string;
    email: string;
  };
  currentPath: string;
}
```

**Propsy:**
- `user` - Dane zalogowanego użytkownika
- `currentPath` - Aktualna ścieżka URL

---

### 4.5 NavLink.tsx

**Opis:** Pojedynczy link nawigacyjny z obsługą stanu aktywnego. Wykorzystuje `aria-current` dla accessibility.

**Główne elementy:**
- `<a>` z odpowiednimi klasami Tailwind
- Conditional styling dla stanu aktywnego (border-bottom lub background)

**Obsługiwane interakcje:**
- Kliknięcie → nawigacja
- Focus → visible focus ring

**Walidacja:** Brak

**Typy:**
```typescript
interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void; // dla zamknięcia mobile menu
}
```

**Propsy:**
- `href` - URL docelowy
- `label` - Tekst linku
- `isActive` - Czy link jest aktywny
- `onClick` - Opcjonalny callback (np. zamknięcie Sheet)

---

### 4.6 MobileSheet.tsx

**Opis:** Menu mobilne wykorzystujące Shadcn Sheet component. Slide-in z lewej lub prawej strony.

**Główne elementy:**
- Sheet (Shadcn/ui)
- SheetTrigger z hamburger icon
- SheetContent z navigation links (vertical stack)
- Opcjonalnie: SheetHeader z logo

**Obsługiwane interakcje:**
- Kliknięcie trigger → otwarcie sheet
- Kliknięcie overlay/X → zamknięcie sheet
- Kliknięcie linku → nawigacja + zamknięcie sheet
- Escape key → zamknięcie sheet

**Walidacja:** Brak

**Typy:**
```typescript
interface MobileSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Propsy:**
- `children` - Zawartość menu (linki)
- `isOpen` - Stan otwarcia
- `onOpenChange` - Callback zmiany stanu

---

### 4.7 UserMenu.tsx

**Opis:** Dropdown menu użytkownika w AdminNavbar. Zawiera avatar z inicjałami, nazwę użytkownika oraz opcje "Profil" i "Wyloguj".

**Główne elementy:**
- DropdownMenu (Shadcn/ui)
- DropdownMenuTrigger z Avatar + ChevronDown
- DropdownMenuContent z items
- Avatar z inicjałami (pierwsze litery display_name)

**Obsługiwane interakcje:**
- Kliknięcie trigger → toggle dropdown
- Kliknięcie "Profil" → nawigacja do `/admin/profile`
- Kliknięcie "Wyloguj" → signOut + redirect
- Keyboard navigation w dropdown

**Walidacja:** Brak

**Typy:**
```typescript
interface UserMenuProps {
  displayName: string;
  email: string;
  onSignOut: () => Promise<void>;
}
```

**Propsy:**
- `displayName` - Nazwa użytkownika do wyświetlenia
- `email` - Email użytkownika (opcjonalnie w dropdown)
- `onSignOut` - Async callback wylogowania

---

### 4.8 Logo.tsx

**Opis:** Komponent logo/nazwy fotografa. Klikalny, prowadzi do strony głównej odpowiedniego kontekstu.

**Główne elementy:**
- `<a>` wrapper
- Tekst nazwy fotografa lub grafika logo

**Obsługiwane interakcje:**
- Kliknięcie → nawigacja do strony głównej

**Walidacja:** Brak

**Typy:**
```typescript
interface LogoProps {
  name: string;
  href: string;
}
```

**Propsy:**
- `name` - Nazwa do wyświetlenia
- `href` - URL docelowy

---

### 4.9 useNavigation.ts (Custom Hook)

**Opis:** Hook do określania aktywnej strony na podstawie bieżącej ścieżki URL.

**Funkcjonalność:**
- Przyjmuje currentPath
- Zwraca funkcję `isActive(href)` sprawdzającą czy link jest aktywny
- Obsługuje exact match i prefix match (np. `/kategoria/*`)

**Typy:**
```typescript
interface UseNavigationReturn {
  isActive: (href: string, exact?: boolean) => boolean;
}

function useNavigation(currentPath: string): UseNavigationReturn;
```

## 5. Typy

### 5.1 Typy nawigacji

```typescript
// src/types/navigation.ts

/**
 * Reprezentuje pojedynczy element nawigacji
 */
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Konfiguracja nawigacji publicznej
 */
export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: "Galeria", href: "/" },
  { label: "O mnie", href: "/o-mnie" },
];

/**
 * Konfiguracja nawigacji administracyjnej
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Kategorie", href: "/admin/categories" },
  { label: "Zdjęcia", href: "/admin/photos" },
  { label: "Profil", href: "/admin/profile" },
];
```

### 5.2 Typy użytkownika (dla nawigacji)

```typescript
// Wykorzystanie istniejących typów z src/types.ts
import type { ProfileDTO, PublicProfileDTO } from "@/types";

/**
 * Uproszczony typ użytkownika dla komponentów nawigacji
 */
export interface NavUser {
  displayName: string;
  email: string;
}

/**
 * Mapper z ProfileDTO do NavUser
 */
export function toNavUser(profile: ProfileDTO): NavUser {
  return {
    displayName: profile.display_name,
    email: profile.contact_email || "",
  };
}
```

### 5.3 Typy props komponentów

```typescript
// src/components/navigation/types.ts

export interface PublicNavbarProps {
  photographerName: string;
  currentPath: string;
}

export interface AdminNavbarProps {
  user: NavUser;
  currentPath: string;
}

export interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}

export interface MobileSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "left" | "right";
}

export interface UserMenuProps {
  displayName: string;
  email?: string;
  onSignOut: () => Promise<void>;
}

export interface LogoProps {
  name: string;
  href: string;
  className?: string;
}
```

## 6. Zarządzanie stanem

### 6.1 Stan lokalny komponentów

**MobileSheet state:**
```typescript
const [isOpen, setIsOpen] = useState(false);
```

**UserMenu state:**
```typescript
const [isSigningOut, setIsSigningOut] = useState(false);
```

### 6.2 Przekazywanie danych z Astro do React

Dane użytkownika i ścieżka są przekazywane z Astro layouts do React components jako props:

```astro
// AdminLayout.astro
---
import { AdminNavbar } from "@/components/navigation/AdminNavbar";

const user = Astro.locals.user; // z middleware
const currentPath = Astro.url.pathname;
---

<AdminNavbar
  client:load
  user={user}
  currentPath={currentPath}
/>
```

### 6.3 Supabase Auth Integration

Wylogowanie wymaga dostępu do Supabase client:

```typescript
// W AdminNavbar lub UserMenu
import { createBrowserClient } from "@supabase/ssr";

const handleSignOut = async () => {
  const supabase = createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );
  await supabase.auth.signOut();
  window.location.href = "/admin/login";
};
```

## 7. Integracja API

### 7.1 PublicLayout - pobieranie nazwy fotografa

**Endpoint:** `GET /api/public/profile`

**Typ odpowiedzi:** `PublicProfileDTO`

**Implementacja w Astro:**
```astro
---
// PublicLayout.astro
const response = await fetch(`${Astro.url.origin}/api/public/profile`);
const profile: PublicProfileDTO = await response.json();
const photographerName = profile.display_name;
---
```

### 7.2 AdminLayout - dane użytkownika

**Endpoint:** `GET /api/profile`

**Typ odpowiedzi:** `ProfileDTO`

**Implementacja w Astro:**
```astro
---
// AdminLayout.astro
const supabase = Astro.locals.supabase;
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return Astro.redirect("/admin/login");
}

const response = await fetch(`${Astro.url.origin}/api/profile`, {
  headers: {
    Authorization: `Bearer ${/* session token */}`,
  },
});
const profile: ProfileDTO = await response.json();
---
```

### 7.3 Wylogowanie

**Metoda:** Supabase Auth SDK (client-side)

```typescript
await supabase.auth.signOut();
```

## 8. Interakcje użytkownika

### 8.1 Publiczna nawigacja

| Interakcja | Element | Rezultat |
|------------|---------|----------|
| Kliknięcie logo | Logo | Nawigacja do `/` |
| Kliknięcie "Galeria" | NavLink | Nawigacja do `/` |
| Kliknięcie "O mnie" | NavLink | Nawigacja do `/o-mnie` |
| Kliknięcie hamburger (mobile) | Button | Otwarcie MobileSheet |
| Kliknięcie overlay (mobile) | Sheet overlay | Zamknięcie MobileSheet |
| Naciśnięcie Escape (mobile) | Keyboard | Zamknięcie MobileSheet |
| Tab navigation | Keyboard | Przechodzenie między linkami |
| Enter na linku | Keyboard | Nawigacja |

### 8.2 Administracyjna nawigacja

| Interakcja | Element | Rezultat |
|------------|---------|----------|
| Kliknięcie logo | Logo | Nawigacja do `/admin/photos` |
| Kliknięcie "Kategorie" | NavLink | Nawigacja do `/admin/categories` |
| Kliknięcie "Zdjęcia" | NavLink | Nawigacja do `/admin/photos` |
| Kliknięcie "Profil" | NavLink | Nawigacja do `/admin/profile` |
| Kliknięcie avatara | UserMenu trigger | Otwarcie dropdown |
| Kliknięcie "Profil" (dropdown) | DropdownMenuItem | Nawigacja do `/admin/profile` |
| Kliknięcie "Wyloguj" | DropdownMenuItem | signOut() + redirect do `/admin/login` |
| Kliknięcie hamburger (mobile) | Button | Otwarcie MobileSheet |

## 9. Warunki i walidacja

### 9.1 Ochrona tras administracyjnych (Middleware)

**Lokalizacja:** `src/middleware/index.ts`

**Warunki:**
- Sprawdzenie czy ścieżka zaczyna się od `/admin`
- Wyjątek: `/admin/login` jest publiczny
- Walidacja sesji Supabase Auth
- Redirect do `/admin/login` jeśli brak sesji

```typescript
// src/middleware/index.ts
export const onRequest = async (context, next) => {
  const { pathname } = context.url;

  // Publiczne endpointy admin
  if (pathname === "/admin/login") {
    return next();
  }

  // Ochrona /admin/*
  if (pathname.startsWith("/admin")) {
    const supabase = context.locals.supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return context.redirect("/admin/login");
    }

    context.locals.user = user;
  }

  return next();
};
```

### 9.2 Określanie aktywnego linku

**Warunki:**
- "Galeria" jest aktywna gdy: `pathname === "/"` lub `pathname.startsWith("/kategoria/")`
- "O mnie" jest aktywna gdy: `pathname === "/o-mnie"`
- "Kategorie" jest aktywna gdy: `pathname === "/admin/categories"`
- "Zdjęcia" jest aktywna gdy: `pathname === "/admin/photos"`
- "Profil" jest aktywna gdy: `pathname === "/admin/profile"`

```typescript
// useNavigation.ts
export function useNavigation(currentPath: string) {
  const isActive = (href: string, exact = false): boolean => {
    if (exact) {
      return currentPath === href;
    }

    // Specjalne przypadki
    if (href === "/" && currentPath.startsWith("/kategoria/")) {
      return true;
    }

    return currentPath === href || currentPath.startsWith(href + "/");
  };

  return { isActive };
}
```

## 10. Obsługa błędów

### 10.1 Błąd pobierania profilu (PublicLayout)

**Scenariusz:** API `/api/public/profile` zwraca błąd lub jest niedostępne

**Obsługa:**
```astro
---
let photographerName = "Portfolio";
try {
  const response = await fetch(`${Astro.url.origin}/api/public/profile`);
  if (response.ok) {
    const profile = await response.json();
    photographerName = profile.display_name || "Portfolio";
  }
} catch (error) {
  console.error("Failed to fetch profile:", error);
}
---
```

### 10.2 Błąd wylogowania

**Scenariusz:** `signOut()` rzuca wyjątek

**Obsługa:**
```typescript
const handleSignOut = async () => {
  setIsSigningOut(true);
  try {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  } catch (error) {
    console.error("Sign out failed:", error);
    // Toast notification o błędzie
    toast.error("Nie udało się wylogować. Spróbuj ponownie.");
  } finally {
    setIsSigningOut(false);
  }
};
```

### 10.3 Sesja wygasła podczas korzystania z panelu

**Scenariusz:** Token sesji wygasa podczas pracy w panelu

**Obsługa:**
- API zwraca 401 Unauthorized
- Frontend przechwytuje błąd i przekierowuje do logowania
- Opcjonalnie: automatyczne odświeżanie tokenu przez Supabase

### 10.4 Strona 404

**Scenariusz:** Użytkownik wchodzi na nieistniejący URL

**Obsługa:**
- Astro automatycznie wyświetla `src/pages/404.astro`
- Strona 404 używa PublicLayout
- Zawiera przycisk powrotu do strony głównej

## 11. Kroki implementacji

### Krok 1: Przygotowanie Shadcn/ui components

1. Sprawdzić czy komponenty `Sheet` i `DropdownMenu` są zainstalowane
2. Jeśli nie, zainstalować:
   ```bash
   npx shadcn@latest add sheet dropdown-menu separator
   ```

### Krok 2: Utworzenie typów nawigacji

1. Utworzyć plik `src/components/navigation/types.ts`
2. Zdefiniować interfejsy dla wszystkich komponentów nawigacji
3. Zdefiniować stałe `PUBLIC_NAV_ITEMS` i `ADMIN_NAV_ITEMS`

### Krok 3: Implementacja custom hook useNavigation

1. Utworzyć plik `src/components/hooks/useNavigation.ts`
2. Zaimplementować logikę określania aktywnego linku
3. Obsłużyć specjalne przypadki (kategorie, prefiksy)

### Krok 4: Implementacja komponentów bazowych

1. Utworzyć `src/components/navigation/Logo.tsx`
2. Utworzyć `src/components/navigation/NavLink.tsx`
3. Utworzyć `src/components/navigation/MobileSheet.tsx`

### Krok 5: Implementacja PublicNavbar

1. Utworzyć `src/components/navigation/PublicNavbar.tsx`
2. Zintegrować Logo, NavLink i MobileSheet
3. Dodać responsywność (md breakpoint)
4. Dodać ARIA attributes

### Krok 6: Implementacja UserMenu

1. Utworzyć `src/components/navigation/UserMenu.tsx`
2. Zintegrować DropdownMenu z Shadcn
3. Dodać Avatar z inicjałami
4. Zaimplementować handleSignOut

### Krok 7: Implementacja AdminNavbar

1. Utworzyć `src/components/navigation/AdminNavbar.tsx`
2. Zintegrować Logo, NavLink, UserMenu i MobileSheet
3. Dodać responsywność
4. Dodać ARIA attributes

### Krok 8: Implementacja PublicLayout.astro

1. Utworzyć/zaktualizować `src/layouts/PublicLayout.astro`
2. Dodać ViewTransitions
3. Pobierać dane profilu dla nazwy fotografa
4. Zintegrować PublicNavbar z `client:load`
5. Dodać slot dla treści
6. Skonfigurować meta tagi SEO

### Krok 9: Implementacja AdminLayout.astro

1. Utworzyć/zaktualizować `src/layouts/AdminLayout.astro`
2. Dodać ViewTransitions
3. Pobierać dane użytkownika z middleware
4. Zintegrować AdminNavbar z `client:load`
5. Dodać slot dla treści
6. Dodać meta tag noindex

### Krok 10: Konfiguracja middleware

1. Zaktualizować `src/middleware/index.ts`
2. Dodać ochronę tras `/admin/*`
3. Dodać wyjątek dla `/admin/login`
4. Przekazywać dane użytkownika przez `context.locals`

### Krok 11: Utworzenie strony 404

1. Utworzyć `src/pages/404.astro`
2. Użyć PublicLayout
3. Dodać estetyczny komunikat o błędzie
4. Dodać przycisk powrotu do strony głównej

### Krok 12: Stylowanie i dopracowanie

1. Zastosować style Tailwind zgodne z designem
2. Dodać animacje dla MobileSheet
3. Dodać focus-visible styles
4. Przetestować responsywność na różnych breakpointach

### Krok 13: Testowanie

1. Przetestować nawigację na desktop i mobile
2. Przetestować keyboard navigation
3. Przetestować flow logowania/wylogowania
4. Przetestować View Transitions
5. Przetestować accessibility (screen reader, ARIA)
6. Przetestować edge cases (brak profilu, wygasła sesja)

### Krok 14: Optymalizacja

1. Sprawdzić bundle size komponentów React
2. Rozważyć `client:visible` zamiast `client:load` gdzie możliwe
3. Upewnić się, że nawigacja nie blokuje FCP