import { abis } from '@fractal-framework/fractal-contracts';
import {
  AbiItem,
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAbiItem,
  getCreate2Address,
  keccak256,
  parseAbiParameters,
  stringToHex,
  toFunctionSelector,
} from 'viem';
import { generateContractByteCodeLinear } from '../models/helpers/utils';
import { FractalTokenType, GovernanceType } from '../types';

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
    abi: abis.DecentPaymasterV1,
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
      abi: abis.LinearERC20VotingV1,
    });
    voteValidator = paymaster.linearERC20VotingV1ValidatorV1;
  } else if (
    strategyType === FractalTokenType.erc721 ||
    strategyType === GovernanceType.AZORIUS_ERC721
  ) {
    voteAbiItem = getAbiItem({
      name: 'vote',
      abi: abis.LinearERC721VotingV1,
    });
    voteValidator = paymaster.linearERC721VotingV1ValidatorV1;
  } else {
    throw new Error('Invalid voting strategy type');
  }

  const voteSelector = toFunctionSelector(voteAbiItem);
  return { voteSelector, voteValidator };
};
