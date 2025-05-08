import { Address } from 'viem';
import { StateCreator } from 'zustand';
import {
  AzoriusGovernance,
  AzoriusProposal,
  DAOKey,
  DecentGovernance,
  ERC721ProposalVote,
  ERC721TokenData,
  GovernanceContracts,
  GovernanceType,
  Proposal,
  ProposalState,
  ProposalTemplate,
  ProposalVote,
  ProposalVotesSummary,
  RawVotingStrategy,
  SafeMultisigGovernance,
  SnapshotProposal,
  VotesTokenData,
  VotingStrategy,
} from '../../types';
import { GlobalStore, StoreMiddleware, StoreSlice } from '../store';

export type SetAzoriusGovernancePayload = {
  votesToken: VotesTokenData | undefined;
  erc721Tokens: ERC721TokenData[] | undefined;
  linearVotingErc20Address?: Address;
  linearVotingErc20WithHatsWhitelistingAddress?: Address;
  linearVotingErc721Address?: Address;
  linearVotingErc721WithHatsWhitelistingAddress?: Address;
  isLoaded: boolean;
  strategies: RawVotingStrategy[];
  votingStrategy: VotingStrategy;
  isAzorius: boolean;
  lockedVotesToken?: VotesTokenData;
  type: GovernanceType;
};

type CombinedGovernance = AzoriusGovernance | SafeMultisigGovernance | DecentGovernance;
export type GovernancesSlice = {
  governances: StoreSlice<CombinedGovernance & GovernanceContracts>;
  setProposalTemplates: (daoKey: DAOKey, proposalTemplates: ProposalTemplate[]) => void;
  setMultisigGovernance: (daoKey: DAOKey) => void;
  setAzoriusGovernance: (daoKey: DAOKey, payload: SetAzoriusGovernancePayload) => void;
  setTokenClaimContractAddress: (daoKey: DAOKey, tokenClaimContractAddress: Address) => void;
  setProposals: (daoKey: DAOKey, proposals: Proposal[]) => void;
  setSnapshotProposals: (daoKey: DAOKey, snapshotProposals: SnapshotProposal[]) => void;
  setProposal: (daoKey: DAOKey, proposal: AzoriusProposal) => void;
  setPendingProposal: (daoKey: DAOKey, txHash: string) => void;
  setProposalVote: (
    daoKey: DAOKey,
    proposalId: string,
    votesSummary: ProposalVotesSummary,
    proposalVote: ProposalVote | ERC721ProposalVote,
  ) => void;
  setProposalState: (daoKey: DAOKey, proposalId: string, state: ProposalState) => void;
  setLoadingFirstProposal: (daoKey: DAOKey, loading: boolean) => void;
  setAllProposalsLoaded: (daoKey: DAOKey, loaded: boolean) => void;
  getGovernance: (daoKey: DAOKey) => CombinedGovernance & GovernanceContracts;
  setGovernanceAccountData: (
    daoKey: DAOKey,
    governanceAccountData: { balance: bigint; delegatee: Address },
  ) => void;
  setGovernanceLockReleaseAccountData: (
    daoKey: DAOKey,
    lockReleaseAccountData: { balance: bigint; delegatee: Address },
  ) => void;
  setGaslessVotingData: (
    daoKey: DAOKey,
    gasslesVotingData: {
      gaslessVotingEnabled: boolean;
      paymasterAddress: Address | null;
    },
  ) => void;
};

const EMPTY_GOVERNANCE: CombinedGovernance & GovernanceContracts = {
  loadingProposals: false,
  allProposalsLoaded: false,
  proposals: null,
  pendingProposals: null,
  isAzorius: false,
  isLoaded: false,
  strategies: [],
  gaslessVotingEnabled: false,
  paymasterAddress: null,
};

export const createGovernancesSlice: StateCreator<
  GlobalStore,
  StoreMiddleware,
  [],
  GovernancesSlice
> = (set, get) => ({
  governances: {},
  setProposalTemplates: (daoKey, proposalTemplates) => {
    set(
      state => {
        if (!state.governances[daoKey]) {
          state.governances[daoKey] = {
            ...EMPTY_GOVERNANCE,
            proposalTemplates,
          };
        } else {
          state.governances[daoKey].proposalTemplates = proposalTemplates;
        }
      },
      false,
      'setProposalTemplates',
    );
  },
  setMultisigGovernance: daoKey => {
    set(
      state => {
        if (!state.governances[daoKey]) {
          state.governances[daoKey] = {
            ...EMPTY_GOVERNANCE,
            type: GovernanceType.MULTISIG,
          };
        } else {
          state.governances[daoKey].type = GovernanceType.MULTISIG;
        }
      },
      false,
      'setMultisigGovernance',
    );
  },
  setAzoriusGovernance: (daoKey, payload) => {
    set(
      state => {
        if (!state.governances[daoKey]) {
          state.governances[daoKey] = {
            ...EMPTY_GOVERNANCE,
            ...payload,
          };
        } else {
          for (const governanceProperty in payload) {
            // TODO: Is there a better way to "assign all properties"
            const typedGovernanceProperty = governanceProperty as keyof typeof payload;
            const typedStoreGovernanceProperty =
              governanceProperty as keyof (typeof state.governances)[typeof daoKey];
            state.governances[daoKey][typedStoreGovernanceProperty] = payload[
              typedGovernanceProperty
            ] as never;
          }
        }
      },
      false,
      'setAzoriusGovernance',
    );
  },
  setTokenClaimContractAddress: (daoKey, tokenClaimContractAddress) => {
    set(
      state => {
        state.governances[daoKey].tokenClaimContractAddress = tokenClaimContractAddress;
      },
      false,
      'setTokenClaimContractAddress',
    );
  },
  setProposals: (daoKey, proposals) => {
    set(
      state => {
        if (!state.governances[daoKey].proposals) {
          state.governances[daoKey].proposals = proposals;
        } else {
          state.governances[daoKey].proposals.push(...proposals);
        }
      },
      false,
      'setProposals',
    );
  },
  setProposal: (daoKey, proposal) => {
    set(
      state => {
        if (!state.governances[daoKey].proposals) {
          state.governances[daoKey].proposals = [];
        }
        const existingProposalIndex = state.governances[daoKey].proposals.findIndex(
          p => p.proposalId === proposal.proposalId,
        );
        if (existingProposalIndex !== -1) {
          state.governances[daoKey].proposals[existingProposalIndex] = proposal;
        } else {
          state.governances[daoKey].proposals.push(proposal);
        }
      },
      false,
      'setProposal',
    );
  },
  setProposalVote: (daoKey, proposalId, votesSummary, proposalVote) => {
    set(
      state => {
        const azoriusProposal = state.governances[daoKey].proposals?.find(
          p => p.proposalId === proposalId,
        ) as AzoriusProposal;
        if (!azoriusProposal) {
          return;
        }

        const existingVoteIndex = azoriusProposal.votes.findIndex(
          v => v.voter === proposalVote.voter,
        );
        if (existingVoteIndex !== -1) {
          azoriusProposal.votes[existingVoteIndex] = proposalVote;
        } else {
          (azoriusProposal.votes as (ProposalVote | ERC721ProposalVote)[]).push(proposalVote);
        }
        azoriusProposal.votesSummary = votesSummary;
      },
      false,
      'setProposalVote',
    );
  },
  setProposalState: (daoKey, proposalId, newState) => {
    set(
      state => {
        const foundProposal = state.governances[daoKey].proposals?.find(
          p => p.proposalId === proposalId,
        );
        if (foundProposal) {
          foundProposal.state = newState;
        }
      },
      false,
      'setProposalState',
    );
  },
  setLoadingFirstProposal: (daoKey, loading) => {
    set(
      state => {
        if (!state.governances[daoKey].proposals?.length) {
          state.governances[daoKey].loadingProposals = loading;
        }
      },
      false,
      'setLoadingFirstProposal',
    );
  },
  setGovernanceAccountData: (daoKey, governanceAccountData) => {
    set(
      state => {
        const azoirusGovernance = state.governances[daoKey] as AzoriusGovernance;
        if (
          !state.governances[daoKey] ||
          !state.governances[daoKey].isAzorius ||
          !azoirusGovernance.votesToken
        ) {
          return;
        }
        azoirusGovernance.votesToken.balance = governanceAccountData.balance;
        azoirusGovernance.votesToken.delegatee = governanceAccountData.delegatee;
      },
      false,
      'setGovernanceAccountData',
    );
  },
  setGovernanceLockReleaseAccountData: (daoKey, lockReleaseAccountData) => {
    set(
      state => {
        const decentGovernance = state.governances[daoKey] as DecentGovernance;
        if (
          !state.governances[daoKey] ||
          !state.governances[daoKey].isAzorius ||
          !decentGovernance.lockedVotesToken
        ) {
          return;
        }
        decentGovernance.lockedVotesToken.balance = lockReleaseAccountData.balance;
        decentGovernance.lockedVotesToken.delegatee = lockReleaseAccountData.delegatee;
      },
      false,
      'setGovernanceLockReleaseAccountData',
    );
  },
  setPendingProposal: (daoKey, txHash) => {
    set(
      state => {
        if (!state.governances[daoKey].pendingProposals) {
          state.governances[daoKey].pendingProposals = [];
        }
        state.governances[daoKey].pendingProposals.push(txHash);
      },
      false,
      'setPendingProposal',
    );
  },
  setAllProposalsLoaded: (daoKey, loaded) => {
    set(
      state => {
        state.governances[daoKey].allProposalsLoaded = loaded;
        state.governances[daoKey].loadingProposals = false;
      },
      false,
      'setAllProposalsLoaded',
    );
  },
  setSnapshotProposals: (daoKey, snapshotProposals) => {
    set(
      state => {
        if (!state.governances[daoKey].proposals) {
          state.governances[daoKey].proposals = snapshotProposals;
        } else {
          state.governances[daoKey].proposals.push(...snapshotProposals);
        }
      },
      false,
      'setSnapshotProposals',
    );
  },
  setGaslessVotingData: (daoKey, gasslesVotingData) => {
    set(
      state => {
        state.governances[daoKey].gaslessVotingEnabled = gasslesVotingData.gaslessVotingEnabled;
        state.governances[daoKey].paymasterAddress = gasslesVotingData.paymasterAddress;
      },
      false,
      'setGaslessVotingData',
    );
  },
  getGovernance: daoKey => {
    const governance = get().governances[daoKey];
    if (!governance) {
      return EMPTY_GOVERNANCE;
    }
    return governance;
  },
});
