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
  addAction: action =>
    set(state => {
      const newAction = {
        ...action,
        transactions: action.transactions.map(transaction => ({
          ...transaction,
          // Generate a unique actionId for each transaction based on the action type and index
          actionId: `${action.actionType}_${state.actions.length}`,
        })),
      };
      return { actions: [...state.actions, newAction] };
    }),
  removeAction: actionIndex =>
    set(state => ({ actions: state.actions.filter((_, index) => index !== actionIndex) })),
  resetActions: () => set({ actions: [] }),
  getTransactions: () =>
    get()
      .actions.map(action => action.transactions)
      .flat(),
}));
