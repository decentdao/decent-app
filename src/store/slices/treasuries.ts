import { StateCreator } from 'zustand';
import { DAOKey, DecentTreasury, TransferDisplayData } from '../../types';
import { GlobalStore, SetState, StoreSlice } from '../store';

export type TreasuriesSlice = {
  treasuries: StoreSlice<DecentTreasury>;
  setTreasury: (daoKey: DAOKey, treasury: DecentTreasury) => void;
  getTreasury: (daoKey: DAOKey) => DecentTreasury;
  setTransfers: (daoKey: DAOKey, transfers: TransferDisplayData[]) => void;
  setTransfer: (daoKey: DAOKey, transfer: TransferDisplayData) => void;
};

const EMPTY_TREASURY: DecentTreasury = {
  totalUsdValue: 0,
  assetsFungible: [],
  assetsNonFungible: [],
  assetsDeFi: [],
  transfers: [],
};

export const createTreasuriesSlice: StateCreator<GlobalStore, [], [], TreasuriesSlice> = (
  set: SetState,
  get,
) => ({
  treasuries: {},
  setTreasury: (daoKey, treasury) => {
    set(state => {
      state.treasuries[daoKey] = treasury;
    });
  },
  setTransfers: (daoKey, transfers) => {
    set(state => {
      if (!state.treasuries[daoKey]) {
        state.treasuries[daoKey] = { ...EMPTY_TREASURY, transfers };
      } else {
        state.treasuries[daoKey].transfers = transfers;
      }
    });
  },
  setTransfer: (daoKey, transfer) => {
    set(state => {
      if (!state.treasuries[daoKey]) {
        state.treasuries[daoKey] = { ...EMPTY_TREASURY, transfers: [transfer] };
      } else if (state.treasuries[daoKey].transfers) {
        state.treasuries[daoKey].transfers?.push(transfer);
      } else {
        state.treasuries[daoKey].transfers = [transfer];
      }
    });
  },
  getTreasury: daoKey => {
    const treasuries = get().treasuries;
    const treasury = treasuries[daoKey];
    if (!treasury) {
      return EMPTY_TREASURY;
    }
    return treasury;
  },
});
