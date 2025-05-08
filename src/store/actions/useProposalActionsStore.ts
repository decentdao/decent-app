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
  setProposalMetadata: (
    field: keyof CreateProposalMetadata,
    value: string | number | undefined,
  ) => void;
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
  setProposalMetadata(field, value = '') {
    set(state => {
      const metadata =
        state.proposalMetadata ?? ({ title: '', description: '' } as CreateProposalMetadata);
      if (field === 'nonce') {
        metadata[field] = Number(value);
      } else {
        metadata[field] = value.toString();
      }
      return {
        ...state,
        proposalMetadata: metadata,
      };
    });
  },
  removeAction: actionIndex =>
    set(state => ({ actions: state.actions.filter((_, index) => index !== actionIndex) })),
  resetActions: () => set({ actions: [], proposalMetadata: undefined }),
  getTransactions: () =>
    get()
      .actions.map(action => action.transactions)
      .flat(),
}));
