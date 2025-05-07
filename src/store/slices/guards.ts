import { StateCreator } from 'zustand';
import { DAOKey, FractalGuardContracts, FreezeGuard } from '../../types';
import { GlobalStore, StoreMiddleware, StoreSlice } from '../store';

export type GuardSlice = {
  guards: StoreSlice<FreezeGuard & FractalGuardContracts>;
  setGuard: (daoKey: DAOKey, guard: FreezeGuard & FractalGuardContracts) => void;
  getGuard: (daoKey: DAOKey) => FreezeGuard & FractalGuardContracts;
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
  userHasFreezeVoted: false,
  isFrozen: false,
  userHasVotes: false,
};

export const createGuardSlice: StateCreator<GlobalStore, StoreMiddleware, [], GuardSlice> = (
  set,
  get,
) => ({
  guards: {},
  setGuard: (daoKey: DAOKey, guard: FreezeGuard & FractalGuardContracts) => {
    set(
      state => {
        state.guards[daoKey] = guard;
      },
      false,
      'setGuard',
    );
  },
  getGuard: (daoKey: DAOKey) => {
    return get().guards[daoKey] || EMPTY_GUARD;
  },
});
