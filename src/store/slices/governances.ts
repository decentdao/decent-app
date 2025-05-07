import { Address } from 'viem';
import { StateCreator } from 'zustand';
import {
  AzoriusProposal,
  DAOKey,
  FractalGovernance,
  FractalGovernanceContracts,
  FractalProposal,
  GovernanceType,
  ProposalTemplate,
} from '../../types';
import { GlobalStore, StoreMiddleware, StoreSlice } from '../store';

export type GovernancesSlice = {
  governances: StoreSlice<FractalGovernance & FractalGovernanceContracts>;
  setProposalTemplates: (daoKey: DAOKey, proposalTemplates: ProposalTemplate[]) => void;
  setMultisigGovernance: (daoKey: DAOKey) => void;
  setAzoriusGovernance: (
    daoKey: DAOKey,
    governance: FractalGovernance & FractalGovernanceContracts,
  ) => void;
  setTokenClaimContractAddress: (daoKey: DAOKey, tokenClaimContractAddress: Address) => void;
  setProposals: (daoKey: DAOKey, proposals: FractalProposal[]) => void;
  setProposal: (daoKey: DAOKey, proposal: AzoriusProposal) => void;
  setLoadingFirstProposal: (daoKey: DAOKey, loading: boolean) => void;
  setAllProposalsLoaded: (daoKey: DAOKey, loaded: boolean) => void;
  getGovernance: (daoKey: DAOKey) => FractalGovernance & FractalGovernanceContracts;
};

const EMPTY_GOVERNANCE: FractalGovernance & FractalGovernanceContracts = {
  loadingProposals: false,
  allProposalsLoaded: false,
  proposals: null,
  pendingProposals: null,
  isAzorius: false,
  isLoaded: false,
  strategies: [],
};

export const createGovernancesSlice: StateCreator<
  GlobalStore,
  StoreMiddleware,
  [],
  GovernancesSlice
> = (set, get) => ({
  governances: {},
  setProposalTemplates: (daoKey: DAOKey, proposalTemplates: ProposalTemplate[]) => {
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
  setMultisigGovernance: (daoKey: DAOKey) => {
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
  setAzoriusGovernance: (
    daoKey: DAOKey,
    governance: FractalGovernance & FractalGovernanceContracts,
  ) => {
    set(
      state => {
        if (!state.governances[daoKey]) {
          state.governances[daoKey] = {
            ...EMPTY_GOVERNANCE,
            ...governance,
          };
        } else {
          for (const governanceProperty in governance) {
            // TODO: Is there a better way to "assign all properties"
            const typedGovernanceProperty = governanceProperty as keyof typeof governance;
            const typedStoreGovernanceProperty =
              governanceProperty as keyof (typeof state.governances)[typeof daoKey];
            state.governances[daoKey][typedStoreGovernanceProperty] = governance[
              typedGovernanceProperty
            ] as never;
          }
        }
      },
      false,
      'setAzoriusGovernance',
    );
  },
  setTokenClaimContractAddress: (daoKey: DAOKey, tokenClaimContractAddress: Address) => {
    set(
      state => {
        state.governances[daoKey].tokenClaimContractAddress = tokenClaimContractAddress;
      },
      false,
      'setTokenClaimContractAddress',
    );
  },
  setProposals: (daoKey: DAOKey, proposals: FractalProposal[]) => {
    set(
      state => {
        state.governances[daoKey].proposals = proposals;
      },
      false,
      'setProposals',
    );
  },
  setProposal: (daoKey: DAOKey, proposal: AzoriusProposal) => {
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
  setLoadingFirstProposal: (daoKey: DAOKey, loading: boolean) => {
    set(
      state => {
        state.governances[daoKey].loadingProposals = loading;
      },
      false,
      'setLoadingFirstProposal',
    );
  },
  setAllProposalsLoaded: (daoKey: DAOKey, loaded: boolean) => {
    set(
      state => {
        state.governances[daoKey].allProposalsLoaded = loaded;
      },
      false,
      'setAllProposalsLoaded',
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
