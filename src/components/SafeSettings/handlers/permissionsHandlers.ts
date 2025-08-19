import { legacy } from '@decentdao/decent-contracts';
import React from 'react';
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContract,
  getCreate2Address,
  keccak256,
  parseAbiParameters,
  PublicClient,
} from 'viem';
import {
  linearERC20VotingWithWhitelistSetupParams,
  linearERC721VotingWithWhitelistSetupParams,
  linearERC721VotingWithWhitelistV1SetupParams,
  linearERC20VotingWithWhitelistV1SetupParams,
} from '../../../constants/params';
import { getRandomBytes } from '../../../helpers';
import { generateContractByteCodeLinear } from '../../../models/helpers/utils';
import {
  AzoriusGovernance,
  CreateProposalAction,
  CreateProposalTransaction,
  FractalGovernance,
  ProposalActionType,
} from '../../../types';
import { SafePermissionsStrategyAction } from '../SafePermissionsStrategyAction';
import { SafeSettingsEdits } from '../types';

interface PermissionsHandlerDependencies {
  safe: { address: Address } | null;
  governance: FractalGovernance;
  moduleAzoriusAddress: Address | undefined;
  linearVotingErc20Address: Address | undefined;
  linearVotingErc721Address: Address | undefined;
  linearVotingErc20WithHatsWhitelistingAddress: Address | undefined;
  linearVotingErc721WithHatsWhitelistingAddress: Address | undefined;
  linearVotingErc20MasterCopy: Address;
  linearVotingErc721MasterCopy: Address;
  linearVotingErc20V1MasterCopy: Address;
  linearVotingErc721V1MasterCopy: Address;
  zodiacModuleProxyFactory: Address;
  hatsProtocol: Address;
  accountAbstraction:
    | {
        lightAccountFactory: Address;
      }
    | undefined;
  gaslessVotingFeatureEnabled: boolean;
  publicClient: PublicClient;
}

export const handleEditPermissions = async (
  updatedValues: SafeSettingsEdits,
  deps: PermissionsHandlerDependencies,
): Promise<CreateProposalAction> => {
  const {
    safe,
    governance,
    moduleAzoriusAddress,
    linearVotingErc20Address,
    linearVotingErc721Address,
    linearVotingErc20WithHatsWhitelistingAddress,
    linearVotingErc721WithHatsWhitelistingAddress,
    linearVotingErc20MasterCopy,
    linearVotingErc721MasterCopy,
    linearVotingErc20V1MasterCopy,
    linearVotingErc721V1MasterCopy,
    zodiacModuleProxyFactory,
    hatsProtocol,
    accountAbstraction,
    gaslessVotingFeatureEnabled,
    publicClient,
  } = deps;

  if (!safe?.address) {
    throw new Error('Safe address is not set');
  }

  if (!updatedValues.permissions) {
    throw new Error('Permissions are not set');
  }

  const { proposerThreshold } = updatedValues.permissions;

  if (!proposerThreshold?.bigintValue) {
    throw new Error('Proposer threshold is not set');
  }

  let transactions: CreateProposalTransaction[] = [];
  const azoriusGovernance = governance as AzoriusGovernance;

  if (!moduleAzoriusAddress) {
    throw new Error('Azorius module address is not set');
  }

  let actionType: ProposalActionType = ProposalActionType.EDIT;

  if (linearVotingErc20Address) {
    transactions = [
      {
        targetAddress: linearVotingErc20Address,
        ethValue: {
          bigintValue: 0n,
          value: '0',
        },
        functionName: 'updateRequiredProposerWeight',
        parameters: [
          {
            signature: 'uint256',
            value: proposerThreshold.bigintValue.toString(),
          },
        ],
      },
    ];
  } else if (linearVotingErc721Address) {
    transactions = [
      {
        targetAddress: linearVotingErc721Address,
        ethValue: {
          bigintValue: 0n,
          value: '0',
        },
        functionName: 'updateProposerThreshold',
        parameters: [
          {
            signature: 'uint256',
            value: proposerThreshold.bigintValue.toString(),
          },
        ],
      },
    ];
  } else if (linearVotingErc20WithHatsWhitelistingAddress) {
    // @todo - definitely could be more DRY here and with useCreateRoles
    actionType = ProposalActionType.ADD;
    const strategyNonce = getRandomBytes();
    const linearERC20VotingMasterCopyContract = getContract({
      abi: legacy.abis.LinearERC20Voting,
      address: linearVotingErc20MasterCopy,
      client: publicClient,
    });

    const { votesToken, votingStrategy } = azoriusGovernance;

    if (!votesToken || !votingStrategy?.votingPeriod || !votingStrategy.quorumPercentage) {
      throw new Error('Voting strategy or votes token not found');
    }

    const quorumDenominator = await linearERC20VotingMasterCopyContract.read.QUORUM_DENOMINATOR();

    const encodedStrategyInitParams =
      gaslessVotingFeatureEnabled && accountAbstraction
        ? encodeAbiParameters(parseAbiParameters(linearERC20VotingWithWhitelistV1SetupParams), [
            safe.address, // owner
            votesToken.address, // governance token
            moduleAzoriusAddress, // Azorius module
            Number(votingStrategy.votingPeriod.value),
            (votingStrategy.quorumPercentage.value * quorumDenominator) / 100n,
            500000n,
            hatsProtocol, // hats protocol
            [], // whitelisted hat ids
            accountAbstraction.lightAccountFactory, // light account factory
          ])
        : encodeAbiParameters(parseAbiParameters(linearERC20VotingWithWhitelistSetupParams), [
            safe.address, // owner
            votesToken.address, // governance token
            moduleAzoriusAddress, // Azorius module
            Number(votingStrategy.votingPeriod.value),
            (votingStrategy.quorumPercentage.value * quorumDenominator) / 100n,
            500000n,
            hatsProtocol, // hats protocol
            [], // whitelisted hat ids
          ]);

    const encodedStrategySetupData = encodeFunctionData({
      abi: gaslessVotingFeatureEnabled
        ? legacy.abis.LinearERC20VotingWithHatsProposalCreationV1
        : legacy.abis.LinearERC20VotingWithHatsProposalCreation,
      functionName: 'setUp',
      args: [encodedStrategyInitParams],
    });

    const masterCopy = gaslessVotingFeatureEnabled
      ? linearVotingErc20V1MasterCopy
      : linearVotingErc20MasterCopy;

    const strategyByteCodeLinear = generateContractByteCodeLinear(masterCopy);

    const strategySalt = keccak256(
      encodePacked(
        ['bytes32', 'uint256'],
        [keccak256(encodePacked(['bytes'], [encodedStrategySetupData])), strategyNonce],
      ),
    );

    const predictedStrategyAddress = getCreate2Address({
      from: zodiacModuleProxyFactory,
      salt: strategySalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [strategyByteCodeLinear])),
    });

    transactions = [
      {
        targetAddress: zodiacModuleProxyFactory,
        functionName: 'deployModule',
        ethValue: { bigintValue: 0n, value: '0' },
        parameters: [
          {
            signature: 'address',
            value: masterCopy,
          },
          { signature: 'bytes', value: encodedStrategySetupData },
          { signature: 'uint256', value: strategyNonce.toString() },
        ],
      },
      {
        targetAddress: moduleAzoriusAddress,
        functionName: 'enableStrategy',
        ethValue: { bigintValue: 0n, value: '0' },
        parameters: [{ signature: 'address', value: predictedStrategyAddress }],
      },
    ];
  } else if (linearVotingErc721WithHatsWhitelistingAddress) {
    actionType = ProposalActionType.ADD;
    const strategyNonce = getRandomBytes();

    const { erc721Tokens, votingStrategy } = azoriusGovernance;

    if (!erc721Tokens || !votingStrategy?.votingPeriod || !votingStrategy.quorumThreshold) {
      throw new Error('Voting strategy or NFT votes tokens not found');
    }

    const encodedStrategyInitParams =
      gaslessVotingFeatureEnabled && accountAbstraction
        ? encodeAbiParameters(parseAbiParameters(linearERC721VotingWithWhitelistV1SetupParams), [
            safe.address, // owner
            erc721Tokens.map(token => token.address), // governance token
            erc721Tokens.map(token => token.votingWeight),
            moduleAzoriusAddress,
            Number(votingStrategy.votingPeriod.value),
            proposerThreshold.bigintValue,
            500000n,
            hatsProtocol, // hats protocol
            [], // whitelisted hat ids
            accountAbstraction.lightAccountFactory, // light account factory
          ])
        : encodeAbiParameters(parseAbiParameters(linearERC721VotingWithWhitelistSetupParams), [
            safe.address, // owner
            erc721Tokens.map(token => token.address), // governance token
            erc721Tokens.map(token => token.votingWeight),
            moduleAzoriusAddress,
            Number(votingStrategy.votingPeriod.value),
            proposerThreshold.bigintValue,
            500000n,
            hatsProtocol, // hats protocol
            [], // whitelisted hat ids
          ]);

    const encodedStrategySetupData = encodeFunctionData({
      abi: gaslessVotingFeatureEnabled
        ? legacy.abis.LinearERC20VotingWithHatsProposalCreationV1
        : legacy.abis.LinearERC20VotingWithHatsProposalCreation,
      functionName: 'setUp',
      args: [encodedStrategyInitParams],
    });

    const masterCopy = gaslessVotingFeatureEnabled
      ? linearVotingErc721V1MasterCopy
      : linearVotingErc721MasterCopy;

    const strategyByteCodeLinear = generateContractByteCodeLinear(masterCopy);

    const strategySalt = keccak256(
      encodePacked(
        ['bytes32', 'uint256'],
        [keccak256(encodePacked(['bytes'], [encodedStrategySetupData])), strategyNonce],
      ),
    );

    const predictedStrategyAddress = getCreate2Address({
      from: zodiacModuleProxyFactory,
      salt: strategySalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [strategyByteCodeLinear])),
    });

    transactions = [
      {
        targetAddress: zodiacModuleProxyFactory,
        functionName: 'deployModule',
        ethValue: { bigintValue: 0n, value: '0' },
        parameters: [
          {
            signature: 'address',
            value: masterCopy,
          },
          { signature: 'bytes', value: encodedStrategySetupData },
          { signature: 'uint256', value: strategyNonce.toString() },
        ],
      },
      {
        targetAddress: moduleAzoriusAddress,
        functionName: 'enableStrategy',
        ethValue: { bigintValue: 0n, value: '0' },
        parameters: [{ signature: 'address', value: predictedStrategyAddress }],
      },
    ];
  } else {
    throw new Error('No existing voting strategy address found');
  }

  return {
    actionType,
    transactions,
    content: React.createElement(SafePermissionsStrategyAction, {
      actionType,
      proposerThreshold,
    }),
  };
};
