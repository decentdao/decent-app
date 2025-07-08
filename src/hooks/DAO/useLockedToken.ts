import { abis } from '@decentdao/decent-contracts';
import { useCallback, useEffect, useState } from 'react';
import { Address, getContract, keccak256, toHex } from 'viem';
import useNetworkPublicClient from '../useNetworkPublicClient';

interface LockedTokenState {
  locked: boolean;
  whitelisted: boolean;
  canTransfer: boolean;
  needWhitelist: boolean;
}

const DEFAULT_STATE = {
  locked: false,
  whitelisted: false,
  canTransfer: true,
  needWhitelist: false,
};

export default function useLockedToken(
  params: { token: Address; account: Address } | undefined = undefined,
) {
  const publicClient = useNetworkPublicClient();
  const [tokenState, setTokenState] = useState<LockedTokenState>(DEFAULT_STATE);

  const loadTokenState = useCallback(
    async (token: Address, account: Address): Promise<LockedTokenState> => {
      const contract = getContract({
        abi: abis.deployables.VotesERC20V1,
        address: token,
        client: publicClient,
      });
      const transferFromRole = keccak256(toHex('TRANSFER_FROM_ROLE'));

      try {
        const [locked, whitelisted] = await Promise.all([
          contract.read.locked(),
          contract.read.hasRole([transferFromRole, account]),
        ]);

        return {
          locked,
          whitelisted,
          canTransfer: !locked || whitelisted,
          needWhitelist: locked && !whitelisted,
        };
      } catch (e) {
        console.warn('Failed to read locked token state', e);
        return DEFAULT_STATE;
      }
    },
    [publicClient],
  );

  useEffect(() => {
    if (params?.token && params?.account) {
      loadTokenState(params.token, params.account).then(s => setTokenState(s));
    }
  }, [params?.token, params?.account, loadTokenState]);

  return {
    tokenState,
    loadTokenState,
  };
}
