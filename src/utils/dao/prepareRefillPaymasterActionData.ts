import { Address } from 'viem';
import { CreateProposalActionData, ProposalActionType } from '../../types';
import { formatCoin } from '../numberFormats';

export interface RefillPaymasterData {
  paymasterAddress: Address;
  refillAmount: bigint;
  nonceInput: number | undefined; // this is only releveant when the caller action results in a proposal
  nativeToken: {
    decimals: number;
    symbol: string;
  };
}

/**
 * Prepare the data for a paymaster refill action.
 *
 * @returns Returns a `RefillPaymasterActionData` object.
 * `.tokenAddress` is `null` if this is a native token transfer.
 * `.transferAmount` is the amount of tokens being transferred.
 * `.calldata` is the calldata for the transfer function. `0x` if this is a native token transfer.
 */
export const prepareRefillPaymasterActionData = ({
  refillAmount,
  paymasterAddress,
  nativeToken,
}: RefillPaymasterData): CreateProposalActionData => {
  const formattedNativeTokenValue = formatCoin(
    refillAmount,
    true,
    nativeToken.decimals,
    nativeToken.symbol,
    false,
  );

  const targetAddress = paymasterAddress;

  const ethValue = {
    bigintValue: refillAmount,
    value: formattedNativeTokenValue,
  };

  const action: CreateProposalActionData = {
    actionType: ProposalActionType.NATIVE_TRANSFER,
    transactions: [
      {
        targetAddress,
        ethValue,
        functionName: '',
        parameters: [],
      },
    ],
  };

  return action;
};
