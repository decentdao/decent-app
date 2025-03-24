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
} from 'viem';
import { LinearERC20VotingV1Abi } from '../../assets/abi/LinearERC20VotingV1';
import { LinearERC721VotingV1Abi } from '../../assets/abi/LinearERC721VotingV1';
import { ZodiacModuleProxyFactoryAbi } from '../../assets/abi/ZodiacModuleProxyFactoryAbi';
import { getRandomBytes } from '../../helpers';
import { generateSalt, generateContractByteCodeLinear } from '../../models/helpers/utils';
import { useFractal } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { AzoriusGovernance, GovernanceType } from '../../types';
import { SENTINEL_MODULE } from '../../utils/address';
import useNetworkPublicClient from '../useNetworkPublicClient';
import useVotingStrategiesAddresses from './useVotingStrategiesAddresses';

export const useInstallVersionedVotingStrategy = () => {
  const { safe } = useDaoInfoStore();

  const safeAddress = safe?.address;
  const { governance, governanceContracts } = useFractal();

  const publicClient = useNetworkPublicClient();
  const { getVotingStrategies } = useVotingStrategiesAddresses();

  const {
    contracts: {
      linearVotingErc20V1MasterCopy,
      linearVotingErc721V1MasterCopy,
      zodiacModuleProxyFactory,
    },
  } = useNetworkConfigStore();

  const buildInstallVersionedVotingStrategy = useCallback(async () => {
    const { moduleAzoriusAddress, linearVotingErc20Address, linearVotingErc721Address } =
      governanceContracts;
    if (!safeAddress) {
      throw new Error('No safe address');
    }
    if (!moduleAzoriusAddress) {
      throw new Error('No module Azorius address');
    }

    const strategies = await getVotingStrategies();
    if (!strategies) {
      throw new Error('No strategies found');
    }

    const strategyToDisable =
      governanceContracts.linearVotingErc20Address || governanceContracts.linearVotingErc721Address;
    if (!strategyToDisable) {
      throw new Error('No strategy to disable');
    }

    // Find the previous strategy for the one to disable
    let prevStrategy: Address = SENTINEL_MODULE;
    for (let j = 0; j < strategies.length; j++) {
      if (strategies[j].strategyAddress === strategyToDisable) {
        break;
      }
      prevStrategy = strategies[j].strategyAddress;
    }

    // Disable the old strategy
    const disableVotingStrategyTx = {
      targetAddress: moduleAzoriusAddress,
      calldata: encodeFunctionData({
        abi: abis.Azorius,
        functionName: 'disableStrategy',
        args: [prevStrategy, strategyToDisable],
      }),
    };

    const azoriusGovernance = governance as AzoriusGovernance;
    const { votingStrategy, votesToken, erc721Tokens } = azoriusGovernance;

    // Install the new strategy
    if (azoriusGovernance.type === GovernanceType.AZORIUS_ERC20) {
      if (!votesToken || !votingStrategy?.quorumPercentage || !linearVotingErc20Address) {
        return;
      }

      const existingAbiAndAddress = {
        abi: abis.LinearERC20Voting,
        address: linearVotingErc20Address,
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
          safeAddress,
          votesToken.address,
          moduleAzoriusAddress,
          existingVotingPeriod,
          existingRequiredProposerWeight,
          existingQuorumNumerator,
          existingBasisNumerator,
        ],
      );

      const encodedStrategySetupData = encodeFunctionData({
        abi: LinearERC20VotingV1Abi, // @todo: (gv) use the deployed abi
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });

      const strategyNonce = getRandomBytes();
      const deployVotingStrategyTx = {
        targetAddress: zodiacModuleProxyFactory,
        calldata: encodeFunctionData({
          abi: ZodiacModuleProxyFactoryAbi,
          functionName: 'deployModule',
          args: [linearVotingErc20V1MasterCopy, encodedStrategySetupData, strategyNonce],
        }),
      };

      const strategySalt = generateSalt(encodedStrategySetupData, strategyNonce);

      const strategyByteCode = generateContractByteCodeLinear(linearVotingErc20V1MasterCopy);
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

      return [disableVotingStrategyTx, deployVotingStrategyTx, enableDeployedVotingStrategyTx];
    } else if (azoriusGovernance.type === GovernanceType.AZORIUS_ERC721) {
      if (!erc721Tokens || !votingStrategy?.quorumThreshold || !linearVotingErc721Address) {
        return;
      }

      const existingAbiAndAddress = {
        abi: abis.LinearERC721Voting,
        address: linearVotingErc721Address,
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
          safeAddress,
          erc721Tokens.map(token => token.address),
          erc721Tokens.map(token => token.votingWeight),
          moduleAzoriusAddress,
          existingVotingPeriod,
          existingProposerThreshold,
          existingQuorumThreshold,
          existingBasisNumerator,
        ],
      );

      const encodedStrategySetupData = encodeFunctionData({
        abi: LinearERC721VotingV1Abi, // @todo: (gv) use the deployed abi
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });

      const strategyNonce = getRandomBytes();
      const deployERC721VotingStrategyTx = {
        targetAddress: zodiacModuleProxyFactory,
        calldata: encodeFunctionData({
          abi: ZodiacModuleProxyFactoryAbi,
          functionName: 'deployModule',
          args: [linearVotingErc721V1MasterCopy, encodedStrategySetupData, strategyNonce],
        }),
      };

      const strategyByteCodeLinear = generateContractByteCodeLinear(linearVotingErc721V1MasterCopy);

      const strategySalt = generateSalt(encodedStrategySetupData, strategyNonce);

      const predictedStrategyAddress = getCreate2Address({
        from: zodiacModuleProxyFactory,
        salt: strategySalt,
        bytecodeHash: keccak256(encodePacked(['bytes'], [strategyByteCodeLinear])),
      });

      const enableDeployedVotingStrategyTx = {
        targetAddress: moduleAzoriusAddress,
        calldata: encodeFunctionData({
          abi: abis.Azorius,
          functionName: 'enableStrategy',
          args: [predictedStrategyAddress],
        }),
      };

      return [
        disableVotingStrategyTx,
        deployERC721VotingStrategyTx,
        enableDeployedVotingStrategyTx,
      ];
    } else {
      throw new Error('Can not deploy Whitelisting Voting Strategy - unsupported governance type!');
    }
  }, [
    governanceContracts,
    safeAddress,
    getVotingStrategies,
    governance,
    publicClient,
    zodiacModuleProxyFactory,
    linearVotingErc20V1MasterCopy,
    linearVotingErc721V1MasterCopy,
  ]);

  return {
    buildInstallVersionedVotingStrategy,
  };
};
