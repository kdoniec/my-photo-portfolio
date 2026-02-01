# Analiza priorytetów testów jednostkowych

Raport analizujący elementy projektu Photo Portfolio pod kątem wartości testów jednostkowych.

## Elementy o wysokim priorytecie testowania

### 1. Services (`lib/services/`) - Najwyższy priorytet

```
lib/services/
├── auth.service.ts
├── category.service.ts
├── photo.service.ts
├── profile.service.ts
├── public.service.ts
├── settings.service.ts
└── stats.service.ts
```

**Dlaczego:**

- Zawierają **logikę biznesową** - serce aplikacji
- Transformują dane między warstwami (DB ↔ API ↔ UI)
- Obsługują **edge cases** i błędy
- Są **niezależne od UI** - łatwe do testowania
- Błędy tutaj propagują się na całą aplikację

**Co testować:**

- Walidację danych wejściowych
- Transformacje danych (DTO → Entity, Entity → Response)
- Obsługę błędów (brak danych, przekroczone limity, brak uprawnień)
- Logikę biznesową (np. limity zdjęć/kategorii)

---

### 2. Schemas (`lib/schemas/`) - Najwyższy priorytet

```
lib/schemas/
├── category.schema.ts
├── photo.schema.ts
├── profile.schema.ts
├── settings.schema.ts
├── login.schema.ts
├── signup.schema.ts
└── reset-password.schema.ts
```

**Dlaczego:**

- Są **pierwszą linią obrony** przed nieprawidłowymi danymi
- Definiują **kontrakt API** - co jest akceptowane, co nie
- Błędy walidacji = podatności bezpieczeństwa
- Już istnieją testy dla 4 schematów - warto uzupełnić resztę

**Co testować:**

- Walidne dane przechodzą
- Nieprawidłowe dane są odrzucane z odpowiednimi komunikatami
- Graniczne wartości (min/max length, empty strings, null)
- Sanityzacja (XSS, SQL injection patterns)

---

### 3. Utilities (`lib/utils/`, `lib/utils.ts`) - Najwyższy priorytet

```
lib/
├── utils.ts          # cn() helper
├── api-utils.ts      # API helpers
├── imageResize.ts    # Kompresja obrazów
└── utils/
    ├── slug.ts       # Generowanie slugów
    └── rate-limit.ts # Rate limiting
```

**Dlaczego:**

- **Czyste funkcje** - deterministyczne, bez side effects
- Używane w wielu miejscach - błąd mnoży się
- **Najłatwiejsze do testowania** - najlepszy ROI
- `slug.ts` i `imageResize.ts` mają specyficzną logikę

**Co testować:**

- `slug.ts`: polskie znaki, spacje, znaki specjalne, duplikaty
- `imageResize.ts`: różne rozmiary, formaty, edge cases
- `rate-limit.ts`: limity, reset czasu, concurrent requests
- `cn()`: merging klas, konflikty Tailwind

---

### 4. Custom Hooks z logiką - Wysoki priorytet

```
components/hooks/
├── usePhotos.ts
├── useCategories.ts
├── usePhotoUpload.ts
└── useNavigation.ts

hooks/
├── useBodyScrollLock.ts
├── useLightbox.ts
└── useInfiniteScroll.ts
```

**Dlaczego:**

- Zawierają **logikę stanu** współdzieloną między komponentami
- `usePhotoUpload.ts` - złożona logika uploadu, kompresji, kolejkowania
- `useInfiniteScroll.ts` - logika paginacji
- Błędy tutaj = zepsute UX

**Co testować:**

- Zarządzanie stanem (loading, error, success)
- Transformacje danych
- Obsługę błędów API
- `usePhotoUpload`: kolejkowanie, retry, progress tracking

---

### 5. Context Providers - Wysoki priorytet

```
admin/context/
├── AuthContext.tsx
└── StatsContext.tsx
```

**Dlaczego:**

- Zarządzają **globalnym stanem** aplikacji
- `AuthContext` - krytyczny dla bezpieczeństwa
- Błąd = użytkownik widzi cudze dane lub traci sesję

**Co testować:**

- Inicjalizacja stanu
- Aktualizacje po akcjach użytkownika
- Persystencja sesji
- Obsługa wygaśnięcia tokenu

---

## Elementy o niższym priorytecie dla unit testów

### Komponenty prezentacyjne - Niski priorytet

```
ui/*, gallery/PhotoCard.tsx, admin/shared/*
```

**Dlaczego niższy priorytet:**

- Głównie renderują props → lepsze dla **visual regression tests**
- Shadcn/ui jest już przetestowane
- Lepiej testować integracyjnie lub E2E

**Wyjątki warte unit testów:**

- Komponenty z **logiką warunkową** (np. `LimitBadge.tsx`)
- Komponenty z **obsługą błędów** (`ErrorBoundary.tsx`)

---

## Podsumowanie priorytetów

| Priorytet | Element            | Uzasadnienie                           |
| --------- | ------------------ | -------------------------------------- |
| ⭐⭐⭐    | Services           | Logika biznesowa, transformacje danych |
| ⭐⭐⭐    | Schemas            | Walidacja, bezpieczeństwo, kontrakt API |
| ⭐⭐⭐    | Utilities          | Czyste funkcje, wysoki ROI             |
| ⭐⭐      | Hooks z logiką     | Stan współdzielony, złożona logika     |
| ⭐⭐      | Contexts           | Globalny stan, bezpieczeństwo          |
| ⭐        | Komponenty z logiką | Tylko te ze złożoną logiką            |

---

## Rekomendacja kolejności implementacji

```
1. lib/schemas/ (uzupełnij brakujące)
   └── login.schema.test.ts
   └── signup.schema.test.ts
   └── reset-password.schema.test.ts
   └── public.schema.test.ts

2. lib/utils/
   └── slug.test.ts
   └── rate-limit.test.ts

3. lib/services/
   └── photo.service.test.ts (najbardziej złożony)
   └── category.service.test.ts
   └── auth.service.test.ts

4. components/hooks/
   └── usePhotoUpload.test.ts
   └── useInfiniteScroll.test.ts

5. admin/context/
   └── AuthContext.test.ts (istnieje już StatsContext.test.tsx)
```

---

## Istniejące testy

Projekt już zawiera testy dla:

- `lib/schemas/__tests__/category.schema.test.ts`
- `lib/schemas/__tests__/photo.schema.test.ts`
- `lib/schemas/__tests__/profile.schema.test.ts`
- `lib/schemas/__tests__/settings.schema.test.ts`
- `components/admin/context/__tests__/StatsContext.test.tsx`
