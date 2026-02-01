import type { EnvironmentConfig } from "./types";

export const featureConfig: EnvironmentConfig = {
  local: {
    registration: true,
  },
  integration: {
    registration: true,
  },
  production: {
    registration: false,
  },
};
