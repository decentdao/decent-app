import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback, useMemo } from 'react';
import { formatUnits, getContract } from 'viem';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { FractalGovernanceAction } from '../../../../providers/App/governance/action';
import { AzoriusGovernance, VotingStrategyType } from '../../../../types';
import { blocksToSeconds } from '../../../../utils/contract';
import useNetworkPublicClient from '../../../useNetworkPublicClient';
import { useTimeHelpers } from '../../../utils/useTimeHelpers';
import { useCurrentDAOKey } from '../../useCurrentDAOKey';

export const useERC20LinearStrategy = () => {
  const { daoKey } = useCurrentDAOKey();
  const {
    governance,
    governanceContracts: {
      linearVotingErc20Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      moduleAzoriusAddress,
    },
    action,
  } = useDAOStore({ daoKey });
  const { getTimeDuration } = useTimeHelpers();
  const publicClient = useNetworkPublicClient();

  const ozLinearVotingContract = useMemo(() => {
    const votingStrategyAddress =
      linearVotingErc20Address || linearVotingErc20WithHatsWhitelistingAddress;
    if (!votingStrategyAddress) {
      return;
    }

    return getContract({
      abi: abis.LinearERC20Voting,
      address: votingStrategyAddress,
      client: publicClient,
    });
  }, [linearVotingErc20Address, linearVotingErc20WithHatsWhitelistingAddress, publicClient]);

  const loadERC20Strategy = useCallback(async () => {
    if (!ozLinearVotingContract || !moduleAzoriusAddress) {
      return {};
    }

    const azoriusContract = getContract({
      abi: abis.Azorius,
      address: moduleAzoriusAddress,
      client: publicClient,
    });
    const azoriusGovernance = governance as AzoriusGovernance;
    const { votesToken } = azoriusGovernance;
    const [
      votingPeriodBlocks,
      quorumNumerator,
      quorumDenominator,
      timeLockPeriod,
      executionPeriod,
      proposerThreshold,
    ] = await Promise.all([
      ozLinearVotingContract.read.votingPeriod(),
      ozLinearVotingContract.read.quorumNumerator(),
      ozLinearVotingContract.read.QUORUM_DENOMINATOR(),
      azoriusContract.read.timelockPeriod(),
      azoriusContract.read.executionPeriod(),
      ozLinearVotingContract.read.requiredProposerWeight(),
    ]);

    const quorumPercentage = (quorumNumerator * 100n) / quorumDenominator;
    const votingPeriodValue = await blocksToSeconds(votingPeriodBlocks, publicClient);
    const timeLockPeriodValue = await blocksToSeconds(timeLockPeriod, publicClient);
    const executionPeriodValue = await blocksToSeconds(executionPeriod, publicClient);
    const votingData = {
      votingPeriod: {
        value: BigInt(votingPeriodValue),
        formatted: getTimeDuration(votingPeriodValue),
      },
      executionPeriod: {
        value: BigInt(executionPeriodValue),
        formatted: getTimeDuration(executionPeriodValue),
      },
      proposerThreshold: {
        value: proposerThreshold,
        formatted: formatUnits(proposerThreshold, votesToken?.decimals || 18),
      },
      quorumPercentage: {
        value: quorumPercentage,
        formatted: quorumPercentage.toString(),
      },
      timeLockPeriod: {
        value: BigInt(timeLockPeriodValue),
        formatted: getTimeDuration(timeLockPeriodValue),
      },
      strategyType: VotingStrategyType.LINEAR_ERC20,
    };
    action.dispatch({ type: FractalGovernanceAction.SET_STRATEGY, payload: votingData });
  }, [
    action,
    moduleAzoriusAddress,
    getTimeDuration,
    ozLinearVotingContract,
    publicClient,
    governance,
  ]);

  return loadERC20Strategy;
};
