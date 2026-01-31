# Architektura UI dla My Photo Portfolio

## 1. Przegląd struktury UI

My Photo Portfolio to aplikacja webowa składająca się z dwóch głównych kontekstów użytkownika:

### 1.1 Publiczna galeria (dla odwiedzających)
- Prezentacja portfolio fotografa w formie responsywnej galerii
- Dostęp bez autoryzacji dla potencjalnych klientów
- Focus na estetyce i szybkości ładowania (<3s FCP)
- Struktura: Strona główna (kategorie) → Galeria kategorii → Lightbox → Strona "O mnie"

### 1.2 Panel administracyjny (dla fotografa)
- Zarządzanie treścią portfolio (kategorie, zdjęcia, profil)
- Chroniony autentykacją Supabase Auth
- Topbar navigation zamiast sidebar dla lepszej responsywności
- Limity: 200 zdjęć, 10 kategorii

### 1.3 Strategia renderowania
- **SSR (Server-Side Rendering):** Wszystkie strony renderowane po stronie serwera (Astro output: "server")
- **Hybrydowe podejście:** SSR pierwszych 20 elementów + CSR (infinite scroll) dla kolejnych
- **React Islands:** Komponenty interaktywne (lightbox, formularze, upload) jako client-side islands
- **View Transitions API:** Płynne przejścia między stronami w obrębie tego samego layoutu

### 1.4 Kluczowe założenia UX
- **Mobile-first:** Design zaczyna się od mobile, skaluje do desktop
- **Accessibility:** ARIA attributes, keyboard navigation, semantic HTML
- **Performance:** Lazy loading, image compression, code splitting
- **Feedback:** Toast notifications, optimistic updates, loading states
- **Prostota:** Brak zbędnych funkcji w MVP, focus na core functionality

---

## 2. Lista widoków

### 2.1 Publiczna galeria

#### 2.1.1 Strona główna (/)

**Ścieżka:** `/`

**Główny cel:** Prezentacja wszystkich kategorii portfolio jako punktu wejścia dla odwiedzających.

**Kluczowe informacje:**
- Grid kart kategorii (responsywny: 1/2/3 kolumny)
- Każda karta: okładka (aspect ratio 4:3), nazwa, opis, badge z liczbą zdjęć
- Logo/nazwa fotografa w nawigacji
- Link do strony "O mnie"

**Kluczowe komponenty:**
- `PublicLayout.astro` - główny layout z nawigacją
- `CategoryGrid.tsx` - responsywny grid kontener
- `CategoryCard.tsx` - pojedyncza karta kategorii z overlay
- `EmptyState.tsx` - komunikat gdy brak kategorii ("Galeria w przygotowaniu")
- `SEO.astro` - meta tags dla SEO

**UX, dostępność i bezpieczeństwo:**
- **UX:** Hover effect na kartach (scale/brightness), wyraźne CTA w overlay
- **Accessibility:** Semantic HTML (`<main>`, `<article>`), alt text dla okładek, aria-label="Main navigation"
- **Security:** Brak (public view), tylko published categories z API
- **Performance:** SSR wszystkich kategorii, lazy loading okładek

---

#### 2.1.2 Galeria kategorii (/kategoria/[slug])

**Ścieżka:** `/kategoria/[slug]`

**Główny cel:** Wyświetlenie zdjęć w kategorii w estetycznym układzie masonry z możliwością powiększenia.

**Kluczowe informacje:**
- Nazwa i opis kategorii (header)
- Masonry grid zdjęć (preserved aspect ratio)
- Infinite scroll (SSR pierwszych 20 + CSR kolejnych stron)
- Lightbox fullscreen po kliknięciu

**Kluczowe komponenty:**
- `PublicLayout.astro`
- `PhotoMasonry.tsx` - masonry layout z react-masonry-css, infinite scroll
- `PhotoLightbox.tsx` - fullscreen viewer z React portal
- `Skeleton.tsx` - loading state dla infinite scroll
- `useInfiniteScroll.ts` - custom hook z Intersection Observer

**UX, dostępność i bezpieczeństwo:**
- **UX:**
  - Smooth infinite scroll z debouncing
  - Skeleton cards podczas loading
  - Error state z retry button
  - "To wszystkie zdjęcia" message na końcu
  - Hover effect na zdjęciach
- **Accessibility:**
  - Alt text dla zdjęć (title lub "Zdjęcie")
  - Keyboard navigation w lightbox
  - role="dialog", aria-modal="true" dla lightbox
  - Focus trap w lightbox
- **Security:**
  - Blokada prawego przycisku myszy (onContextMenu preventDefault)
  - Blokada drag & drop (onDragStart preventDefault)
  - Tylko preview 1200px dostępne (nie oryginał)
- **Performance:**
  - Lazy loading (loading="lazy")
  - Preloading tylko 2 sąsiednich zdjęć w lightbox
  - Body scroll lock podczas lightbox open

**Lightbox - szczegółowa specyfikacja:**
- **Desktop:** Backdrop blur, max 90vw/90vh, duże przyciski po bokach
- **Mobile:** Fullscreen (position: fixed; inset: 0), małe przyciski, swipe gestures
- **Keyboard:** Escape (close), Arrow Left/Right (nawigacja)
- **Swipe:** react-swipeable dla mobile gestures
- **Counter:** "3 z 15" informacja o pozycji
- **Zamknięcie:** X button, Escape, kliknięcie poza zdjęciem

---

#### 2.1.3 Strona "O mnie" (/o-mnie)

**Ścieżka:** `/o-mnie`

**Główny cel:** Prezentacja fotografa i danych kontaktowych dla potencjalnych klientów.

**Kluczowe informacje:**
- Display name (h1)
- Bio (paragraf z preserved whitespace)
- Email kontaktowy (klikalny mailto:)
- Telefon kontaktowy (klikalny tel: na mobile)

**Kluczowe komponenty:**
- `PublicLayout.astro`
- Centered card (max-width 600px)
- Ikony kontaktu (Lucide: Mail, Phone)

**UX, dostępność i bezpieczeństwo:**
- **UX:** Minimalistyczny design, focus na treści, ikony dla czytelności
- **Accessibility:** Semantic HTML (`<h1>`, `<p>`), aria-label dla ikon
- **Security:** Brak (public view)
- **Performance:** SSR, brak heavy components

---

#### 2.1.4 Strona 404

**Ścieżka:** Wszystkie nieistniejące URL

**Główny cel:** Obsługa błędnych URL z przyjaznym komunikatem.

**Kluczowe informacje:**
- Heading "404"
- Komunikat "Strona nie została znaleziona"
- Przycisk "Wróć do strony głównej"

**Kluczowe komponenty:**
- Minimalistyczny layout (bez pełnego PublicLayout)
- Button component linkujący do `/`

**UX, dostępność i bezpieczeństwo:**
- **UX:** Estetyczna strona spójna z designem portfolio
- **Accessibility:** role="main", semantic headings
- **Security:** Brak
- **Performance:** Lekka strona, brak zależności

---

### 2.2 Panel administracyjny

#### 2.2.1 Logowanie (/admin/login)

**Ścieżka:** `/admin/login`

**Główny cel:** Autentykacja fotografa przed dostępem do panelu administracyjnego.

**Kluczowe informacje:**
- Logo/nazwa aplikacji (centered)
- Formularz: email, hasło
- Komunikaty błędów (nieprawidłowe dane, błąd sieci)

**Kluczowe komponenty:**
- Minimalistyczny layout (bez AdminLayout)
- `LoginForm.tsx` - react-hook-form + Zod validation
- Supabase Auth integration (signInWithPassword)
- Error Alert component

**UX, dostępność i bezpieczeństwo:**
- **UX:**
  - Przycisk submit disabled podczas loading (spinner)
  - Auto-focus na email input
  - Enter key dla submit
  - Clear error messages
- **Accessibility:**
  - Labels dla wszystkich inputs
  - aria-invalid dla błędnych pól
  - aria-describedby dla error messages
  - role="alert" dla error alerts
  - autoComplete attributes (email, current-password)
- **Security:**
  - Password masked (type="password")
  - Supabase Auth z JWT tokens
  - HTTPS tylko
  - Brak "Remember me" (session managed by Supabase)
  - Brak "Forgot password" w MVP
- **Performance:** Lekka strona, brak heavy dependencies

**Flow:**
1. User wprowadza email + hasło
2. Submit → Supabase Auth signInWithPassword
3. Success → AuthContext update → redirect `/admin/photos`
4. Error → Display alert z komunikatem

---

#### 2.2.2 Redirect /admin

**Ścieżka:** `/admin`

**Główny cel:** Przekierowanie do głównego widoku administracyjnego.

**Logika:**
- Jeśli niezalogowany → redirect `/admin/login`
- Jeśli zalogowany → redirect `/admin/photos`

**Uzasadnienie:** Brak dedykowanego Dashboard w MVP - uproszczenie.

---

#### 2.2.3 Kategorie (/admin/categories)

**Ścieżka:** `/admin/categories`

**Główny cel:** Zarządzanie kategoriami portfolio (CRUD operations).

**Kluczowe informacje:**
- Header: h1 "Kategorie" + Badge "X/10" + Button "Dodaj kategorię"
- Grid kart kategorii (1-2 kolumny responsive)
- Każda karta: miniaturka okładki (80x80px), nazwa, opis (truncated), badge count zdjęć, actions (Edit, Delete)

**Kluczowe komponenty:**
- `AdminLayout.astro` - topbar z user menu
- `CategoriesGrid.tsx` - grid kontener
- `CategoryCard.tsx` - pojedyncza karta
- `CategoryDialog.tsx` - create/edit (Shadcn/ui Dialog)
- `CoverPhotoSelector.tsx` - Popover z grid miniaturek
- `AlertDialog` - delete confirmation (Shadcn/ui)

**UX, dostępność i bezpieczeństwo:**
- **UX:**
  - Hover effect na kartach (actions visible)
  - Badge z limitem (X/10) - kolor progresowy (green/yellow/red)
  - Disabled "Dodaj kategorię" przy 10/10 + tooltip
  - Auto-close Dialog po successful submit
  - Toast notifications (success/error)
  - Slug preview (readonly, auto-generated z nazwy)
  - Empty state w CoverPhotoSelector jeśli kategoria bez zdjęć
- **Accessibility:**
  - ARIA labels dla icon buttons (Edit, Delete)
  - Focus management w Dialog (auto-focus first field)
  - Keyboard navigation (Tab, Enter, Escape)
  - Semantic headings hierarchy
- **Security:**
  - Middleware sprawdza auth session
  - API validates ownership (RLS)
  - Slug generation server-side (prevent injection)
- **Performance:**
  - SSR listy kategorii
  - Client-side Dialog rendering
  - Optimistic update dla edycji (optional)

**CategoryDialog - szczegóły:**
- **Title:** "Dodaj kategorię" / "Edytuj kategorię"
- **Fields:**
  - Nazwa: Input (required, max 100 chars)
  - Slug preview: Readonly text (auto-generated: lowercase, diacritics normalized, hyphens)
  - Opis: Textarea (optional, max 500 chars)
  - Wybór okładki: Button → CoverPhotoSelector Popover (tylko edit mode)
- **Buttons:** Anuluj, Zapisz
- **Validation:** react-hook-form + Zod (zgodne ze schema backendu)

**CoverPhotoSelector - szczegóły:**
- **Trigger:** Button "Wybierz okładkę"
- **Content:** Popover z grid miniaturek (3-4 kolumny, max height 400px, scroll)
- **Empty state:** "Brak zdjęć w kategorii"
- **Interaction:** Click miniaturka → Border highlight → Confirm selection
- **Data:** Filtrowane zdjęcia z category_id (tylko published w MVP? - check)

**Delete confirmation - szczegóły:**
- **Trigger:** Trash icon button
- **AlertDialog:**
  - Title: "Usuń kategorię?"
  - Description: "Kategoria zawiera X zdjęć. Zdjęcia staną się nieprzypisane (category_id = null)."
  - Buttons: Anuluj (default), Usuń (destructive variant, red)
- **Flow:** Confirm → API DELETE → Success toast → Remove from list

**Limit enforcement:**
- Gdy 10/10 → Button "Dodaj kategorię" disabled
- Tooltip: "Osiągnięto limit kategorii (10)"
- Badge czerwony gdy 10/10

---

#### 2.2.4 Zdjęcia (/admin/photos)

**Ścieżka:** `/admin/photos`

**Główny cel:** Główny widok zarządzania zdjęciami portfolio (upload, edycja, publikacja, usuwanie).

**Kluczowe informacje:**
- Toolbar: Select filtr kategorii + Button "Dodaj zdjęcia" + Badge "X/200"
- Grid kart zdjęć (responsywny: 1/2-3/4-5 kolumn)
- Każda karta: miniaturka (dominująca), tytuł (optional), badge kategorii, switch publikacji, actions (Edit, Delete)

**Kluczowe komponenty:**
- `AdminLayout.astro`
- `PhotosGrid.tsx` - grid kontener z filtrowaniem
- `PhotoCard.tsx` - pojedyncza karta zdjęcia
- `PhotoUploadZone.tsx` - Dialog z drag & drop (react-dropzone)
- `UploadProgressList.tsx` - lista plików z dual progress bars
- `PhotoEditDialog.tsx` - edycja metadanych
- `AlertDialog` - delete confirmation
- `Select` (Shadcn/ui) - filtr kategorii

**UX, dostępność i bezpieczeństwo:**
- **UX:**
  - Filter toolbar: Select z opcjami "Wszystkie", "Kategoria 1", ..., "Bez kategorii"
  - Badge limitu (X/200) z kolorem progresowym
  - Disabled upload button przy 200/200 + tooltip
  - Optimistic update dla Switch publikacji
  - Hover effect na kartach (actions visible)
  - Toast notifications dla wszystkich akcji
  - Dual progress bars (kompresja 0-50%, upload 50-100%)
  - FileReader preview przed uploadem (instant feedback)
  - Per-file status (pending, uploading, success, error)
  - Retry button dla failed uploads
- **Accessibility:**
  - ARIA labels dla icon buttons
  - Switch z visible label "Opublikowane"
  - Focus management w Dialogs
  - Keyboard navigation
  - Alt text dla miniaturek
- **Security:**
  - Auth required (middleware)
  - Client-side validation: JPEG only, max 10MB
  - Server-side validation (double check)
  - UUID naming dla storage files ({uuid}-thumbnail.jpg)
  - Timeout 30s dla upload endpoints
- **Performance:**
  - Lazy rendering grid (virtual scroll optional, nie w MVP)
  - Image compression client-side (browser-image-compression)
  - Batch upload limit: 20 plików per batch
  - Sekwencyjne przetwarzanie per-file (validate → compress → upload)

**Toolbar - szczegóły:**
- **Select filtr kategorii:**
  - Opcje: "Wszystkie", "Kategoria 1", "Kategoria 2", ..., "Bez kategorii"
  - onChange → Filter photos array (client-side lub re-fetch API)
  - Count przy każdej opcji (optional)
- **Button "Dodaj zdjęcia":** → Open PhotoUploadZone Dialog
- **Badge "X/200":** Kolor green <70%, yellow 70-90%, red >90%

**PhotoCard - szczegóły:**
- **Layout:** Miniaturka (aspect ratio preserved, rounded-md)
- **Overlay/Below:**
  - Tytuł: Jeśli istnieje (truncated 1 line)
  - Badge: Nazwa kategorii (jeśli przypisana) lub "Bez kategorii"
  - Switch: Publikacja z label "Opublikowane"
  - Actions (hover): Edit icon button, Trash icon button

**PhotoUploadZone (Dialog) - szczegóły:**
- **Dialog title:** "Dodaj zdjęcia"
- **Drag & drop zone:**
  - react-dropzone integration
  - Text: "Przeciągnij zdjęcia tutaj lub kliknij, aby wybrać"
  - Accept: image/jpeg
  - Multiple: true
  - Max files: 20 per batch
  - Traditional file input (hidden, triggered by click)
- **Preview list:**
  - Per file: miniaturka (FileReader.readAsDataURL()), nazwa, rozmiar
  - Dual progress bar: Kompresja (0-50%), Upload (50-100%)
  - Status indicator: pending (gray), uploading (blue), success (green), error (red)
  - Error message + Retry button
- **Global controls:**
  - Select kategorii: Przypisz wszystkie uploadowane do kategorii
  - Switch "Opublikuj od razu": Default OFF
  - Button "Wyczyść listę": Reset state przed uploadem
  - Button "Wyślij": Disabled jeśli brak plików, trigger batch upload
- **Validation:**
  - Pre-upload check: JPEG format, max 10MB, limit 200 total
  - Toast error dla invalid files
  - Disable "Wyślij" jeśli wszystkie invalid
- **Processing flow:**
  1. User wybiera pliki
  2. FileReader preview (instant)
  3. Validation (format, size, limit)
  4. User klika "Wyślij"
  5. Per-file sekwencyjnie:
     - Kompresja (browser-image-compression): thumbnail 400px, preview 1200px
     - Progress bar 0-50%
     - Upload do Supabase Storage (POST /api/photos/batch)
     - Progress bar 50-100%
     - Success/Error state
  6. Podsumowanie: "5 zdjęć dodanych, 2 błędy"
  7. StatsContext.refreshStats()
  8. Auto-close Dialog (lub zostaw open dla review?)

**PhotoEditDialog - szczegóły:**
- **Dialog title:** "Edytuj zdjęcie"
- **Miniaturka:** 60x60px (preview_url)
- **Form (react-hook-form + Zod):**
  - Tytuł: Input (optional, max 200 chars)
  - Kategoria: Select dropdown z opcjami
  - Publikacja: Switch
- **Buttons:** Anuluj, Zapisz
- **Flow:** Submit → PUT /api/photos/:id → Success toast → Update card

**Delete confirmation - szczegóły:**
- **AlertDialog:**
  - Miniaturka: 60x60px usuwanego zdjęcia
  - Title: "Usuń zdjęcie?"
  - Description: "Tej operacji nie można cofnąć"
  - Buttons: Anuluj, Usuń (destructive)
- **Flow:** Confirm → DELETE /api/photos/:id → Success toast → Remove from grid

**Optimistic update - Switch publikacji:**
1. User toggle Switch
2. Immediate UI update (Switch state + optional visual feedback)
3. Background: PATCH /api/photos/:id/publish
4. Success: Toast "Status publikacji zaktualizowany" (3s)
5. Error: Revert Switch + Toast error (5s)

---

#### 2.2.5 Profil (/admin/profile)

**Ścieżka:** `/admin/profile`

**Główny cel:** Edycja danych profilowych fotografa, ustawień SEO i podgląd statystyk limitów.

**Kluczowe informacje:**
- **Sekcja 1:** Dane profilowe (display_name, bio, contact_email, contact_phone)
- **Sekcja 2:** Ustawienia SEO (site_title, site_description)
- **Sekcja 3:** Statystyki (progress bars: zdjęcia X/200, kategorie X/10)

**Kluczowe komponenty:**
- `AdminLayout.astro`
- `ProfileForm.tsx` - react-hook-form + Zod
- `SeoSettingsForm.tsx` - react-hook-form + Zod
- `StatsCard.tsx` - Card z Progress bars (Shadcn/ui)
- `StatsContext` - React Context dla limitów

**UX, dostępność i bezpieczeństwo:**
- **UX:**
  - Dwie osobne formy z osobnymi przyciskami "Zapisz"
  - Toast notifications po zapisaniu
  - Field validation z immediate feedback
  - Progress bars z kolorami (green/yellow/red)
  - Disabled submit podczas loading
- **Accessibility:**
  - Labels dla wszystkich inputs
  - aria-invalid dla błędnych pól
  - aria-describedby dla error messages
  - Progress bars z aria-valuenow, aria-valuemin, aria-valuemax
  - Semantic sections
- **Security:**
  - Auth required
  - Email validation (valid format)
  - Phone validation (basic format)
  - Server-side validation (double check)
- **Performance:**
  - SSR initial data (GET /api/profile, GET /api/settings)
  - Client-side form handling
  - StatsContext refresh po mutacjach (nie auto-refresh)

**Sekcja: Dane profilowe - szczegóły:**
- **Card title:** "Dane profilowe"
- **Fields:**
  - Display name: Input (required, max 100 chars)
  - Bio: Textarea (optional, auto-resize lub fixed height)
  - Email kontaktowy: Input (optional, email validation, max 255 chars)
  - Telefon: Input (optional, max 20 chars)
- **Button:** "Zapisz zmiany"
- **API:** PUT /api/profile
- **Success toast:** "Profil zaktualizowany"

**Sekcja: Ustawienia SEO - szczegóły:**
- **Card title:** "Ustawienia SEO"
- **Description:** "Te dane będą używane w meta tagach i przy udostępnianiu w social media"
- **Fields:**
  - Site title: Input (optional, max 100 chars, placeholder: "Fotografia ślubna | Jan Kowalski")
  - Site description: Textarea (optional, max 300 chars, placeholder: "Profesjonalna fotografia ślubna...")
- **Button:** "Zapisz zmiany"
- **API:** PUT /api/settings
- **Success toast:** "Ustawienia SEO zaktualizowane"

**Sekcja: Statystyki - szczegóły:**
- **Card title:** "Wykorzystanie limitów"
- **Progress bar 1:**
  - Label: "Zdjęcia"
  - Value: "145 z 200" (text)
  - Progress: 145/200 = 72.5%
  - Kolor: green (<70%), yellow (70-90%), red (>90%)
- **Progress bar 2:**
  - Label: "Kategorie"
  - Value: "6 z 10"
  - Progress: 6/10 = 60%
  - Kolor: green
- **Data source:** StatsContext (GET /api/stats)

---

## 3. Mapa podróży użytkownika

### 3.1 Podróż odwiedzającego (potencjalny klient)

**Cel:** Przejrzenie portfolio i kontakt z fotografem

```
START → Strona główna (/)
  ↓
Przeglądanie kafelków kategorii
  ↓
Kliknięcie kategorii → Galeria (/kategoria/[slug])
  ↓
Scrollowanie zdjęć (masonry + infinite scroll)
  ↓
Kliknięcie zdjęcia → Lightbox (fullscreen)
  ↓
Nawigacja strzałkami/swipe między zdjęciami
  ↓
Zamknięcie lightbox (Escape/X/click outside)
  ↓
[Opcjonalnie] Powrót do głównej lub przejście do "O mnie"
  ↓
Strona O mnie (/o-mnie)
  ↓
Przejrzenie bio i danych kontaktowych
  ↓
Kliknięcie email/telefon → Kontakt zewnętrzny
  ↓
END
```

**Kluczowe punkty decyzyjne:**
- Wybór kategorii (która najbardziej interesuje)
- Przeglądanie zdjęć (ile czasu spędzi)
- Decyzja o kontakcie (czy bio i prace przekonują)

**Pain points i rozwiązania:**
- **PP:** Długi czas ładowania → **Rozwiązanie:** Lazy loading, SSR, compression
- **PP:** Zgubienie się w galerii → **Rozwiązanie:** Breadcrumbs (brak w MVP), wyraźna nawigacja
- **PP:** Trudność z powrotem → **Rozwiązanie:** Logo w nav zawsze wraca do głównej

---

### 3.2 Podróż fotografa - Pierwsze uruchomienie portfolio

**Cel:** Setup portfolio od zera do pierwszej publikacji

```
START → /admin → Redirect → Login (/admin/login)
  ↓
Wprowadzenie email + hasło
  ↓
Supabase Auth → Success → Redirect → Zdjęcia (/admin/photos)
  ↓
Empty state (brak zdjęć) → Navbar → Kategorie
  ↓
Strona Kategorie (/admin/categories) → Kliknięcie "Dodaj kategorię"
  ↓
CategoryDialog: Wprowadzenie nazwy "Sesje ślubne" + opis
  ↓
Submit → Kategoria utworzona (slug auto: "sesje-slubne")
  ↓
Powtórzenie dla 2-3 kolejnych kategorii
  ↓
Navbar → Zdjęcia → Kliknięcie "Dodaj zdjęcia"
  ↓
PhotoUploadZone Dialog: Drag & drop 10 plików JPEG
  ↓
Preview pojawia się instant (FileReader)
  ↓
Wybór kategorii "Sesje ślubne" z Select
  ↓
Kliknięcie "Wyślij"
  ↓
Per-file processing:
  - Kompresja (progress 0-50%)
  - Upload (progress 50-100%)
  - Success (zielona ikona)
  ↓
Podsumowanie: "10 zdjęć dodanych"
  ↓
Zdjęcia pojawiają się na grid
  ↓
StatsContext update: Badge "10/200 zdjęć"
  ↓
Toggle Switch publikacji dla wszystkich zdjęć (jedno po drugim)
  ↓
Navbar → Kategorie → Edycja kategorii "Sesje ślubne"
  ↓
Kliknięcie "Wybierz okładkę" → Popover z miniaturkami
  ↓
Wybór najlepszego zdjęcia → Submit
  ↓
Okładka zaktualizowana (widoczna na karcie)
  ↓
Navbar → Profil
  ↓
Edycja danych profilowych: nazwa, bio, email, telefon
  ↓
Edycja SEO: site_title, site_description
  ↓
Zapisanie obu formularzy
  ↓
Otwarcie nowej karty → Strona główna publiczna (/)
  ↓
Weryfikacja: kategorie widoczne, zdjęcia w galerii, dane na "O mnie"
  ↓
END (Portfolio gotowe do prezentacji)
```

**Estymowany czas:** 30-45 minut dla ~30 zdjęć w 3 kategoriach

**Kluczowe momenty sukcesu:**
- Utworzenie pierwszej kategorii (zrozumienie struktury)
- Pierwszy upload zdjęć (zobacz progress, zrozum flow)
- Publikacja pierwszego zdjęcia (widzisz efekt publicznie)
- Wybór okładki (personalizacja portfolio)

---

### 3.3 Podróż fotografa - Codzienne zarządzanie

**Cel:** Dodawanie nowych zdjęć i aktualizacja portfolio

```
START → /admin → Auto-login (session active) → Zdjęcia (/admin/photos)
  ↓
Przegląd istniejących zdjęć
  ↓
Kliknięcie "Dodaj zdjęcia" → PhotoUploadZone
  ↓
Upload nowej sesji (20 zdjęć) → Przypisanie do kategorii
  ↓
Review zdjęć na grid
  ↓
[Opcjonalnie] Edycja tytułów wybranych zdjęć (PhotoEditDialog)
  ↓
Toggle publikacji dla gotowych zdjęć
  ↓
[Opcjonalnie] Usunięcie starych zdjęć (Delete confirmation)
  ↓
Sprawdzenie limitów (Badge toolbar + /admin/profile)
  ↓
Wylogowanie (User menu → Wyloguj)
  ↓
END
```

**Częstotliwość:** 1-2 razy w tygodniu po nowych sesjach

**Pain points i rozwiązania:**
- **PP:** Długi upload → **Rozwiązanie:** Dual progress, retry per-file
- **PP:** Przypadkowe usunięcia → **Rozwiązanie:** AlertDialog z kontekstem
- **PP:** Nie wie które published → **Rozwiązanie:** Switch widoczny na karcie
- **PP:** Zbliżanie się do limitu → **Rozwiązanie:** Badge z kolorami, progress bars

---

## 4. Układ i struktura nawigacji

### 4.1 PublicLayout (Publiczna galeria)

**Struktura topbar:**

```
[Logo/Nazwa Fotografa]          [Galeria] [O mnie]
```

**Desktop (>= 768px):**
- Horizontal nav bar (fixed lub sticky top)
- Logo/nazwa po lewej (link do `/`)
- Nav links po prawej (Galeria, O mnie)
- Active indicator: Border-bottom lub background highlight
- Hover states na linkach

**Mobile (< 768px):**
- Hamburger icon (prawy górny róg) → Sheet component (Shadcn/ui)
- Sheet slide-in z navigation links (vertical stack)
- Logo/nazwa centered lub lewy górny róg
- Backdrop blur gdy Sheet open

**Active page indicator:**
- Galeria: Active gdy URL = `/` lub `/kategoria/*`
- O mnie: Active gdy URL = `/o-mnie`

**Accessibility:**
- `<nav aria-label="Main navigation">`
- `aria-current="page"` dla aktywnej strony
- `aria-expanded` + `aria-controls` dla hamburger menu
- Keyboard navigation (Tab, Enter)

**Data source:**
- Logo/nazwa: GET /api/public/profile (display_name)
- SSR w PublicLayout.astro

---

### 4.2 AdminLayout (Panel administracyjny)

**Struktura topbar:**

```
[Logo/Nazwa]  [Kategorie] [Zdjęcia] [Profil]        [Avatar ▼]
                                                      ├─ Profil
                                                      └─ Wyloguj
```

**Desktop (>= 768px):**
- Horizontal nav bar (fixed top)
- Logo/nazwa po lewej (link do `/admin/photos`)
- Nav links centrum/lewo (Kategorie, Zdjęcia, Profil)
- User menu po prawej (Avatar + DropdownMenu)
- Active indicator: Border-bottom lub background
- Badge z limitami (optional, może być w Profil)

**Mobile (< 768px):**
- Logo/nazwa lewy górny
- Hamburger icon prawy górny → Sheet z nav links + user menu
- Sheet vertical stack:
  - Kategorie
  - Zdjęcia
  - Profil
  - Separator
  - Wyloguj

**User menu (DropdownMenu):**
- **Trigger:** Avatar z inicjałami (np. "JK") + display_name
- **Content:**
  - Profil (link do `/admin/profile`)
  - Separator
  - Wyloguj (action: AuthContext.signOut())

**Active page indicator:**
- Kategorie: Active gdy URL = `/admin/categories`
- Zdjęcia: Active gdy URL = `/admin/photos`
- Profil: Active gdy URL = `/admin/profile`

**Accessibility:**
- Semantic nav z aria-label
- aria-current dla aktywnej
- Keyboard navigation
- Focus visible styles

**Data source:**
- Display_name: GET /api/profile (dla user menu)
- SSR w AdminLayout.astro lub CSR w React component (AuthContext)

---

### 4.3 Navigation flows

**Publiczna galeria:**
```
Strona główna (/)
  ├─ Kliknięcie kafelka → /kategoria/[slug]
  │   └─ Logo → / (powrót)
  ├─ O mnie → /o-mnie
  │   └─ Logo → /
  └─ Nieistniejący URL → 404
      └─ Przycisk → / (powrót)
```

**Panel administracyjny:**
```
Login (/admin/login)
  └─ Success → /admin/photos

Admin topbar navigation:
  ├─ Kategorie → /admin/categories
  ├─ Zdjęcia → /admin/photos
  ├─ Profil → /admin/profile
  └─ User menu:
      ├─ Profil → /admin/profile (duplicate link)
      └─ Wyloguj → /admin/login (po signOut)

Redirect flows:
  /admin → middleware check → zalogowany? /admin/photos : /admin/login
  /admin/* (niezalogowany) → /admin/login
```

**View Transitions:**
- Włączone dla wszystkich przejść w obrębie tego samego layoutu
- PublicLayout → PublicLayout: Smooth transition
- AdminLayout → AdminLayout: Smooth transition
- PublicLayout ↔ AdminLayout: Standard page load (różne layouty)

---

## 5. Kluczowe komponenty

### 5.1 Komponenty Astro (statyczne, SSR)

#### SEO.astro
**Opis:** Component do meta tags i Open Graph
**Props:**
- `title: string` (required)
- `description: string` (required)
- `image?: string` (optional, URL do og:image)
- `type?: 'website' | 'article'` (default: 'website')

**Użycie:**
```astro
<SEO
  title={seoSettings.site_title || "My Photo Portfolio"}
  description={seoSettings.site_description || "Portfolio fotograficzne"}
  image={category.cover_photo_url}
  type="website"
/>
```

**Output:** Meta tags w `<head>` (title, description, og:*, twitter:*)

---

#### Navigation.astro
**Opis:** Nawigacja publicznej galerii
**Props:**
- `currentPath: string` (dla active indicator)
- `photographerName: string` (z API)

**Zawiera:**
- Logo/nazwa (link do `/`)
- Nav links (Galeria, O mnie)
- Mobile hamburger → Sheet

---

#### EmptyState.tsx (React)
**Opis:** Generic empty state component
**Props:**
- `icon: React.ReactNode` (Lucide icon)
- `title: string`
- `description?: string`
- `action?: { label: string, onClick: () => void }`

**Użycie:** Brak kategorii, brak zdjęć, kategoria pusta

---

### 5.2 Komponenty React (interaktywne, CSR)

#### PhotoLightbox.tsx
**Opis:** Fullscreen photo viewer z navigation
**Props:**
- `photos: Photo[]` (array zdjęć)
- `initialIndex: number` (który zdjęcie otworzyć)
- `onClose: () => void`

**Features:**
- React portal (createPortal do body)
- Keyboard: Escape, Arrow Left/Right
- Swipe: react-swipeable (mobile)
- Preloading: 2 sąsiednie (new Image())
- Body scroll lock
- Blokada: onContextMenu, onDragStart preventDefault
- Counter: "3 z 15"
- Responsive: fullscreen mobile, backdrop desktop

**State:**
- `currentIndex: number` (aktualnie wyświetlane)
- `isPreloading: boolean` (loading indicator)

**ARIA:**
- role="dialog", aria-modal="true", aria-label="Podgląd zdjęcia"

---

#### PhotoUploadZone.tsx
**Opis:** Drag & drop upload z progress tracking
**Props:**
- `onUploadComplete: (uploadedPhotos: Photo[]) => void`
- `maxFiles?: number` (default: 20)

**Features:**
- react-dropzone (drag & drop + file input)
- FileReader preview (instant)
- Validation: JPEG, max 10MB, limit total
- Dual progress bars: kompresja + upload
- Per-file status: pending, uploading, success, error
- Retry button dla errors
- Select kategorii (assign all)
- Switch "Opublikuj od razu"
- Button "Wyczyść listę"

**State:**
- `files: UploadFile[]` (array z metadata + progress)
- `selectedCategory: string | null`
- `publishImmediately: boolean`

**UploadFile type:**
```typescript
{
  file: File,
  preview: string (data URL),
  status: 'pending' | 'uploading' | 'success' | 'error',
  progress: number (0-100),
  error?: string
}
```

---

#### PhotoMasonry.tsx
**Opis:** Masonry layout z infinite scroll
**Props:**
- `initialPhotos: Photo[]` (SSR first page)
- `categorySlug: string` (dla fetch kolejnych)
- `onPhotoClick: (index: number) => void` (open lightbox)

**Features:**
- react-masonry-css (masonry layout)
- Intersection Observer (infinite scroll)
- useInfiniteScroll custom hook
- Skeleton loading state
- Error state z retry button
- "To wszystkie zdjęcia" message

**State:**
- `photos: Photo[]` (current array)
- `page: number` (pagination)
- `hasMore: boolean`
- `isLoading: boolean`
- `error: string | null`

**Columns responsive:**
- Mobile (< 768px): 1 kolumna
- Tablet (768-1024px): 2-3 kolumny
- Desktop (> 1024px): 3 kolumny

---

#### CategoryDialog.tsx
**Opis:** Create/Edit kategoria modal
**Props:**
- `mode: 'create' | 'edit'`
- `category?: Category` (tylko edit mode)
- `onSuccess: (category: Category) => void`
- `onClose: () => void`

**Features:**
- Shadcn/ui Dialog
- react-hook-form + Zod
- Slug preview (auto-generated)
- CoverPhotoSelector (edit mode)
- Toast notifications

**Form fields:**
- Nazwa (required)
- Opis (optional, max 500)
- Okładka (tylko edit)

---

#### PhotoEditDialog.tsx
**Opis:** Edit photo metadata modal
**Props:**
- `photo: Photo`
- `categories: Category[]`
- `onSuccess: (updatedPhoto: Photo) => void`
- `onClose: () => void`

**Features:**
- Shadcn/ui Dialog
- react-hook-form + Zod
- Miniaturka preview (60x60px)
- Select kategorii
- Switch publikacji

**Form fields:**
- Tytuł (optional)
- Kategoria (Select)
- Publikacja (Switch)

---

#### CoverPhotoSelector.tsx
**Opis:** Popover z grid miniaturek do wyboru okładki
**Props:**
- `categoryId: string`
- `currentCoverId?: string` (highlight current)
- `onSelect: (photoId: string) => void`

**Features:**
- Shadcn/ui Popover
- Grid 3-4 kolumny
- Max height 400px + scroll
- Border highlight selected
- Empty state jeśli brak zdjęć

**Data source:** GET /api/photos?category_id={categoryId}

---

### 5.3 Shared UI Components (Shadcn/ui)

**Używane komponenty:**
- **Button** - CTA, actions, submits
- **Dialog** - Modals (CategoryDialog, PhotoEditDialog, PhotoUploadZone)
- **AlertDialog** - Delete confirmations
- **Popover** - CoverPhotoSelector
- **Select** - Dropdown filters, category select
- **Switch** - Toggle publikacji
- **Input** - Text fields
- **Textarea** - Bio, opisy
- **Card** - Containers (kategorie, zdjęcia, profil)
- **Badge** - Counts, limits, categories
- **Progress** - Progress bars (upload, limits)
- **Sheet** - Mobile navigation
- **DropdownMenu** - User menu
- **Skeleton** - Loading states
- **Alert** - Error states
- **Toaster** (Sonner) - Toast notifications

**Style variant:** "new-york"
**Base color:** "neutral"
**Border radius:** rounded-md (6px)

---

### 5.4 Context Providers (React)

#### AuthContext
**Opis:** Zarządzanie sesją użytkownika
**Provides:**
- `user: User | null`
- `session: Session | null`
- `signIn: (email, password) => Promise<void>`
- `signOut: () => Promise<void>`
- `isLoading: boolean`

**Logic:**
- Supabase Auth onAuthStateChange listener
- Auto-refresh tokens
- Redirect do /admin/login jeśli session null

**Użycie:** Middleware, AdminLayout, protected pages

---

#### StatsContext
**Opis:** Tracking limitów zdjęć i kategorii
**Provides:**
- `photosCount: number`
- `categoriesCount: number`
- `refreshStats: () => Promise<void>`

**Data source:** GET /api/stats

**Refresh strategy:**
- Wywołane po mutacjach: upload, delete, create category
- NIE auto-refresh co X sekund (uproszczenie MVP)

**Użycie:**
- AdminLayout topbar (Badge limits - optional)
- /admin/photos toolbar (Badge X/200)
- /admin/categories header (Badge X/10)
- /admin/profile (Progress bars)
- PhotoUploadZone (validation before upload)

---

### 5.5 Custom Hooks

#### useInfiniteScroll.ts
**Opis:** Intersection Observer dla infinite scroll
**Params:**
- `fetchNextPage: () => Promise<void>`
- `hasMore: boolean`
- `isLoading: boolean`

**Returns:**
- `sentinelRef: RefObject<HTMLDivElement>` (attach do sentinel element)

**Logic:**
- Intersection Observer na sentinel div
- Debouncing 300ms (optional)
- Trigger fetchNextPage gdy sentinel visible

---

#### useOptimisticUpdate.ts
**Opis:** Helper dla optimistic UI updates
**Params:**
- `updateFn: () => Promise<void>` (API call)
- `optimisticData: T` (new state)
- `rollbackData: T` (previous state)

**Returns:**
- `execute: () => Promise<void>`

**Logic:**
1. Update local state (optimistic)
2. Call API
3. Success → Toast success
4. Error → Rollback state + Toast error

**Użycie:** Switch publikacji, inline edits (optional)

---

## 6. Edge Cases i Error Handling

### 6.1 Publiczna galeria

#### Brak kategorii
- **Empty state:** "Galeria w przygotowaniu" z ikoną Camera
- **Action:** Brak (user nie może nic zrobić)
- **Location:** Strona główna (/)

#### Kategoria bez published zdjęć
- **Behavior:** Nie wyświetlaj na public (hidden przez API)
- **Backend:** GET /api/public/categories filtruje kategorie bez published photos

#### Nieistniejący slug
- **Response:** 404 Not Found z backendu
- **UI:** Strona 404 z przyciskiem "Wróć do strony głównej"

#### Network error w infinite scroll
- **UI:** Alert component (Shadcn/ui) z ikoną AlertTriangle
- **Message:** "Nie udało się załadować zdjęć"
- **Action:** Button "Spróbuj ponownie" → retry fetch

#### Lightbox - brak sąsiednich zdjęć
- **Behavior:** Disable arrow buttons lub loop (first ↔ last)
- **MVP decision:** Disable arrows (prostsze)

#### Lightbox - fail preload sąsiedniego
- **Behavior:** Ignore error, nie blokuj nawigacji
- **Fallback:** Load on demand przy przejściu

---

### 6.2 Login

#### Nieprawidłowe credentials
- **Response:** 401 Unauthorized z Supabase
- **UI:** Alert (role="alert") "Nieprawidłowy email lub hasło"
- **Color:** Destructive (red)

#### Network error
- **Response:** Fetch error (timeout, no connection)
- **UI:** Alert "Błąd połączenia. Spróbuj ponownie."
- **Action:** User może retry manual (re-submit form)

#### Session expired podczas użytkowania
- **Detection:** AuthContext onAuthStateChange → session null
- **Behavior:** Auto redirect do /admin/login
- **Toast:** "Sesja wygasła. Zaloguj się ponownie."

---

### 6.3 Kategorie

#### Limit 10/10 kategorii
- **UI:** Button "Dodaj kategorię" disabled
- **Tooltip:** "Osiągnięto limit kategorii (10)"
- **Visual:** Badge "10/10" red

#### Kategoria bez zdjęć - wybór okładki
- **UI:** Empty state w CoverPhotoSelector Popover
- **Message:** "Brak zdjęć w kategorii"
- **Action:** Brak (user musi najpierw dodać zdjęcia)

#### Duplicate slug (conflict)
- **Response:** 400 Bad Request z API
- **UI:** Toast error "Kategoria o tej nazwie już istnieje"
- **Behavior:** Dialog pozostaje open, user może edytować nazwę

#### Delete kategorii z zdjęciami
- **UI:** AlertDialog z info
- **Message:** "Kategoria zawiera 15 zdjęć. Zdjęcia staną się nieprzypisane."
- **Explanation:** category_id = null, zdjęcia niewidoczne publicznie
- **Buttons:** Anuluj (default focus), Usuń (destructive)

---

### 6.4 Zdjęcia

#### Limit 200/200 zdjęć
- **UI:** Button "Dodaj zdjęcia" disabled
- **Tooltip:** "Osiągnięto limit zdjęć (200)"
- **Visual:** Badge "200/200" red

#### Nieprawidłowy format (nie JPEG)
- **Detection:** Client-side validation (File.type !== 'image/jpeg')
- **UI:** Toast error "Dozwolony tylko format JPEG"
- **Behavior:** File nie dodany do preview list

#### Plik > 10MB
- **Detection:** Client-side validation (File.size > 10 * 1024 * 1024)
- **UI:** Toast error "Maksymalny rozmiar pliku to 10 MB"
- **Behavior:** File nie dodany do preview list

#### Network error podczas uploadu
- **Detection:** Fetch error w POST /api/photos/batch
- **UI:** Per-file error state (red icon + error message)
- **Action:** Retry button per-file
- **Behavior:** Successful uploads nie są tracone (partial success OK)

#### Kompresja fail (browser-image-compression error)
- **Detection:** Try/catch w compression logic
- **UI:** Per-file error state "Błąd przetwarzania"
- **Action:** Retry button → retry compression + upload

#### Zdjęcie bez kategorii (category_id = null)
- **UI:** Badge "Bez kategorii" (gray)
- **Public visibility:** Niewidoczne (even if is_published = true)
- **Filter:** Option "Bez kategorii" w Select filter

#### Toggle publikacji fail (PATCH error)
- **UI:** Revert Switch state (rollback)
- **Toast:** Error "Nie udało się zaktualizować statusu"
- **Color:** Destructive (5s)

---

### 6.5 Profil

#### Validation error (invalid email format)
- **UI:** Field error z aria-describedby
- **Message:** "Wprowadź poprawny adres email"
- **Color:** Destructive
- **ARIA:** aria-invalid="true"

#### API error (500 Internal Server Error)
- **UI:** Toast generic "Coś poszło nie tak. Spróbuj ponownie."
- **Behavior:** Form data nie zmieniona (user może retry)

#### Empty stats (0/200, 0/10)
- **UI:** Progress bars na 0%
- **Color:** Green (daleko od limitu)
- **Message:** Brak (progress bars wystarczające)

---

### 6.6 Global

#### Unauthorized (401) podczas używania admin
- **Detection:** Middleware lub API response
- **Behavior:** Auto redirect do /admin/login
- **Toast:** "Sesja wygasła. Zaloguj się ponownie."

#### Network timeout (fetch timeout)
- **Detection:** AbortController timeout (30s dla uploads, default dla reszty)
- **UI:** Toast error "Przekroczono limit czasu. Spróbuj ponownie."
- **Retry:** User manual (re-submit action)

#### Server error (500)
- **UI:** Toast generic "Coś poszło nie tak. Spróbuj ponownie później."
- **Logging:** console.error (brak Sentry w MVP)
- **Behavior:** User może retry manual

---

## 7. Responsywność i Accessibility

### 7.1 Breakpoints (Tailwind CSS)

```
Mobile:  < 768px   (sm, default)
Tablet:  768-1024px (md)
Desktop: > 1024px   (lg, xl, 2xl)
```

### 7.2 Grid responsiveness

**Strona główna - CategoryGrid:**
- Mobile: 1 kolumna
- Tablet: 2 kolumny
- Desktop: 3 kolumny

**Galeria kategorii - PhotoMasonry:**
- Mobile: 1 kolumna
- Tablet: 2-3 kolumny (zależne od szerokości zdjęć)
- Desktop: 3 kolumny

**Admin - CategoriesGrid:**
- Mobile: 1 kolumna
- Tablet: 2 kolumny
- Desktop: 2 kolumny (max)

**Admin - PhotosGrid:**
- Mobile: 1 kolumna
- Tablet: 2-3 kolumny
- Desktop: 4-5 kolumn

### 7.3 Navigation responsiveness

**PublicLayout:**
- Desktop: Horizontal nav (Logo | Links)
- Mobile: Hamburger → Sheet (slide-in)

**AdminLayout:**
- Desktop: Horizontal topbar (Logo | Nav | User menu)
- Mobile: Hamburger → Sheet (Logo | Nav stack | User menu stack)

### 7.4 Lightbox responsiveness

**Desktop:**
- Backdrop blur
- Max 90vw / 90vh
- Duże arrow buttons po bokach
- X button prawy górny

**Mobile:**
- Fullscreen (position: fixed; inset: 0)
- Black backdrop (no blur)
- Małe arrow buttons (bottom corners)
- Swipe gestures (primary navigation)
- X button prawy górny

### 7.5 Typography responsiveness

**Headings:**
- h1: text-2xl md:text-4xl
- h2: text-xl md:text-3xl
- h3: text-lg md:text-2xl

**Body:** text-base (16px) - czytelne bez zooming

**Buttons:** min-height 44px (touch target size)

### 7.6 ARIA Attributes

**Navigation:**
- `<nav aria-label="Main navigation">`
- `aria-current="page"` dla aktywnej strony
- `aria-expanded`, `aria-controls` dla hamburger menu

**Forms:**
- `<label>` dla wszystkich inputs
- `aria-invalid="true"` dla błędnych pól
- `aria-describedby` wskazujący error message
- `role="alert"` dla error messages

**Dialogs:**
- `role="dialog"` + `aria-modal="true"`
- `aria-label` lub `aria-labelledby` (title)
- Focus trap (automatic w Shadcn/ui)
- Escape key closes

**Images:**
- `alt` text dla wszystkich zdjęć (title lub generic "Zdjęcie")
- `loading="lazy"` dla galerii
- `loading="eager"` dla above-fold (okładki na głównej)

**Buttons:**
- `aria-label` dla icon-only buttons (Edit, Delete, Close)
- `disabled` attribute z tooltip explanation

**Progress bars:**
- `role="progressbar"`
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- `aria-label` describing purpose

**Alerts:**
- `role="alert"` dla error messages (auto screen reader announcement)
- `aria-live="polite"` dla toast notifications

### 7.7 Keyboard navigation

**General:**
- Tab order logical (top to bottom, left to right)
- Focus visible (outline) na wszystkich interactive elements
- Skip to content link (optional, nice-to-have)

**Lightbox:**
- Escape: Close
- Arrow Left: Previous photo
- Arrow Right: Next photo
- Tab: Cycle przez controls (arrows, close)

**Dialogs:**
- Escape: Close (anuluj)
- Enter: Submit form (jeśli focus na input)
- Tab: Cycle przez fields i buttons

**Dropdowns/Selects:**
- Arrow Down/Up: Navigate options
- Enter: Select option
- Escape: Close dropdown

### 7.8 Pominięte w MVP (accessibility)

- Screen reader announcements dla wszystkich akcji (tylko critical: alerts)
- Accessibility features dla infinite scroll (skip to footer, aria-live dla loading)
- High contrast mode support
- Reduced motion preference (prefers-reduced-motion) - subtle animations OK

---

## 8. Security Considerations

### 8.1 Autentykacja

- **Mechanizm:** Supabase Auth z JWT tokens
- **Storage:** httpOnly cookies (Supabase managed)
- **Session:** Auto-refresh tokens via onAuthStateChange
- **Timeout:** Supabase default (1h access token, refresh on expiry)
- **Middleware:** Check session dla wszystkich `/admin/*` routes

### 8.2 Upload security

- **Walidacja client-side:**
  - Format: tylko JPEG (File.type === 'image/jpeg')
  - Rozmiar: max 10MB
  - Count: max 200 total (check przed upload)
- **Walidacja server-side:**
  - Double check format, size, count
  - MIME type validation (nie tylko extension)
- **Storage naming:**
  - UUID + suffix: `{uuid}-thumbnail.jpg`, `{uuid}-preview.jpg`
  - Avoid original filenames (prevent path traversal, special chars)
- **Kompresja:**
  - Client-side (browser-image-compression)
  - Tylko processed files do storage (nie oryginały)

### 8.3 Blokada pobierania zdjęć

- **Context menu:** `onContextMenu={e => e.preventDefault()}`
- **Drag:** `onDragStart={e => e.preventDefault()}`
- **Resolution limit:** Tylko preview 1200px dostępne publicznie
- **Oryginały:** Nie stored (tylko thumbnail + preview)
- **Watermark:** Pominięty w MVP (post-MVP feature)

### 8.4 Input validation

- **Client:** Zod schemas (shared z backendem)
- **Server:** Double validation (Zod + database constraints)
- **SQL injection:** Protected (Supabase/Postgres parametrized queries)
- **XSS:** Protected (React escapes by default, no dangerouslySetInnerHTML)
- **CSRF:** Token nie wymagany (same-site cookies + JWT, Astro SSR)

### 8.5 Authorization

- **Database level:** Row Level Security (RLS) policies
  - `authenticated` role: tylko own data
  - `anon` role: tylko public data (published photos, categories)
- **API level:** Middleware sprawdza `auth.uid()` matches resource ownership
- **Frontend:** AuthContext guards protected routes

### 8.6 Error handling

- **Logging:** console.error dla wszystkich errors (brak external logging w MVP)
- **User messages:** Generic errors (nie expose stack traces, DB errors)
- **Example:** "Coś poszło nie tak" zamiast "Database connection timeout"

---

## 9. Performance Optimizations

### 9.1 Image optimization

- **Compression:** Client-side (browser-image-compression)
  - Thumbnail: 400px width, quality 0.8
  - Preview: 1200px width, quality 0.85
- **Lazy loading:** `loading="lazy"` dla galerii
- **Eager loading:** `loading="eager"` dla above-fold (okładki kategorii)
- **Aspect ratio hints:** `aspect-ratio` CSS (prevent layout shift)
- **Preloading:** Tylko 2 sąsiednie w lightbox (new Image())
- **Storage:** Supabase Storage CDN (automatic caching)

### 9.2 Code splitting

- **React islands:** Tylko interactive components hydrated
- **React.lazy:** Heavy components (PhotoLightbox, PhotoUploadZone)
- **View Transitions:** Soft navigations (no full page reload w obrębie layoutu)
- **Bundle size:** Tree-shakeable icons (Lucide), minimal dependencies

### 9.3 Data fetching

- **SSR pierwszych elementów:** Fast FCP (First Contentful Paint)
  - Strona główna: wszystkie kategorie (max 10)
  - Galeria kategorii: pierwsze 20 zdjęć
- **Pagination:** 20 items per page (API + infinite scroll)
- **Debouncing:** Intersection Observer infinite scroll (automatic)
- **Optimistic updates:** Instant UI feedback (no wait for API)

### 9.4 Caching

- **Browser cache:** Static assets (CSS, JS, fonts)
- **Supabase Storage:** CDN caching dla images
- **API responses:** Brak custom caching w MVP (Supabase defaults)
- **AuthContext:** Cached user session (no re-fetch per page)

### 9.5 Bundle optimizations

- **System fonts:** Zero load time (-apple-system, BlinkMacSystemFont, ...)
- **Icons:** Lucide (tree-shakeable, import only used)
- **Animations:** CSS transitions only (no heavy JS animations)
- **No external tracking:** Brak Sentry, Google Analytics w MVP

### 9.6 Rendering strategy

- **SSR (Astro):** All pages server-rendered
  - SEO benefits
  - Fast FCP
  - No flash of unstyled content
- **React islands:** Minimal hydration
  - Tylko interactive components
  - No full page React app
  - Reduced JS bundle

### 9.7 Pominięte optimizations w MVP

- **Service workers / PWA:** Brak offline capabilities
- **Image CDN optimizations:** Supabase Storage wystarczające
- **Database indexing custom:** Supabase defaults + RLS
- **Advanced caching:** Redis, CDN rules (overkill dla MVP)

---

## 10. Data Flow i State Management

### 10.1 Server → Client (SSR)

**Publiczna galeria:**

```
Strona główna (/):
  GET /api/public/categories
  → Pass to CategoryGrid as props
  → SSR render

Galeria kategorii (/kategoria/[slug]):
  GET /api/public/categories/:slug
  GET /api/public/categories/:slug/photos?page=1&limit=20
  → Pass initialPhotos + categoryData to PhotoMasonry
  → SSR render first 20

O mnie (/o-mnie):
  GET /api/public/profile
  → SSR render bio, email, phone
```

**Panel administracyjny:**

```
AdminLayout:
  GET /api/profile
  → display_name do user menu
  → SSR render

Kategorie (/admin/categories):
  GET /api/categories
  → Pass to CategoriesGrid
  → SSR render

Zdjęcia (/admin/photos):
  GET /api/photos?page=1&limit=20
  → Pass initialPhotos to PhotosGrid
  → SSR render

Profil (/admin/profile):
  GET /api/profile
  GET /api/settings
  GET /api/stats
  → Pass to forms i StatsCard
  → SSR render
```

### 10.2 Client state (React Context)

**AuthContext:**

```typescript
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}
```

**Usage:**
- AdminLayout (check auth, display user)
- Middleware (redirect jeśli brak session)
- Protected pages (conditional rendering)

**Data source:** Supabase Auth onAuthStateChange

---

**StatsContext:**

```typescript
interface StatsContextValue {
  photosCount: number;
  photosLimit: number; // 200
  categoriesCount: number;
  categoriesLimit: number; // 10
  refreshStats: () => Promise<void>;
  isLoading: boolean;
}
```

**Usage:**
- AdminLayout topbar (optional badge)
- /admin/photos toolbar (Badge "X/200")
- /admin/categories header (Badge "X/10")
- /admin/profile (Progress bars)
- PhotoUploadZone (validation przed upload)

**Data source:** GET /api/stats

**Refresh strategy:**
- Manual call po mutacjach:
  - Upload zdjęć → refreshStats()
  - Delete zdjęcia → refreshStats()
  - Create kategoria → refreshStats()
  - Delete kategoria → refreshStats()
- NIE auto-refresh co X sekund (uproszczenie MVP)

### 10.3 Component state (useState, useReducer)

**PhotoUploadZone:**

```typescript
const [files, setFiles] = useState<UploadFile[]>([]);
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [publishImmediately, setPublishImmediately] = useState(false);
```

**PhotoMasonry (infinite scroll):**

```typescript
const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**PhotoLightbox:**

```typescript
const [currentIndex, setCurrentIndex] = useState(initialIndex);
const [isPreloading, setIsPreloading] = useState(false);
```

### 10.4 Form state (react-hook-form)

**Wszystkie formularze używają react-hook-form + Zod:**
- LoginForm
- CategoryDialog (create/edit)
- PhotoEditDialog
- ProfileForm
- SeoSettingsForm

**Example (CategoryDialog):**

```typescript
const form = useForm<CategoryFormData>({
  resolver: zodResolver(categorySchema),
  defaultValues: category || { name: '', description: '' }
});

const onSubmit = async (data: CategoryFormData) => {
  // API call
  // Toast notification
  // onSuccess callback
};
```

### 10.5 Mutations flow

**Pattern dla wszystkich mutations:**

```
User action (button click, form submit)
  ↓
[Optional] Optimistic update (instant UI)
  ↓
API call (POST, PUT, PATCH, DELETE)
  ↓
Success:
  - Update local state (jeśli nie optimistic)
  - Toast success (3s)
  - Callback (onSuccess, refresh list, close Dialog)
  - [If applicable] StatsContext.refreshStats()
  ↓
Error:
  - [If optimistic] Rollback state
  - Toast error (5s)
  - console.error
```

**Example - Toggle publikacji (optimistic):**

```typescript
const togglePublish = async (photoId: string, currentStatus: boolean) => {
  // 1. Optimistic update
  setPhotos(photos.map(p =>
    p.id === photoId ? {...p, is_published: !currentStatus} : p
  ));

  // 2. API call
  try {
    await fetch(`/api/photos/${photoId}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ is_published: !currentStatus })
    });
    toast.success('Status publikacji zaktualizowany');
  } catch (error) {
    // 3. Revert
    setPhotos(photos.map(p =>
      p.id === photoId ? {...p, is_published: currentStatus} : p
    ));
    toast.error('Nie udało się zaktualizować');
  }
};
```

---

## 11. Mapowanie User Stories do UI

| US # | User Story | Główny widok | Kluczowe komponenty | Status |
|------|-----------|--------------|---------------------|--------|
| US-001 | Logowanie | `/admin/login` | LoginForm, AuthContext | ✓ |
| US-002 | Wylogowanie | AdminLayout user menu | DropdownMenu, AuthContext.signOut() | ✓ |
| US-003 | Ochrona panelu | Middleware | AuthContext, redirect logic | ✓ |
| US-004 | Tworzenie kategorii | `/admin/categories` | CategoryDialog (create mode) | ✓ |
| US-005 | Edycja kategorii | `/admin/categories` | CategoryDialog (edit mode) | ✓ |
| US-006 | Wybór okładki | CategoryDialog | CoverPhotoSelector (Popover) | ✓ |
| US-007 | Usuwanie kategorii | `/admin/categories` | AlertDialog (delete confirmation) | ✓ |
| US-008 | Upload pojedynczego | `/admin/photos` | PhotoUploadZone (single file) | ✓ |
| US-009 | Batch upload | `/admin/photos` | PhotoUploadZone (multiple files) | ✓ |
| US-010 | Walidacja pliku | PhotoUploadZone | Validation logic + toasts | ✓ |
| US-011 | Edycja zdjęcia | `/admin/photos` | PhotoEditDialog | ✓ |
| US-012 | Toggle publikacji | `/admin/photos` | Switch (optimistic update) | ✓ |
| US-013 | Usuwanie zdjęcia | `/admin/photos` | AlertDialog (delete confirmation) | ✓ |
| US-014 | Edycja profilu | `/admin/profile` | ProfileForm, SeoSettingsForm | ✓ |
| US-015 | Przeglądanie kategorii | `/` (główna) | CategoryGrid, CategoryCard | ✓ |
| US-016 | Galeria w kategorii | `/kategoria/[slug]` | PhotoMasonry (infinite scroll) | ✓ |
| US-017 | Podgląd lightbox | PhotoLightbox | Dialog z image, controls | ✓ |
| US-018 | Nawigacja lightbox | PhotoLightbox | Arrow buttons, keyboard, swipe | ✓ |
| US-019 | Blokada pobierania | PhotoLightbox, images | onContextMenu/onDragStart preventDefault | ✓ |
| US-020 | O mnie (odwiedzający) | `/o-mnie` | Centered card, contact icons | ✓ |
| US-021 | Nawigacja | PublicLayout | Navigation component, hamburger | ✓ |
| US-022 | Strona 404 | `404.astro` | Minimalistyczny layout + button | ✓ |
| US-023 | SEO i udostępnianie | SEO component | Meta tags, Open Graph | ✓ |
| US-024 | Responsywność mobile | Wszystkie widoki | Responsive grids, Sheet, swipe | ✓ |
| US-025 | Filtrowanie admin | `/admin/photos` | Select dropdown (kategorie) | ✓ |
| US-026 | Limity info | `/admin/photos`, `/admin/profile` | Badge, Progress bars, StatsContext | ✓ |
| US-027 | Błędy sieciowe upload | PhotoUploadZone | Per-file error state + retry | ✓ |

**Wszystkie 27 User Stories pokryte przez architekturę UI.** ✓

---

## 12. Podsumowanie i Next Steps

### 12.1 Kluczowe zalety architektury

1. **Separation of concerns:** Publiczna galeria vs Panel admin (dwa layouty)
2. **Hybrydowe renderowanie:** SSR dla SEO + CSR dla interaktywności
3. **Responsywność:** Mobile-first design, tested na 3 breakpoints
4. **Accessibility:** ARIA attributes, keyboard navigation, semantic HTML
5. **Performance:** Lazy loading, compression, code splitting
6. **User feedback:** Toast notifications, optimistic updates, loading states
7. **Security:** Auth guards, input validation, download protection
8. **Simplicity:** Brak over-engineering, focus na MVP scope

### 12.2 Trade-offs w MVP

**Pominięte features (post-MVP):**
- Dashboard z overview (redirect do /admin/photos wystarczy)
- Dark mode (tylko light mode)
- Drag & drop reordering kategorii (static order wystarczy)
- Filtr po statusie publikacji (tylko kategoria filter)
- PWA / offline capabilities
- External error logging (Sentry)
- Advanced accessibility (screen reader announcements dla wszystkich akcji)

**Uzasadnienie:**
- Szybsze delivery MVP
- Mniejszy tech debt
- Validation core functionality
- Feedback od fotografa przed feature expansion

### 12.3 Następne kroki implementacji

**Faza 1: Setup i infrastruktura**
1. Astro project setup (config, dependencies)
2. Supabase integration (Auth, Storage, Database)
3. Tailwind CSS 4 + Shadcn/ui installation
4. Podstawowe layouty (PublicLayout, AdminLayout)
5. Middleware dla auth guards

**Faza 2: Publiczna galeria**
1. Strona główna (CategoryGrid, SSR)
2. Galeria kategorii (PhotoMasonry, infinite scroll, SSR+CSR)
3. PhotoLightbox (fullscreen viewer)
4. Strona O mnie
5. Strona 404
6. SEO component (meta tags)

**Faza 3: Panel administracyjny - Auth**
1. Login page + LoginForm
2. AuthContext (Supabase Auth integration)
3. Wylogowanie (user menu)

**Faza 4: Panel administracyjny - Kategorie**
1. Lista kategorii (CategoriesGrid)
2. CategoryDialog (create/edit)
3. CoverPhotoSelector (Popover)
4. Delete confirmation (AlertDialog)

**Faza 5: Panel administracyjny - Zdjęcia**
1. Lista zdjęć (PhotosGrid, filter)
2. PhotoUploadZone (drag & drop, progress, compression)
3. PhotoEditDialog
4. Switch publikacji (optimistic update)
5. Delete confirmation

**Faza 6: Panel administracyjny - Profil**
1. ProfileForm (dane profilowe)
2. SeoSettingsForm
3. StatsCard (progress bars)
4. StatsContext

**Faza 7: Polish & Testing**
1. Toast notifications (Sonner setup)
2. Loading states (Skeleton components)
3. Error handling (wszystkie edge cases)
4. Responsywność testing (mobile, tablet, desktop)
5. Accessibility audit (keyboard navigation, ARIA)
6. Performance audit (Lighthouse)
7. Security review (auth, validation, download protection)

**Faza 8: Deployment**
1. Docker setup
2. Environment variables
3. DigitalOcean deployment
4. Domain setup (optional)
5. Supabase production config

### 12.4 Metryki sukcesu (z PRD)

**Do weryfikacji po implementacji:**

1. **Samodzielność fotografa:** 100% operacji bez wsparcia technicznego
2. **Czas ładowania:** Strona główna < 3s, Galeria < 2s (pierwsze zdjęcia)
3. **Upload:** < 10s dla pliku 10MB
4. **Lightbox:** < 500ms otwarcie
5. **Błędy krytyczne:** 0 w pierwszym miesiącu
6. **Kompatybilność:** 100% funkcji w Chrome, Firefox, Safari, Edge (ostatnie 2 wersje)
7. **Responsywność:** 100% funkcji działa na mobile
8. **Adopcja:** Portfolio używane jako główna wizytówka fotografa

---

**Dokument zakończony.**
**Architektura UI gotowa do implementacji.**
