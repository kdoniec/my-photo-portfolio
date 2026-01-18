# Aplikacja - My Photo Portfolio (MVP)

### Główny problem

Fotografowie polegają na mediach społecznościowych do prezentacji portfolio, co wiąże się z brakiem kontroli nad wyświetlaniem zdjęć, ograniczonymi opcjami organizacji, rozproszeniem uwagi odbiorcy i nieprofesjonalnym wizerunkiem. Aplikacja umożliwia stworzenie dedykowanej, profesjonalnej galerii online z pełną kontrolą nad prezentacją prac i danymi kontaktowymi.

### Najmniejszy zestaw funkcjonalności

- Publiczna galeria zdjęć z podziałem na kategorie (masonry layout, lightbox z nawigacją)
- Panel administracyjny do zarządzania zdjęciami i kategoriami (CRUD, batch upload z drag & drop)
- Automatyczne przetwarzanie obrazów przy uploadzie (generowanie miniaturki 400px i podglądu 1200px)
- Strona "O mnie" z bio i danymi kontaktowymi (email, telefon)
- Prosty system logowania dla jednego fotografa (email + hasło przez Supabase Auth)
- Responsywny design (mobile-first) z lazy loading zdjęć

### Co NIE wchodzi w zakres MVP

- Obsługa wielu fotografów i system rejestracji
- Prywatne galerie z hasłem lub unikalnym linkiem
- Interakcje klientów (ulubione, komentarze, zamawianie zdjęć)
- System tagów i zaawansowane filtrowanie
- Watermark na zdjęciach
- Ręczne sortowanie zdjęć (drag & drop)
- Obsługa formatów innych niż JPEG
- Monetyzacja i subskrypcje

### Kryteria sukcesu

- Fotograf samodzielnie zarządza portfolio bez wsparcia technicznego
- Strona główna ładuje się w czasie poniżej 3 sekund
- Portfolio jest wykorzystywane jako główna wizytówka fotografa zamiast profili w social media
- Brak krytycznych błędów blokujących użytkowanie w pierwszym miesiącu po wdrożeniu
