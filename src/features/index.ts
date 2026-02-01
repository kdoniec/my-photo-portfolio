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
