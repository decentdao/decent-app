import { abis } from '@fractal-framework/fractal-contracts';
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getCreate2Address,
  keccak256,
  parseAbiParameters,
} from 'viem';
import GnosisSafeL2Abi from '../../assets/abi/GnosisSafeL2';
import { ZodiacModuleProxyFactoryAbi } from '../../assets/abi/ZodiacModuleProxyFactoryAbi';
import { buildContractCall } from '../../helpers/crypto';
import { SafeTransaction } from '../../types';
import { generateContractByteCodeLinear, generateSalt } from './utils';

export interface DecentModule {
  predictedFractalModuleAddress: string;
  deployFractalModuleTx: SafeTransaction;
  enableFractalModuleTx: SafeTransaction;
}

export const fractalModuleData = (
  fractalModuleMasterCopyAddress: Address,
  moduleProxyFactoryAddress: Address,
  safeAddress: Address,
  saltNum: bigint,
  parentAddress?: Address | null,
): DecentModule => {
  const fractalModuleCalldata = encodeFunctionData({
    abi: abis.FractalModule,
    functionName: 'setUp',
    args: [
      encodeAbiParameters(parseAbiParameters(['address, address, address, address[]']), [
        parentAddress ?? safeAddress, // Owner -- Parent DAO or safe contract
        safeAddress, // Avatar
        safeAddress, // Target
        [], // Authorized Controllers
      ]),
    ],
  });

  const fractalByteCodeLinear = generateContractByteCodeLinear(fractalModuleMasterCopyAddress);

  const fractalSalt = generateSalt(fractalModuleCalldata, saltNum);

  const deployFractalModuleTx = buildContractCall({
    target: moduleProxyFactoryAddress,
    encodedFunctionData: encodeFunctionData({
      functionName: 'deployModule',
      args: [fractalModuleMasterCopyAddress, fractalModuleCalldata, saltNum],
      abi: ZodiacModuleProxyFactoryAbi,
    }),
    nonce: 0,
  });

  const predictedFractalModuleAddress = getCreate2Address({
    from: moduleProxyFactoryAddress,
    salt: fractalSalt,
    bytecodeHash: keccak256(encodePacked(['bytes'], [fractalByteCodeLinear])),
  });

  const enableFractalModuleTx = buildContractCall({
    target: safeAddress,
    encodedFunctionData: encodeFunctionData({
      functionName: 'enableModule',
      args: [predictedFractalModuleAddress],
      abi: GnosisSafeL2Abi,
    }),
    nonce: 0,
  });
  return {
    predictedFractalModuleAddress,
    deployFractalModuleTx,
    enableFractalModuleTx,
  };
};
