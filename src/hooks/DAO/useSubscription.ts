import { useCallback, useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { Address } from 'viem';
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

  const fetchSubscription = useCallback(async (daoAddress: Address, chainId: number) => {
    const cacheKey = `${chainId}-${daoAddress}`;

    setSubscriptionCache(prev => ({
      ...prev,
      [cacheKey]: { ...prev[cacheKey], isLoading: true, error: null },
    }));

    try {
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
  }, []);

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
