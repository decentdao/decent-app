import { abis } from '@decentdao/decent-contracts';
import { useCallback, useEffect, useState } from 'react';
import { Address, getContract, zeroAddress } from 'viem';
import { ROLES } from '../../constants/accessControlRoles';
import useNetworkPublicClient from '../useNetworkPublicClient';
import { useCurrentDAOKey } from './useCurrentDAOKey';

interface LockedTokenState {
  locked: boolean;
  whitelisted: boolean;
  canTransfer: boolean;
  needWhitelist: boolean;
  isImportedToken: boolean;
}

const DEFAULT_STATE = {
  locked: false,
  whitelisted: false,
  canTransfer: true,
  needWhitelist: false,
  isImportedToken: true,
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
        abi: abis.deployables.VotesERC20V1,
        address: token,
        client: publicClient,
      });

      try {
        const [locked, whitelisted, canGrantRole] = await Promise.all([
          contract.read.locked(),
          contract.read.hasRole([ROLES.TRANSFER_FROM_ROLE, account]),
          contract.read.hasRole([ROLES.DEFAULT_ADMIN_ROLE, safeAddress || zeroAddress]),
        ]);

        return {
          locked,
          whitelisted,
          canTransfer: !locked || whitelisted || canGrantRole,
          needWhitelist: locked && !whitelisted,
          isImportedToken: false,
        };
      } catch (e) {
        console.warn('Failed to read locked token state', e);
        return DEFAULT_STATE;
      }
    },
    [publicClient, safeAddress],
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
