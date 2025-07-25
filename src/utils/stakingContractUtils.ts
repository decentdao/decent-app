import { abis } from '@decentdao/decent-contracts';
import {
  Address,
  encodeFunctionData,
  encodePacked,
  getCreate2Address,
  keccak256,
  stringToHex,
} from 'viem';
import { generateContractByteCodeLinear, generateSalt } from '../models/helpers/utils';

export const getStakingContractSaltNonce = (safeAddress: Address, chainId: number) => {
  const salt = `${safeAddress}-${chainId}`;
  const saltHash = keccak256(stringToHex(salt));
  const saltNonce = BigInt(saltHash);
  return saltNonce;
};

export const getStakingContractAddress = (args: {
  safeAddress: Address;
  stakedTokenAddress: Address;
  zodiacModuleProxyFactory: Address;
  stakingContractMastercopy: Address;
  chainId: number;
}) => {
  const {
    safeAddress,
    stakedTokenAddress,
    zodiacModuleProxyFactory,
    stakingContractMastercopy,
    chainId,
  } = args;

  const encodedInitializationData = encodeFunctionData({
    abi: abis.deployables.VotesERC20StakedV1,
    functionName: 'initialize',
    args: [safeAddress, stakedTokenAddress],
  });

  const byteCodeLinear = generateContractByteCodeLinear(stakingContractMastercopy);
  const salt = generateSalt(
    encodedInitializationData,
    getStakingContractSaltNonce(safeAddress, chainId),
  );

  const predictedStakingContractAddress = getCreate2Address({
    from: zodiacModuleProxyFactory,
    salt: salt,
    bytecodeHash: keccak256(encodePacked(['bytes'], [byteCodeLinear])),
  });

  return predictedStakingContractAddress;
};
