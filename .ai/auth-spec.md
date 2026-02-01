# Specyfikacja Modułu Autentykacji - My Photo Portfolio

## Spis treści

1. [Wprowadzenie](#1-wprowadzenie)
2. [Architektura interfejsu użytkownika](#2-architektura-interfejsu-użytkownika)
3. [Logika backendowa](#3-logika-backendowa)
4. [System autentykacji](#4-system-autentykacji)
5. [Scenariusze użycia](#5-scenariusze-użycia)
6. [Walidacja i komunikaty błędów](#6-walidacja-i-komunikaty-błędów)

---

## 1. Wprowadzenie

### 1.1 Zakres dokumentu

Niniejsza specyfikacja opisuje architekturę modułu autentykacji dla aplikacji My Photo Portfolio, obejmującą funkcjonalności zdefiniowane w wymaganiach:

- **US-001**: Logowanie do panelu administracyjnego
- **US-002**: Wylogowanie z panelu
- **US-003**: Ochrona panelu przed nieautoryzowanym dostępem
- **US-028**: Odzyskiwanie hasła
- **US-029**: Obsługa wygaśnięcia sesji

### 1.2 Stan obecny

Aplikacja posiada już podstawową infrastrukturę autentykacji:

| Element | Stan | Lokalizacja |
|---------|------|-------------|
| Strona logowania | Istnieje (wymaga rozszerzenia) | `src/pages/admin/login.astro` |
| Formularz logowania | Istnieje (wymaga rozszerzenia) | `src/components/admin/auth/DirectLoginForm.tsx` |
| Middleware ochrony tras | Istnieje (wymaga rozszerzenia) | `src/middleware/index.ts` |
| Kontekst autentykacji | Istnieje | `src/components/admin/context/AuthContext.tsx` |
| Menu użytkownika z wylogowaniem | Istnieje | `src/components/admin/shared/UserMenu.tsx` |
| Schemat walidacji logowania | Istnieje (wymaga rozszerzenia) | `src/lib/schemas/login.schema.ts` |

### 1.3 Elementy do implementacji

| Element | Typ | Priorytet |
|---------|-----|-----------|
| Strona resetowania hasła | Nowy | Wysoki |
| Strona ustawienia nowego hasła | Nowy | Wysoki |
| Formularz resetowania hasła | Nowy | Wysoki |
| Formularz ustawienia hasła | Nowy | Wysoki |
| Rate limiting logowania | Rozszerzenie | Wysoki |
| Link "Nie pamiętam hasła" | Rozszerzenie | Wysoki |
| Obsługa returnTo URL | Rozszerzenie | Średni |
| Powiadomienie o wygaśnięciu sesji | Nowy | Średni |
| Ochrona przed utratą niezapisanych zmian (US-029) | Nowy | Średni |
| Serwis autentykacji | Nowy | Wysoki |

---

## 2. Architektura interfejsu użytkownika

### 2.1 Struktura stron (Pages)

#### 2.1.1 Strona logowania (rozszerzenie)

**Lokalizacja:** `src/pages/admin/login.astro`

**Zmiany:**
- Dodanie linku "Nie pamiętam hasła" pod formularzem
- Przekazanie parametru `returnTo` z query string do komponentu formularza
- Dodanie obsługi komunikatu o wygaśnięciu sesji (query param `?expired=true`)

**Parametry URL:**
- `?returnTo=/admin/categories` - URL do przekierowania po udanym logowaniu
- `?expired=true` - flaga informująca o wygaśnięciu sesji

**Struktura:**
```
/admin/login
├── Layout (minimalistyczny, bez nawigacji admin)
├── Tytuł i opis strony
├── Komunikat o wygaśnięciu sesji (warunkowo)
├── DirectLoginForm (rozszerzony)
└── Link "Nie pamiętam hasła" → /admin/reset-password
```

#### 2.1.2 Strona resetowania hasła (nowa)

**Lokalizacja:** `src/pages/admin/reset-password.astro`

**Odpowiedzialność:**
- Wyświetlenie formularza do wprowadzenia adresu email
- Obsługa stanu sukcesu (komunikat o wysłaniu emaila)
- Przekierowanie zalogowanych użytkowników do panelu

**Struktura:**
```
/admin/reset-password
├── Layout (minimalistyczny)
├── Tytuł: "Resetowanie hasła"
├── ForgotPasswordForm (komponent React)
└── Link "Wróć do logowania" → /admin/login
```

**Parametry URL:**
- Brak parametrów wejściowych
- Nie wymaga autentykacji

#### 2.1.3 Strona ustawienia nowego hasła (nowa)

**Lokalizacja:** `src/pages/admin/set-password.astro`

**Odpowiedzialność:**
- Walidacja obecności tokena w URL
- Wyświetlenie formularza do ustawienia nowego hasła
- Obsługa błędów (nieprawidłowy/wygasły token)
- Przekierowanie do logowania po sukcesie

**Struktura:**
```
/admin/set-password
├── Layout (minimalistyczny)
├── Tytuł: "Ustaw nowe hasło"
├── Walidacja tokena (server-side)
│   ├── Brak tokena → Błąd + link do reset-password
│   └── Token obecny → SetPasswordForm
└── Link "Wróć do logowania" → /admin/login
```

**Parametry URL:**
- Token dostarczany przez Supabase w hash fragmentu URL
- Supabase Auth automatycznie przetwarza token z emaila

### 2.2 Komponenty React

#### 2.2.1 DirectLoginForm (rozszerzenie)

**Lokalizacja:** `src/components/admin/auth/DirectLoginForm.tsx`

**Nowe właściwości (props):**
```typescript
interface DirectLoginFormProps {
  returnTo?: string;        // URL do przekierowania po logowaniu
  showExpiredMessage?: boolean; // Flaga wyświetlenia komunikatu o wygaśnięciu
}
```

**Nowe elementy:**
- Rate limiting: licznik nieudanych prób w `sessionStorage`
- Ostrzeżenie po 5 nieudanych próbach
- Przekierowanie do `returnTo` zamiast stałego `/admin/photos`
- Komunikat o wygaśnięciu sesji (warunkowo wyświetlany)

**Stan wewnętrzny:**
```typescript
interface FormState {
  error: string | null;
  isLoading: boolean;
  failedAttempts: number;    // Nowe: licznik nieudanych prób
  isBlocked: boolean;        // Nowe: flaga blokady po 5 próbach
  blockTimeRemaining: number; // Nowe: czas do odblokowania (sekundy)
}
```

**Wymagania UX (zgodnie z US-001):**
- Przycisk "Zaloguj" jest nieaktywny (`disabled`) gdy pola email lub hasło są puste
- Formularz obsługuje wysyłanie przez klawisz Enter
- Pole hasła używa `type="password"` (maskowanie gwiazdkami)
- Po udanym logowaniu przekierowanie do `returnTo` lub domyślnie `/admin/photos`

**Logika rate limiting:**
- Przechowywanie licznika prób w `sessionStorage` z kluczem `auth_failed_attempts`
- Przechowywanie czasu ostatniej próby w `sessionStorage` z kluczem `auth_last_attempt`
- Po 5 nieudanych próbach: blokada na 5 minut
- Wyświetlenie komunikatu z odliczaniem czasu do odblokowania
- Reset licznika po udanym logowaniu

#### 2.2.2 ForgotPasswordForm (nowy)

**Lokalizacja:** `src/components/admin/auth/ForgotPasswordForm.tsx`

**Odpowiedzialność:**
- Formularz z polem email
- Wywołanie Supabase Auth `resetPasswordForEmail()`
- Obsługa stanu sukcesu i błędu

**Właściwości:**
```typescript
interface ForgotPasswordFormProps {
  // Brak właściwości - komponent samodzielny
}
```

**Stan wewnętrzny:**
```typescript
interface FormState {
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;  // Przełączenie na widok sukcesu
  email: string;       // Zachowany email do wyświetlenia w komunikacie
}
```

**Walidacja:**
- Email: wymagany, poprawny format

**Widoki:**
1. **Formularz** - pole email + przycisk "Wyślij link resetujący"
2. **Sukces** - komunikat "Sprawdź swoją skrzynkę email" + adres email + link powrotu

#### 2.2.3 SetPasswordForm (nowy)

**Lokalizacja:** `src/components/admin/auth/SetPasswordForm.tsx`

**Odpowiedzialność:**
- Formularz z polami: nowe hasło, potwierdzenie hasła
- Wywołanie Supabase Auth `updateUser({ password })`
- Przekierowanie do logowania po sukcesie

**Właściwości:**
```typescript
interface SetPasswordFormProps {
  // Brak właściwości - komponent samodzielny
  // Token obsługiwany automatycznie przez Supabase
}
```

**Stan wewnętrzny:**
```typescript
interface FormState {
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
}
```

**Walidacja:**
- Hasło: minimum 8 znaków
- Potwierdzenie: musi być identyczne z hasłem

**Przepływ:**
1. Supabase Auth automatycznie przetwarza token z URL hash
2. Po załadowaniu strony sesja jest aktywna (tymczasowo)
3. Użytkownik wprowadza nowe hasło
4. Wywołanie `updateUser({ password })`
5. Wylogowanie i przekierowanie do `/admin/login?password_reset=true`

#### 2.2.4 SessionExpiredBanner (nowy)

**Lokalizacja:** `src/components/admin/auth/SessionExpiredBanner.tsx`

**Odpowiedzialność:**
- Komponent alertu wyświetlany na stronie logowania
- Informacja o wygaśnięciu sesji

**Właściwości:**
```typescript
interface SessionExpiredBannerProps {
  show: boolean;
}
```

**Wygląd:**
- Alert typu "warning"
- Ikona zegara
- Tekst: "Twoja sesja wygasła. Zaloguj się ponownie, aby kontynuować."

#### 2.2.5 UnsavedChangesGuard (nowy)

**Lokalizacja:** `src/components/admin/auth/UnsavedChangesGuard.tsx`

**Odpowiedzialność (zgodnie z US-029):**
- Wykrywanie niezapisanych zmian w formularzach panelu admina
- Wyświetlanie ostrzeżenia przed przekierowaniem przy wygaśnięciu sesji
- Ochrona przed utratą danych użytkownika

**Właściwości:**
```typescript
interface UnsavedChangesGuardProps {
  hasUnsavedChanges: boolean;
  children: React.ReactNode;
}
```

**Mechanizm działania:**
1. Komponent nasłuchuje na zdarzenie `beforeunload` przeglądarki
2. Przy wykryciu wygaśnięcia sesji (przez AuthContext) sprawdza flagę `hasUnsavedChanges`
3. Jeśli są niezapisane zmiany, wyświetla modal ostrzegawczy przed przekierowaniem
4. Użytkownik może wybrać: "Zapisz i wyloguj" lub "Porzuć zmiany"

**Stan wewnętrzny:**
```typescript
interface GuardState {
  showWarningModal: boolean;
  pendingRedirect: string | null;
}
```

**Integracja:**
- Używany jako wrapper w formularzach edycji (zdjęcia, kategorie, profil)
- Formularze przekazują `hasUnsavedChanges` na podstawie dirty state (react-hook-form lub własna logika)

### 2.3 Domyślna strona panelu administracyjnego

Po pomyślnym logowaniu użytkownik jest przekierowany do `/admin/photos` (zarządzanie zdjęciami), ponieważ jest to główna funkcjonalność panelu administracyjnego. Ścieżka `/admin` sama w sobie nie jest stroną - stanowi jedynie prefiks dla chronionych tras.

**Uzasadnienie:**
- Zarządzanie zdjęciami (FR-009, FR-010) to najczęściej używana funkcja
- Upraszcza nawigację - użytkownik od razu widzi listę zdjęć
- Spójne z istniejącą implementacją w UserMenu

### 2.4 Rozszerzenia istniejących komponentów

#### 2.4.1 UserMenu

**Lokalizacja:** `src/components/admin/shared/UserMenu.tsx`

**Zmiany:** Brak zmian wymaganych - funkcjonalność wylogowania już istnieje

#### 2.4.2 Middleware

**Lokalizacja:** `src/middleware/index.ts`

**Nowe funkcjonalności:**

1. **Obsługa returnTo:**
   - Zapisanie aktualnej ścieżki do query param przy przekierowaniu do logowania
   - Format: `/admin/login?returnTo=/admin/categories`

2. **Wykrywanie wygaśnięcia sesji:**
   - Sprawdzenie czy sesja istnieje ale jest wygasła
   - Dodanie flagi `?expired=true` do przekierowania

3. **Obsługa stron resetowania hasła:**
   - `/admin/reset-password` - dostępna bez autentykacji
   - `/admin/set-password` - dostępna bez autentykacji (token w URL)

**Pseudokod logiki:**
```
1. Utworzenie klienta Supabase SSR
2. Pobranie użytkownika z tokena lub sesji
3. Jeśli trasa to /admin/* (oprócz wyjątków):
   a. Jeśli brak użytkownika:
      - Zapisz returnTo = aktualna ścieżka
      - Przekieruj do /admin/login?returnTo=...
   b. Jeśli sesja wygasła (błąd z Supabase):
      - Przekieruj do /admin/login?expired=true&returnTo=...
4. Jeśli trasa to /admin/login i użytkownik zalogowany:
   - Przekieruj do /admin/photos
5. Kontynuuj request
```

**Trasy wyłączone z ochrony:**
- `/admin/login`
- `/admin/reset-password`
- `/admin/set-password`

### 2.5 Schematy walidacji (Zod)

#### 2.5.1 Rozszerzenie login.schema.ts

**Lokalizacja:** `src/lib/schemas/login.schema.ts`

**Zmiany:**
- Dodanie walidacji minimalnej długości hasła (8 znaków) dla lepszego UX

```typescript
// Schemat logowania (rozszerzony)
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email"),
  password: z
    .string()
    .min(1, "Hasło jest wymagane"),
});
```

#### 2.5.2 Nowy reset-password.schema.ts

**Lokalizacja:** `src/lib/schemas/reset-password.schema.ts`

```typescript
// Schemat resetowania hasła
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format email"),
});

// Schemat ustawienia nowego hasła
export const setPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków"),
  confirmPassword: z
    .string()
    .min(1, "Potwierdzenie hasła jest wymagane"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła muszą być identyczne",
  path: ["confirmPassword"],
});
```

### 2.6 Layouty

Moduł autentykacji wykorzystuje minimalistyczny layout bez nawigacji administracyjnej. Strony logowania, resetowania hasła i ustawienia hasła używają prostego layoutu z wycentrowaną zawartością.

**Wspólne elementy layoutu auth:**
- Tło: `bg-background`
- Wycentrowany kontener: `max-w-md`
- Karta z formularzem: `rounded-lg border bg-card p-6 shadow-sm`
- Brak nawigacji (header/footer)

---

## 3. Logika backendowa

### 3.1 Struktura endpointów API

Moduł autentykacji **nie wymaga** nowych endpointów API po stronie serwera Astro, ponieważ cała logika autentykacji jest obsługiwana bezpośrednio przez Supabase Auth SDK po stronie klienta.

**Uzasadnienie:**
- Supabase Auth SDK zapewnia pełną funkcjonalność autentykacji
- Komunikacja odbywa się bezpośrednio między przeglądarką a Supabase
- Middleware Astro waliduje sesję przy każdym request server-side
- Brak potrzeby proxy przez własne API

### 3.2 Middleware - rozszerzenia

**Lokalizacja:** `src/middleware/index.ts`

#### 3.2.1 Nowa logika ochrony tras

```typescript
// Trasy publiczne w sekcji admin
const PUBLIC_ADMIN_ROUTES = [
  '/admin/login',
  '/admin/reset-password',
  '/admin/set-password',
];

// Sprawdzenie czy trasa jest publiczna
const isPublicAdminRoute = PUBLIC_ADMIN_ROUTES.some(
  route => url.pathname === route || url.pathname.startsWith(route + '?')
);
```

#### 3.2.2 Obsługa returnTo

```typescript
// Przy przekierowaniu do logowania
if (isAdminRoute && !isPublicAdminRoute && !user) {
  const returnTo = encodeURIComponent(url.pathname + url.search);
  return context.redirect(`/admin/login?returnTo=${returnTo}`);
}
```

#### 3.2.3 Wykrywanie wygasłej sesji

```typescript
// Sprawdzenie błędu sesji
const { data: { user }, error } = await supabase.auth.getUser();

if (error?.message?.includes('expired') || error?.message?.includes('invalid')) {
  const returnTo = encodeURIComponent(url.pathname);
  return context.redirect(`/admin/login?expired=true&returnTo=${returnTo}`);
}
```

### 3.3 Serwis autentykacji

**Lokalizacja:** `src/lib/services/auth.service.ts`

Serwis pełni rolę abstrakcji nad Supabase Auth, centralizując logikę autentykacji i umożliwiając łatwe testowanie.

#### 3.3.1 Interfejs serwisu

```typescript
interface AuthService {
  // Logowanie
  signIn(email: string, password: string): Promise<AuthResult>;

  // Wylogowanie
  signOut(): Promise<void>;

  // Resetowanie hasła
  sendPasswordResetEmail(email: string): Promise<AuthResult>;

  // Ustawienie nowego hasła
  updatePassword(newPassword: string): Promise<AuthResult>;

  // Pobranie aktualnego użytkownika
  getCurrentUser(): Promise<User | null>;

  // Sprawdzenie czy sesja jest aktywna
  isSessionValid(): Promise<boolean>;
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}
```

#### 3.3.2 Implementacja (client-side)

```typescript
class ClientAuthService implements AuthService {
  private supabase = supabaseClient;

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: this.mapErrorMessage(error.message)
      };
    }

    return { success: true, user: data.user };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async sendPasswordResetEmail(email: string): Promise<AuthResult> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/set-password`,
    });

    if (error) {
      return {
        success: false,
        error: this.mapErrorMessage(error.message)
      };
    }

    return { success: true };
  }

  async updatePassword(newPassword: string): Promise<AuthResult> {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: this.mapErrorMessage(error.message)
      };
    }

    return { success: true };
  }

  private mapErrorMessage(message: string): string {
    // Mapowanie komunikatów Supabase na przyjazne użytkownikowi
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Nieprawidłowy email lub hasło',
      'Email not confirmed': 'Konto nie zostało potwierdzone',
      'User not found': 'Nieprawidłowy email lub hasło', // Nie ujawniamy czy email istnieje
      // ... inne mapowania
    };

    return errorMap[message] || 'Wystąpił nieoczekiwany błąd';
  }
}
```

### 3.4 Rate Limiting (client-side)

**Lokalizacja:** `src/lib/utils/rate-limit.ts`

```typescript
interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil: number | null;
}

const STORAGE_KEY = 'auth_rate_limit';
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minut

export function getRateLimitState(): RateLimitState {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { attempts: 0, lastAttempt: 0, blockedUntil: null };
  }
  return JSON.parse(stored);
}

export function recordFailedAttempt(): RateLimitState {
  const state = getRateLimitState();
  const now = Date.now();

  // Reset jeśli minęło więcej niż 15 minut od ostatniej próby
  if (now - state.lastAttempt > 15 * 60 * 1000) {
    state.attempts = 0;
    state.blockedUntil = null;
  }

  state.attempts += 1;
  state.lastAttempt = now;

  if (state.attempts >= MAX_ATTEMPTS) {
    state.blockedUntil = now + BLOCK_DURATION_MS;
  }

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function resetRateLimit(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isBlocked(): boolean {
  const state = getRateLimitState();
  if (!state.blockedUntil) return false;

  if (Date.now() > state.blockedUntil) {
    resetRateLimit();
    return false;
  }

  return true;
}

export function getBlockTimeRemaining(): number {
  const state = getRateLimitState();
  if (!state.blockedUntil) return 0;

  const remaining = state.blockedUntil - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}
```

### 3.5 Konfiguracja Supabase Auth

#### 3.5.1 Ustawienia w Supabase Dashboard

| Parametr | Wartość | Opis |
|----------|---------|------|
| Site URL | `https://yourdomain.com` | Bazowy URL aplikacji |
| Redirect URLs | `https://yourdomain.com/admin/set-password` | Dozwolone URL przekierowań |
| JWT Expiry | `86400` (24h) | Czas wygaśnięcia sesji |
| Password min length | `8` | Minimalna długość hasła |
| Enable email confirmations | `false` | Wyłączone dla MVP (jeden użytkownik) |

#### 3.5.2 Email Templates

**Reset Password Email:**
```html
<h2>Resetowanie hasła</h2>
<p>Kliknij poniższy link, aby ustawić nowe hasło:</p>
<p><a href="{{ .ConfirmationURL }}">Ustaw nowe hasło</a></p>
<p>Link jest ważny przez 24 godziny.</p>
<p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
```

---

## 4. System autentykacji

### 4.1 Przepływ autentykacji

#### 4.1.1 Logowanie

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGOWANIE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Użytkownik wchodzi na /admin/*                              │
│                     │                                            │
│                     ▼                                            │
│  2. Middleware sprawdza sesję                                   │
│                     │                                            │
│         ┌──────────┴──────────┐                                 │
│         │                     │                                  │
│    Brak sesji            Jest sesja                             │
│         │                     │                                  │
│         ▼                     ▼                                  │
│  3. Redirect do         Kontynuuj do                            │
│     /admin/login        żądanej strony                          │
│         │                                                        │
│         ▼                                                        │
│  4. Wyświetl formularz logowania                                │
│         │                                                        │
│         ▼                                                        │
│  5. Użytkownik wprowadza dane                                   │
│         │                                                        │
│         ▼                                                        │
│  6. Client-side: walidacja formularza                           │
│         │                                                        │
│         ▼                                                        │
│  7. Sprawdź rate limiting                                       │
│         │                                                        │
│    ┌────┴────┐                                                  │
│    │         │                                                   │
│  Zablok.   OK                                                   │
│    │         │                                                   │
│    ▼         ▼                                                   │
│  Pokaż    8. Supabase signInWithPassword()                      │
│  timer       │                                                   │
│              │                                                   │
│         ┌────┴────┐                                             │
│         │         │                                              │
│       Błąd      Sukces                                          │
│         │         │                                              │
│         ▼         ▼                                              │
│  9. Zapisz    10. Reset rate limit                              │
│     próbę,        Redirect do returnTo                          │
│     pokaż         lub /admin/photos                             │
│     błąd                                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.1.2 Wylogowanie

```
┌─────────────────────────────────────────────────────────────────┐
│                        WYLOGOWANIE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Użytkownik klika "Wyloguj" w UserMenu                       │
│                     │                                            │
│                     ▼                                            │
│  2. Supabase auth.signOut()                                     │
│                     │                                            │
│                     ▼                                            │
│  3. Usunięcie cookies sesji                                     │
│                     │                                            │
│                     ▼                                            │
│  4. Redirect do /admin/login                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.1.3 Resetowanie hasła

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESETOWANIE HASŁA                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CZĘŚĆ 1: Żądanie resetu                                        │
│  ────────────────────────                                        │
│                                                                  │
│  1. Użytkownik klika "Nie pamiętam hasła"                       │
│                     │                                            │
│                     ▼                                            │
│  2. Redirect do /admin/reset-password                           │
│                     │                                            │
│                     ▼                                            │
│  3. Użytkownik wprowadza email                                  │
│                     │                                            │
│                     ▼                                            │
│  4. Supabase resetPasswordForEmail()                            │
│                     │                                            │
│                     ▼                                            │
│  5. Wyświetl komunikat sukcesu                                  │
│     (niezależnie czy email istnieje - bezpieczeństwo)           │
│                                                                  │
│  CZĘŚĆ 2: Ustawienie nowego hasła                               │
│  ─────────────────────────────────                               │
│                                                                  │
│  6. Użytkownik klika link w emailu                              │
│                     │                                            │
│                     ▼                                            │
│  7. Redirect do /admin/set-password#access_token=...            │
│                     │                                            │
│                     ▼                                            │
│  8. Supabase automatycznie przetwarza token                     │
│                     │                                            │
│                     ▼                                            │
│  9. Wyświetl formularz nowego hasła                             │
│                     │                                            │
│                     ▼                                            │
│  10. Użytkownik wprowadza i potwierdza hasło                    │
│                     │                                            │
│                     ▼                                            │
│  11. Supabase updateUser({ password })                          │
│                     │                                            │
│                     ▼                                            │
│  12. Wylogowanie + redirect do /admin/login                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.1.4 Wygaśnięcie sesji

```
┌─────────────────────────────────────────────────────────────────┐
│                   WYGAŚNIĘCIE SESJI                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Użytkownik wykonuje akcję w panelu                          │
│                     │                                            │
│                     ▼                                            │
│  2. Request do serwera                                          │
│                     │                                            │
│                     ▼                                            │
│  3. Middleware sprawdza sesję                                   │
│                     │                                            │
│                     ▼                                            │
│  4. Supabase zwraca błąd: sesja wygasła                         │
│                     │                                            │
│                     ▼                                            │
│  5. Redirect do /admin/login?expired=true&returnTo=...          │
│                     │                                            │
│                     ▼                                            │
│  6. Wyświetl komunikat o wygaśnięciu sesji                      │
│                     │                                            │
│                     ▼                                            │
│  7. Użytkownik loguje się ponownie                              │
│                     │                                            │
│                     ▼                                            │
│  8. Redirect do returnTo (poprzednia strona)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Zarządzanie sesją

#### 4.2.1 Przechowywanie sesji

Supabase Auth przechowuje sesję w:
- **Cookies** (httpOnly, secure) - dla server-side
- **localStorage** - dla client-side refresh

#### 4.2.2 Odświeżanie sesji

- Supabase SDK automatycznie odświeża access token przed wygaśnięciem
- Refresh token ważny przez 7 dni (domyślnie)
- Access token ważny przez 1 godzinę (domyślnie)

#### 4.2.3 Czas wygaśnięcia

Zgodnie z US-029: sesja wygasa po 24 godzinach nieaktywności.

Konfiguracja w Supabase:
- JWT Expiry: 86400 sekund (24h)
- Session timeout obsługiwany przez Supabase

### 4.3 Bezpieczeństwo

#### 4.3.1 Zabezpieczenia CSRF

- Supabase Auth używa tokenów w nagłówku Authorization
- Cookies mają flagę `SameSite=Lax`
- Brak podatności na CSRF dzięki architekturze token-based

#### 4.3.2 Zabezpieczenia XSS

- Wszystkie dane wejściowe sanityzowane przez React
- Hasła nie są logowane ani wyświetlane
- Tokeny przechowywane w httpOnly cookies (server-side)

#### 4.3.3 Rate Limiting

- 5 nieudanych prób logowania → blokada na 5 minut
- Implementacja client-side (sessionStorage)
- Dodatkowe rate limiting po stronie Supabase (domyślne)

#### 4.3.4 Bezpieczeństwo haseł

- Minimum 8 znaków (walidacja client i server)
- Hasła hashowane przez Supabase (bcrypt)
- Brak przechowywania haseł po stronie aplikacji

#### 4.3.5 Ochrona przed enumeracją użytkowników

- Identyczny komunikat błędu dla nieistniejącego emaila i błędnego hasła
- Reset hasła: zawsze komunikat sukcesu (bez informacji czy email istnieje)

---

## 5. Scenariusze użycia

### 5.1 Scenariusz: Pomyślne logowanie

**Aktor:** Fotograf (administrator)

**Warunki wstępne:**
- Użytkownik nie jest zalogowany
- Użytkownik posiada konto w systemie

**Kroki:**
1. Użytkownik wchodzi na `/admin/photos`
2. System przekierowuje do `/admin/login?returnTo=/admin/photos`
3. Użytkownik wprowadza email i hasło
4. Użytkownik klika "Zaloguj"
5. System waliduje dane
6. System tworzy sesję
7. System przekierowuje do `/admin/photos`

**Rezultat:** Użytkownik jest zalogowany i widzi panel zarządzania zdjęciami

### 5.2 Scenariusz: Nieudane logowanie

**Aktor:** Fotograf

**Warunki wstępne:**
- Użytkownik nie jest zalogowany

**Kroki:**
1. Użytkownik wchodzi na `/admin/login`
2. Użytkownik wprowadza nieprawidłowe dane
3. Użytkownik klika "Zaloguj"
4. System wyświetla komunikat: "Nieprawidłowy email lub hasło"
5. Formularz pozostaje widoczny z wypełnionym emailem

**Rezultat:** Użytkownik widzi komunikat błędu i może ponowić próbę

### 5.3 Scenariusz: Blokada po nieudanych próbach

**Aktor:** Fotograf

**Warunki wstępne:**
- Użytkownik wykonał 4 nieudane próby logowania

**Kroki:**
1. Użytkownik wprowadza nieprawidłowe dane (5. próba)
2. System wyświetla ostrzeżenie o blokadzie
3. Formularz jest zablokowany
4. System wyświetla odliczanie (np. "Spróbuj ponownie za 4:59")
5. Po upływie czasu formularz jest odblokowany

**Rezultat:** Użytkownik musi poczekać 5 minut przed kolejną próbą

### 5.4 Scenariusz: Resetowanie hasła

**Aktor:** Fotograf

**Warunki wstępne:**
- Użytkownik zapomniał hasła
- Użytkownik ma dostęp do skrzynki email

**Kroki:**
1. Użytkownik klika "Nie pamiętam hasła" na stronie logowania
2. System przekierowuje do `/admin/reset-password`
3. Użytkownik wprowadza email
4. Użytkownik klika "Wyślij link resetujący"
5. System wyświetla: "Sprawdź swoją skrzynkę email"
6. Użytkownik otwiera email i klika link
7. System przekierowuje do `/admin/set-password`
8. Użytkownik wprowadza nowe hasło i potwierdzenie
9. Użytkownik klika "Ustaw hasło"
10. System przekierowuje do `/admin/login`

**Rezultat:** Hasło zostało zmienione, użytkownik może się zalogować

### 5.5 Scenariusz: Wygaśnięcie sesji

**Aktor:** Fotograf

**Warunki wstępne:**
- Użytkownik był zalogowany
- Minęło 24 godziny od ostatniej aktywności

**Kroki:**
1. Użytkownik próbuje wykonać akcję (np. kliknięcie w link)
2. System wykrywa wygasłą sesję
3. System przekierowuje do `/admin/login?expired=true&returnTo=...`
4. System wyświetla banner: "Twoja sesja wygasła"
5. Użytkownik loguje się ponownie
6. System przekierowuje do poprzedniej strony

**Rezultat:** Użytkownik jest ponownie zalogowany i kontynuuje pracę

### 5.6 Scenariusz: Wylogowanie

**Aktor:** Fotograf

**Warunki wstępne:**
- Użytkownik jest zalogowany

**Kroki:**
1. Użytkownik klika awatar w nawigacji
2. System wyświetla menu użytkownika
3. Użytkownik klika "Wyloguj"
4. System kończy sesję
5. System przekierowuje do `/admin/login`

**Rezultat:** Użytkownik jest wylogowany

---

## 6. Walidacja i komunikaty błędów

### 6.1 Walidacja formularza logowania

| Pole | Reguła | Komunikat błędu |
|------|--------|-----------------|
| Email | Wymagane | "Email jest wymagany" |
| Email | Format email | "Nieprawidłowy format email" |
| Hasło | Wymagane | "Hasło jest wymagane" |

### 6.2 Walidacja formularza resetowania hasła

| Pole | Reguła | Komunikat błędu |
|------|--------|-----------------|
| Email | Wymagane | "Email jest wymagany" |
| Email | Format email | "Nieprawidłowy format email" |

### 6.3 Walidacja formularza ustawienia hasła

| Pole | Reguła | Komunikat błędu |
|------|--------|-----------------|
| Hasło | Wymagane | "Hasło jest wymagane" |
| Hasło | Min 8 znaków | "Hasło musi mieć minimum 8 znaków" |
| Potwierdzenie | Wymagane | "Potwierdzenie hasła jest wymagane" |
| Potwierdzenie | Zgodność | "Hasła muszą być identyczne" |

### 6.4 Komunikaty błędów API

| Błąd Supabase | Komunikat dla użytkownika |
|---------------|---------------------------|
| Invalid login credentials | "Nieprawidłowy email lub hasło" |
| Email not confirmed | "Konto nie zostało potwierdzone" |
| User not found | "Nieprawidłowy email lub hasło" |
| Too many requests | "Zbyt wiele prób. Spróbuj ponownie za chwilę" |
| Network error | "Błąd połączenia. Sprawdź internet" |
| Invalid token | "Link resetujący wygasł lub jest nieprawidłowy" |
| Weak password | "Hasło jest zbyt słabe" |

### 6.5 Komunikaty sukcesu

| Akcja | Komunikat |
|-------|-----------|
| Reset hasła wysłany | "Sprawdź swoją skrzynkę email. Wysłaliśmy link do resetowania hasła na adres {email}" |
| Hasło zmienione | "Hasło zostało zmienione. Możesz się teraz zalogować" |
| Wylogowanie | Brak komunikatu (przekierowanie) |

### 6.6 Komunikaty ostrzegawcze

| Sytuacja | Komunikat |
|----------|-----------|
| Sesja wygasła | "Twoja sesja wygasła. Zaloguj się ponownie, aby kontynuować" |
| Blokada logowania | "Zbyt wiele nieudanych prób. Spróbuj ponownie za {czas}" |
| Link wygasł | "Link do resetowania hasła wygasł. Wygeneruj nowy link" |
| Niezapisane zmiany (US-029) | "Masz niezapisane zmiany. Czy chcesz je zapisać przed wylogowaniem?" |

---

## Podsumowanie

### Pliki do utworzenia

| Plik | Typ |
|------|-----|
| `src/pages/admin/reset-password.astro` | Strona Astro |
| `src/pages/admin/set-password.astro` | Strona Astro |
| `src/components/admin/auth/ForgotPasswordForm.tsx` | Komponent React |
| `src/components/admin/auth/SetPasswordForm.tsx` | Komponent React |
| `src/components/admin/auth/SessionExpiredBanner.tsx` | Komponent React |
| `src/components/admin/auth/UnsavedChangesGuard.tsx` | Komponent React |
| `src/lib/schemas/reset-password.schema.ts` | Schemat Zod |
| `src/lib/services/auth.service.ts` | Serwis |
| `src/lib/utils/rate-limit.ts` | Utility |

### Pliki do modyfikacji

| Plik | Zakres zmian |
|------|--------------|
| `src/pages/admin/login.astro` | Dodanie linku i obsługi query params |
| `src/components/admin/auth/DirectLoginForm.tsx` | Rate limiting, returnTo |
| `src/middleware/index.ts` | Rozszerzenie ochrony tras, returnTo |
| `src/lib/schemas/login.schema.ts` | Drobne rozszerzenia walidacji |

### Zależności zewnętrzne

- **Supabase Auth** - pełna obsługa autentykacji
- **Supabase Email** - wysyłka maili resetowania hasła
- Brak nowych zależności npm
