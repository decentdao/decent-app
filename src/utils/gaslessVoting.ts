import { abis } from '@fractal-framework/fractal-contracts';
import {
  Address,
  encodeFunctionData,
  getContract,
  keccak256,
  PublicClient,
  stringToHex,
} from 'viem';

export const getPaymasterSaltHash = (safeAddress: Address, chainId: number) => {
  const salt = `${safeAddress}-${chainId}`;
  return keccak256(stringToHex(salt));
};

export const getPaymasterAddress = async (args: {
  safeAddress: Address;
  publicClient: PublicClient;
  proxyFactory: Address;
  paymasterMastercopy: Address;
  entryPoint: Address;
}) => {
  const { safeAddress, publicClient, proxyFactory, paymasterMastercopy, entryPoint } = args;

  const proxyFactoryContract = getContract({
    address: proxyFactory,
    abi: abis.ProxyFactory,
    client: publicClient,
  });

  const paymasterInitData = encodeFunctionData({
    abi: abis.DecentPaymasterV1,
    functionName: 'initialize',
    args: [safeAddress, entryPoint],
  });

  const paymasterAddress = await proxyFactoryContract.read.predictProxyAddress([
    paymasterMastercopy,
    paymasterInitData,
    getPaymasterSaltHash(safeAddress, publicClient.chain!.id),
    safeAddress,
  ]);

  return paymasterAddress;
};
