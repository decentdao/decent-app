import { legacy } from '@decentdao/decent-contracts';
import { Address, getContract, PublicClient } from 'viem';
import {
  CreateProposalActionData,
  CreateProposalTransaction,
  FractalTokenType,
  ProposalActionType,
} from '../../../types';
import { getEstimatedNumberOfBlocks } from '../../../utils/contract';
import { SafeSettingsEdits } from '../types';

interface AzoriusHandlerDependencies {
  t: (key: string, options?: { ns: string }) => string;
  moduleAzoriusAddress: Address | undefined;
  strategies: Array<{ type: FractalTokenType; address: Address }>;
  ethValue: { bigintValue: bigint; value: string };
  publicClient: PublicClient;
}

export const handleEditAzoriusGovernance = async (
  updatedValues: SafeSettingsEdits,
  deps: AzoriusHandlerDependencies,
): Promise<{ action: CreateProposalActionData; title: string }> => {
  const { t, moduleAzoriusAddress, strategies, ethValue, publicClient } = deps;

  if (!updatedValues.azorius) {
    throw new Error('Azorius settings are not set');
  }

  if (!moduleAzoriusAddress) {
    throw new Error('Azorius module address is not set');
  }

  const { quorumPercentage, quorumThreshold, votingPeriod, timelockPeriod, executionPeriod } =
    updatedValues.azorius;

  const transactions: CreateProposalTransaction[] = [];
  const changeTitles: string[] = [];

  if (quorumPercentage) {
    const erc20Strategies = strategies.filter(s => s.type === FractalTokenType.erc20);
    if (erc20Strategies.length === 0) {
      throw new Error('ERC20 strategy is not set');
    }

    await Promise.all(
      erc20Strategies.map(async strategy => {
        const erc20VotingContract = getContract({
          abi:
            strategy.type === FractalTokenType.erc20
              ? legacy.abis.LinearERC20Voting
              : legacy.abis.LinearERC721Voting,
          address: strategy.address,
          client: publicClient,
        });

        const quorumDenominator = await erc20VotingContract.read.QUORUM_DENOMINATOR();

        transactions.push({
          targetAddress: strategy.address,
          ethValue,
          functionName: 'updateQuorumNumerator',
          parameters: [
            {
              signature: 'uint256',
              value: ((quorumPercentage * quorumDenominator) / 100n).toString(),
            },
          ],
        });
      }),
    );

    changeTitles.push(t('changeQuorumNumerator', { ns: 'proposalMetadata' }));
  }

  if (quorumThreshold) {
    const erc721Strategies = strategies.filter(s => s.type === FractalTokenType.erc721);
    if (erc721Strategies.length === 0) {
      throw new Error('ERC721 strategy is not set');
    }

    erc721Strategies.forEach(strategy => {
      transactions.push({
        targetAddress: strategy.address,
        ethValue,
        functionName: 'updateQuorumThreshold',
        parameters: [
          {
            signature: 'uint256',
            value: quorumThreshold.toString(),
          },
        ],
      });
    });

    changeTitles.push(t('changeQuorumThreshold', { ns: 'proposalMetadata' }));
  }

  if (votingPeriod) {
    const eligibleStrategies = strategies.filter(
      s => s.type === FractalTokenType.erc20 || s.type === FractalTokenType.erc721,
    );
    if (eligibleStrategies.length === 0) {
      throw new Error('No eligible strategies found');
    }

    await Promise.all(
      eligibleStrategies.map(async strategy => {
        const numberOfBlocks = await getEstimatedNumberOfBlocks(votingPeriod / 60n, publicClient);
        transactions.push({
          targetAddress: strategy.address,
          ethValue,
          functionName: 'updateVotingPeriod',
          parameters: [
            {
              signature: 'uint32',
              value: numberOfBlocks.toString(),
            },
          ],
        });
      }),
    );

    changeTitles.push(t('changeVotingPeriod', { ns: 'proposalMetadata' }));
  }

  if (timelockPeriod) {
    const numberOfBlocks = await getEstimatedNumberOfBlocks(timelockPeriod / 60n, publicClient);
    transactions.push({
      targetAddress: moduleAzoriusAddress,
      ethValue,
      functionName: 'updateTimelockPeriod',
      parameters: [
        {
          signature: 'uint32',
          value: numberOfBlocks.toString(),
        },
      ],
    });

    changeTitles.push(t('changeTimelockPeriod', { ns: 'proposalMetadata' }));
  }

  if (executionPeriod) {
    const numberOfBlocks = await getEstimatedNumberOfBlocks(executionPeriod / 60n, publicClient);
    transactions.push({
      targetAddress: moduleAzoriusAddress,
      ethValue,
      functionName: 'updateExecutionPeriod',
      parameters: [
        {
          signature: 'uint32',
          value: numberOfBlocks.toString(),
        },
      ],
    });

    changeTitles.push(t('changeExecutionPeriod', { ns: 'proposalMetadata' }));
  }

  return {
    action: { actionType: ProposalActionType.EDIT, transactions },
    title: changeTitles.join(`; `),
  };
};
