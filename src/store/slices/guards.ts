import { StateCreator } from 'zustand';
import { DAOKey, FractalGuardContracts, FreezeGuard, GuardAccountData } from '../../types';
import { GlobalStore, StoreMiddleware, StoreSlice } from '../store';

export type GuardSlice = {
  guards: StoreSlice<FreezeGuard & FractalGuardContracts>;
  guardAccountData: StoreSlice<GuardAccountData>;
  setGuard: (daoKey: DAOKey, guard: FreezeGuard & FractalGuardContracts) => void;
  setGuardAccountData: (daoKey: DAOKey, guardAccountData: GuardAccountData) => void;
  getGuard: (daoKey: DAOKey) => FreezeGuard & FractalGuardContracts;
  getGuardAccountData: (daoKey: DAOKey) => {
    userHasFreezeVoted: boolean;
    userHasVotes: boolean;
  };
};

const EMPTY_GUARD: FreezeGuard & FractalGuardContracts = {
  freezeGuardType: null,
  freezeVotingType: null,
  isGuardLoaded: false,
  freezeGuardContractAddress: undefined,
  freezeVotingContractAddress: undefined,
  freezeVotesThreshold: null,
  freezeProposalCreatedTime: null,
  freezeProposalVoteCount: null,
  freezeProposalPeriod: null,
  freezePeriod: null,
  isFrozen: false,
};

export const createGuardSlice: StateCreator<GlobalStore, StoreMiddleware, [], GuardSlice> = (
  set,
  get,
) => ({
  guards: {},
  guardAccountData: {},
  setGuard: (daoKey, guard) => {
    set(
      state => {
        state.guards[daoKey] = {
          ...guard,
          isGuardLoaded: true,
        };
      },
      false,
      'setGuard',
    );
  },
  setGuardAccountData: (daoKey, guardAccountData) => {
    set(
      state => {
        state.guardAccountData[daoKey] = {
          ...guardAccountData,
        };
      },
      false,
      'setGuardAccountData',
    );
  },
  getGuard: daoKey => {
    return get().guards[daoKey] || EMPTY_GUARD;
  },
  getGuardAccountData: daoKey => {
    return get().guardAccountData[daoKey] || { userHasFreezeVoted: false, userHasVotes: false };
  },
});
