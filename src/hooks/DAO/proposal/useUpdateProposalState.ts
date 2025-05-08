import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback } from 'react';
import { getContract } from 'viem';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useGlobalStore } from '../../../store/store';
import { getAzoriusProposalState } from '../../../utils';
import useNetworkPublicClient from '../../useNetworkPublicClient';
import { useCurrentDAOKey } from '../useCurrentDAOKey';

export default function useUpdateProposalState() {
  const { daoKey } = useCurrentDAOKey();
  const {
    governanceContracts: { moduleAzoriusAddress },
  } = useDAOStore({ daoKey });
  const { setProposalState } = useGlobalStore();
  const publicClient = useNetworkPublicClient();
  const updateProposalState = useCallback(
    async (proposalId: number) => {
      if (!moduleAzoriusAddress || !daoKey) {
        return;
      }
      const azoriusContract = getContract({
        abi: abis.Azorius,
        address: moduleAzoriusAddress,
        client: publicClient,
      });

      const newState = await getAzoriusProposalState(azoriusContract, proposalId);
      setProposalState(daoKey, proposalId.toString(), newState);
    },
    [moduleAzoriusAddress, publicClient, setProposalState, daoKey],
  );

  return updateProposalState;
}
