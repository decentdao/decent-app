import { SafeMultisigConfirmationResponse } from '@safe-global/safe-core-sdk-types';
import { Address } from 'viem';
import { StateCreator } from 'zustand';
import {
  AzoriusProposal,
  DAOKey,
  DecentGovernance,
  ERC20TokenData,
  ERC721ProposalVote,
  ERC721TokenData,
  FractalGovernance,
  FractalGovernanceContracts,
  FractalProposal,
  FractalProposalState,
  FractalVotingStrategy,
  GaslessVotingDaoData,
  GovernanceType,
  MultisigProposal,
  ProposalTemplate,
  ProposalVote,
  ProposalVotesSummary,
  SnapshotProposal,
  StakedTokenData,
  VotesTokenData,
  VotingStrategy,
} from '../../types';
import { GlobalStore, StoreMiddleware, StoreSlice } from '../store';

export type SetAzoriusGovernancePayload = {
  moduleAzoriusAddress: Address;
  votesToken: VotesTokenData | undefined;
  erc721Tokens: ERC721TokenData[] | undefined;
  linearVotingErc20Address?: Address;
  linearVotingErc20WithHatsWhitelistingAddress?: Address;
  linearVotingErc721Address?: Address;
  linearVotingErc721WithHatsWhitelistingAddress?: Address;
  isLoaded: boolean;
  strategies: FractalVotingStrategy[];
  votingStrategy: VotingStrategy;
  isAzorius: boolean;
  lockedVotesToken?: VotesTokenData;
  type: GovernanceType;
};

function getFilterUniqueProposals(proposals: FractalProposal[]) {
  const seenIds = new Set();
  return proposals.filter(p => {
    const snapshotProposal = p as SnapshotProposal;
    const id = snapshotProposal.snapshotProposalId || p.proposalId;

    if (seenIds.has(id)) {
      return false;
    }

    seenIds.add(id);
    return true;
  });
}

export type GovernancesSlice = {
  governances: StoreSlice<FractalGovernance & FractalGovernanceContracts>;
  setProposalTemplates: (daoKey: DAOKey, proposalTemplates: ProposalTemplate[]) => void;
  setPendingProposalLoading: (daoKey: DAOKey, txHash: string[]) => void;
  setMultisigGovernance: (daoKey: DAOKey) => void;
  setAzoriusGovernance: (daoKey: DAOKey, payload: SetAzoriusGovernancePayload) => void;
  setTokenClaimContractAddress: (daoKey: DAOKey, tokenClaimContractAddress: Address) => void;
  setProposals: (daoKey: DAOKey, proposals: FractalProposal[]) => void;
  setSnapshotProposals: (daoKey: DAOKey, snapshotProposals: SnapshotProposal[]) => void;
  setProposal: (daoKey: DAOKey, proposal: AzoriusProposal) => void;
  updateProposalState: (daoKey: DAOKey, proposalId: string, state: FractalProposalState) => void;
  updateProposalConfirmations: (
    daoKey: DAOKey,
    proposalId: string,
    confirmations: SafeMultisigConfirmationResponse,
  ) => void;
  setProposalVote: (
    daoKey: DAOKey,
    proposalId: string,
    votesSummary: ProposalVotesSummary,
    proposalVote: ProposalVote | ERC721ProposalVote,
  ) => void;
  setAllProposalsLoaded: (daoKey: DAOKey, loaded: boolean) => void;
  getGovernance: (daoKey: DAOKey) => FractalGovernance & FractalGovernanceContracts;
  setGovernanceAccountData: (
    daoKey: DAOKey,
    governanceAccountData: { balance: bigint; delegatee: Address },
  ) => void;
  setGovernanceLockReleaseAccountData: (
    daoKey: DAOKey,
    lockReleaseAccountData: { balance: bigint; delegatee: Address },
  ) => void;
  setGaslessVotingData: (daoKey: DAOKey, gasslesVotingData: GaslessVotingDaoData) => void;
  setVotesTokenAddress: (daoKey: DAOKey, votesTokenAddress: Address) => void;
  setERC20Token: (daoKey: DAOKey, erc20Token: ERC20TokenData | undefined) => void;
  setStakingData: (daoKey: DAOKey, stakedToken: StakedTokenData | undefined) => void;
  setStakedTokenAccountData: (daoKey: DAOKey, stakedTokenAccountData: { balance: bigint }) => void;
  setERC20TokenAccountData: (daoKey: DAOKey, erc20TokenAccountData: { balance: bigint }) => void;
};

export const EMPTY_GOVERNANCE: FractalGovernance & FractalGovernanceContracts = {
  loadingProposals: false,
  allProposalsLoaded: false,
  proposals: null,
  pendingProposals: null,
  isAzorius: false,
  isLoaded: false,
  strategies: [],
  gaslessVotingEnabled: false,
  paymasterAddress: null,
  erc20Token: undefined,
  stakedToken: undefined,
};

const filterPendingTxHashes = (
  pendingProposalTxHashes: string[] | null,
  proposals: FractalProposal[],
): string[] | null => {
  if (pendingProposalTxHashes === null || proposals.length === 0) {
    return null;
  }

  return pendingProposalTxHashes.filter(
    pTxHash => !proposals.find(p => p.transactionHash === pTxHash),
  );
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
            isLoaded: true,
          };
        } else {
          state.governances[daoKey].type = GovernanceType.MULTISIG;
          state.governances[daoKey].isLoaded = true;
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
        if (!state.governances[daoKey]) {
          state.governances[daoKey] = {
            ...EMPTY_GOVERNANCE,
            proposals,
          };
        } else if (!state.governances[daoKey].proposals) {
          state.governances[daoKey].proposals = proposals;
        } else {
          const uniqueProposals = getFilterUniqueProposals([
            ...proposals,
            ...state.governances[daoKey].proposals,
          ]);
          state.governances[daoKey].proposals = uniqueProposals;
          state.governances[daoKey].pendingProposals = filterPendingTxHashes(
            state.governances[daoKey].pendingProposals,
            proposals,
          );
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
          state.governances[daoKey].proposals = [proposal];
          state.governances[daoKey].loadingProposals = false;
        }
        const existingProposalIndex = state.governances[daoKey].proposals.findIndex(
          p => p.proposalId === proposal.proposalId,
        );
        if (existingProposalIndex !== -1) {
          state.governances[daoKey].proposals[existingProposalIndex] = proposal;
        } else {
          state.governances[daoKey].proposals.push(proposal);
          state.governances[daoKey].pendingProposals = filterPendingTxHashes(
            state.governances[daoKey].pendingProposals,
            [proposal],
          );
        }
      },
      false,
      'setProposal',
    );
  },
  updateProposalState: (daoKey, proposalId, proposalState) => {
    set(
      state => {
        const proposal = state.governances[daoKey].proposals?.find(
          p => p.proposalId === proposalId,
        );
        if (!proposal) {
          return;
        }
        proposal.state = proposalState;
      },
      false,
      'updateProposalState',
    );
  },
  updateProposalConfirmations: (daoKey, proposalId, confirmation) => {
    set(
      state => {
        const proposal = state.governances[daoKey].proposals?.find(
          p => p.proposalId === proposalId,
        );
        if (!proposal) {
          return;
        }
        const msProposal = proposal as MultisigProposal;
        if (!msProposal.confirmations?.length) {
          msProposal.confirmations = [confirmation];
        } else if (!msProposal.confirmations.find(c => c.owner !== confirmation.owner)) {
          msProposal.confirmations.push(confirmation);
        }
      },
      false,
      'updateProposalConfirmations',
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
  setGovernanceAccountData: (daoKey, governanceAccountData) => {
    set(
      state => {
        const azoriusGovernance = state.governances[daoKey];
        // TOOD: we need to update the typing, this returns early if voteToken isn't first set? seems like a bug
        if (
          !state.governances[daoKey] ||
          !state.governances[daoKey].isAzorius ||
          !azoriusGovernance.votesToken
        ) {
          return;
        }

        azoriusGovernance.votesToken.balance = governanceAccountData.balance;
        azoriusGovernance.votesToken.delegatee = governanceAccountData.delegatee;
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
        if (!state.governances[daoKey]) {
          state.governances[daoKey] = {
            ...EMPTY_GOVERNANCE,
            proposals: snapshotProposals,
          };
        } else if (!state.governances[daoKey].proposals) {
          state.governances[daoKey].proposals = snapshotProposals;
        } else {
          const uniqueProposals = getFilterUniqueProposals([
            ...state.governances[daoKey].proposals,
            ...snapshotProposals,
          ]);
          state.governances[daoKey].proposals = uniqueProposals;
          state.governances[daoKey].pendingProposals = filterPendingTxHashes(
            state.governances[daoKey].pendingProposals,
            snapshotProposals,
          );
        }
      },
      false,
      'setSnapshotProposals',
    );
  },
  setPendingProposalLoading: (daoKey, txHashes) => {
    set(
      state => {
        if (!state.governances[daoKey]) {
          state.governances[daoKey] = {
            ...EMPTY_GOVERNANCE,
            pendingProposals: txHashes,
          };
        } else {
          state.governances[daoKey].pendingProposals = [
            ...txHashes,
            ...(state.governances[daoKey].pendingProposals || []),
          ];
        }
      },
      false,
      'setPendingProposalLoading',
    );
  },
  setGaslessVotingData: (daoKey, gasslesVotingData) => {
    set(
      state => {
        if (!state.governances[daoKey]) {
          state.governances[daoKey] = {
            ...EMPTY_GOVERNANCE,
            gaslessVotingEnabled: gasslesVotingData.gaslessVotingEnabled,
            paymasterAddress: gasslesVotingData.paymasterAddress,
          };
        } else {
          state.governances[daoKey].gaslessVotingEnabled = gasslesVotingData.gaslessVotingEnabled;
          state.governances[daoKey].paymasterAddress = gasslesVotingData.paymasterAddress;
        }
      },
      false,
      'setGaslessVotingData',
    );
  },
  setERC20Token: (daoKey, erc20Token) => {
    set(
      state => {
        if (!state.governances[daoKey]) {
          state.governances[daoKey] = {
            ...EMPTY_GOVERNANCE,
            erc20Token: erc20Token,
          };
        } else {
          state.governances[daoKey].erc20Token = erc20Token;
        }
      },
      false,
      'setERC20Token',
    );
  },
  setERC20TokenAccountData: (daoKey, erc20TokenAccountData) => {
    set(
      state => {
        if (
          !state.governances[daoKey] ||
          !state.governances[daoKey].isAzorius ||
          !state.governances[daoKey].erc20Token
        ) {
          return;
        }

        state.governances[daoKey].erc20Token.balance = erc20TokenAccountData.balance;
      },
      false,
      'setStakedTokenAccountData',
    );
  },
  setStakingData: (daoKey, stakedToken) => {
    set(
      state => {
        if (!state.governances[daoKey]) {
          state.governances[daoKey] = {
            ...EMPTY_GOVERNANCE,
            stakedToken: stakedToken,
          };
        } else {
          if (
            stakedToken &&
            stakedToken.balance === undefined &&
            !!state.governances[daoKey].stakedToken?.balance
          ) {
            stakedToken.balance = state.governances[daoKey].stakedToken?.balance;
          }
          state.governances[daoKey].stakedToken = stakedToken;
        }
      },
      false,
      'setStakingData',
    );
  },
  setStakedTokenAccountData: (daoKey, stakedTokenAccountData) => {
    set(
      state => {
        if (
          !state.governances[daoKey] ||
          !state.governances[daoKey].isAzorius ||
          !state.governances[daoKey].stakedToken
        ) {
          return;
        }
        state.governances[daoKey].stakedToken.balance = stakedTokenAccountData.balance;
      },
      false,
      'setStakedTokenAccountData',
    );
  },
  getGovernance: daoKey => {
    const governance = get().governances[daoKey];
    if (!governance) {
      return EMPTY_GOVERNANCE;
    }
    return governance;
  },
  setVotesTokenAddress: (daoKey, votesTokenAddress) => {
    set(
      state => {
        state.governances[daoKey].votesTokenAddress = votesTokenAddress;
      },
      false,
      'setVotesTokenAddress',
    );
  },
});
