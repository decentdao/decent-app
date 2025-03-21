import { Address } from 'viem';
import { ENTRY_POINT_07_ADDRESS } from '../../constants/common';
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
 * @returns Returns a `CreateProposalActionData` object.
 */
export const prepareRefillPaymasterAction = ({
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

  const targetAddress = ENTRY_POINT_07_ADDRESS;
  const ethValue = {
    bigintValue: refillAmount,
    value: formattedNativeTokenValue,
  };

  const action: CreateProposalActionData = {
    actionType: ProposalActionType.REFILL_PAYMASTER,
    transactions: [
      {
        targetAddress,
        ethValue,
        functionName: 'depositTo',
        parameters: [{ signature: 'address', value: paymasterAddress }],
      },
    ],
  };

  return action;
};
