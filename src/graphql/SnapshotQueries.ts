import { Address } from 'viem';
import { SnapshotPlugin, SnapshotProposalType } from '../types';

// Types for Extended Snapshot Proposal
interface Strategy {
  name: string;
  network: string;
  params: Record<string, unknown>;
}

export interface ExtendedSnapshotProposalResponse {
  proposal: {
    snapshot: number;
    type: SnapshotProposalType;
    quorum: number;
    privacy: string;
    strategies: Strategy[];
    plugins: SnapshotPlugin[];
    choices: string[];
    ipfs: string;
  };
}

export interface SnapshotVote {
  id: string;
  voter: Address;
  vp: number;
  vp_by_strategy: number[];
  vp_state: string;
  created: number;
  choice: number | Record<string, number>;
}

export interface SnapshotProposalVotesResponse {
  votes: SnapshotVote[];
}

// Types for User Voting Weight
interface VotingPower {
  vp: number;
  vp_by_strategy: number[];
  vp_state: string;
}

export interface UserVotingWeightResponse {
  vp: VotingPower;
}

// Types for Proposals Query
interface SnapshotProposal {
  id: string;
  title: string;
  body: string;
  start: number;
  end: number;
  state: string;
  author: Address;
}

export interface ProposalsResponse {
  proposals: SnapshotProposal[];
}

export const ExtendedSnapshotProposalQuery = `query ExtendedSnapshotProposal($snapshotProposalId: String!) {
  proposal(id: $snapshotProposalId) {
    snapshot
    type
    quorum
    privacy
    strategies {
      name
      network
      params
    }
    plugins
    choices
    ipfs
  }
}`;

export const SnapshotProposalVotesQuery = `query SnapshotProposalVotes($snapshotProposalId: String!) {
  votes(where: { proposal: $snapshotProposalId }, first: 500) {
    id
    voter
    vp
    vp_by_strategy
    vp_state
    created
    choice
  }
}`;

export const UserVotingWeightQuery = `query UserVotingWeight($voter: String!, $space: String!, $proposal: String!) {
  vp(voter: $voter, space: $space, proposal: $proposal) {
    vp
    vp_by_strategy
    vp_state
  }
}`;

export const ProposalsQuery = `query Proposals($spaceIn: [String!]) {
  proposals(
    first: 50,
    where: {
      space_in: $spaceIn
    },
    orderBy: "created",
    orderDirection: desc
  ) {
    id
    title
    body
    start
    end
    state
    author
  }
}`;
