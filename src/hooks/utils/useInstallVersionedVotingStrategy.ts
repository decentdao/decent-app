import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback } from 'react';
import {
  getContract,
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
      linearVotingErc20MasterCopy,
      linearVotingErc20V1MasterCopy,
      linearVotingErc721MasterCopy,
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

      const votingStrategyContract = getContract({
        abi: abis.LinearERC20Voting,
        address: linearVotingErc20Address,
        client: publicClient,
      });

      const linearERC20VotingMasterCopyContract = getContract({
        abi: abis.LinearERC20Voting,
        address: linearVotingErc20MasterCopy,
        client: publicClient,
      });
      const existingVotingPeriod = await votingStrategyContract.read.votingPeriod();
      const quorumDenominator = await linearERC20VotingMasterCopyContract.read.QUORUM_DENOMINATOR();
      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters('address, address, address, uint32, uint256, uint256, uint256'),
        [
          safeAddress, // owner
          votesToken.address, // governance token
          moduleAzoriusAddress, // Azorius module
          existingVotingPeriod,
          1n,
          (votingStrategy.quorumPercentage.value * quorumDenominator) / 100n, // quorom numerator, denominator is 1,000,000, so quorum percentage is quorumNumerator * 100 / quorumDenominator
          500000n, // basis numerator, denominator is 1,000,000, so basis percentage is 50% (simple majority)
        ],
      );

      const encodedStrategySetupData = encodeFunctionData({
        abi: LinearERC20VotingV1Abi, // @todo: use the deployed abi
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

      const strategyNonce = getRandomBytes();
      const votingStrategyContract = getContract({
        abi: abis.LinearERC721Voting,
        address: linearVotingErc721Address,
        client: publicClient,
      });
      const existingVotingPeriod = await votingStrategyContract.read.votingPeriod();

      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(
          'address, address[], uint256[], address, uint32, uint256, uint256, uint256',
        ),
        [
          safeAddress, // owner
          erc721Tokens.map(token => token.address), // governance tokens addresses
          erc721Tokens.map(token => token.votingWeight), // governance tokens weights
          moduleAzoriusAddress, // Azorius module
          existingVotingPeriod,
          votingStrategy.quorumThreshold.value, // quorom threshold, number of yes + abstain votes has to >= threshold
          1n, // proposer threshold, how much is needed to create a proposal.
          500000n, // basis numerator, denominator is 1,000,000, so basis percentage is 50% (simple majority)
        ],
      );

      const encodedStrategySetupData = encodeFunctionData({
        abi: LinearERC721VotingV1Abi, // @todo: use the deployed abi
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });

      const deployWhitelistingVotingStrategyTx = {
        targetAddress: zodiacModuleProxyFactory,
        calldata: encodeFunctionData({
          abi: ZodiacModuleProxyFactoryAbi,
          functionName: 'deployModule',
          args: [linearVotingErc721MasterCopy, encodedStrategySetupData, strategyNonce],
        }),
      };

      const strategyByteCodeLinear = generateContractByteCodeLinear(linearVotingErc721MasterCopy);

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
        deployWhitelistingVotingStrategyTx,
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
    linearVotingErc20MasterCopy,
    zodiacModuleProxyFactory,
    linearVotingErc20V1MasterCopy,
    linearVotingErc721MasterCopy,
  ]);

  return {
    buildInstallVersionedVotingStrategy,
  };
};
