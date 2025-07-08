import { StateCreator } from 'zustand';
import { DAOSplitWallet } from '../../providers/App/hooks/useDecentAPI';
import { DAOKey, DecentTreasury, TransferDisplayData } from '../../types';
import { GlobalStore, StoreMiddleware, StoreSlice } from '../store';

export type TreasuriesSlice = {
  treasuries: StoreSlice<DecentTreasury>;
  daoSplits: StoreSlice<DAOSplitWallet[]>;
  setTreasury: (daoKey: DAOKey, treasury: DecentTreasury) => void;
  getTreasury: (daoKey: DAOKey) => DecentTreasury;
  setTransfers: (daoKey: DAOKey, transfers: TransferDisplayData[]) => void;
  setTransfer: (daoKey: DAOKey, transfer: TransferDisplayData) => void;
  setDaoSplits: (daoKey: DAOKey, splits: DAOSplitWallet[]) => void;
};

const EMPTY_TREASURY: DecentTreasury = {
  totalUsdValue: 0,
  assetsFungible: [],
  assetsNonFungible: [],
  assetsDeFi: [],
  transfers: [],
};

export const createTreasuriesSlice: StateCreator<
  GlobalStore,
  StoreMiddleware,
  [],
  TreasuriesSlice
> = (set, get) => ({
  treasuries: {},
  setTreasury: (daoKey, treasury) => {
    set(
      state => {
        state.treasuries[daoKey] = treasury;
      },
      false,
      'setTreasury',
    );
  },
  setTransfers: (daoKey, transfers) => {
    set(
      state => {
        if (!state.treasuries[daoKey]) {
          state.treasuries[daoKey] = { ...EMPTY_TREASURY, transfers };
        } else {
          state.treasuries[daoKey].transfers = transfers;
        }
      },
      false,
      'setTransfers',
    );
  },
  setTransfer: (daoKey, transfer) => {
    set(
      state => {
        if (!state.treasuries[daoKey]) {
          state.treasuries[daoKey] = { ...EMPTY_TREASURY, transfers: [transfer] };
        } else if (state.treasuries[daoKey].transfers) {
          state.treasuries[daoKey].transfers?.push(transfer);
        } else {
          state.treasuries[daoKey].transfers = [transfer];
        }
      },
      false,
      'setTransfer',
    );
  },
  getTreasury: daoKey => {
    const treasuries = get().treasuries;
    const treasury = treasuries[daoKey];
    if (!treasury) {
      return EMPTY_TREASURY;
    }
    return treasury;
  },
  daoSplits: {},
  setDaoSplits: (daoKey, splits) => {
    set(state => {
      state.daoSplits[daoKey] = splits;
    });
  },
});
