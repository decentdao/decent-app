import { abis } from '@fractal-framework/fractal-contracts';
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getCreate2Address,
  keccak256,
  parseAbiParameters,
  stringToHex,
} from 'viem';
import { generateContractByteCodeLinear } from '../models/helpers/utils';

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
  chainId: number;
}) => {
  const { safeAddress, zodiacModuleProxyFactory, paymasterMastercopy, entryPoint, chainId } = args;

  const encodedPaymasterInitializationParams = encodeAbiParameters(
    parseAbiParameters('address, address'),
    [safeAddress, entryPoint],
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
