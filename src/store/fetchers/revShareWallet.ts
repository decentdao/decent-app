import { useCallback } from 'react';
import { Address } from 'viem';
import { getDaoRevenueSharingWallets } from '../../providers/App/decentAPI';

export function useRevShareWalletFetcher() {
  const fetchRevenueSharingWallets = useCallback(
    async ({ chainId, daoAddress }: { chainId: number; daoAddress: Address }) => {
      try {
        const revenueShareWallets = await getDaoRevenueSharingWallets(chainId, daoAddress);
        return revenueShareWallets;
      } catch {
        return [];
      }
    },
    [],
  );
  return {
    fetchRevenueSharingWallets,
  };
}
