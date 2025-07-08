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

export const getStakingContractSaltNonce = (safeAddress: Address, chainId: number) => {
  const salt = `${safeAddress}-${chainId}`;
  const saltHash = keccak256(stringToHex(salt));
  const saltNonce = BigInt(saltHash);
  return saltNonce;
};

export const getStakingContractAddress = (args: {
  safeAddress: Address;
  zodiacModuleProxyFactory: Address;
  stakingContractMastercopy: Address;
  chainId: number;
}) => {
  // @todo: Implement (https://linear.app/decent-labs/issue/ENG-1154/implement-getstakingcontractaddress)
  return '0x1234567890123456789012345678901234567890';
  const { safeAddress, zodiacModuleProxyFactory, stakingContractMastercopy, chainId } = args;

  const encodedStakingContractInitializationParams = encodeAbiParameters(
    parseAbiParameters('address'),
    [stakingContractMastercopy],
  );

  const encodedStakingContractInitializationData = encodeFunctionData({
    abi: 'legacy.abis.DecentStakingContractV1' as any, // @todo: Use abi from contracts
    functionName: 'initialize',
    args: [encodedStakingContractInitializationParams],
  });

  const salt = keccak256(
    encodePacked(
      ['bytes32', 'uint256'],
      [
        keccak256(encodePacked(['bytes'], [encodedStakingContractInitializationData])),
        getStakingContractSaltNonce(safeAddress, chainId),
      ],
    ),
  );

  const predictedStakingContractAddress = getCreate2Address({
    from: zodiacModuleProxyFactory,
    salt: salt,
    bytecodeHash: keccak256(
      encodePacked(['bytes'], [generateContractByteCodeLinear(stakingContractMastercopy)]),
    ),
  });

  return predictedStakingContractAddress;
};
