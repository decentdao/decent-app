import { Address } from 'viem';
import { CreateProposalActionData, ProposalActionType } from '../../types';

export interface WithdrawPaymasterData {
  daoAddress: Address;
  paymasterAddress: Address;
  withdrawAmount: bigint;
}

/**
 * Prepare the data for a paymaster withdraw action.
 *
 * @returns Returns a `CreateProposalActionData` object.
 */
export const prepareWithdrawPaymasterAction = ({
  withdrawAmount,
  paymasterAddress,
  daoAddress,
}: WithdrawPaymasterData): CreateProposalActionData => {
  const action: CreateProposalActionData = {
    actionType: ProposalActionType.WITHDRAW_PAYMASTER,
    transactions: [
      {
        targetAddress: paymasterAddress,
        functionName: 'withdrawTo',
        parameters: [
          { signature: 'address', value: daoAddress },
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
