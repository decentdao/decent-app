export enum SubscriptionTier {
  Free = 'free',
  Pro = 'pro',
  Ultimate = 'ultimate',
  Enterprise = 'enterprise',
}

export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  [SubscriptionTier.Free]: 0,
  [SubscriptionTier.Pro]: 1,
  [SubscriptionTier.Ultimate]: 2,
  [SubscriptionTier.Enterprise]: 3,
} as const;

export interface SubscriptionData {
  tier: SubscriptionTier;
  startTimestamp: number | null;
  endTimestamp: number | null;
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: SubscriptionTier;
  endDate: Date | null;
  isLoading: boolean;
  error: Error | null;
  hasTier: (requiredTier: SubscriptionTier) => boolean;
}
