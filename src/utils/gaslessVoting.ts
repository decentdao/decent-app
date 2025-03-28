import { Address, getContract, keccak256, PublicClient, stringToHex } from 'viem';
import { DecentPaymasterFactoryV1Abi } from '../assets/abi/DecentPaymasterFactoryV1Abi';

export const getUserSmartWalletSalt = (args: { EOA: Address; chainId: number }) => {
  const { EOA, chainId } = args;

  const salt = `DECENT_GASLESS_VOTING_USER_WALLET_SALT-${EOA}-${chainId}`;
  const saltHash = keccak256(stringToHex(salt));
  const userSmartWalletSaltBigInt = BigInt(saltHash);
  return userSmartWalletSaltBigInt;
};

export const getPaymasterSalt = (safeAddress: Address, chainId: number) => {
  const salt = `DECENT_GASLESS_VOTING_PAYMASTER_SALT-${safeAddress}-${chainId}`;
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
  const paymasterContract = getContract({
    address: paymasterFactory,
    abi: DecentPaymasterFactoryV1Abi,
    client: publicClient,
  });
  const paymasterAddress = await paymasterContract.read.getAddress([address, paymasterSalt]);
  return paymasterAddress;
};
