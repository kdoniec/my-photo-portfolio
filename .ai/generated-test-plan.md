# Plan Testów - My Photo Portfolio

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji My Photo Portfolio - nowoczesnego portfolio fotograficznego zbudowanego w oparciu o Astro 5, React 19, TypeScript 5 i Supabase.

### 1.2 Cele testowania

- **Zapewnienie jakości** - weryfikacja poprawności działania wszystkich funkcjonalności aplikacji
- **Bezpieczeństwo** - potwierdzenie prawidłowego działania mechanizmów autoryzacji i izolacji danych
- **Niezawodność** - testowanie obsługi błędów i przypadków brzegowych
- **Wydajność** - weryfikacja czasów odpowiedzi i zachowania przy dużym obciążeniu
- **Zgodność z wymaganiami** - potwierdzenie realizacji założeń funkcjonalnych

### 1.3 Zakres projektu

Aplikacja składa się z:

- Panelu administracyjnego (zarządzanie zdjęciami, kategoriami, profilem)
- Publicznego portfolio (galeria zdjęć, lightbox, kategorie)
- Systemu autentykacji (logowanie, rejestracja, reset hasła)
- API REST (28 endpointów: 5 auth, 12 admin, 6 publicznych)
- Integracji z Supabase (baza danych, storage, auth)

---

## 2. Zakres testów

### 2.1 Funkcjonalności objęte testami

| Moduł                             | Priorytet | Uzasadnienie                    |
| --------------------------------- | --------- | ------------------------------- |
| Upload zdjęć (pojedynczy i batch) | Krytyczny | Główna funkcjonalność aplikacji |
| Autentykacja i autoryzacja        | Krytyczny | Bezpieczeństwo danych           |
| Izolacja danych (RLS)             | Krytyczny | Multi-tenant security           |
| Zarządzanie kategoriami           | Wysoki    | Core business logic             |
| Publiczne API                     | Wysoki    | UX publicznego portfolio        |
| Profil i ustawienia               | Średni    | Dane konfiguracyjne             |
| Statystyki użycia                 | Niski     | Funkcja pomocnicza              |

### 2.2 Funkcjonalności wyłączone z testów

- Infrastruktura Supabase (testowana przez dostawcę)
- Komponenty UI Shadcn/ui (zewnętrzna biblioteka)
- Kompresja obrazów w przeglądarce (biblioteka browser-image-compression)

---

## 3. Typy testów do przeprowadzenia

### 3.1 Testy jednostkowe (Unit Tests)

**Cel:** Weryfikacja pojedynczych funkcji i modułów w izolacji

**Zakres:**

- Schematy walidacji Zod (photo, category, profile, settings, auth)
- Funkcje pomocnicze (slug generation, rate limiting, URL signing)
- Mapowanie błędów (Supabase → przyjazne komunikaty PL)
- Logika biznesowa serwisów (bez wywołań do bazy)

**Narzędzia:** Vitest

**Istniejące testy do rozszerzenia:**

- `src/lib/schemas/photo.schema.test.ts` - 20+ testów
- `src/lib/schemas/category.schema.test.ts`
- `src/lib/schemas/profile.schema.test.ts`
- `src/lib/schemas/settings.schema.test.ts`

### 3.2 Testy integracyjne (Integration Tests)

**Cel:** Weryfikacja współdziałania komponentów

**Zakres:**

- API endpoints z mockowanym Supabase
- Middleware autentykacji
- Serwisy z rzeczywistą bazą testową
- Przepływ upload → storage → database

**Narzędzia:** Vitest + Supertest + Supabase Local Development

### 3.3 Testy end-to-end (E2E Tests)

**Cel:** Symulacja realnych scenariuszy użytkownika

**Zakres:**

- Pełny flow rejestracji i logowania
- Upload zdjęć przez interfejs
- Zarządzanie kategoriami
- Przeglądanie publicznego portfolio

**Narzędzia:** Playwright

### 3.4 Testy bezpieczeństwa (Security Tests)

**Cel:** Weryfikacja mechanizmów ochrony danych

**Zakres:**

- Row-Level Security policies
- Izolacja danych między użytkownikami
- Walidacja typów plików (tylko JPEG)
- Limity rozmiaru plików (10MB)
- Signed URLs expiration

**Narzędzia:** Testy manualne + automatyczne testy API

### 3.5 Testy wydajnościowe (Performance Tests)

**Cel:** Weryfikacja zachowania pod obciążeniem

**Zakres:**

- Czas odpowiedzi API przy paginacji (50 elementów)
- Batch upload 10 zdjęć jednocześnie
- Generowanie signed URLs dla 200 zdjęć

**Narzędzia:** k6 / Artillery

---

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Upload zdjęć (Priorytet: Krytyczny)

#### TC-UP-001: Upload pojedynczego zdjęcia JPEG

**Warunki wstępne:** Zalogowany użytkownik, < 200 zdjęć
| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Wybierz plik JPEG < 10MB | Plik zaakceptowany |
| 2 | Kliknij "Prześlij" | Progress bar widoczny |
| 3 | Poczekaj na upload | Zdjęcie pojawia się w galerii |
| 4 | Sprawdź thumbnail i preview | Oba obrazy wyświetlane poprawnie |

#### TC-UP-002: Odrzucenie pliku PNG

**Warunki wstępne:** Zalogowany użytkownik
| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Wybierz plik PNG | Błąd: "Dozwolony format to JPEG" |
| 2 | Sprawdź czy plik nie został przesłany | Brak nowego zdjęcia w galerii |

#### TC-UP-003: Odrzucenie pliku > 10MB

**Warunki wstępne:** Zalogowany użytkownik
| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Wybierz plik JPEG > 10MB | Błąd: "Plik jest za duży" |
| 2 | Sprawdź storage | Brak pliku w Supabase Storage |

#### TC-UP-004: Batch upload z częściowym błędem

**Warunki wstępne:** Zalogowany użytkownik, 195 zdjęć
| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Wybierz 10 plików JPEG | Wszystkie zaakceptowane lokalnie |
| 2 | Kliknij "Prześlij wszystkie" | 5 przesłanych, 5 odrzuconych (limit 200) |
| 3 | Sprawdź podsumowanie | "Przesłano 5, błędy: 5 (przekroczono limit)" |

#### TC-UP-005: Rollback przy błędzie bazy danych

**Warunki wstępne:** Symulowany błąd DB
| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Prześlij zdjęcie | Pliki zapisane w storage |
| 2 | Symuluj błąd INSERT | Błąd zwrócony do użytkownika |
| 3 | Sprawdź storage | Pliki zostały usunięte (cleanup) |

### 4.2 Autentykacja (Priorytet: Krytyczny)

#### TC-AUTH-001: Rejestracja nowego użytkownika

| Krok | Akcja                                                         | Oczekiwany rezultat             |
| ---- | ------------------------------------------------------------- | ------------------------------- |
| 1    | Wejdź na /admin/signup                                        | Formularz rejestracji widoczny  |
| 2    | Wprowadź email i hasło (8+ znaków, wielka/mała litera, cyfra) | Walidacja przechodzi            |
| 3    | Kliknij "Zarejestruj"                                         | Komunikat o wysłaniu emaila     |
| 4    | Sprawdź email                                                 | Link aktywacyjny otrzymany      |
| 5    | Kliknij link                                                  | Konto aktywowane                |
| 6    | Zaloguj się                                                   | Przekierowanie do /admin/photos |

#### TC-AUTH-002: Logowanie z nieprawidłowym hasłem

| Krok | Akcja                                  | Oczekiwany rezultat                   |
| ---- | -------------------------------------- | ------------------------------------- |
| 1    | Wprowadź poprawny email i błędne hasło | Błąd: "Nieprawidłowy email lub hasło" |
| 2    | Powtórz 5 razy                         | Blokada na 60 sekund (rate limiting)  |
| 3    | Poczekaj 60 sekund                     | Możliwość ponownej próby              |

#### TC-AUTH-003: Reset hasła

| Krok | Akcja                       | Oczekiwany rezultat                                           |
| ---- | --------------------------- | ------------------------------------------------------------- |
| 1    | Kliknij "Zapomniałem hasła" | Formularz reset password                                      |
| 2    | Wprowadź email              | Komunikat o wysłaniu (zawsze, bez ujawniania istnienia konta) |
| 3    | Kliknij link z emaila       | Formularz ustawiania nowego hasła                             |
| 4    | Ustaw nowe hasło            | Przekierowanie do logowania                                   |

#### TC-AUTH-004: Dostęp do chronionych endpointów bez sesji

| Krok | Akcja                              | Oczekiwany rezultat                             |
| ---- | ---------------------------------- | ----------------------------------------------- |
| 1    | Wywołaj GET /api/photos bez tokenu | HTTP 401 Unauthorized                           |
| 2    | Wejdź na /admin/photos             | Redirect do /admin/login?returnTo=/admin/photos |

#### TC-AUTH-005: Wygaśnięcie sesji

| Krok | Akcja                         | Oczekiwany rezultat                                 |
| ---- | ----------------------------- | --------------------------------------------------- |
| 1    | Zaloguj się                   | Sesja aktywna                                       |
| 2    | Poczekaj na wygaśnięcie sesji | -                                                   |
| 3    | Wykonaj akcję w panelu        | Redirect do logowania z komunikatem "Sesja wygasła" |

### 4.3 Izolacja danych / RLS (Priorytet: Krytyczny)

#### TC-RLS-001: Użytkownik A nie widzi zdjęć użytkownika B

| Krok | Akcja                     | Oczekiwany rezultat         |
| ---- | ------------------------- | --------------------------- |
| 1    | Zaloguj jako użytkownik A | -                           |
| 2    | Prześlij zdjęcie          | Zdjęcie widoczne dla A      |
| 3    | Zaloguj jako użytkownik B | -                           |
| 4    | Sprawdź GET /api/photos   | Zdjęcie A nie jest widoczne |

#### TC-RLS-002: Publiczne API zwraca tylko opublikowane zdjęcia

| Krok | Akcja                                                       | Oczekiwany rezultat      |
| ---- | ----------------------------------------------------------- | ------------------------ |
| 1    | Zaloguj i prześlij 2 zdjęcia                                | Oba widoczne w panelu    |
| 2    | Opublikuj tylko 1 zdjęcie                                   | Status zaktualizowany    |
| 3    | Wywołaj GET /api/public/categories/[slug]/photos bez tokenu | Tylko 1 zdjęcie zwrócone |

#### TC-RLS-003: Próba modyfikacji cudzego zdjęcia

| Krok | Akcja                                  | Oczekiwany rezultat          |
| ---- | -------------------------------------- | ---------------------------- |
| 1    | Zaloguj jako A, pobierz ID zdjęcia A   | -                            |
| 2    | Zaloguj jako B                         | -                            |
| 3    | Wywołaj PUT /api/photos/[ID zdjęcia A] | HTTP 404 Not Found (nie 403) |

### 4.4 Zarządzanie kategoriami (Priorytet: Wysoki)

#### TC-CAT-001: Tworzenie kategorii

| Krok | Akcja                       | Oczekiwany rezultat             |
| ---- | --------------------------- | ------------------------------- |
| 1    | Kliknij "Dodaj kategorię"   | Dialog tworzenia                |
| 2    | Wprowadź nazwę "Krajobrazy" | Slug: "krajobrazy" wygenerowany |
| 3    | Kliknij "Zapisz"            | Kategoria widoczna na liście    |

#### TC-CAT-002: Limit 10 kategorii

| Krok | Akcja                | Oczekiwany rezultat                |
| ---- | -------------------- | ---------------------------------- |
| 1    | Utwórz 10 kategorii  | Wszystkie utworzone                |
| 2    | Spróbuj utworzyć 11. | Błąd: "Osiągnięto limit kategorii" |
| 3    | Przycisk "Dodaj"     | Zablokowany (disabled)             |

#### TC-CAT-003: Usunięcie kategorii z przypisanymi zdjęciami

| Krok | Akcja                               | Oczekiwany rezultat                              |
| ---- | ----------------------------------- | ------------------------------------------------ |
| 1    | Utwórz kategorię i przypisz 5 zdjęć | -                                                |
| 2    | Usuń kategorię                      | Komunikat: "5 zdjęć zostanie odkategorizowanych" |
| 3    | Potwierdź usunięcie                 | Zdjęcia mają category_id = NULL                  |

#### TC-CAT-004: Zmiana kolejności kategorii

| Krok | Akcja                        | Oczekiwany rezultat          |
| ---- | ---------------------------- | ---------------------------- |
| 1    | Utwórz 3 kategorie (A, B, C) | display_order: 0, 1, 2       |
| 2    | Przeciągnij C na pozycję 1   | display_order: A=0, C=1, B=2 |
| 3    | Odśwież stronę               | Kolejność zachowana          |

### 4.5 Publiczne portfolio (Priorytet: Wysoki)

#### TC-PUB-001: Wyświetlanie galerii z paginacją

| Krok | Akcja                               | Oczekiwany rezultat         |
| ---- | ----------------------------------- | --------------------------- |
| 1    | Opublikuj 60 zdjęć w kategorii      | -                           |
| 2    | Wejdź na publiczną stronę kategorii | 20 zdjęć (domyślna strona)  |
| 3    | Przewiń / kliknij "więcej"          | Kolejne 20 zdjęć załadowane |

#### TC-PUB-002: Lightbox nawigacja

| Krok | Akcja                    | Oczekiwany rezultat  |
| ---- | ------------------------ | -------------------- |
| 1    | Kliknij miniaturę        | Lightbox otwiera się |
| 2    | Kliknij strzałkę w prawo | Następne zdjęcie     |
| 3    | Naciśnij Escape          | Lightbox zamknięty   |

#### TC-PUB-003: Brak kategorii bez opublikowanych zdjęć

| Krok | Akcja                              | Oczekiwany rezultat         |
| ---- | ---------------------------------- | --------------------------- |
| 1    | Utwórz kategorię bez zdjęć         | -                           |
| 2    | Wywołaj GET /api/public/categories | Kategoria nie jest zwrócona |

---

## 5. Środowisko testowe

### 5.1 Środowiska

| Środowisko | Baza danych                   | Storage          | Cel                        |
| ---------- | ----------------------------- | ---------------- | -------------------------- |
| Local      | Supabase Local (Docker)       | Local minio      | Rozwój i testy jednostkowe |
| Staging    | Supabase Cloud (projekt test) | Supabase Storage | Testy E2E i integracyjne   |
| Production | Supabase Cloud (projekt prod) | Supabase Storage | Smoke testy po deploy      |

### 5.2 Dane testowe

**Użytkownicy:**

- `admin@test.com` - pełny zestaw danych (200 zdjęć, 10 kategorii)
- `empty@test.com` - pusty profil
- `partial@test.com` - częściowe dane (50 zdjęć, 3 kategorie)

**Pliki testowe:**

- `valid.jpg` - 5MB, 3000x2000px, JPEG
- `large.jpg` - 15MB, przekracza limit
- `fake.jpg` - plik PNG z rozszerzeniem .jpg
- `corrupt.jpg` - uszkodzony plik JPEG

### 5.3 Konfiguracja Supabase Local

```bash
# Uruchomienie lokalnego Supabase
supabase start

# Migracje
supabase db reset

# Seed danych testowych
supabase db seed
```

---

## 6. Narzędzia do testowania

| Narzędzie        | Zastosowanie                     | Wersja |
| ---------------- | -------------------------------- | ------ |
| **Vitest**       | Testy jednostkowe i integracyjne | ^2.x   |
| **Playwright**   | Testy E2E                        | ^1.40  |
| **Supertest**    | Testy API                        | ^6.x   |
| **MSW**          | Mockowanie API                   | ^2.x   |
| **Faker.js**     | Generowanie danych testowych     | ^8.x   |
| **Supabase CLI** | Lokalne środowisko               | ^1.x   |
| **k6**           | Testy wydajnościowe              | latest |

### 6.1 Konfiguracja Vitest

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["src/components/ui/**", "node_modules/**"],
    },
  },
});
```

### 6.2 Konfiguracja Playwright

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    port: 3000,
  },
});
```

---

## 7. Harmonogram testów

### 7.1 Faza 1: Testy jednostkowe (Tydzień 1-2)

| Zadanie                                       | Priorytet | Status       |
| --------------------------------------------- | --------- | ------------ |
| Rozszerzenie testów schematów walidacji       | Krytyczny | Do zrobienia |
| Testy funkcji pomocniczych (slug, rate-limit) | Wysoki    | Do zrobienia |
| Testy mapowania błędów                        | Średni    | Do zrobienia |
| Konfiguracja coverage                         | Średni    | Do zrobienia |

### 7.2 Faza 2: Testy integracyjne (Tydzień 3-4)

| Zadanie                       | Priorytet | Status       |
| ----------------------------- | --------- | ------------ |
| Testy PhotoService            | Krytyczny | Do zrobienia |
| Testy CategoryService         | Wysoki    | Do zrobienia |
| Testy middleware autentykacji | Krytyczny | Do zrobienia |
| Testy API endpoints           | Wysoki    | Do zrobienia |

### 7.3 Faza 3: Testy E2E (Tydzień 5-6)

| Zadanie                             | Priorytet | Status       |
| ----------------------------------- | --------- | ------------ |
| Scenariusze rejestracji i logowania | Krytyczny | Do zrobienia |
| Scenariusze upload zdjęć            | Krytyczny | Do zrobienia |
| Scenariusze zarządzania kategoriami | Wysoki    | Do zrobienia |
| Scenariusze publicznego portfolio   | Wysoki    | Do zrobienia |

### 7.4 Faza 4: Testy bezpieczeństwa i wydajnościowe (Tydzień 7)

| Zadanie                          | Priorytet | Status       |
| -------------------------------- | --------- | ------------ |
| Weryfikacja RLS policies         | Krytyczny | Do zrobienia |
| Testy izolacji danych            | Krytyczny | Do zrobienia |
| Testy wydajnościowe paginacji    | Średni    | Do zrobienia |
| Testy wydajnościowe batch upload | Średni    | Do zrobienia |

---

## 8. Kryteria akceptacji testów

### 8.1 Kryteria wejścia do fazy testowania

- [ ] Kod źródłowy dostępny w repozytorium
- [ ] Środowisko testowe skonfigurowane i działające
- [ ] Dane testowe przygotowane
- [ ] Dokumentacja API aktualna

### 8.2 Kryteria zakończenia testów

- [ ] Pokrycie kodu testami jednostkowymi ≥ 80% dla serwisów
- [ ] Wszystkie testy krytyczne (Priorytet: Krytyczny) przechodzą
- [ ] Brak otwartych błędów o priorytecie Blocker lub Critical
- [ ] Testy E2E dla głównych przepływów przechodzą
- [ ] Dokumentacja testowa zaktualizowana

### 8.3 Metryki jakości

| Metryka                      | Cel     | Aktualny |
| ---------------------------- | ------- | -------- |
| Pokrycie kodu (serwisy)      | ≥ 80%   | ~40%     |
| Pokrycie kodu (schematy)     | ≥ 90%   | ~70%     |
| Testy E2E przechodzące       | 100%    | N/A      |
| Średni czas wykonania testów | < 2 min | N/A      |

---

## 9. Role i odpowiedzialności

### 9.1 Struktura zespołu

| Rola                    | Odpowiedzialności                               |
| ----------------------- | ----------------------------------------------- |
| **QA Lead**             | Planowanie testów, przegląd raportów, eskalacja |
| **Tester automatyczny** | Implementacja testów Vitest i Playwright        |
| **Tester manualny**     | Testy eksploracyjne, przypadki brzegowe         |
| **Developer**           | Naprawianie błędów, code review testów          |

### 9.2 Macierz RACI

| Zadanie           | QA Lead | Tester Auto | Tester Manual | Developer |
| ----------------- | ------- | ----------- | ------------- | --------- |
| Plan testów       | R/A     | C           | C             | I         |
| Testy jednostkowe | A       | R           | I             | C         |
| Testy E2E         | A       | R           | C             | I         |
| Testy manualne    | A       | I           | R             | I         |
| Naprawa błędów    | I       | I           | I             | R/A       |
| Code review       | C       | C           | I             | R/A       |

**R** - Responsible, **A** - Accountable, **C** - Consulted, **I** - Informed

---

## 10. Procedury raportowania błędów

### 10.1 Klasyfikacja błędów

| Priorytet    | Definicja                            | SLA naprawy |
| ------------ | ------------------------------------ | ----------- |
| **Blocker**  | Uniemożliwia korzystanie z aplikacji | 4h          |
| **Critical** | Główna funkcjonalność nie działa     | 24h         |
| **Major**    | Funkcjonalność działa częściowo      | 72h         |
| **Minor**    | Drobne usterki, problemy UI          | 1 tydzień   |
| **Trivial**  | Kosmetyczne, sugestie                | Backlog     |

### 10.2 Szablon zgłoszenia błędu

```markdown
## Tytuł

[Krótki, zwięzły opis problemu]

## Środowisko

- Przeglądarka: [Chrome 120 / Firefox 121 / Safari 17]
- System: [macOS 14 / Windows 11 / Ubuntu 22.04]
- Środowisko: [Local / Staging / Production]

## Kroki reprodukcji

1. [Krok 1]
2. [Krok 2]
3. [Krok 3]

## Oczekiwane zachowanie

[Co powinno się stać]

## Aktualne zachowanie

[Co się dzieje]

## Załączniki

- Screenshot / nagranie
- Logi konsoli
- Network requests

## Priorytet

[Blocker / Critical / Major / Minor / Trivial]

## Dodatkowe informacje

[Obejście problemu, powiązane błędy]
```

### 10.3 Workflow obsługi błędów

```
New → Confirmed → In Progress → Code Review → Ready for QA → Verified → Closed
         ↓                                        ↓
      Won't Fix                               Reopened
```

### 10.4 Narzędzie do śledzenia błędów

GitHub Issues z labelami:

- `bug/blocker`, `bug/critical`, `bug/major`, `bug/minor`
- `area/auth`, `area/photos`, `area/categories`, `area/public`
- `status/confirmed`, `status/in-progress`, `status/ready-for-qa`

---

## 11. Załączniki

### 11.1 Mapa pokrycia testami

```
src/
├── lib/
│   ├── services/
│   │   ├── photo.service.ts      [DO PRZETESTOWANIA - Krytyczny]
│   │   ├── category.service.ts   [DO PRZETESTOWANIA - Wysoki]
│   │   ├── public.service.ts     [DO PRZETESTOWANIA - Wysoki]
│   │   ├── profile.service.ts    [DO PRZETESTOWANIA - Średni]
│   │   ├── settings.service.ts   [DO PRZETESTOWANIA - Średni]
│   │   └── stats.service.ts      [DO PRZETESTOWANIA - Niski]
│   ├── schemas/
│   │   ├── photo.schema.ts       [CZĘŚCIOWO PRZETESTOWANE]
│   │   ├── category.schema.ts    [CZĘŚCIOWO PRZETESTOWANE]
│   │   ├── profile.schema.ts     [CZĘŚCIOWO PRZETESTOWANE]
│   │   └── settings.schema.ts    [CZĘŚCIOWO PRZETESTOWANE]
│   └── utils/
│       ├── rate-limit.ts         [DO PRZETESTOWANIA]
│       └── utils.ts              [DO PRZETESTOWANIA]
├── middleware/
│   └── index.ts                  [DO PRZETESTOWANIA - Krytyczny]
└── pages/api/
    ├── auth/                     [DO PRZETESTOWANIA - Krytyczny]
    ├── photos/                   [DO PRZETESTOWANIA - Krytyczny]
    ├── categories/               [DO PRZETESTOWANIA - Wysoki]
    └── public/                   [DO PRZETESTOWANIA - Wysoki]
```

### 11.2 Checklist przed release

- [ ] Wszystkie testy jednostkowe przechodzą (npm run test)
- [ ] Testy E2E przechodzą na staging
- [ ] Pokrycie kodu spełnia wymagania
- [ ] Brak otwartych błędów Blocker/Critical
- [ ] Dokumentacja zaktualizowana
- [ ] Smoke testy na produkcji po deploy

---

_Dokument wygenerowany: 2026-02-01_
_Wersja: 1.0_
_Autor: QA Team_
