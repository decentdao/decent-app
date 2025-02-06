import { Address, encodeFunctionData, erc20Abi, Hex } from 'viem';
import { TokenBalance } from '../../types';

export interface SendAssetsData {
  recipientAddress: Address;
  transferAmount: bigint;
  asset: TokenBalance;
  nonceInput: number | undefined; // this is only releveant when the caller action results in a proposal
}

interface SendAssetsActionData {
  tokenAddress: Address | null;
  transferAmount: bigint;
  calldata: Hex;
}

/**
 * Prepare the data for a send assets action.
 *
 * @returns Returns a `SendAssetsActionData` object.
 *
 * `.tokenAddress` is `null` if this is a native token transfer.
 *
 * `.transferAmount` is the amount of tokens being transferred.
 *
 * `.calldata` is the calldata for the transfer function. `0x` if this is a native token transfer.
 */
export const prepareSendAssetsActionData = ({
  transferAmount,
  asset,
  recipientAddress,
}: SendAssetsData): SendAssetsActionData => {
  let calldata: Hex = '0x';
  if (!asset.nativeToken) {
    calldata = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipientAddress, transferAmount],
    });
  }

  const tokenAddress = asset.nativeToken ? null : asset.tokenAddress;
  const actionData = {
    tokenAddress,
    transferAmount,
    calldata,
  };

  return actionData;
};
