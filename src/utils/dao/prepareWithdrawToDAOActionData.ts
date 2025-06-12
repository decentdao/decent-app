import { Address, encodeFunctionData } from 'viem';
import { SablierV2LockupLinearAbi } from '../../assets/abi/SablierV2LockupLinear';
import { convertStreamIdToBigInt } from '../../hooks/streams/useCreateSablierStream';
import { CreateProposalActionData, ProposalActionType } from '../../types';

interface WithdrawStreamData {
  daoAddress: Address;
  roleHatSmartAccountAddress: Address;
  paymentContractAddress: Address;
  streamId: string;
  nonceInput?: number; // this is only releveant when the caller action results in a proposal
}

/**
 * Prepare the data for a withdraw stream action.
 */
export const prepareWithdrawToDAOActionData = ({
  daoAddress,
  streamId,
  roleHatSmartAccountAddress,
  paymentContractAddress,
}: WithdrawStreamData): CreateProposalActionData => {
  const hatsAccountCalldata = encodeFunctionData({
    abi: SablierV2LockupLinearAbi,
    functionName: 'withdrawMax',
    args: [convertStreamIdToBigInt(streamId), daoAddress],
  });

  const action: CreateProposalActionData = {
    actionType: ProposalActionType.WITHDRAW_STREAM,
    transactions: [
      {
        targetAddress: roleHatSmartAccountAddress,
        ethValue: {
          bigintValue: 0n,
          value: '0',
        },
        functionName: 'execute',
        parameters: [
          { signature: 'address', value: paymentContractAddress },
          { signature: 'uint256', value: '0' },
          { signature: 'bytes', value: hatsAccountCalldata },
          { signature: 'uint8', value: '0' },
        ],
      },
    ],
  };

  return action;
};
