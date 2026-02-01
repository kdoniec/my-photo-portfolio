# Diagram Architektury UI - Moduł Autentykacji

## Opis

Diagram przedstawia architekturę interfejsu użytkownika modułu autentykacji dla aplikacji My Photo Portfolio. Uwzględnia istniejące komponenty oraz nowe elementy wymagane do pełnej implementacji funkcjonalności logowania, wylogowania, resetowania hasła i ochrony sesji.

## Legenda

- **Zielone** - istniejące komponenty (bez zmian)
- **Pomarańczowe** - komponenty wymagające modyfikacji
- **Niebieskie** - nowe komponenty do implementacji

---

<mermaid_diagram>

```mermaid
flowchart TD
    subgraph "Warstawa Routingu"
        direction TB
        MW[["Middleware<br/>index.ts"]]
    end

    subgraph "Strony Publiczne Auth"
        direction TB
        LP["login.astro<br/>/admin/login"]
        RP["reset-password.astro<br/>/admin/reset-password"]
        SP["set-password.astro<br/>/admin/set-password"]
    end

    subgraph "Strony Chronione"
        direction TB
        IDX["index.astro<br/>/admin"]
        PH["photos.astro<br/>/admin/photos"]
        CAT["categories.astro<br/>/admin/categories"]
        PRF["profile.astro<br/>/admin/profile"]
    end

    subgraph "Layout"
        direction TB
        AL["AdminLayout.astro"]
        AH["AdminHeader.tsx"]
    end

    subgraph "Komponenty Formularzy Auth"
        direction TB
        DLF["DirectLoginForm.tsx"]
        FPF["ForgotPasswordForm.tsx"]
        SPF["SetPasswordForm.tsx"]
    end

    subgraph "Komponenty Wspoldzielone Auth"
        direction TB
        UM["UserMenu.tsx"]
        SEB["SessionExpiredBanner.tsx"]
        UCG["UnsavedChangesGuard.tsx"]
    end

    subgraph "Kontekst i Stan"
        direction TB
        AC["AuthContext.tsx"]
    end

    subgraph "Walidacja"
        direction TB
        LS["login.schema.ts"]
        RPS["reset-password.schema.ts"]
    end

    subgraph "Serwisy i Utility"
        direction TB
        AS["auth.service.ts"]
        RL["rate-limit.ts"]
    end

    subgraph "Supabase"
        direction TB
        SC["supabase.client.ts"]
        SA[("Supabase Auth")]
    end

    %% Przepływ routingu
    MW -->|"Brak sesji"| LP
    MW -->|"Sesja wygasla"| LP
    MW -->|"Sesja aktywna"| AL
    MW -.->|"Publiczne"| RP
    MW -.->|"Publiczne"| SP

    %% Strony auth do formularzy
    LP --> DLF
    LP -->|"Link"| RP
    RP --> FPF
    SP --> SPF

    %% Layout do stron chronionych
    AL --> AH
    AL --> IDX
    AL --> PH
    AL --> CAT
    AL --> PRF

    %% Header zawiera UserMenu
    AH --> UM

    %% Formularze do walidacji
    DLF --> LS
    DLF --> RL
    DLF --> SEB
    FPF --> RPS
    SPF --> RPS

    %% Formularze do serwisu auth
    DLF --> AS
    FPF --> AS
    SPF --> AS
    UM --> AS

    %% Serwis auth do Supabase
    AS --> SC
    SC --> SA

    %% Kontekst auth
    AC --> SC
    DLF -.->|"Opcjonalnie"| AC
    UM -.->|"Opcjonalnie"| AC

    %% Ochrona niezapisanych zmian
    UCG -.->|"Wrappuje"| PH
    UCG -.->|"Wrappuje"| CAT
    UCG -.->|"Wrappuje"| PRF

    %% Stylizacja
    classDef existing fill:#22c55e,stroke:#166534,stroke-width:2px,color:#fff
    classDef modified fill:#f97316,stroke:#c2410c,stroke-width:2px,color:#fff
    classDef new fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef supabase fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff

    %% Przypisanie klas - Istniejące
    class AC,UM,AH,AL,IDX,PH,CAT,PRF,SC,LS existing

    %% Przypisanie klas - Do modyfikacji
    class LP,DLF,MW modified

    %% Przypisanie klas - Nowe
    class RP,SP,FPF,SPF,SEB,UCG,RPS,AS,RL new

    %% Przypisanie klas - Supabase
    class SA supabase
```

</mermaid_diagram>

---

## Szczegolowy opis komponentow

### Strony Astro

| Strona | Status | Opis |
|--------|--------|------|
| `login.astro` | Modyfikacja | Dodanie linku do resetu hasla, obsluga query params (returnTo, expired) |
| `reset-password.astro` | Nowa | Formularz zadania resetu hasla |
| `set-password.astro` | Nowa | Formularz ustawienia nowego hasla |
| `photos.astro` | Istniejaca | Zarzadzanie zdjeciami |
| `categories.astro` | Istniejaca | Zarzadzanie kategoriami |
| `profile.astro` | Istniejaca | Edycja profilu |

### Komponenty React

| Komponent | Status | Opis |
|-----------|--------|------|
| `DirectLoginForm.tsx` | Modyfikacja | Dodanie rate limiting, returnTo, komunikat wygasniecia |
| `ForgotPasswordForm.tsx` | Nowy | Formularz z polem email do resetu hasla |
| `SetPasswordForm.tsx` | Nowy | Formularz nowego hasla z potwierdzeniem |
| `SessionExpiredBanner.tsx` | Nowy | Alert o wygasnieciu sesji |
| `UnsavedChangesGuard.tsx` | Nowy | Ochrona przed utrata niezapisanych zmian |
| `UserMenu.tsx` | Istniejacy | Menu uzytkownika z wylogowaniem |
| `AuthContext.tsx` | Istniejacy | Kontekst zarzadzania stanem autentykacji |

### Middleware

| Plik | Status | Opis |
|------|--------|------|
| `middleware/index.ts` | Modyfikacja | Rozszerzenie o returnTo URL, wykrywanie wygasnietej sesji |

### Schematy walidacji

| Schemat | Status | Opis |
|---------|--------|------|
| `login.schema.ts` | Istniejacy | Walidacja formularza logowania |
| `reset-password.schema.ts` | Nowy | Walidacja resetu i ustawiania hasla |

### Serwisy i Utility

| Plik | Status | Opis |
|------|--------|------|
| `auth.service.ts` | Nowy | Abstrakcja nad Supabase Auth |
| `rate-limit.ts` | Nowy | Rate limiting prob logowania |

---

## Przeplywy uzytkownika

### 1. Logowanie

```
Uzytkownik → /admin/* → Middleware (brak sesji) → /admin/login
→ DirectLoginForm → auth.service → Supabase Auth
→ Sukces → /admin/photos
```

### 2. Reset hasla

```
Uzytkownik → /admin/login → Link "Nie pamietam hasla"
→ /admin/reset-password → ForgotPasswordForm → auth.service
→ Supabase wysyla email → Uzytkownik klika link
→ /admin/set-password → SetPasswordForm → auth.service
→ Sukces → /admin/login
```

### 3. Wygasniecie sesji

```
Uzytkownik wykonuje akcje → Middleware wykrywa wygasla sesje
→ /admin/login?expired=true&returnTo=... → SessionExpiredBanner
→ Ponowne logowanie → Powrot do poprzedniej strony
```

### 4. Wylogowanie

```
Uzytkownik → UserMenu → "Wyloguj" → auth.service.signOut()
→ /admin/login
```
