import { ENV_NAME } from "astro:env/server";
import { featureConfig } from "./config";
import type { Environment, FeatureName } from "./types";

function getEnvironment(): Environment {
  return ENV_NAME;
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
