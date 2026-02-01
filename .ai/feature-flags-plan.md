# Plan: Feature Flag Module

## Cel
Stworzenie uniwersalnego modułu TypeScript do zarządzania feature flagami, umożliwiającego separację deploymentów od releasów.

## Wymagania
- Proste wartości `true/false` per environment
- Build-time (statyczna konfiguracja)
- API: `isFeatureEnabled('auth')` z typowaniem
- Środowiska: `local`, `integration`, `prod`
- Flagi początkowe: `auth`, `collections`
- Komunikaty debug przy sprawdzaniu flag
- Zmienna środowiskowa: `ENV_NAME`

## Struktura plików

```
src/features/
├── index.ts      # Główny eksport API
├── config.ts     # Konfiguracja flag per środowisko
└── types.ts      # Typy TypeScript
```

## Pliki do utworzenia/modyfikacji

### 1. `src/features/types.ts`
```typescript
export const ENVIRONMENTS = ["local", "integration", "prod"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const FEATURES = ["auth", "collections"] as const;
export type FeatureName = (typeof FEATURES)[number];

export type FeatureConfig = Record<FeatureName, boolean>;
export type EnvironmentConfig = Record<Environment, FeatureConfig>;
```

### 2. `src/features/config.ts`
```typescript
import type { EnvironmentConfig } from "./types";

export const featureConfig: EnvironmentConfig = {
  local: {
    auth: true,
    collections: true,
  },
  integration: {
    auth: true,
    collections: true,
  },
  prod: {
    auth: false,
    collections: false,
  },
};
```

### 3. `src/features/index.ts`
```typescript
import { featureConfig } from "./config";
import { ENVIRONMENTS, type Environment, type FeatureName } from "./types";

function getEnvironment(): Environment {
  const envName = import.meta.env.ENV_NAME;

  if (!envName) {
    console.warn("[Feature Flag] ENV_NAME not set, defaulting to 'local'");
    return "local";
  }

  if (!ENVIRONMENTS.includes(envName as Environment)) {
    console.warn(`[Feature Flag] Invalid ENV_NAME '${envName}', defaulting to 'local'`);
    return "local";
  }

  return envName as Environment;
}

export function isFeatureEnabled(featureName: FeatureName): boolean {
  const env = getEnvironment();
  const enabled = featureConfig[env][featureName];
  console.log(`[Feature Flag] ${featureName}: ${enabled ? "enabled" : "disabled"} (env: ${env})`);
  return enabled;
}

export function getFeatureConfig() {
  const env = getEnvironment();
  return featureConfig[env];
}

export { type FeatureName, type Environment } from "./types";
```

### 4. `src/env.d.ts` (modyfikacja)
Dodanie deklaracji dla `ENV_NAME` do istniejącego interfejsu:
```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly ENV_NAME?: "local" | "integration" | "prod";
}
```

## API modułu

```typescript
// Główne użycie
import { isFeatureEnabled } from "@/features";

if (isFeatureEnabled("auth")) {
  // funkcjonalność auth włączona
}

// Pomocnicze
import { getEnvironment, getFeatureConfig } from "@/features";

const env = getEnvironment(); // "local" | "integration" | "prod"
const config = getFeatureConfig(); // { auth: true, collections: true }
```

## Zachowanie domyślne
- Brak `ENV_NAME` → domyślnie `local` + warning w konsoli
- Nieprawidłowa wartość `ENV_NAME` → domyślnie `local` + warning

## Weryfikacja
1. Uruchomić `npm run build` - sprawdzić brak błędów TypeScript
2. Uruchomić `npm run lint` - sprawdzić zgodność z ESLint
3. Zaimportować moduł w dowolnym pliku i sprawdzić typowanie
4. Przetestować w `npm run dev` czy komunikaty się wyświetlają
