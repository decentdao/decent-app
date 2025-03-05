import { Address } from 'viem';
import { GovernanceActivity } from '.';

export interface SnapshotProposal extends GovernanceActivity {
  snapshotProposalId: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  author: Address;
}

interface SnapshotVotingStrategy {
  name: string;
  network: string;
  params: {
    addresses?: string[];
    symbol?: string;
  };
}

export interface SnapshotPlugin {}
export interface SnapshotWeightedVotingChoice {
  [choice: number]: number;
}
export interface DecentSnapshotVote {
  id: string;
  voter: Address;
  votingWeight: number;
  votingWeightByStrategy: number[];
  votingState: string;
  created: number;
  choice: number | SnapshotWeightedVotingChoice;
}

export interface SnapshotVoteBreakdown {
  // Choice might be dynamically created by proposal's author.
  // So "For" | "Against" | "Abstain" are not hardcoded/guaranteed
  // However, it's not a big deal cause we don't need to rely on that
  [voteChoice: string]: {
    total: number;
    votes: DecentSnapshotVote[];
  };
}

export type SnapshotProposalType =
  | 'single-choice'
  | 'approval'
  | 'quadratic'
  | 'ranked-choice'
  | 'weighted'
  | 'basic';

/**
 * @interface ExtendedSnapshotProposal - extension of `SnapshotProposal` to inject voting strategy data, votes, quorum, etc.
 * Their data model is quite different comparing to our, so there's not much of point to reuse existing
 */
export interface ExtendedSnapshotProposal extends SnapshotProposal {
  snapshot: number; // Number of block
  type: SnapshotProposalType;
  quorum?: number;
  privacy?: string;
  ipfs: string;
  strategies: SnapshotVotingStrategy[];
  choices: string[];
  plugins: SnapshotPlugin[];
  votes: DecentSnapshotVote[];
  votesBreakdown: SnapshotVoteBreakdown;
}

export const snapshotVoteTypes = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'string' },
    { name: 'choice', type: 'uint32' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' },
  ],
} as const;

export const snapshotVote2Types = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'bytes32' },
    { name: 'choice', type: 'uint32' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' },
  ],
} as const;

export const snapshotVoteArray2Types = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'bytes32' },
    { name: 'choice', type: 'uint32[]' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' },
  ],
} as const;

export const snapshotVoteArrayTypes = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'string' },
    { name: 'choice', type: 'uint32[]' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' },
  ],
} as const;

export const snapshotVoteString2Types = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'bytes32' },
    { name: 'choice', type: 'string' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' },
  ],
} as const;

export const snapshotVoteStringTypes = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'string' },
    { name: 'choice', type: 'string' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' },
  ],
} as const;

export type SnapshotVoteTypes =
  | typeof snapshotVoteTypes
  | typeof snapshotVote2Types
  | typeof snapshotVoteArrayTypes
  | typeof snapshotVoteArray2Types
  | typeof snapshotVoteStringTypes
  | typeof snapshotVoteString2Types;

export interface SnapshotVote {
  space: string;
  proposal: string;
  type: SnapshotProposalType;
  choice:
    | number
    | number[]
    | string
    | {
        [key: string]: number;
      };
  privacy?: string;
  reason?: string;
  app?: string;
  metadata?: string;
}

export interface SnapshotVoteForSigning extends Omit<SnapshotVote, 'type' | 'privacy'> {
  from: Address;
  timestamp: bigint;
  reason: string;
  app: string;
  metadata: string;
}

type SnapshotSignMessageBase = Omit<SnapshotVoteForSigning, 'choice'>;

type SnapshotSignMessageSingleChoice = SnapshotSignMessageBase & {
  choice: number;
};

type SnapshotSignMessageArrayChoice = SnapshotSignMessageBase & {
  choice: number[];
};

type SnapshotSignMessageStringChoice = SnapshotSignMessageBase & {
  choice: string;
};

export type SnapshotSignMessage =
  | SnapshotSignMessageSingleChoice
  | SnapshotSignMessageArrayChoice
  | SnapshotSignMessageStringChoice;
