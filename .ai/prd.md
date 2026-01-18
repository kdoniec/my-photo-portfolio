# Dokument wymagań produktu (PRD) - My Photo Portfolio

## 1. Przegląd produktu

My Photo Portfolio to aplikacja webowa umożliwiająca fotografowi prezentację swojego portfolio w formie profesjonalnej galerii online. Aplikacja ma zastąpić profile w mediach społecznościowych jako główna wizytówka fotografa, oferując pełną kontrolę nad prezentacją prac i danymi kontaktowymi.

Produkt składa się z dwóch głównych części:

- Publiczna galeria zdjęć dostępna dla odwiedzających (potencjalnych klientów)
- Panel administracyjny dla fotografa do zarządzania treścią

## 2. Problem użytkownika

Fotografowie często polegają na profilach w mediach społecznościowych (Instagram, Facebook) do prezentacji portfolio, co wiąże się z istotnymi ograniczeniami:

1. Brak kontroli nad algorytmami wyświetlania - zdjęcia nie docierają do wszystkich obserwujących
2. Ograniczone opcje organizacji zdjęć - brak możliwości tworzenia kategorii tematycznych
3. Rozproszenie uwagi odbiorcy przez reklamy i inne treści
4. Brak profesjonalnego wizerunku - portfolio miesza się z prywatnymi postami
5. Uzależnienie od zewnętrznej platformy - zmiany regulaminu mogą wpłynąć na widoczność
6. Utrudniony kontakt - dane kontaktowe ukryte lub nieczytelne

My Photo Portfolio rozwiązuje te problemy, oferując:

- Dedykowaną przestrzeń do prezentacji prac fotograficznych
- Pełną kontrolę nad organizacją i prezentacją zdjęć
- Profesjonalny wizerunek bez rozpraszaczy
- Czytelne dane kontaktowe
- Niezależność od platform społecznościowych

## 3. Wymagania funkcjonalne

### 3.1 Panel publiczny (dla odwiedzających)

FR-001: Strona główna z kafelkami kategorii

- Wyświetlanie wszystkich kategorii jako kafelki z okładką, nazwą i opisem
- Responsywny układ dla mobile, tablet i desktop
- Kliknięcie kafelka przenosi do galerii kategorii

FR-002: Galeria zdjęć w kategorii

- Układ masonry (Pinterest-style) dla zdjęć o różnych proporcjach
- Lazy loading zdjęć podczas scrollowania
- Sortowanie zdjęć od najnowszych
- Wyświetlanie tylko opublikowanych zdjęć przypisanych do kategorii

FR-003: Lightbox do podglądu zdjęć

- Powiększony podgląd zdjęcia po kliknięciu
- Nawigacja między zdjęciami (strzałki, klawiatura, swipe na mobile)
- Zamknięcie przez kliknięcie poza zdjęciem lub przycisk X
- Brak możliwości pobierania zdjęć

FR-004: Strona "O mnie"

- Wyświetlanie imienia/nazwy fotografa
- Wyświetlanie bio (opisu)
- Wyświetlanie danych kontaktowych: email, telefon
- Responsywny design

FR-005: Strona 404

- Estetyczna strona błędu spójna z designem portfolio
- Link powrotny do strony głównej

FR-006: SEO i Open Graph

- Meta tagi (title, description) dla każdej strony
- Open Graph tags dla udostępniania w social media
- Semantyczny HTML

### 3.2 Panel administracyjny (dla fotografa)

FR-007: Autentykacja

- Strona logowania pod adresem /admin
- Logowanie przez email i hasło (Supabase Auth)
- Walidacja poprawności danych
- Komunikat błędu przy niepoprawnych danych
- Przekierowanie do panelu po poprawnym logowaniu
- Ochrona wszystkich ścieżek /admin/\* przed nieautoryzowanym dostępem

FR-008: Zarządzanie kategoriami

- Lista istniejących kategorii
- Tworzenie nowej kategorii: nazwa, opis
- Automatyczne generowanie sluga z nazwy
- Wybór zdjęcia okładkowego z istniejących zdjęć
- Edycja istniejącej kategorii
- Usuwanie kategorii z potwierdzeniem (modal)
- Informacja o liczbie zdjęć przy usuwaniu kategorii
- Limit 10 kategorii

FR-009: Upload zdjęć

- Batch upload (wiele plików naraz)
- Drag & drop interface
- Progress bar dla każdego uploadowanego pliku
- Walidacja formatu (tylko JPEG)
- Walidacja rozmiaru (maksymalnie 10 MB)
- Automatyczne generowanie miniaturki (400px szerokości)
- Automatyczne generowanie podglądu (1200px szerokości)
- Przypisanie wszystkich uploadowanych zdjęć do wybranej kategorii
- Limit 200 zdjęć łącznie
- Komunikaty błędów przy przekroczeniu limitów

FR-010: Zarządzanie zdjęciami

- Lista zdjęć z miniaturkami
- Filtrowanie po kategorii
- Edycja tytułu zdjęcia (opcjonalny)
- Zmiana kategorii przypisania
- Toggle publikacji (opublikowane/ukryte)
- Usuwanie zdjęcia z potwierdzeniem (modal)
- Zdjęcia bez kategorii są niewidoczne w publicznej galerii

FR-011: Edycja profilu

- Formularz edycji danych: imię/nazwa, bio, email kontaktowy, telefon
- Walidacja pól
- Zapisywanie zmian

FR-012: Wylogowanie

- Przycisk wylogowania w panelu admina
- Przekierowanie do strony logowania po wylogowaniu

### 3.3 Wymagania techniczne

FR-013: Przetwarzanie obrazów

- Przetwarzanie client-side z biblioteką browser-image-compression
- Generowanie 2 wersji: miniaturka (400px), podgląd (1200px)
- Brak zapisywania oryginalnych plików (oszczędność miejsca)
- Upload obu wersji do Supabase Storage

FR-014: Struktura URL

- / - strona główna (kafelki kategorii)
- /kategoria/[slug] - galeria zdjęć w kategorii
- /o-mnie - bio i dane kontaktowe
- /admin - panel administracyjny (chroniony)

FR-015: Responsywność

- Mobile-first design
- Obsługa urządzeń: mobile, tablet, desktop
- Wsparcie przeglądarek: Chrome, Firefox, Safari, Edge (ostatnie 2 wersje)

## 4. Granice produktu

### 4.1 W zakresie MVP

- Publiczna galeria zdjęć z podziałem na kategorie
- Panel administracyjny do zarządzania zdjęciami i kategoriami
- Strona "O mnie" z bio i danymi kontaktowymi
- System logowania dla jednego fotografa
- Automatyczne przetwarzanie obrazów (generowanie miniatur)
- Responsywny design (mobile-first)
- Podstawowe SEO i Open Graph
- Strona 404

### 4.2 Poza zakresem MVP (przyszłe fazy)

- Obsługa wielu fotografów / system rejestracji
- Prywatne galerie z hasłem/linkiem
- Interakcje klientów (ulubione, komentarze, zamawianie)
- System tagów
- Watermark na zdjęciach
- Specjalizacja i lokalizacja fotografa
- Monetyzacja / subskrypcje
- Ręczne sortowanie zdjęć (drag & drop)
- Customowa domena
- Obsługa formatów innych niż JPEG
- Pobieranie zdjęć przez odwiedzających

### 4.3 Ograniczenia techniczne

| Parametr                    | Wartość           |
| --------------------------- | ----------------- |
| Maksymalna liczba zdjęć     | 200               |
| Maksymalna liczba kategorii | 10                |
| Maksymalny rozmiar pliku    | 10 MB             |
| Obsługiwany format          | JPEG              |
| Rozmiar miniaturki          | 400px szerokości  |
| Rozmiar podglądu            | 1200px szerokości |

## 5. Historyjki użytkowników

### US-001: Logowanie do panelu administracyjnego

Jako fotograf chcę zalogować się do panelu administracyjnego, aby zarządzać swoim portfolio.

Kryteria akceptacji:

- Strona logowania jest dostępna pod adresem /admin
- Formularz zawiera pola: email, hasło
- Przycisk "Zaloguj" jest aktywny tylko gdy oba pola są wypełnione
- Po wprowadzeniu poprawnych danych użytkownik jest przekierowany do panelu admina
- Po wprowadzeniu niepoprawnych danych wyświetla się komunikat błędu
- Hasło jest maskowane (gwiazdki/kropki)
- Formularz obsługuje wysyłanie przez Enter

### US-002: Wylogowanie z panelu

Jako zalogowany fotograf chcę się wylogować, aby zabezpieczyć dostęp do panelu.

Kryteria akceptacji:

- Przycisk wylogowania jest widoczny w panelu admina
- Kliknięcie przycisku kończy sesję użytkownika
- Po wylogowaniu użytkownik jest przekierowany na stronę logowania
- Próba dostępu do /admin po wylogowaniu przekierowuje na stronę logowania

### US-003: Ochrona panelu przed nieautoryzowanym dostępem

Jako właściciel aplikacji chcę, aby panel admina był chroniony, aby osoby nieupoważnione nie miały dostępu do zarządzania portfolio.

Kryteria akceptacji:

- Wszystkie ścieżki /admin/\* są niedostępne bez zalogowania
- Niezalogowany użytkownik jest przekierowany na stronę logowania
- Sesja wygasa po określonym czasie nieaktywności
- Bezpośrednie wpisanie URL /admin/\* bez zalogowania przekierowuje na logowanie

### US-004: Tworzenie nowej kategorii

Jako fotograf chcę tworzyć kategorie, aby uporządkować moje zdjęcia tematycznie.

Kryteria akceptacji:

- W panelu admina jest opcja "Dodaj kategorię"
- Formularz zawiera pola: nazwa (wymagane), opis (opcjonalny)
- Slug jest generowany automatycznie z nazwy (np. "Sesje ślubne" → "sesje-slubne")
- Po zapisaniu kategoria pojawia się na liście
- Wyświetla się komunikat potwierdzający utworzenie
- Nie można utworzyć kategorii bez nazwy
- Nie można przekroczyć limitu 10 kategorii (wyświetla się komunikat)

### US-005: Edycja istniejącej kategorii

Jako fotograf chcę edytować kategorie, aby aktualizować ich nazwy i opisy.

Kryteria akceptacji:

- Przy każdej kategorii jest przycisk "Edytuj"
- Formularz edycji jest wypełniony aktualnymi danymi
- Można zmienić nazwę i opis
- Slug jest aktualizowany przy zmianie nazwy
- Zmiany są zapisywane po kliknięciu "Zapisz"
- Wyświetla się komunikat potwierdzający edycję
- Można anulować edycję bez zapisywania zmian

### US-006: Wybór okładki kategorii

Jako fotograf chcę wybrać zdjęcie okładkowe dla kategorii, aby atrakcyjnie prezentować kategorię na stronie głównej.

Kryteria akceptacji:

- W formularzu kategorii jest opcja wyboru okładki
- Wyświetla się lista miniaturek zdjęć przypisanych do kategorii
- Można wybrać jedno zdjęcie jako okładkę
- Jeśli brak zdjęć w kategorii, wyświetla się komunikat
- Okładka jest widoczna na kafelku kategorii na stronie głównej
- Domyślnie okładką jest pierwsze zdjęcie w kategorii

### US-007: Usuwanie kategorii

Jako fotograf chcę usuwać kategorie, aby utrzymać portfolio uporządkowane.

Kryteria akceptacji:

- Przy każdej kategorii jest przycisk "Usuń"
- Po kliknięciu wyświetla się modal z potwierdzeniem
- Modal informuje o liczbie zdjęć w kategorii
- Zdjęcia z usuniętej kategorii tracą przypisanie (stają się niewidoczne)
- Po potwierdzeniu kategoria jest usuwana
- Wyświetla się komunikat potwierdzający usunięcie
- Można anulować usuwanie

### US-008: Upload pojedynczego zdjęcia

Jako fotograf chcę dodać zdjęcie do portfolio, aby prezentować swoje prace.

Kryteria akceptacji:

- W panelu admina jest opcja "Dodaj zdjęcia"
- Można wybrać plik przez przycisk lub przeciągnięcie (drag & drop)
- Akceptowany jest tylko format JPEG
- Maksymalny rozmiar pliku to 10 MB
- Wyświetla się progress bar podczas uploadu
- Po uploadzie generowane są automatycznie: miniaturka (400px), podgląd (1200px)
- Można przypisać zdjęcie do kategorii
- Wyświetla się komunikat potwierdzający upload
- Przy przekroczeniu limitu 200 zdjęć wyświetla się komunikat błędu

### US-009: Batch upload wielu zdjęć

Jako fotograf chcę dodawać wiele zdjęć naraz, aby szybciej budować portfolio.

Kryteria akceptacji:

- Można wybrać wiele plików jednocześnie
- Drag & drop obsługuje wiele plików
- Wyświetla się lista wybranych plików z progress barami
- Wszystkie zdjęcia są przypisywane do wybranej kategorii
- Nieprawidłowe pliki (zły format, za duży rozmiar) są oznaczane błędem
- Prawidłowe pliki są uploadowane mimo błędów w innych
- Po zakończeniu wyświetla się podsumowanie (ile udanych, ile błędów)

### US-010: Walidacja uploadowanego pliku

Jako system chcę walidować uploadowane pliki, aby zapewnić poprawność danych.

Kryteria akceptacji:

- Pliki inne niż JPEG są odrzucane z komunikatem "Dozwolony tylko format JPEG"
- Pliki większe niż 10 MB są odrzucane z komunikatem "Maksymalny rozmiar pliku to 10 MB"
- Przy przekroczeniu limitu 200 zdjęć wyświetla się komunikat "Osiągnięto limit zdjęć"
- Walidacja następuje przed rozpoczęciem uploadu
- Użytkownik widzi szczegóły błędu dla każdego odrzuconego pliku

### US-011: Edycja zdjęcia

Jako fotograf chcę edytować dane zdjęcia, aby aktualizować tytuły i kategorię.

Kryteria akceptacji:

- Przy każdym zdjęciu w panelu jest przycisk "Edytuj"
- Formularz zawiera: tytuł (opcjonalny), wybór kategorii, status publikacji
- Można zmienić kategorię przypisania
- Można włączyć/wyłączyć publikację
- Zmiany są zapisywane po kliknięciu "Zapisz"
- Wyświetla się komunikat potwierdzający edycję

### US-012: Toggle publikacji zdjęcia

Jako fotograf chcę ukrywać i pokazywać zdjęcia, aby kontrolować co jest widoczne publicznie.

Kryteria akceptacji:

- Przy każdym zdjęciu jest toggle/przełącznik publikacji
- Zmiana statusu jest natychmiastowa (bez dodatkowego zapisywania)
- Ukryte zdjęcia nie są widoczne w publicznej galerii
- Ukryte zdjęcia są oznaczone w panelu admina
- Można filtrować zdjęcia po statusie publikacji

### US-013: Usuwanie zdjęcia

Jako fotograf chcę usuwać zdjęcia, aby utrzymać portfolio aktualnym.

Kryteria akceptacji:

- Przy każdym zdjęciu jest przycisk "Usuń"
- Po kliknięciu wyświetla się modal z potwierdzeniem
- Modal pokazuje miniaturkę usuwanego zdjęcia
- Po potwierdzeniu zdjęcie jest trwale usuwane
- Usuwane są obie wersje (miniaturka i podgląd) z storage
- Wyświetla się komunikat potwierdzający usunięcie
- Można anulować usuwanie

### US-014: Edycja profilu fotografa

Jako fotograf chcę edytować swoje dane profilowe, aby aktualizować informacje kontaktowe.

Kryteria akceptacji:

- W panelu admina jest sekcja "Profil" lub "O mnie"
- Formularz zawiera pola: imię/nazwa, bio, email kontaktowy, telefon
- Pola email i telefon mają walidację formatu
- Zmiany są zapisywane po kliknięciu "Zapisz"
- Wyświetla się komunikat potwierdzający zapisanie
- Dane są widoczne na publicznej stronie "O mnie"

### US-015: Przeglądanie kategorii przez odwiedzającego

Jako odwiedzający chcę przeglądać kategorie zdjęć, aby szybko znaleźć interesujący mnie typ fotografii.

Kryteria akceptacji:

- Strona główna wyświetla kafelki wszystkich kategorii
- Każdy kafelek zawiera: okładkę, nazwę, opis
- Kafelki są responsywne (układ dostosowuje się do ekranu)
- Kliknięcie kafelka przenosi do galerii kategorii
- Puste kategorie (bez zdjęć) nie są wyświetlane
- Strona ładuje się w czasie poniżej 3 sekund

### US-016: Przeglądanie galerii zdjęć w kategorii

Jako odwiedzający chcę przeglądać zdjęcia w kategorii, aby ocenić styl fotografa.

Kryteria akceptacji:

- Strona kategorii wyświetla zdjęcia w układzie masonry
- Zdjęcia są ładowane lazy loading (podczas scrollowania)
- Wyświetlane są tylko opublikowane zdjęcia
- Zdjęcia są posortowane od najnowszych
- Widoczna jest nazwa kategorii i opis
- Strona jest responsywna

### US-017: Podgląd zdjęcia w lightbox

Jako odwiedzający chcę powiększyć zdjęcie, aby zobaczyć szczegóły.

Kryteria akceptacji:

- Kliknięcie zdjęcia otwiera lightbox z powiększonym podglądem
- Lightbox wyświetla zdjęcie w rozmiarze 1200px
- Można zamknąć lightbox: przyciskiem X, klawiszem Escape, kliknięciem poza zdjęciem
- Tło jest przyciemnione
- Na mobile lightbox zajmuje cały ekran

### US-018: Nawigacja między zdjęciami w lightbox

Jako odwiedzający chcę przechodzić między zdjęciami, aby przeglądać galerię bez zamykania lightboxa.

Kryteria akceptacji:

- W lightboxie są widoczne strzałki nawigacji (poprzednie/następne)
- Można nawigować klawiszami strzałek na klawiaturze
- Na mobile można nawigować gestem swipe
- Po ostatnim zdjęciu nawigacja "w prawo" wraca do pierwszego (lub jest nieaktywna)
- Wyświetla się informacja o numerze zdjęcia (np. "3 z 15")

### US-019: Blokada pobierania zdjęć

Jako fotograf chcę, aby odwiedzający nie mogli łatwo pobierać moich zdjęć, aby chronić moje prace.

Kryteria akceptacji:

- Prawy przycisk myszy na zdjęciach nie wyświetla opcji "Zapisz obraz"
- Przeciąganie zdjęć jest zablokowane
- Zdjęcia nie są dostępne w pełnej rozdzielczości (tylko 1200px)
- Oryginalne pliki nie są przechowywane

### US-020: Przeglądanie strony "O mnie"

Jako odwiedzający chcę zobaczyć informacje o fotografie, aby dowiedzieć się więcej i skontaktować się.

Kryteria akceptacji:

- Strona /o-mnie wyświetla: imię/nazwę, bio, email, telefon
- Email jest klikalny (mailto:)
- Telefon jest klikalny na mobile (tel:)
- Strona jest responsywna
- Link do strony "O mnie" jest dostępny w nawigacji

### US-021: Nawigacja po stronie

Jako odwiedzający chcę łatwo nawigować po stronie, aby przeglądać różne sekcje portfolio.

Kryteria akceptacji:

- Na każdej stronie jest widoczna nawigacja
- Nawigacja zawiera: logo/nazwę, link do galerii (strona główna), link do "O mnie"
- Na mobile nawigacja jest zwinięta (hamburger menu)
- Aktywna strona jest oznaczona w nawigacji
- Kliknięcie logo przenosi na stronę główną

### US-022: Wyświetlanie strony 404

Jako odwiedzający który wpisał błędny URL chcę zobaczyć przyjazną stronę błędu, aby wiedzieć że strona nie istnieje.

Kryteria akceptacji:

- Nieistniejące URL wyświetlają stronę 404
- Strona 404 jest spójna z designem portfolio
- Wyświetla się komunikat o nieistniejącej stronie
- Jest przycisk/link "Wróć do strony głównej"
- Strona 404 ma odpowiedni kod HTTP (404)

### US-023: SEO i udostępnianie w social media

Jako fotograf chcę, aby moje portfolio było dobrze widoczne w wyszukiwarkach i ładnie wyglądało przy udostępnianiu, aby przyciągać klientów.

Kryteria akceptacji:

- Każda strona ma unikalne meta tagi: title, description
- Strona główna ma Open Graph tags (og:title, og:description, og:image)
- Strony kategorii mają Open Graph z okładką kategorii jako og:image
- HTML jest semantyczny (nagłówki, sekcje)
- Strona ma poprawną strukturę nagłówków (h1, h2, h3)

### US-024: Responsywność na urządzeniach mobilnych

Jako odwiedzający korzystający z telefonu chcę wygodnie przeglądać portfolio, aby ocenić prace fotografa.

Kryteria akceptacji:

- Wszystkie strony są w pełni funkcjonalne na mobile
- Galeria masonry dostosowuje liczbę kolumn do szerokości ekranu
- Lightbox działa poprawnie na mobile (swipe, pełny ekran)
- Teksty są czytelne bez zoomowania
- Przyciski i linki są wystarczająco duże do tapnięcia
- Nawigacja jest dostępna jako menu hamburger

### US-025: Filtrowanie zdjęć w panelu admina

Jako fotograf chcę filtrować zdjęcia w panelu, aby łatwiej zarządzać dużą liczbą zdjęć.

Kryteria akceptacji:

- W panelu admina jest filtr po kategorii
- Można wybrać kategorię z listy rozwijanej
- Lista zdjęć aktualizuje się po wybraniu filtru
- Jest opcja "Wszystkie" pokazująca wszystkie zdjęcia
- Jest opcja "Bez kategorii" pokazująca nieprzypisane zdjęcia
- Liczba zdjęć jest widoczna przy każdej opcji filtru

### US-026: Informacja o limitach

Jako fotograf chcę widzieć wykorzystanie limitów, aby wiedzieć ile zdjęć/kategorii mogę jeszcze dodać.

Kryteria akceptacji:

- W panelu admina jest widoczna informacja o wykorzystaniu limitów
- Wyświetla się: liczba zdjęć / limit (np. "45 / 200")
- Wyświetla się: liczba kategorii / limit (np. "3 / 10")
- Przy zbliżaniu się do limitu (90%) wyświetla się ostrzeżenie
- Po osiągnięciu limitu opcja dodawania jest zablokowana

### US-027: Obsługa błędów sieciowych podczas uploadu

Jako fotograf chcę być informowany o błędach sieciowych, aby wiedzieć że upload się nie powiódł.

Kryteria akceptacji:

- Przy błędzie sieci wyświetla się komunikat błędu
- Można ponowić upload nieudanych plików
- Udane uploady nie są tracone przy błędzie kolejnych
- Progress bar pokazuje stan "błąd" dla nieudanych plików
- Jest przycisk "Ponów" dla nieudanych uploadów

## 6. Metryki sukcesu

### 6.1 Metryki funkcjonalne

| Metryka                 | Cel                                               | Sposób mierzenia                                            |
| ----------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| Samodzielność fotografa | 100% operacji bez wsparcia technicznego           | Brak zgłoszeń pomocy technicznej dot. podstawowych operacji |
| Kompletność funkcji     | Wszystkie historyjki użytkownika zaimplementowane | Checklist funkcjonalności                                   |
| Pokrycie testami        | Wszystkie kryteria akceptacji testowalne          | Testy manualne/automatyczne                                 |

### 6.2 Metryki wydajnościowe

| Metryka                       | Cel                            | Sposób mierzenia                       |
| ----------------------------- | ------------------------------ | -------------------------------------- |
| Czas ładowania strony głównej | < 3 sekundy                    | Lighthouse, WebPageTest                |
| Czas ładowania galerii        | < 2 sekundy (pierwsze zdjęcia) | Pomiar czasu do First Contentful Paint |
| Czas uploadu zdjęcia          | < 10 sekund dla pliku 10 MB    | Pomiar w aplikacji                     |
| Responsywność lightbox        | < 500 ms otwarcie              | Pomiar w aplikacji                     |

### 6.3 Metryki jakościowe

| Metryka         | Cel                                             | Sposób mierzenia                           |
| --------------- | ----------------------------------------------- | ------------------------------------------ |
| Błędy krytyczne | 0 w pierwszym miesiącu                          | Monitoring błędów, zgłoszenia użytkowników |
| Kompatybilność  | 100% funkcji działa w docelowych przeglądarkach | Testy cross-browser                        |
| Responsywność   | 100% funkcji działa na mobile                   | Testy na urządzeniach mobilnych            |

### 6.4 Metryki biznesowe

| Metryka                 | Cel                                                   | Sposób mierzenia          |
| ----------------------- | ----------------------------------------------------- | ------------------------- |
| Adopcja                 | Portfolio używane jako główna wizytówka               | Feedback od fotografa     |
| Czas do uruchomienia    | Pierwsze publiczne portfolio w < 1 dzień od wdrożenia | Data pierwszej publikacji |
| Zadowolenie użytkownika | Pozytywna ocena UX                                    | Feedback od fotografa     |

### 6.5 Definicja sukcesu MVP

MVP zostanie uznane za sukces, gdy:

1. Fotograf może samodzielnie zalogować się i zarządzać zdjęciami bez wsparcia technicznego
2. Aplikacja ładuje i wyświetla zdjęcia szybko (< 3s dla strony głównej)
3. Portfolio jest wykorzystywane jako główna wizytówka fotografa
4. Brak krytycznych błędów blokujących użytkowanie w pierwszym miesiącu po wdrożeniu
5. Wszystkie 27 historyjek użytkownika zostało zaimplementowanych i przetestowanych
