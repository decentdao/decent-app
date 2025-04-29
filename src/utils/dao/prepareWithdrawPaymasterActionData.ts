import { Address } from 'viem';
import { WithdrawGasData } from '../../components/ui/modals/GaslessVoting/WithdrawGasTankModal';
import { CreateProposalActionData, ProposalActionType } from '../../types';

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
