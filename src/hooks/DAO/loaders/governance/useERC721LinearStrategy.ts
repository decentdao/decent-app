import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback, useMemo } from 'react';
import { getContract } from 'viem';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { FractalGovernanceAction } from '../../../../providers/App/governance/action';
import { VotingStrategyType } from '../../../../types';
import { blocksToSeconds } from '../../../../utils/contract';
import useNetworkPublicClient from '../../../useNetworkPublicClient';
import { useTimeHelpers } from '../../../utils/useTimeHelpers';
import { useCurrentDAOKey } from '../../useCurrentDAOKey';

export const useERC721LinearStrategy = () => {
  const { daoKey } = useCurrentDAOKey();
  const {
    governanceContracts: {
      linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress,
      moduleAzoriusAddress,
    },
    action,
  } = useDAOStore({ daoKey });
  const { getTimeDuration } = useTimeHelpers();
  const publicClient = useNetworkPublicClient();

  const erc721LinearVotingContract = useMemo(() => {
    const votingStrategyAddress =
      linearVotingErc721Address || linearVotingErc721WithHatsWhitelistingAddress;
    if (!votingStrategyAddress) {
      return;
    }

    return getContract({
      abi: abis.LinearERC721Voting,
      address: votingStrategyAddress,
      client: publicClient,
    });
  }, [linearVotingErc721Address, linearVotingErc721WithHatsWhitelistingAddress, publicClient]);

  const loadERC721Strategy = useCallback(async () => {
    if (!moduleAzoriusAddress || !erc721LinearVotingContract) {
      return;
    }

    const azoriusContract = getContract({
      abi: abis.Azorius,
      address: moduleAzoriusAddress,
      client: publicClient,
    });

    const [
      votingPeriodBlocks,
      quorumThreshold,
      proposerThreshold,
      timeLockPeriod,
      executionPeriod,
    ] = await Promise.all([
      erc721LinearVotingContract.read.votingPeriod(),
      erc721LinearVotingContract.read.quorumThreshold(),
      erc721LinearVotingContract.read.proposerThreshold(),
      azoriusContract.read.timelockPeriod(),
      azoriusContract.read.executionPeriod(),
    ]);

    const votingPeriodValue = await blocksToSeconds(votingPeriodBlocks, publicClient);
    const timeLockPeriodValue = await blocksToSeconds(timeLockPeriod, publicClient);
    const executionPeriodValue = await blocksToSeconds(executionPeriod, publicClient);
    const votingData = {
      proposerThreshold: {
        value: proposerThreshold,
        formatted: proposerThreshold.toString(),
      },
      votingPeriod: {
        value: BigInt(votingPeriodValue),
        formatted: getTimeDuration(votingPeriodValue),
      },
      quorumThreshold: {
        value: quorumThreshold,
        formatted: quorumThreshold.toString(),
      },
      timeLockPeriod: {
        value: BigInt(timeLockPeriodValue),
        formatted: getTimeDuration(timeLockPeriodValue),
      },
      executionPeriod: {
        value: BigInt(executionPeriodValue),
        formatted: getTimeDuration(executionPeriodValue),
      },
      strategyType: VotingStrategyType.LINEAR_ERC721,
    };
    action.dispatch({ type: FractalGovernanceAction.SET_STRATEGY, payload: votingData });
  }, [action, moduleAzoriusAddress, erc721LinearVotingContract, getTimeDuration, publicClient]);

  return loadERC721Strategy;
};
