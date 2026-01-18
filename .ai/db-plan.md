# Schemat bazy danych - My Photo Portfolio

## 1. Lista tabel

Tabela `auth.users` będzie obsługiwana przez Supabase Auth

### 1.1 profiles

Dane biznesowe fotografa, powiązane 1:1 z `auth.users`.

| Kolumna       | Typ          | Ograniczenia                                             |
| ------------- | ------------ | -------------------------------------------------------- |
| id            | uuid         | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE |
| display_name  | varchar(100) | NOT NULL                                                 |
| bio           | text         | NULL                                                     |
| contact_email | varchar(255) | NULL                                                     |
| contact_phone | varchar(20)  | NULL                                                     |
| created_at    | timestamptz  | NOT NULL DEFAULT now()                                   |
| updated_at    | timestamptz  | NOT NULL DEFAULT now()                                   |

### 1.2 photographer_settings

Ustawienia SEO fotografa, powiązane 1:1 z `profiles`.

| Kolumna          | Typ          | Ograniczenia                                               |
| ---------------- | ------------ | ---------------------------------------------------------- |
| id               | uuid         | PRIMARY KEY DEFAULT gen_random_uuid()                      |
| photographer_id  | uuid         | NOT NULL UNIQUE, REFERENCES profiles(id) ON DELETE CASCADE |
| site_title       | varchar(100) | NULL                                                       |
| site_description | varchar(300) | NULL                                                       |
| created_at       | timestamptz  | NOT NULL DEFAULT now()                                     |
| updated_at       | timestamptz  | NOT NULL DEFAULT now()                                     |

### 1.3 categories

Kategorie zdjęć fotografa.

| Kolumna         | Typ          | Ograniczenia                                        |
| --------------- | ------------ | --------------------------------------------------- |
| id              | uuid         | PRIMARY KEY DEFAULT gen_random_uuid()               |
| photographer_id | uuid         | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE |
| name            | varchar(100) | NOT NULL                                            |
| slug            | varchar(100) | NOT NULL                                            |
| description     | text         | NULL                                                |
| cover_photo_id  | uuid         | NULL                                                |
| display_order   | integer      | NOT NULL                                            |
| created_at      | timestamptz  | NOT NULL DEFAULT now()                              |
| updated_at      | timestamptz  | NOT NULL DEFAULT now()                              |

**Constraints:**

- UNIQUE(photographer_id, slug)

> **Uwaga:** FK `cover_photo_id` → `photos(id) ON DELETE SET NULL` jest dodawany przez ALTER TABLE po utworzeniu tabeli `photos` ze względu na circular dependency.

### 1.4 photos

Zdjęcia fotografa z referencjami do Supabase Storage.

| Kolumna         | Typ          | Ograniczenia                                        |
| --------------- | ------------ | --------------------------------------------------- |
| id              | uuid         | PRIMARY KEY DEFAULT gen_random_uuid()               |
| photographer_id | uuid         | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE |
| category_id     | uuid         | NULL, REFERENCES categories(id) ON DELETE SET NULL  |
| title           | varchar(200) | NULL                                                |
| thumbnail_path  | text         | NOT NULL                                            |
| preview_path    | text         | NOT NULL                                            |
| original_width  | integer      | NOT NULL                                            |
| original_height | integer      | NOT NULL                                            |
| file_size_bytes | integer      | NOT NULL                                            |
| mime_type       | varchar(50)  | NOT NULL DEFAULT 'image/jpeg'                       |
| is_published    | boolean      | NOT NULL DEFAULT false                              |
| created_at      | timestamptz  | NOT NULL DEFAULT now()                              |
| updated_at      | timestamptz  | NOT NULL DEFAULT now()                              |

---

## 2. Relacje między tabelami

### Diagram relacji

```
┌─────────────────┐
│   auth.users    │
│   (Supabase)    │
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐       1:1        ┌──────────────────────┐
│    profiles     │◄────────────────►│ photographer_settings │
└────────┬────────┘                  └──────────────────────┘
         │ 1:N
         ▼
┌─────────────────┐       1:N        ┌─────────────────┐
│   categories    │◄────────────────►│     photos      │
│                 │                  │                 │
│  cover_photo_id │─ ─ ─ ─ ─ ─ ─ ─ ─►│                 │
└─────────────────┘   (nullable FK)  └─────────────────┘
```

### Opis relacji

| Relacja                            | Typ | Opis                                                     |
| ---------------------------------- | --- | -------------------------------------------------------- |
| auth.users → profiles              | 1:1 | Każdy użytkownik Supabase Auth ma dokładnie jeden profil |
| profiles → photographer_settings   | 1:1 | Każdy profil ma dokładnie jedno ustawienie SEO           |
| profiles → categories              | 1:N | Fotograf może mieć wiele kategorii (limit 10)            |
| profiles → photos                  | 1:N | Fotograf może mieć wiele zdjęć (limit 200)               |
| categories → photos                | 1:N | Kategoria może zawierać wiele zdjęć                      |
| categories.cover_photo_id → photos | N:1 | Kategoria może mieć jedno zdjęcie okładkowe (nullable)   |

---

## 3. Indeksy

### 3.1 Indeksy dla tabeli `photos`

```sql
-- Partial index dla galerii publicznej (opublikowane zdjęcia w kategorii)
create index idx_photos_published_by_category
on photos (category_id, created_at desc)
where is_published = true and category_id is not null;

-- Indeks dla panelu admina (wszystkie zdjęcia fotografa)
create index idx_photos_by_photographer
on photos (photographer_id, created_at desc);

-- Indeks dla filtrowania po kategorii w panelu admina
create index idx_photos_category_id
on photos (category_id)
where category_id is not null;
```

### 3.2 Indeksy dla tabeli `categories`

```sql
-- Indeks dla routingu URL (wyszukiwanie po slug)
create index idx_categories_photographer_slug
on categories (photographer_id, slug);

-- Indeks dla sortowania kategorii
create index idx_categories_display_order
on categories (photographer_id, display_order);
```

### 3.3 Indeksy dla tabeli `photographer_settings`

```sql
-- Indeks dla wyszukiwania ustawień fotografa (covered by UNIQUE constraint)
-- photographer_id ma już unique constraint, który tworzy indeks automatycznie
```

---

## 4. Polityki Row Level Security (RLS)

### 4.1 Włączenie RLS na wszystkich tabelach

```sql
alter table profiles enable row level security;
alter table photographer_settings enable row level security;
alter table categories enable row level security;
alter table photos enable row level security;
```

### 4.2 Polityki dla tabeli `profiles`

```sql
-- SELECT: authenticated może odczytać tylko swój profil
create policy "profiles_select_own" on profiles
for select to authenticated
using (id = auth.uid());

-- SELECT: anon może odczytać wszystkie profile (potrzebne dla strony "O mnie")
create policy "profiles_select_anon" on profiles
for select to anon
using (true);

-- UPDATE: authenticated może aktualizować tylko swój profil
create policy "profiles_update_own" on profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- INSERT: obsługiwane przez trigger, nie przez aplikację
-- DELETE: nie dozwolone (usunięcie konta przez Supabase Auth)
```

### 4.3 Polityki dla tabeli `photographer_settings`

```sql
-- SELECT: authenticated może odczytać tylko swoje ustawienia
create policy "settings_select_own" on photographer_settings
for select to authenticated
using (photographer_id = auth.uid());

-- SELECT: anon może odczytać ustawienia (dla meta tagów)
create policy "settings_select_anon" on photographer_settings
for select to anon
using (true);

-- UPDATE: authenticated może aktualizować tylko swoje ustawienia
create policy "settings_update_own" on photographer_settings
for update to authenticated
using (photographer_id = auth.uid())
with check (photographer_id = auth.uid());

-- INSERT: obsługiwane przez trigger
-- DELETE: kaskadowo przy usunięciu profilu
```

### 4.4 Polityki dla tabeli `categories`

```sql
-- SELECT: authenticated może odczytać tylko swoje kategorie
create policy "categories_select_own" on categories
for select to authenticated
using (photographer_id = auth.uid());

-- SELECT: anon może odczytać kategorie które mają opublikowane zdjęcia
create policy "categories_select_anon" on categories
for select to anon
using (
  exists (
    select 1 from photos
    where photos.category_id = categories.id
    and photos.is_published = true
  )
);

-- INSERT: authenticated może tworzyć kategorie dla siebie
create policy "categories_insert_own" on categories
for insert to authenticated
with check (photographer_id = auth.uid());

-- UPDATE: authenticated może aktualizować tylko swoje kategorie
create policy "categories_update_own" on categories
for update to authenticated
using (photographer_id = auth.uid())
with check (photographer_id = auth.uid());

-- DELETE: authenticated może usuwać tylko swoje kategorie
create policy "categories_delete_own" on categories
for delete to authenticated
using (photographer_id = auth.uid());
```

### 4.5 Polityki dla tabeli `photos`

```sql
-- SELECT: authenticated może odczytać tylko swoje zdjęcia
create policy "photos_select_own" on photos
for select to authenticated
using (photographer_id = auth.uid());

-- SELECT: anon może odczytać tylko opublikowane zdjęcia z przypisaną kategorią
create policy "photos_select_anon" on photos
for select to anon
using (is_published = true and category_id is not null);

-- INSERT: authenticated może dodawać zdjęcia dla siebie
create policy "photos_insert_own" on photos
for insert to authenticated
with check (photographer_id = auth.uid());

-- UPDATE: authenticated może aktualizować tylko swoje zdjęcia
create policy "photos_update_own" on photos
for update to authenticated
using (photographer_id = auth.uid())
with check (photographer_id = auth.uid());

-- DELETE: authenticated może usuwać tylko swoje zdjęcia
create policy "photos_delete_own" on photos
for delete to authenticated
using (photographer_id = auth.uid());
```

---

## 5. Triggery i funkcje

### 5.1 Automatyczne tworzenie profilu i ustawień przy rejestracji

```sql
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Fotograf'));

  insert into public.photographer_settings (photographer_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
```

### 5.2 Automatyczne ustawianie `display_order` dla nowych kategorii

```sql
create or replace function set_category_display_order()
returns trigger
language plpgsql
as $$
begin
  if new.display_order is null then
    select coalesce(max(display_order), 0) + 1 into new.display_order
    from categories
    where photographer_id = new.photographer_id;
  end if;
  return new;
end;
$$;

create trigger before_category_insert
before insert on categories
for each row execute function set_category_display_order();
```

### 5.3 Automatyczna aktualizacja okładki przy usunięciu zdjęcia

```sql
create or replace function update_category_cover_on_photo_delete()
returns trigger
language plpgsql
as $$
begin
  -- Jeśli usuwane zdjęcie było okładką jakiejś kategorii
  update categories
  set cover_photo_id = (
    select id from photos
    where category_id = categories.id
    and is_published = true
    and id != old.id
    order by created_at desc
    limit 1
  )
  where cover_photo_id = old.id;

  return old;
end;
$$;

create trigger after_photo_delete
before delete on photos
for each row execute function update_category_cover_on_photo_delete();
```

### 5.4 Automatyczna aktualizacja `updated_at`

```sql
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on profiles
for each row execute function update_updated_at();

create trigger set_settings_updated_at
before update on photographer_settings
for each row execute function update_updated_at();

create trigger set_categories_updated_at
before update on categories
for each row execute function update_updated_at();

create trigger set_photos_updated_at
before update on photos
for each row execute function update_updated_at();
```

---

## 6. Supabase Storage

### 6.1 Konfiguracja bucketu

```sql
-- Bucket dla zdjęć (tworzony przez Supabase Dashboard lub SQL)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true);
```

### 6.2 Polityki Storage RLS

```sql
-- Publiczny odczyt wszystkich plików
create policy "photos_bucket_select_anon"
on storage.objects for select to anon
using (bucket_id = 'photos');

create policy "photos_bucket_select_authenticated"
on storage.objects for select to authenticated
using (bucket_id = 'photos');

-- Upload tylko do własnego folderu
create policy "photos_bucket_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Usuwanie tylko z własnego folderu
create policy "photos_bucket_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

### 6.3 Struktura ścieżek

```
Bucket: photos
├── {photographer_id}/
│   ├── thumb_{photo_id}.jpg   (400px szerokości)
│   └── preview_{photo_id}.jpg (1200px szerokości)
```

---

## 7. Dodatkowe uwagi i decyzje projektowe

### 7.1 Circular dependency

Między tabelami `categories` i `photos` istnieje zależność cykliczna:

- `photos.category_id` → `categories.id`
- `categories.cover_photo_id` → `photos.id`

**Rozwiązanie:** Tabela `photos` jest tworzona najpierw bez FK do `categories`, następnie tworzony jest FK `categories.cover_photo_id` → `photos`, a na końcu FK `photos.category_id` → `categories` jest dodawany przez ALTER TABLE.

### 7.2 Walidacja limitów

Limity (200 zdjęć, 10 kategorii) są walidowane po stronie aplikacji, nie przez triggery bazodanowe. Pozwala to na:

- Lepszą kontrolę nad komunikatami błędów
- Łatwiejsze testowanie
- Możliwość zmiany limitów bez migracji

### 7.3 Soft delete

Projekt używa hard delete zamiast soft delete. Zdjęcia i kategorie są trwale usuwane. Decyzja podyktowana:

- Prostotą implementacji w MVP
- Ograniczeniami storage (1GB free tier)
- Brakiem wymagań dotyczących przywracania danych

### 7.4 Multi-tenant architecture

Schemat jest przygotowany na obsługę wielu fotografów (`photographer_id` w tabelach), mimo że MVP obsługuje jednego. Pozwala to na:

- Łatwe rozszerzenie w przyszłości
- Izolację danych per fotograf
- Niezależne limity per konto

### 7.5 Wymiary zdjęć

Pola `original_width` i `original_height` przechowują oryginalne wymiary zdjęcia (przed resize). Służą do:

- Obliczania aspect ratio dla masonry layout
- Eliminacji content shift podczas ładowania
- Rezerwacji miejsca w UI

### 7.6 Ścieżki Storage

Ścieżki do plików (`thumbnail_path`, `preview_path`) przechowują pełne ścieżki względne w buckecie, np. `{photographer_id}/thumb_{photo_id}.jpg`. Aplikacja konstruuje pełny URL do Supabase Storage.

### 7.7 Usuwanie plików Storage

Kaskadowe usuwanie plików z Storage przy usunięciu zdjęcia lub fotografa jest obsługiwane przez aplikację, nie przez triggery. Triggery bazodanowe nie mają dostępu do Storage API.

### 7.8 Niepublikowane zdjęcia

Niepublikowane zdjęcia są dostępne przez bezpośredni URL Storage (bucket jest publiczny). Dla MVP jest to akceptowalne - pełna ochrona wymagałaby signed URLs lub Edge Functions.
