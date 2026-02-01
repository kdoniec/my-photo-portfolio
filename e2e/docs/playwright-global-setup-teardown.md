# Playwright Global Setup & Teardown

Playwright oferuje **dwa podejścia** do konfiguracji globalnego setup/teardown, które uruchamiają się przed i po całym zestawie testów.

## 1. Project Dependencies (zalecane)

Nowocześniejsze podejście z pełną integracją z test runnerem. Według dokumentacji: "your HTML report will include the global setup, traces will be recorded, and fixtures can be used."

### Konfiguracja

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'setup db',
      testMatch: /global\.setup\.ts/,
      teardown: 'cleanup db', // <-- wskazuje projekt teardown
    },
    {
      name: 'cleanup db',
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup db'],
    },
  ],
});
```

### Plik Setup

```typescript
// tests/global.setup.ts
import { test as setup } from '@playwright/test';

setup('create database', async ({}) => {
  console.log('creating test database...');
  // logika setup
});
```

### Plik Teardown

```typescript
// tests/global.teardown.ts
import { test as teardown } from '@playwright/test';

teardown('delete database', async ({}) => {
  console.log('deleting test database...');
  // logika cleanup
});
```

### Zalety Project Dependencies

- Widoczne w HTML report jako osobny projekt
- Pełne wsparcie dla trace recording
- Dostęp do fixtures
- Zintegrowana obsługa retry i parallelizacji

## 2. Config-based (legacy)

Starsze podejście używające opcji konfiguracyjnych:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
});
```

```typescript
// global-setup.ts
async function globalSetup() {
  console.log('Global setup...');
}

export default globalSetup;
```

```typescript
// global-teardown.ts
async function globalTeardown() {
  console.log('Global teardown...');
}

export default globalTeardown;
```

### Ograniczenia

- Brak niektórych funkcji dostępnych w project dependencies
- Nie pojawia się w HTML report
- Brak wsparcia dla trace recording
- Brak dostępu do fixtures

## Kiedy uruchamia się Teardown?

Teardown uruchamia się **po zakończeniu wszystkich zależnych projektów**. Kolejność wykonania:

1. `setup db` - uruchamia się pierwszy
2. `chromium` (i inne projekty zależne od setup) - uruchamiają się po setup
3. `cleanup db` - uruchamia się na końcu, po wszystkich zależnych projektach

## Typowe przypadki użycia

### Czyszczenie bazy danych

```typescript
teardown('cleanup database', async ({}) => {
  await db.query('DELETE FROM test_users WHERE email LIKE %test%');
  await db.query('DELETE FROM test_data');
});
```

### Usuwanie plików tymczasowych

```typescript
teardown('cleanup files', async ({}) => {
  await fs.rm('./test-uploads', { recursive: true, force: true });
});
```

### Authentication State

Częsty wzorzec polega na zapisaniu stanu logowania podczas setup i ponownym użyciu go w testach poprzez `storageState`:

```typescript
// global.setup.ts
setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'password');
  await page.click('button[type="submit"]');
  await page.context().storageState({ path: './auth.json' });
});
```

```typescript
// playwright.config.ts
use: {
  storageState: './auth.json',
},
```

## Źródło

- [Playwright Docs: Global Setup and Teardown](https://playwright.dev/docs/test-global-setup-teardown)
