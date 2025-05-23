import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback, useEffect, useRef } from 'react';
import { getContract } from 'viem';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { FractalGovernanceAction } from '../../../../providers/App/governance/action';
import useNetworkPublicClient from '../../../useNetworkPublicClient';
import { useAddressContractType } from '../../../utils/useAddressContractType';
import { useCurrentDAOKey } from '../../useCurrentDAOKey';

export function useERC20Claim() {
  const { daoKey } = useCurrentDAOKey();
  const {
    governanceContracts: { votesTokenAddress },
    node: { safe },
    action,
  } = useDAOStore({ daoKey });
  const publicClient = useNetworkPublicClient();
  const safeAddress = safe?.address;
  const { getAddressContractType } = useAddressContractType();

  const loadTokenClaimContract = useCallback(async () => {
    if (!votesTokenAddress) {
      return;
    }

    const votesTokenContract = getContract({
      abi: abis.VotesERC20,
      address: votesTokenAddress,
      client: publicClient,
    });

    // TODO here be dark programming...

    const approvals = await votesTokenContract.getEvents.Approval(undefined, { fromBlock: 0n });

    if (approvals.length === 0 || !approvals[0].args.spender) {
      return;
    }

    const { isClaimErc20 } = await getAddressContractType(approvals[0].args.spender);
    if (!isClaimErc20) {
      return;
    }

    // action to governance
    action.dispatch({
      type: FractalGovernanceAction.SET_CLAIMING_CONTRACT,
      payload: approvals[0].args.spender,
    });
  }, [action, getAddressContractType, publicClient, votesTokenAddress]);

  const loadKey = useRef<string>();

  useEffect(() => {
    if (safeAddress && votesTokenAddress && safeAddress + votesTokenAddress !== loadKey.current) {
      loadKey.current = safeAddress + votesTokenAddress;
      loadTokenClaimContract();
    }
    if (!safeAddress || !votesTokenAddress) {
      loadKey.current = undefined;
    }
  }, [loadTokenClaimContract, safeAddress, votesTokenAddress]);
  return;
}
