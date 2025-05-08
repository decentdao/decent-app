import { StateCreator } from 'zustand';
import { DAOKey, FreezeGuard, GuardContracts } from '../../types';
import { GlobalStore, StoreMiddleware, StoreSlice } from '../store';

export type GuardSlice = {
  guards: StoreSlice<FreezeGuard & GuardContracts>;
  setGuard: (
    daoKey: DAOKey,
    guard: Omit<FreezeGuard & GuardContracts, 'userHasFreezeVoted' | 'userHasVotes'>,
  ) => void;
  setGuardAccountData: (
    daoKey: DAOKey,
    guardAccountData: { userHasFreezeVoted: boolean; userHasVotes: boolean },
  ) => void;
  getGuard: (daoKey: DAOKey) => FreezeGuard & GuardContracts;
};

const EMPTY_GUARD: FreezeGuard & GuardContracts = {
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
  setGuard: (daoKey, guard) => {
    set(
      state => {
        state.guards[daoKey] = {
          ...guard,
          isGuardLoaded: true,
          userHasFreezeVoted: false,
          userHasVotes: false,
        };
      },
      false,
      'setGuard',
    );
  },
  setGuardAccountData: (daoKey, guardAccountData) => {
    set(
      state => {
        state.guards[daoKey].userHasFreezeVoted = guardAccountData.userHasFreezeVoted;
        state.guards[daoKey].userHasVotes = guardAccountData.userHasVotes;
      },
      false,
      'setGuardAccountData',
    );
  },
  getGuard: daoKey => {
    return get().guards[daoKey] || EMPTY_GUARD;
  },
});
