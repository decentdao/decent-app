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
  proposalMetadata: {
    title: '',
    description: '',
    nonce: undefined as number | undefined,
  },
  transactions: [DEFAULT_PROPOSAL_TRANSACTION],
};

export const SECONDS_IN_MINUTE = 60;
export const SECONDS_IN_HOUR = 60 * SECONDS_IN_MINUTE;
export const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;
export const SECONDS_IN_WEEK = 7 * SECONDS_IN_DAY;
export const SECONDS_IN_YEAR = 365 * SECONDS_IN_DAY;

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
  proposalMetadata: {
    title: '',
    description: '',
    nonce: undefined as number | undefined,
  },
  streams: [DEFAULT_STREAM],
  transactions: [],
};
