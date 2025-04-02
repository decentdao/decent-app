import { Address, getContract, keccak256, PublicClient, stringToHex, zeroAddress } from 'viem';

export const getPaymasterSalt = (safeAddress: Address, chainId: number) => {
  const salt = `${safeAddress}-${chainId}`;
  const saltHash = keccak256(stringToHex(salt));
  const paymasterSaltBigInt = BigInt(saltHash);
  return paymasterSaltBigInt;
};

export const getPaymasterSaltHex = (safeAddress: Address, chainId: number) => {
  const salt = `${safeAddress}-${chainId}`;
  return keccak256(stringToHex(salt));
};

export const getPaymasterAddress = async (args: {
  address: Address;
  chainId: number;
  publicClient: PublicClient;
}) => {
  const { address, chainId, publicClient } = args;
  const paymasterSalt = getPaymasterSalt(address, chainId);
  const paymasterFactoryContract = getContract({
    address: zeroAddress,
    abi: 'remove this whole thing and predict address locally' as any,
    client: publicClient,
  });
  const paymasterAddress = await paymasterFactoryContract.read.getAddress([address, paymasterSalt]);
  return paymasterAddress as Address;
};
