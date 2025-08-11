import { StateCreator } from 'zustand';
import { DAOKey } from '../../types';
import { RevenueSharingWallet } from '../../types/revShare';
import { GlobalStore, StoreSlice, StoreMiddleware } from '../store';

export type RevShareSlice = {
  revShareWallets: StoreSlice<RevenueSharingWallet[]>;
  setRevShareWallets: (daoKey: DAOKey, revShareWallets: RevenueSharingWallet[]) => void;
  getRevShareWallets: (daoKey: DAOKey) => RevenueSharingWallet[];
};

export const createRevShareSlice: StateCreator<GlobalStore, StoreMiddleware, [], RevShareSlice> = (
  set,
  get,
) => ({
  revShareWallets: {},
  setRevShareWallets: (daoKey, revShareWallets) => {
    set(
      state => {
        state.revShareWallets[daoKey] = revShareWallets;
      },
      false,
      'setRevShareWallets',
    );
  },
  getRevShareWallets: daoKey => {
    const revShareWallets = get().revShareWallets[daoKey];
    if (!revShareWallets) {
      return [];
    }
    return revShareWallets;
  },
});
