import { useCallback, useEffect, useState } from 'react';
import { Address, getContract, zeroAddress } from 'viem';
import { VotesERC20LockableV1Abi } from '../../assets/abi/VotesERC20LockableV1';
import useNetworkPublicClient from '../useNetworkPublicClient';
import { useCurrentDAOKey } from './useCurrentDAOKey';

interface LockedTokenState {
  locked: boolean;
  whitelisted: boolean;
  owner: Address;
  canTransfer: boolean;
  needWhitelist: boolean;
}

const DEFAULT_STATE = {
  locked: false,
  whitelisted: false,
  owner: zeroAddress,
  canTransfer: true,
  needWhitelist: false,
};

export default function useLockedToken(
  params: { token: Address; account: Address } | undefined = undefined,
) {
  const publicClient = useNetworkPublicClient();
  const { safeAddress } = useCurrentDAOKey();
  const [tokenState, setTokenState] = useState<LockedTokenState>(DEFAULT_STATE);

  const loadTokenState = useCallback(
    async (token: Address, account: Address): Promise<LockedTokenState> => {
      const contract = getContract({
        abi: VotesERC20LockableV1Abi,
        address: token,
        client: publicClient,
      });

      try {
        const [locked, whitelisted, owner] = await Promise.all([
          contract.read.locked(),
          contract.read.whitelisted([account]),
          contract.read.owner(),
        ]);

        return {
          locked,
          whitelisted,
          owner,
          canTransfer: !locked || whitelisted || owner === account || owner === safeAddress,
          needWhitelist: locked && !whitelisted && owner !== account,
        };
      } catch {
        return DEFAULT_STATE;
      }
    },
    [publicClient, safeAddress],
  );

  useEffect(() => {
    if (params) {
      loadTokenState(params.token, params.account).then(s => setTokenState(s));
    }
  }, [params, loadTokenState]);

  return {
    tokenState,
    loadTokenState,
  };
}
