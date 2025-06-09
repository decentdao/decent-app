import {
  FractalGovernance,
  AzoriusProposal,
  SnapshotProposal,
  ERC721ProposalVote,
  AzoriusGovernance,
  DecentGovernance,
  getVoteChoice,
  GovernanceType,
} from '../../../types';
import {
  FractalGovernanceAction,
  FractalGovernanceActions,
  DecentGovernanceAction,
} from './action';

export const initialGovernanceState: FractalGovernance = {
  isAzorius: false,
  loadingProposals: true,
  allProposalsLoaded: false,
  proposals: null,
  pendingProposals: null,
  proposalTemplates: null,
  type: undefined,
  votingStrategy: undefined,
  votesToken: undefined,
  gaslessVotingEnabled: false,
  paymasterAddress: null,
  erc20Token: undefined,
};

export const initialVotesTokenAccountData = {
  balance: null,
  delegatee: null,
  votingWeight: null,
};

const createPendingProposals = (
  pendingProposals: string[] | null,
  proposalIds: string[],
): string[] | null => {
  if (pendingProposals === null || proposalIds.length === 0) {
    return null;
  }

  return pendingProposals.filter(p => !proposalIds.includes(p));
};

export const governanceReducer = (state: FractalGovernance, action: FractalGovernanceActions) => {
  const { proposals } = state;
  switch (action.type) {
    case FractalGovernanceAction.SET_ALL_PROPOSALS_LOADED:
      return { ...state, allProposalsLoaded: action.payload };
    case FractalGovernanceAction.SET_LOADING_FIRST_PROPOSAL:
      return { ...state, loadingProposals: action.payload };
    case FractalGovernanceAction.SET_GOVERNANCE_TYPE:
      return {
        ...state,
        type: action.payload,
        isAzorius:
          action.payload === GovernanceType.AZORIUS_ERC20 ||
          action.payload === GovernanceType.AZORIUS_ERC721,
      };
    case FractalGovernanceAction.SET_PROPOSALS: {
      return {
        ...state,
        proposals: [
          // dev: what this does, is takes an array of proposals. the payload should, in practice,
          // never be Snapshot Proposals objects.
          // Then we create a new proposals list, by appending the payload to what already exists,
          // while at the same time filtering out all of the non-Snapshot proposals from
          // the existing list. This "refrehes" the non Snapshot propsoals while leaving Snapshot
          // proposals alone.
          ...action.payload,
          ...(proposals || []).filter(
            proposal => !!(proposal as SnapshotProposal).snapshotProposalId,
          ),
        ],
        pendingProposals: createPendingProposals(
          state.pendingProposals,
          action.payload.map(p => p.transactionHash),
        ),
      };
    }
    case FractalGovernanceAction.SET_AZORIUS_PROPOSAL: {
      return {
        ...state,
        proposals: [...(proposals || []), action.payload],
        pendingProposals: createPendingProposals(state.pendingProposals, [
          action.payload.transactionHash,
        ]),
      };
    }
    case FractalGovernanceAction.SET_PROPOSAL_TEMPLATES: {
      return { ...state, proposalTemplates: action.payload };
    }
    case FractalGovernanceAction.SET_STRATEGY: {
      return {
        ...state,
        votingStrategy: action.payload,
      };
    }
    case FractalGovernanceAction.SET_SNAPSHOT_PROPOSALS:
      // TODO: what happens if this is called after some azorius or multisig proposals have already loaded in?
      // I would expect that we lose them. Worth some investigation into when this action is called.
      return {
        ...state,
        proposals: [...(proposals || []), ...action.payload],
        pendingProposals: createPendingProposals(
          state.pendingProposals,
          action.payload.map(p => p.transactionHash),
        ),
      };
    case FractalGovernanceAction.UPDATE_PROPOSALS_NEW:
      return {
        ...state,
        // TODO - Investigate a better way of avoiding duplicate proposals
        // It seems like UPDATE_PROPOSALS_NEW dispatched multiple times with the same proposal sometimes
        // Yet, I'm not sure of the cause :(
        proposals: [...(proposals || []), action.payload].filter(
          (proposal, index, array) =>
            index === array.findIndex(p => p.proposalId === proposal.proposalId),
        ),
        pendingProposals: createPendingProposals(state.pendingProposals, [
          action.payload.transactionHash,
        ]),
      };
    case FractalGovernanceAction.UPDATE_NEW_AZORIUS_ERC20_VOTE: {
      const { proposalId, voter, support, votesSummary, weight } = action.payload;
      const updatedProposals = ((proposals || []) as AzoriusProposal[]).map(proposal => {
        if (proposal.proposalId === proposalId) {
          const foundVote = proposal.votes.find(vote => vote.voter === voter);
          const newProposal: AzoriusProposal = {
            ...proposal,
            votesSummary,
            votes: foundVote
              ? [...proposal.votes]
              : [...proposal.votes, { voter, choice: getVoteChoice(support), weight }],
          };
          return newProposal;
        }
        return proposal;
      });
      return { ...state, proposals: updatedProposals };
    }
    case FractalGovernanceAction.UPDATE_NEW_AZORIUS_ERC721_VOTE: {
      const { proposalId, voter, support, votesSummary, tokenAddresses, tokenIds } = action.payload;
      const updatedProposals = ((proposals || []) as AzoriusProposal[]).map(proposal => {
        if (proposal.proposalId === proposalId) {
          const foundVote = proposal.votes.find(vote => vote.voter === voter);
          const newProposal: AzoriusProposal = {
            ...proposal,
            votesSummary,
            votes: foundVote
              ? [...proposal.votes]
              : ([
                  ...proposal.votes,
                  { voter, choice: support, tokenAddresses, tokenIds },
                ] as ERC721ProposalVote[]),
          };
          return newProposal;
        }
        return proposal;
      });
      return { ...state, proposals: updatedProposals };
    }
    case FractalGovernanceAction.UPDATE_PROPOSAL_STATE: {
      const { proposalId, state: proposalState } = action.payload;
      if (!proposals) {
        return state;
      }
      const updatedProposals = ((proposals || []) as AzoriusProposal[]).map(proposal => {
        if (proposal.proposalId === proposalId) {
          const newProposal: AzoriusProposal = {
            ...proposal,
            state: proposalState,
          };
          return newProposal;
        }
        return proposal;
      });
      return { ...state, proposals: updatedProposals };
    }
    case FractalGovernanceAction.SET_TOKEN_DATA: {
      const { votesToken } = state as AzoriusGovernance;
      return { ...state, votesToken: { ...votesToken, ...action.payload } };
    }
    case FractalGovernanceAction.SET_ERC721_TOKENS_DATA: {
      return { ...state, erc721Tokens: action.payload };
    }
    case FractalGovernanceAction.SET_TOKEN_ACCOUNT_DATA: {
      const { votesToken } = state as AzoriusGovernance;
      return { ...state, votesToken: { ...votesToken, ...action.payload } };
    }
    case FractalGovernanceAction.SET_CLAIMING_CONTRACT: {
      return { ...state, tokenClaimContractAddress: action.payload };
    }
    case FractalGovernanceAction.RESET_TOKEN_ACCOUNT_DATA: {
      const { votesToken } = state as AzoriusGovernance;
      return { ...state, votesToken: { ...votesToken, ...initialVotesTokenAccountData } };
    }
    case FractalGovernanceAction.PENDING_PROPOSAL_ADD: {
      return { ...state, pendingProposals: [action.payload, ...(state.pendingProposals || [])] };
    }
    case FractalGovernanceAction.SET_GASLESS_VOTING_DATA: {
      return { ...state, ...action.payload };
    }
    // Decent Governance only
    case DecentGovernanceAction.SET_LOCKED_TOKEN_ACCOUNT_DATA: {
      const { lockedVotesToken } = state as DecentGovernance;
      return { ...state, lockedVotesToken: { ...(lockedVotesToken || {}), ...action.payload } };
    }
    case DecentGovernanceAction.RESET_LOCKED_TOKEN_ACCOUNT_DATA: {
      return { ...state, lockedVotesToken: undefined };
    }
    default:
      return state;
  }
};
