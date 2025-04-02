import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback } from 'react';
import {
  encodeAbiParameters,
  parseAbiParameters,
  encodeFunctionData,
  getCreate2Address,
  keccak256,
  encodePacked,
  Address,
  EncodeAbiParametersReturnType,
} from 'viem';
import { ZodiacModuleProxyFactoryAbi } from '../../assets/abi/ZodiacModuleProxyFactoryAbi';
import { getRandomBytes } from '../../helpers';
import { generateSalt, generateContractByteCodeLinear } from '../../models/helpers/utils';
import { useFractal } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import {
  AzoriusGovernance,
  ERC721TokenData,
  FractalTokenType,
  FractalVotingStrategy,
} from '../../types';
import { SENTINEL_MODULE } from '../../utils/address';
import useNetworkPublicClient from '../useNetworkPublicClient';
import useVotingStrategiesAddresses from './useVotingStrategiesAddresses';

export const useInstallVersionedVotingStrategy = () => {
  const { safe } = useDaoInfoStore();

  const safeAddress = safe?.address;
  const { governance, governanceContracts } = useFractal();

  const publicClient = useNetworkPublicClient();
  const { getVotingStrategies } = useVotingStrategiesAddresses();

  const azoriusGovernance = governance as AzoriusGovernance;
  const { votesToken, erc721Tokens } = azoriusGovernance;

  const {
    contracts: {
      hatsProtocol,
      linearVotingErc20V1MasterCopy,
      linearVotingErc721V1MasterCopy,
      linearVotingErc20HatsWhitelistingV1MasterCopy,
      linearVotingErc721HatsWhitelistingV1MasterCopy,
      zodiacModuleProxyFactory,
    },
  } = useNetworkConfigStore();

  const removalAction = (
    removal: FractalVotingStrategy,
    strategies: FractalVotingStrategy[],
    moduleAzoriusAddress: Address,
  ): {
    targetAddress: `0x${string}`;
    calldata: `0x${string}`;
  } => {
    let prevStrategy: Address = SENTINEL_MODULE;
    for (let j = 0; j < strategies.length; j++) {
      if (strategies[j].address === removal.address) {
        break;
      }
      prevStrategy = strategies[j].address;
    }

    // Disable the old strategy
    return {
      targetAddress: moduleAzoriusAddress,
      calldata: encodeFunctionData({
        abi: abis.Azorius,
        functionName: 'disableStrategy',
        args: [prevStrategy, removal.address],
      }),
    };
  };

  const linearErc20SetupParams = useCallback(
    async (
      removal: FractalVotingStrategy,
      tokenAddress: Address,
      moduleAzoriusAddress: Address,
    ): Promise<EncodeAbiParametersReturnType> => {
      const existingAbiAndAddress = {
        abi: abis.LinearERC20Voting,
        address: removal.address,
      };

      const [
        existingVotingPeriod,
        existingQuorumNumerator,
        existingBasisNumerator,
        existingRequiredProposerWeight,
      ] = await publicClient.multicall({
        contracts: [
          {
            ...existingAbiAndAddress,
            functionName: 'votingPeriod',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'quorumNumerator',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'basisNumerator',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'requiredProposerWeight',
          },
        ],
        allowFailure: false,
      });

      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters('address, address, address, uint32, uint256, uint256, uint256'),
        [
          safeAddress!,
          tokenAddress,
          moduleAzoriusAddress,
          existingVotingPeriod,
          existingRequiredProposerWeight,
          existingQuorumNumerator,
          existingBasisNumerator,
        ],
      );

      return encodeFunctionData({
        abi: abis.LinearERC20VotingV1,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });
    },
    [publicClient, safeAddress],
  );

  const linearErc20WithWhitelistSetupParams = useCallback(
    async (
      removal: FractalVotingStrategy,
      tokenAddress: Address,
      moduleAzoriusAddress: Address,
    ): Promise<EncodeAbiParametersReturnType> => {
      const existingAbiAndAddress = {
        abi: abis.LinearERC20VotingWithHatsProposalCreation,
        address: removal.address,
      };

      const [
        existingVotingPeriod,
        existingQuorumNumerator,
        existingBasisNumerator,
        existingRequiredProposerWeight,
        existingWhitelistedHatIds,
      ] = await publicClient.multicall({
        contracts: [
          {
            ...existingAbiAndAddress,
            functionName: 'votingPeriod',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'quorumNumerator',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'basisNumerator',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'requiredProposerWeight',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'getWhitelistedHatIds',
          },
        ],
        allowFailure: false,
      });

      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(
          'address, address, address, uint32, uint256, uint256, uint256, address, unit256[]',
        ),
        [
          safeAddress!,
          tokenAddress,
          moduleAzoriusAddress,
          existingVotingPeriod,
          existingRequiredProposerWeight,
          existingQuorumNumerator,
          existingBasisNumerator,
          hatsProtocol,
          existingWhitelistedHatIds,
        ],
      );

      return encodeFunctionData({
        abi: abis.LinearERC20VotingWithHatsProposalCreation, // TODO: Use release version of LinearERC20VotingWithHatsProposalV1Creation
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });
    },
    [hatsProtocol, publicClient, safeAddress],
  );

  const linearErc721SetupParams = useCallback(
    async (
      removal: FractalVotingStrategy,
      erc721TokenAddresses: ERC721TokenData[],
      moduleAzoriusAddress: Address,
    ): Promise<EncodeAbiParametersReturnType> => {
      const existingAbiAndAddress = {
        abi: abis.LinearERC721Voting,
        address: removal.address,
      };

      const [
        existingVotingPeriod,
        existingQuorumThreshold,
        existingProposerThreshold,
        existingBasisNumerator,
      ] = await publicClient.multicall({
        contracts: [
          {
            ...existingAbiAndAddress,
            functionName: 'votingPeriod',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'quorumThreshold',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'proposerThreshold',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'basisNumerator',
          },
        ],
        allowFailure: false,
      });

      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(
          'address, address[], uint256[], address, uint32, uint256, uint256, uint256',
        ),
        [
          safeAddress!,
          erc721TokenAddresses.map(token => token.address),
          erc721TokenAddresses.map(token => token.votingWeight),
          moduleAzoriusAddress,
          existingVotingPeriod,
          existingProposerThreshold,
          existingQuorumThreshold,
          existingBasisNumerator,
        ],
      );

      return encodeFunctionData({
        abi: abis.LinearERC721VotingV1,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });
    },
    [publicClient, safeAddress],
  );

  const linearErc721WithWhitelistSetupParams = useCallback(
    async (
      removal: FractalVotingStrategy,
      erc721TokenAddresses: ERC721TokenData[],
      moduleAzoriusAddress: Address,
    ): Promise<EncodeAbiParametersReturnType> => {
      const existingAbiAndAddress = {
        abi: abis.LinearERC721VotingWithHatsProposalCreation,
        address: removal.address,
      };

      const [
        existingVotingPeriod,
        existingQuorumThreshold,
        existingProposerThreshold,
        existingBasisNumerator,
        existingWhitelistedHatIds,
      ] = await publicClient.multicall({
        contracts: [
          {
            ...existingAbiAndAddress,
            functionName: 'votingPeriod',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'quorumThreshold',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'proposerThreshold',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'basisNumerator',
          },
          {
            ...existingAbiAndAddress,
            functionName: 'getWhitelistedHatIds',
          },
        ],
        allowFailure: false,
      });

      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(
          'address, address[], uint256[], address, uint32, uint256, uint256, uint256, address, uint256[]',
        ),
        [
          safeAddress!,
          erc721TokenAddresses.map(token => token.address),
          erc721TokenAddresses.map(token => token.votingWeight),
          moduleAzoriusAddress,
          existingVotingPeriod,
          existingProposerThreshold,
          existingQuorumThreshold,
          existingBasisNumerator,
          hatsProtocol,
          existingWhitelistedHatIds,
        ],
      );

      return encodeFunctionData({
        abi: abis.LinearERC721VotingWithHatsProposalCreation, // TODO: Use release version of LinearERC721VotingWithHatsProposalV1Creation
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });
    },
    [hatsProtocol, publicClient, safeAddress],
  );

  const setupParams = useCallback(
    async (
      removal: FractalVotingStrategy,
      moduleAzoriusAddress: Address,
      tokenAddress?: Address,
      erc721TokenAddresses?: ERC721TokenData[],
    ): Promise<EncodeAbiParametersReturnType> => {
      if (removal.type == FractalTokenType.erc20) {
        if (!tokenAddress) {
          throw new Error('Expected token address');
        }
        if (removal.withWhitelist) {
          return linearErc20WithWhitelistSetupParams(removal, tokenAddress, moduleAzoriusAddress);
        } else {
          return linearErc20SetupParams(removal, tokenAddress, moduleAzoriusAddress);
        }
      } else {
        if (!erc721TokenAddresses) {
          throw new Error('Expected ERC721 tokens');
        }
        if (removal.withWhitelist) {
          return linearErc721WithWhitelistSetupParams(
            removal,
            erc721TokenAddresses,
            moduleAzoriusAddress,
          );
        } else {
          return linearErc721SetupParams(removal, erc721TokenAddresses, moduleAzoriusAddress);
        }
      }
    },
    [
      linearErc20SetupParams,
      linearErc20WithWhitelistSetupParams,
      linearErc721SetupParams,
      linearErc721WithWhitelistSetupParams,
    ],
  );

  const getMasterAddress = useCallback(
    (removal: FractalVotingStrategy): Address => {
      if (removal.type == FractalTokenType.erc20) {
        if (removal.withWhitelist) {
          return linearVotingErc20HatsWhitelistingV1MasterCopy;
        } else {
          return linearVotingErc20V1MasterCopy;
        }
      } else {
        if (removal.withWhitelist) {
          return linearVotingErc721HatsWhitelistingV1MasterCopy;
        } else {
          return linearVotingErc721V1MasterCopy;
        }
      }
    },
    [
      linearVotingErc20HatsWhitelistingV1MasterCopy,
      linearVotingErc20V1MasterCopy,
      linearVotingErc721HatsWhitelistingV1MasterCopy,
      linearVotingErc721V1MasterCopy,
    ],
  );

  const addAndEnableActions = useCallback(
    async (
      removal: FractalVotingStrategy,
      moduleAzoriusAddress: Address,
      tokenAddress?: Address,
      erc721TokenAddresses?: ERC721TokenData[],
    ): Promise<
      {
        targetAddress: `0x${string}`;
        calldata: `0x${string}`;
      }[]
    > => {
      const encodedStrategySetupData = await setupParams(
        removal,
        moduleAzoriusAddress,
        tokenAddress,
        erc721TokenAddresses,
      );

      const masterAddress = getMasterAddress(removal);

      const strategyNonce = getRandomBytes();
      const deployVotingStrategyTx = {
        targetAddress: zodiacModuleProxyFactory,
        calldata: encodeFunctionData({
          abi: ZodiacModuleProxyFactoryAbi,
          functionName: 'deployModule',
          args: [masterAddress, encodedStrategySetupData, strategyNonce],
        }),
      };

      const strategySalt = generateSalt(encodedStrategySetupData, strategyNonce);

      const strategyByteCode = generateContractByteCodeLinear(masterAddress);
      const predictedStrategyAddress = getCreate2Address({
        from: zodiacModuleProxyFactory,
        salt: strategySalt,
        bytecodeHash: keccak256(encodePacked(['bytes'], [strategyByteCode])),
      });

      const enableDeployedVotingStrategyTx = {
        targetAddress: moduleAzoriusAddress,
        calldata: encodeFunctionData({
          abi: abis.Azorius,
          functionName: 'enableStrategy',
          args: [predictedStrategyAddress],
        }),
      };

      return [deployVotingStrategyTx, enableDeployedVotingStrategyTx];
    },
    [setupParams, getMasterAddress, zodiacModuleProxyFactory],
  );

  const buildInstallVersionedVotingStrategy = useCallback(async () => {
    const { moduleAzoriusAddress, strategies } = governanceContracts;
    if (!safeAddress) {
      throw new Error('No safe address');
    }
    if (!moduleAzoriusAddress) {
      throw new Error('No module Azorius address');
    }

    const votingStrategies = await getVotingStrategies();
    if (!votingStrategies) {
      throw new Error('No strategies found');
    }

    const removals = strategies.filter(strategy => {
      // unversioned strategies do not support gasless voting
      return strategy.version == undefined;
    });

    if (removals.length > 0) {
      // Could be 1 or many
      let actions: {
        targetAddress: `0x${string}`;
        calldata: `0x${string}`;
      }[] = [];

      // Handle all the removal first
      // There can be multiple strategies to replace. Use reverse so we can get prevStrategy correctly
      // Find the previous strategy for the one to disable
      const removalActions: {
        targetAddress: `0x${string}`;
        calldata: `0x${string}`;
      }[] = removals
        .reverse()
        .map(removal => removalAction(removal, strategies, moduleAzoriusAddress));

      const addAndEnablePromises = removals.map(removal =>
        addAndEnableActions(removal, moduleAzoriusAddress, votesToken?.address, erc721Tokens),
      );
      const addActions = await Promise.all(addAndEnablePromises);

      if (removalActions.length == addActions.length) {
        actions.push(...removalActions);
        actions.push(...addActions.flat());
        return actions;
      } else {
        throw new Error('Additions and removals should match');
      }
    } else {
      // The installed strategies already support gasless voting, so no need to replace with new ones
      return [];
    }
  }, [
    governanceContracts,
    safeAddress,
    getVotingStrategies,
    addAndEnableActions,
    votesToken?.address,
    erc721Tokens,
  ]);

  return {
    buildInstallVersionedVotingStrategy,
  };
};
