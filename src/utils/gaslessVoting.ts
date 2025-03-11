import { Address, getContract, keccak256, PublicClient, stringToHex } from 'viem';
import { DecentPaymasterFactoryV1Abi } from '../assets/abi/DecentPaymasterFactoryV1Abi';
import { SimpleAccountFactoryAbi } from '../assets/abi/SimpleAccountFactoryAbi';

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

export const getUserSmartWalletAddress = async (args: {
  address: Address;
  chainId: number;
  publicClient: PublicClient;
  simpleAccountFactory: Address;
}) => {
  const { address, chainId, publicClient, simpleAccountFactory } = args;
  const smartWalletSalt = getUserSmartWalletSalt({
    EOA: address,
    chainId,
  });
  const smartWalletContract = getContract({
    address: simpleAccountFactory,
    abi: SimpleAccountFactoryAbi,
    client: publicClient,
  });
  const smartWalletAddress = await smartWalletContract.read.getAddress([address, smartWalletSalt]);
  return smartWalletAddress;
};

export const userHasSmartWallet = async (args: {
  address: Address;
  chainId: number;
  publicClient: PublicClient;
  simpleAccountFactory: Address;
}) => {
  const smartWalletAddress = await getUserSmartWalletAddress(args);
  const bytecode = await args.publicClient.getBytecode({
    address: smartWalletAddress,
  });
  return bytecode !== undefined && bytecode !== '0x';
};
