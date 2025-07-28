import { legacy } from '@decentdao/decent-contracts';
import { useCallback } from 'react';
import { Address, GetContractEventsReturnType } from 'viem';

const emptyRevShareWallets = [] as {
  name: string;
  address: Address;
}[];

export function useRevShareWalletFetcher() {
  const fetchRevenueSharingWallets = useCallback(
    async ({
      events,
    }: {
      events: GetContractEventsReturnType<typeof legacy.abis.KeyValuePairs>;
    }) => {
      const mostRecentEvent = events.filter(event => event.args.key === 'revShareWallets').pop();
      if (!mostRecentEvent) {
        return emptyRevShareWallets;
      }
      try {
        // expecting [{ name: string, address: Address }]
        const revShareWalletsData = JSON.parse(mostRecentEvent.args.value as string);
        return revShareWalletsData;
      } catch {
        return emptyRevShareWallets;
      }
    },
    [],
  );
  return {
    fetchRevenueSharingWallets,
  };
}
