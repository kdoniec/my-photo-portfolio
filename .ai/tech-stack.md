# Tech Stack - My Photo Portfolio

## Frontend

### Astro 5
- Framework do budowy szybkich, wydajnych stron z minimalną ilością JavaScript
- Wykorzystanie SSG/SSR dla optymalnej wydajności
- View Transitions i Partial Hydration dla lepszego UX

### React 19
- Komponenty interaktywne (panel admina, lightbox, formularze)
- Integracja z Astro poprzez wyspy (islands architecture)

### TypeScript 5
- Statyczne typowanie dla lepszej jakości kodu
- Wsparcie IDE i autocomplete

### Tailwind 4
- Utility-first CSS framework
- Szybkie prototypowanie i stylowanie

### Shadcn/ui
- Biblioteka dostępnych komponentów React
- Baza dla UI panelu administracyjnego

## Backend

### Supabase
- **Baza danych:** PostgreSQL
- **Autentykacja:** Wbudowany system auth (email/hasło)
- **Storage:** Przechowywanie zdjęć (miniaturki 400px, podglądy 1200px)
- **Row Level Security:** Kontrola dostępu na poziomie bazy danych
- **SDK:** JavaScript client do komunikacji z backendem

## Przetwarzanie obrazów

### browser-image-compression
- Kompresja i resize obrazów po stronie klienta
- Generowanie dwóch wersji: miniaturka (400px), podgląd (1200px)
- Brak potrzeby server-side processing

## CI/CD i Hosting

### GitHub Actions
- Automatyczne pipeline'y CI/CD
- Budowanie obrazu Docker
- Deployment na DigitalOcean

### DigitalOcean
- Hosting aplikacji via Docker
- Pełna kontrola nad infrastrukturą
- Stały, przewidywalny koszt

### Docker
- Konteneryzacja aplikacji
- Spójne środowisko dev/prod
- Łatwy deployment i skalowanie

## Uwagi dotyczące wyboru

### Dlaczego Docker + DigitalOcean zamiast Vercel/Netlify?
- Pełna kontrola nad infrastrukturą
- Brak vendor lock-in
- Możliwość rozbudowy o dodatkowe usługi w przyszłości
- Stały koszt niezależny od ruchu

### Ryzyka do monitorowania
- **Tailwind 4:** Stosunkowo nowa wersja - śledzić breaking changes
- **React 19:** Nowa wersja - weryfikować kompatybilność z ekosystemem
- **Supabase Storage:** Limit 1GB na free tier - monitorować wykorzystanie przy 200 zdjęciach

### Szacowane koszty miesięczne
| Usługa | Koszt |
|--------|-------|
| Supabase (Free Tier) | $0 |
| DigitalOcean Droplet | ~$6 |
| GitHub Actions | $0 (w ramach limitu) |
| **Razem** | **~$6/mies** |

## Limity techniczne (zgodne z PRD)

| Parametr | Wartość |
|----------|---------|
| Maksymalna liczba zdjęć | 200 |
| Maksymalna liczba kategorii | 10 |
| Maksymalny rozmiar pliku | 10 MB |
| Obsługiwany format | JPEG |
| Rozmiar miniaturki | 400px szerokości |
| Rozmiar podglądu | 1200px szerokości |
