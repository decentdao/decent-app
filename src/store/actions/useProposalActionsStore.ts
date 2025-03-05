import { create } from 'zustand';
import { CreateProposalAction, CreateProposalTransaction } from '../../types';

interface ProposalActionsStoreData {
  actions: CreateProposalAction[];
}

interface ProposalActionsStore extends ProposalActionsStoreData {
  addAction: (action: CreateProposalAction) => void;
  removeAction: (actionIndex: number) => void;
  resetActions: () => void;
  getTransactions: () => CreateProposalTransaction[];
}

const initialProposalActionsStore: ProposalActionsStoreData = {
  actions: [],
};

export const useProposalActionsStore = create<ProposalActionsStore>()((set, get) => ({
  ...initialProposalActionsStore,
  addAction: action => set(state => ({ actions: [...state.actions, action] })),
  removeAction: actionIndex =>
    set(state => ({ actions: state.actions.filter((_, index) => index !== actionIndex) })),
  resetActions: () => set({ actions: [] }),
  getTransactions: () =>
    get()
      .actions.map(action => action.transactions)
      .flat(),
}));
