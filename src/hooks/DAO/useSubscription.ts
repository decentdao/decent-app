import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { Address } from 'viem';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { getSubscriptionStatus } from '../../providers/App/decentAPI';
import {
  SubscriptionStatus,
  SubscriptionTier,
  SubscriptionData,
  TIER_HIERARCHY,
} from '../../types/subscription';

type SubscriptionCache = Record<
  string,
  {
    data: SubscriptionData | null;
    isLoading: boolean;
    error: Error | null;
  }
>;

const useSharedSubscriptionState = () => {
  const [subscriptionCache, setSubscriptionCache] = useState<SubscriptionCache>({});
  const isFeatureFlagEnabled = useFeatureFlag('flag_subscriptions');

  // TODO: Remove these temporary subscription tier flags after feature deployment
  const isTierFreeEnabled = useFeatureFlag('flag_subscriptions_tier_free');
  const isTierProEnabled = useFeatureFlag('flag_subscriptions_tier_pro');
  const isTierAdvancedEnabled = useFeatureFlag('flag_subscriptions_tier_advanced');
  const isTierEnterpriseEnabled = useFeatureFlag('flag_subscriptions_tier_enterprise');

  const getMockSubscriptionData = useCallback(
    (chainId: number): SubscriptionData | null => {
      // Only apply mock logic on Sepolia (chainId 11155111)
      if (chainId !== 11155111) {
        return null;
      }

      // Check tier flags in hierarchy order: enterprise → advanced → pro → free
      if (isTierEnterpriseEnabled) {
        return {
          tier: SubscriptionTier.Enterprise,
          startTimestamp: null,
          endTimestamp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year from now
        };
      }
      if (isTierAdvancedEnabled) {
        return {
          tier: SubscriptionTier.Advanced,
          startTimestamp: null,
          endTimestamp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year from now
        };
      }
      if (isTierProEnabled) {
        return {
          tier: SubscriptionTier.Pro,
          startTimestamp: null,
          endTimestamp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year from now
        };
      }
      if (isTierFreeEnabled) {
        return {
          tier: SubscriptionTier.Free,
          startTimestamp: null,
          endTimestamp: null,
        };
      }

      // If flag_subscriptions is disabled, return default mock data (Advanced tier)
      if (!isFeatureFlagEnabled) {
        return {
          tier: SubscriptionTier.Advanced,
          startTimestamp: null,
          endTimestamp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year from now
        };
      }

      return null; // No mock data, proceed with API call
    },
    [
      isFeatureFlagEnabled,
      isTierFreeEnabled,
      isTierProEnabled,
      isTierAdvancedEnabled,
      isTierEnterpriseEnabled,
    ],
  );

  const fetchSubscription = useCallback(
    async (daoAddress: Address, chainId: number) => {
      const cacheKey = `${chainId}-${daoAddress}`;

      setSubscriptionCache(prev => ({
        ...prev,
        [cacheKey]: { ...prev[cacheKey], isLoading: true, error: null },
      }));

      try {
        // Check for mock data first
        const mockData = getMockSubscriptionData(chainId);
        if (mockData) {
          setSubscriptionCache(prev => ({
            ...prev,
            [cacheKey]: { data: mockData, isLoading: false, error: null },
          }));
          return;
        }

        // Otherwise, call the API
        const data = await getSubscriptionStatus(chainId, daoAddress);
        setSubscriptionCache(prev => ({
          ...prev,
          [cacheKey]: { data, isLoading: false, error: null },
        }));
      } catch (e) {
        setSubscriptionCache(prev => ({
          ...prev,
          [cacheKey]: { data: null, isLoading: false, error: e as Error },
        }));
      }
    },
    [getMockSubscriptionData],
  );

  return { subscriptionCache, fetchSubscription };
};

export function useSubscription(daoAddress: Address, chainId: number): SubscriptionStatus {
  const { subscriptionCache, fetchSubscription } = useBetween(useSharedSubscriptionState);

  const cacheKey = `${chainId}-${daoAddress}`;
  const cached = subscriptionCache[cacheKey];

  useEffect(() => {
    if (!daoAddress || !chainId) return;
    if (!cached || cached.error) {
      fetchSubscription(daoAddress, chainId);
    }
  }, [daoAddress, chainId, cached, fetchSubscription]);

  const data = cached?.data;
  const tier: SubscriptionTier = data?.tier || SubscriptionTier.Free;
  const endDate = data?.endTimestamp ? new Date(data.endTimestamp * 1000) : null;
  const isPaidTier = tier !== SubscriptionTier.Free;
  const notExpired = !endDate || endDate > new Date();
  const isActive = isPaidTier && notExpired;

  const hasTier = useCallback(
    (requiredTier: SubscriptionTier): boolean => {
      return TIER_HIERARCHY[tier] >= TIER_HIERARCHY[requiredTier];
    },
    [tier],
  );

  return {
    isActive,
    tier,
    endDate,
    isLoading: cached?.isLoading ?? true,
    error: cached?.error ?? null,
    hasTier,
  };
}
