import { legacy } from '@decentdao/decent-contracts';
import {
  AbiItem,
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAbiItem,
  getCreate2Address,
  Hex,
  keccak256,
  parseAbiParameters,
  stringToHex,
  toFunctionSelector,
} from 'viem';
import { generateContractByteCodeLinear } from '../models/helpers/utils';
import { FractalTokenType, GovernanceType } from '../types';
import { NetworkConfig } from '../types/network';

export const getPaymasterSaltNonce = (safeAddress: Address, chainId: number) => {
  const salt = `${safeAddress}-${chainId}`;
  const saltHash = keccak256(stringToHex(salt));
  const saltNonce = BigInt(saltHash);
  return saltNonce;
};

export const getPaymasterAddress = (args: {
  safeAddress: Address;
  zodiacModuleProxyFactory: Address;
  paymasterMastercopy: Address;
  entryPoint: Address;
  lightAccountFactory: Address;
  chainId: number;
}) => {
  const {
    safeAddress,
    zodiacModuleProxyFactory,
    paymasterMastercopy,
    entryPoint,
    chainId,
    lightAccountFactory,
  } = args;

  const encodedPaymasterInitializationParams = encodeAbiParameters(
    parseAbiParameters('address, address, address'),
    [safeAddress, entryPoint, lightAccountFactory],
  );

  const encodedPaymasterInitializationData = encodeFunctionData({
    abi: legacy.abis.DecentPaymasterV1,
    functionName: 'initialize',
    args: [encodedPaymasterInitializationParams],
  });

  const salt = keccak256(
    encodePacked(
      ['bytes32', 'uint256'],
      [
        keccak256(encodePacked(['bytes'], [encodedPaymasterInitializationData])),
        getPaymasterSaltNonce(safeAddress, chainId),
      ],
    ),
  );

  const predictedPaymasterAddress = getCreate2Address({
    from: zodiacModuleProxyFactory,
    salt: salt,
    bytecodeHash: keccak256(
      encodePacked(['bytes'], [generateContractByteCodeLinear(paymasterMastercopy)]),
    ),
  });

  return predictedPaymasterAddress;
};

export const getVoteSelectorAndValidator = (
  strategyType: FractalTokenType | GovernanceType,
  paymaster: {
    linearERC20VotingV1ValidatorV1: Address;
    linearERC721VotingV1ValidatorV1: Address;
  },
) => {
  let voteAbiItem: AbiItem;
  let voteValidator: Address;

  if (strategyType === FractalTokenType.erc20 || strategyType === GovernanceType.AZORIUS_ERC20) {
    voteAbiItem = getAbiItem({
      name: 'vote',
      abi: legacy.abis.LinearERC20VotingV1,
    });
    voteValidator = paymaster.linearERC20VotingV1ValidatorV1;
  } else if (
    strategyType === FractalTokenType.erc721 ||
    strategyType === GovernanceType.AZORIUS_ERC721
  ) {
    voteAbiItem = getAbiItem({
      name: 'vote',
      abi: legacy.abis.LinearERC721VotingV1,
    });
    voteValidator = paymaster.linearERC721VotingV1ValidatorV1;
  } else {
    throw new Error('Invalid voting strategy type');
  }

  const voteSelector = toFunctionSelector(voteAbiItem);
  return { voteSelector, voteValidator };
};

export const fetchMaxPriorityFeePerGas = async (networkConfig: NetworkConfig) => {
  // Fetch minimum maxPriorityFeePerGas from Alchemy
  try {
    const response = await fetch(networkConfig.rpcEndpoint, {
      method: 'POST',
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'rundler_maxPriorityFeePerGas' }),
    });

    if (!response.ok) {
      console.error('Error fetching maxPriorityFeePerGas from Alchemy:', {
        status: response.status,
        statusText: response.statusText,
        chain: networkConfig.chain.name,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return BigInt(data.result as Hex);
  } catch (error) {
    console.error('Error fetching maxPriorityFeePerGas from Alchemy:', {
      chain: networkConfig.chain.name,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return;
  }
};
