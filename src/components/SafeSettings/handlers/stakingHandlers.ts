import { abis } from '@decentdao/decent-contracts';
import { Address, encodeFunctionData } from 'viem';
import {
  BigIntValuePair,
  CreateProposalActionData,
  CreateProposalTransaction,
  FractalGovernance,
  GovernanceType,
  ProposalActionType,
} from '../../../types';
import {
  getStakingContractAddress,
  getStakingContractSaltNonce,
} from '../../../utils/stakingContractUtils';
import { isNonEmpty } from '../../../utils/valueCheck';
import { SafeSettingsEdits } from '../types';

interface StakingHandlerDependencies {
  safe: { address: Address } | null;
  governance: FractalGovernance;
  votesERC20StakedV1MasterCopy: Address;
  zodiacModuleProxyFactory: Address;
  ethValue: BigIntValuePair;
  chainId: number;
  t: (key: string, options?: { ns: string }) => string;
}

export const handleEditStaking = async (
  updatedValues: SafeSettingsEdits,
  deps: StakingHandlerDependencies,
): Promise<{ action: CreateProposalActionData; title: string }> => {
  const {
    safe,
    governance,
    votesERC20StakedV1MasterCopy,
    zodiacModuleProxyFactory,
    ethValue,
    chainId,
    t,
  } = deps;

  if (!safe?.address) {
    throw new Error('Safe address is not set');
  }

  if (!votesERC20StakedV1MasterCopy) {
    throw new Error('VotesERC20StakedV1MasterCopy is not set');
  }

  if (!isNonEmpty(updatedValues.staking)) {
    throw new Error('Staking are not set');
  }
  const stakingValues = updatedValues.staking!;

  const stakingContract = governance.stakedToken;

  const changeTitles = [];
  const transactions: CreateProposalTransaction[] = [];

  if (stakingValues.deploying) {
    if (stakingContract !== undefined) {
      throw new Error('Staking contract already deployed');
    }

    if (stakingValues.minimumStakingPeriod === undefined) {
      throw new Error('minimumStakingPeriod parameters are not set');
    }

    let daoErc20Token;
    if (governance.type === GovernanceType.AZORIUS_ERC20) {
      daoErc20Token = governance.votesToken;
    } else if (governance.type === GovernanceType.MULTISIG) {
      daoErc20Token = governance.erc20Token;
    }
    if (daoErc20Token === undefined) {
      throw new Error('No ERC20 to be staked');
    }

    const encodedInitializationData = encodeFunctionData({
      abi: abis.deployables.VotesERC20StakedV1,
      functionName: 'initialize',
      args: [safe.address, daoErc20Token.address],
    });

    changeTitles.push(t('deployStakingContract', { ns: 'proposalMetadata' }));
    transactions.push({
      targetAddress: zodiacModuleProxyFactory,
      ethValue,
      functionName: 'deployModule',
      parameters: [
        {
          signature: 'address',
          value: votesERC20StakedV1MasterCopy,
        },
        {
          signature: 'bytes',
          value: encodedInitializationData,
        },
        {
          signature: 'uint256',
          value: getStakingContractSaltNonce(safe.address, chainId).toString(),
        },
      ],
    });
    const predictedStakingAddress = getStakingContractAddress({
      safeAddress: safe.address,
      stakedTokenAddress: daoErc20Token.address,
      zodiacModuleProxyFactory,
      stakingContractMastercopy: votesERC20StakedV1MasterCopy,
      chainId,
    });
    transactions.push({
      targetAddress: predictedStakingAddress,
      ethValue,
      functionName: 'initialize2',
      parameters: [
        {
          signature: 'bool',
          value: 'false',
        },
        {
          signature: 'uint256',
          value: stakingValues.minimumStakingPeriod.bigintValue?.toString(),
        },
        {
          signature: 'address[]',
          value: `[${(stakingValues.newRewardTokens || []).join(',')}]`,
        },
      ],
    });
  } else {
    // If deploying is false or undefined, then we are updating the staking contract
    if (stakingContract === undefined) {
      throw new Error('Staking contract not deployed');
    }

    if (stakingValues.minimumStakingPeriod !== undefined) {
      transactions.push({
        targetAddress: stakingContract.address,
        ethValue,
        functionName: 'updateMinimumStakingPeriod',
        parameters: [
          {
            signature: 'uint256',
            value: stakingValues.minimumStakingPeriod.bigintValue?.toString(),
          },
        ],
      });
      changeTitles.push(t('updateStakingMinPeriod', { ns: 'proposalMetadata' }));
    }

    if (stakingValues.newRewardTokens !== undefined) {
      transactions.push({
        targetAddress: stakingContract.address,
        ethValue,
        functionName: 'addRewardsTokens',
        parameters: [
          {
            signature: 'address[]',
            value: `[${stakingValues.newRewardTokens.join(',')}]`,
          },
        ],
      });
      changeTitles.push(t('addStakingRewardTokens', { ns: 'proposalMetadata' }));
    }
  }

  const title = changeTitles.join(`; `);

  const action: CreateProposalActionData = {
    actionType: ProposalActionType.EDIT,
    transactions,
  };

  return { action, title };
};
