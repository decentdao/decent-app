import { SafeMultisigConfirmationResponse } from '@safe-global/safe-core-sdk-types';
import { Address, Hex } from 'viem';
import { GovernanceActivity } from './fractal';
import { CreateProposalMetadata } from './proposalBuilder';
import { MetaTransaction, DecodedTransaction } from './transaction';

export interface ProposalExecuteData extends ExecuteData {
  metaData: CreateProposalMetadata;
}

export interface ExecuteData {
  targets: Address[];
  values: bigint[];
  calldatas: Hex[];
}

export type CreateProposalFunc = (proposal: {
  proposalData: {};
  successCallback: () => void;
}) => void;

export type ProposalData = {
  metaData?: CreateProposalMetadata;
  transactions?: MetaTransaction[];
  decodedTransactions: DecodedTransaction[];
};

export interface AzoriusProposal extends GovernanceActivity {
  votingStrategy: Address;
  votesSummary: ProposalVotesSummary;
  votes: ProposalVote[] | ERC721ProposalVote[];
  /** The deadline timestamp for the proposal, in milliseconds. */
  deadlineMs: number;
  startBlock: bigint;
}

export interface MultisigProposal extends GovernanceActivity {
  confirmations?: SafeMultisigConfirmationResponse[];
  signersThreshold?: number;
  isMultisigRejectionTx?: boolean;
  nonce?: number;
}

export type ProposalVotesSummary = {
  yes: bigint;
  no: bigint;
  abstain: bigint;
  quorum: bigint;
};

export type ProposalVote = {
  voter: Address;
  choice: (typeof VOTE_CHOICES)[number];
  weight: bigint;
};

export type ERC721ProposalVote = {
  tokenAddresses: Address[];
  tokenIds: string[];
} & ProposalVote;

export const VOTE_CHOICES = [
  {
    label: 'yes',
    value: 1,
  },
  {
    label: 'no',
    value: 0,
  },
  {
    label: 'abstain',
    value: 2,
  },
] as const;

export const getVoteChoice = (value: number) => {
  const choice = VOTE_CHOICES.find(c => c.value === value);
  if (!choice) {
    throw new Error(`Invalid vote choice: ${value}`);
  }

  return choice;
};
