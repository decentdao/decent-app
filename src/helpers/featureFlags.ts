export const FEATURE_FLAGS = [
  'flag_dev',
  'flag_revenue_sharing',
  'flag_gasless_voting',
  'flag_iframe_template',
  'flag_store_v2',
  'flag_locked_token',
  'flag_proposal_v1',
  'flag_feature_agreement',
  'flag_token_deployment',
] as const;

export type FeatureFlagKeys = typeof FEATURE_FLAGS;
export type FeatureFlagKey = (typeof FEATURE_FLAGS)[number];

export interface IFeatureFlags {
  isFeatureEnabled(key: FeatureFlagKey): boolean | undefined;
}

export class FeatureFlags {
  static instance?: IFeatureFlags;
}
