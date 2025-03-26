import { Address, getContract, keccak256, PublicClient, stringToHex } from 'viem';
import { DecentPaymasterFactoryV1Abi } from '../assets/abi/DecentPaymasterFactoryV1Abi';

export const getPaymasterSalt = (safeAddress: Address, chainId: number) => {
  const salt = `${safeAddress}-${chainId}`;
  const saltHash = keccak256(stringToHex(salt));
  const paymasterSaltBigInt = BigInt(saltHash);
  return paymasterSaltBigInt;
};

export const getPaymasterAddress = async (args: {
  address: Address;
  chainId: number;
  publicClient: PublicClient;
  paymasterFactory: Address;
}) => {
  const { address, chainId, publicClient, paymasterFactory } = args;
  const paymasterSalt = getPaymasterSalt(address, chainId);
  const paymasterFactoryContract = getContract({
    address: paymasterFactory,
    abi: DecentPaymasterFactoryV1Abi,
    client: publicClient,
  });
  const paymasterAddress = await paymasterFactoryContract.read.getAddress([address, paymasterSalt]);
  return paymasterAddress;
};
