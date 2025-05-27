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
}

const DEFAULT_STATE = {
  locked: false,
  whitelisted: false,
  owner: zeroAddress,
  canTransfer: true,
};

export default function useLockedToken({ token, account }: { token: Address; account: Address }) {
  const publicClient = useNetworkPublicClient();
  const { safeAddress } = useCurrentDAOKey();
  const [tokenState, setTokenState] = useState<LockedTokenState>(DEFAULT_STATE);

  const loadTokenState = useCallback(
    async (tokenParam: Address, accountParam: Address): Promise<LockedTokenState> => {
      const contract = getContract({
        abi: VotesERC20LockableV1Abi,
        address: tokenParam,
        client: publicClient,
      });

      try {
        const [locked, whitelisted, owner] = await Promise.all([
          contract.read.locked(),
          contract.read.whitelisted([accountParam]),
          contract.read.owner(),
        ]);

        return {
          locked,
          whitelisted,
          owner,
          canTransfer: !locked || whitelisted || owner === safeAddress,
        };
      } catch {
        return DEFAULT_STATE;
      }
    },
    [publicClient, safeAddress],
  );

  useEffect(() => {
    loadTokenState(token, account).then(s => setTokenState(s));
  }, [account, loadTokenState, token]);

  return {
    tokenState,
    loadTokenState,
  };
}
