import { Address } from 'viem';
import { CreateProposalActionData, ProposalActionType } from '../../types';
import { formatCoin } from '../numberFormats';

interface RefillPaymasterData {
  entryPointAddress: Address;
  paymasterAddress: Address;
  refillAmount: bigint;
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
  entryPointAddress,
}: RefillPaymasterData): CreateProposalActionData => {
  const formattedNativeTokenValue = formatCoin(
    refillAmount,
    true,
    nativeToken.decimals,
    nativeToken.symbol,
    false,
  );

  const targetAddress = entryPointAddress;
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
