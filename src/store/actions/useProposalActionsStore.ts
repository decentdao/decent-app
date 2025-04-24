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
  addAction: (action: CreateProposalAction) => void;
  setProposalMetadata: (proposalMetadata: CreateProposalMetadata) => void;
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
      actions: [...state.actions, action],
    })),
  setProposalMetadata: proposalMetadata => set({ proposalMetadata }),
  removeAction: actionIndex =>
    set(state => ({ actions: state.actions.filter((_, index) => index !== actionIndex) })),
  resetActions: () => set({ actions: [], proposalMetadata: undefined }),
  getTransactions: () =>
    get()
      .actions.map(action => action.transactions)
      .flat(),
}));
