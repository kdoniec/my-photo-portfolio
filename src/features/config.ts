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
  production: {
    auth: false,
    collections: false,
  },
};
