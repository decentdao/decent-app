import { create } from 'zustand';
import {
  CreateProposalAction,
  CreateProposalMetadata,
  CreateProposalTransaction,
} from '../../types';

interface ProposalActionsStoreData {
  proposalMetadata?: CreateProposalMetadata;
  actions: CreateProposalAction[];
}

interface ProposalActionsStore extends ProposalActionsStoreData {
  addAction: (action: CreateProposalAction & { proposalMetadata?: CreateProposalMetadata }) => void;
  removeAction: (actionIndex: number) => void;
  resetActions: () => void;
  getTransactions: () => CreateProposalTransaction[];
}

const initialProposalActionsStore: ProposalActionsStoreData = {
  actions: [],
};

export const useProposalActionsStore = create<ProposalActionsStore>()((set, get) => ({
  ...initialProposalActionsStore,
  addAction: action =>
    set(state => ({
      ...state,
      proposalMetadata: action.proposalMetadata,
      actions: [...state.actions, action],
    })),
  removeAction: actionIndex =>
    set(state => ({ actions: state.actions.filter((_, index) => index !== actionIndex) })),
  resetActions: () => set({ actions: [] }),
  getTransactions: () =>
    get()
      .actions.map(action => action.transactions)
      .flat(),
}));
