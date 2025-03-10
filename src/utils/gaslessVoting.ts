import { Address, keccak256, stringToHex } from 'viem';

export const getUserSmartWalletSalt = (args: { EOA: Address; chainId: number }) => {
  const { EOA, chainId } = args;

  const salt = `DECENT_GASLESS_VOTING_USER_WALLET_SALT-${EOA}-${chainId}`;
  const saltHash = keccak256(stringToHex(salt));
  const userSmartWalletSaltBigInt = BigInt(saltHash);
  return userSmartWalletSaltBigInt;
};
