import { Address } from 'viem';
import { CreateProposalActionData, ProposalActionType } from '../../types';

interface WithdrawGasData {
  withdrawAmount: bigint;
  recipientAddress: Address;
}

export interface WithdrawPaymasterData {
  paymasterAddress: Address;
  withdrawData: WithdrawGasData;
}

/**
 * Prepare the data for a paymaster withdraw action.
 *
 * @returns Returns a `CreateProposalActionData` object.
 */
export const prepareWithdrawPaymasterAction = ({
  withdrawData,
  paymasterAddress,
}: WithdrawPaymasterData): CreateProposalActionData => {
  const { recipientAddress, withdrawAmount } = withdrawData;
  const action: CreateProposalActionData = {
    actionType: ProposalActionType.WITHDRAW_PAYMASTER,
    transactions: [
      {
        targetAddress: paymasterAddress,
        functionName: 'withdrawTo',
        parameters: [
          { signature: 'address', value: recipientAddress },
          { signature: 'uint256', value: withdrawAmount.toString() },
        ],
        ethValue: {
          bigintValue: 0n,
          value: '0',
        },
      },
    ],
  };

  return action;
};
