import { CreateProposalTransaction, Stream, Tranche } from '../../types/proposalBuilder';

export const DEFAULT_PROPOSAL_TRANSACTION: CreateProposalTransaction = {
  targetAddress: '',
  ethValue: { value: '', bigintValue: undefined },
  functionName: '',
  parameters: [
    {
      signature: '',
      label: '',
      value: '',
    },
  ],
};

export const DEFAULT_PROPOSAL = {
  nonce: undefined,
  proposalMetadata: {
    title: '',
    description: '',
  },
  transactions: [DEFAULT_PROPOSAL_TRANSACTION],
};

export const SECONDS_IN_DAY = 60 * 60 * 24;

export const DEFAULT_TRANCHE: Tranche = {
  amount: {
    value: '0',
    bigintValue: 0n,
  },
  duration: {
    value: (SECONDS_IN_DAY * 14).toString(),
    bigintValue: BigInt(SECONDS_IN_DAY * 14),
  },
};

export const DEFAULT_STREAM: Stream = {
  type: 'tranched',
  tokenAddress: '',
  recipientAddress: '',
  startDate: new Date(),
  tranches: [DEFAULT_TRANCHE],
  totalAmount: {
    value: '0',
    bigintValue: 0n,
  },
  cancelable: true,
  transferable: false,
};

export const DEFAULT_SABLIER_PROPOSAL = {
  nonce: undefined,
  proposalMetadata: {
    title: '',
    description: '',
  },
  streams: [DEFAULT_STREAM],
  transactions: [],
};
