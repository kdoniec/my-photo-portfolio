export const ENVIRONMENTS = ["local", "integration", "production"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const FEATURES = ["auth", "collections"] as const;
export type FeatureName = (typeof FEATURES)[number];

export type FeatureConfig = Record<FeatureName, boolean>;
export type EnvironmentConfig = Record<Environment, FeatureConfig>;
