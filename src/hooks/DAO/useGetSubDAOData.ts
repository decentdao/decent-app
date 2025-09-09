import { legacy } from '@decentdao/decent-contracts';
import { useCallback } from 'react';
import { Address, getContract } from 'viem';
import { SubDAO } from '../../types';
import useNetworkPublicClient from '../useNetworkPublicClient';

export const useGetSubDAOData = () => {
  const publicClient = useNetworkPublicClient();

  const getSubDAOData = useCallback(
    async (guardAddress: Address): Promise<Partial<SubDAO>> => {
      if (!guardAddress) return {};

      const freezeGuardContract = getContract({
        address: guardAddress,
        abi: legacy.abis.MultisigFreezeGuard,
        client: publicClient,
      });

      const [timelock, execution, freezeVotingAddress] = await Promise.all([
        freezeGuardContract.read.timelockPeriod(),
        freezeGuardContract.read.executionPeriod(),
        freezeGuardContract.read.freezeVoting(),
      ]);

      const freezeVotingContract = getContract({
        address: freezeVotingAddress,
        abi: legacy.abis.MultisigFreezeVoting, // Assuming multisig freeze voting for now
        client: publicClient,
      });

      const [freezeVotesThreshold, freezeProposalPeriod, freezePeriod] = await Promise.all([
        freezeVotingContract.read.freezeVotesThreshold(),
        freezeVotingContract.read.freezeProposalPeriod(),
        freezeVotingContract.read.freezePeriod(),
      ]);

      return {
        timelockPeriod: BigInt(timelock),
        executionPeriod: BigInt(execution),
        freezeVotesThreshold,
        freezeProposalPeriod: BigInt(freezeProposalPeriod),
        freezePeriod: BigInt(freezePeriod),
      };
    },
    [publicClient],
  );

  return { getSubDAOData };
};
