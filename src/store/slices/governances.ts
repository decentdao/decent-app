import { StateCreator } from 'zustand';
import { DAOKey, FractalGovernance, FractalGovernanceContracts, AzoriusGovernance } from '../../types';
import { GlobalStore, SetState, StoreSlice } from '../store';



export type GovernancesSlice = {
    governances: StoreSlice<FractalGovernance & FractalGovernanceContracts>;
    setGovernance: (daoKey: DAOKey, governance: FractalGovernance & FractalGovernanceContracts) => void;
    getGovernance: (daoKey: DAOKey) => FractalGovernance & FractalGovernanceContracts;
}

const EMPTY_GOVERNANCE: FractalGovernance & FractalGovernanceContracts = {
    loadingProposals: false,
    allProposalsLoaded: false,
    proposals: null,
    pendingProposals: null,
    isAzorius: false,
    isLoaded: false,
    strategies: [],
}

export const createGovernancesSlice: StateCreator<GlobalStore, [], [], GovernancesSlice> = (
    set: SetState,
    get,
) => ({
    governances: {},
    setGovernance: (daoKey, governance) => {
        set(state => {
            const currentGovernance = state.governances[daoKey];
            if (!currentGovernance) {
                state.governances[daoKey] = governance;
            } else {
                currentGovernance.isLoaded = governance.allProposalsLoaded;
                currentGovernance.proposals = governance.proposals;
                currentGovernance.pendingProposals = governance.pendingProposals;
                currentGovernance.loadingProposals = governance.loadingProposals;
                currentGovernance.isAzorius = governance.isAzorius;
                currentGovernance.strategies = governance.strategies;
                (currentGovernance as AzoriusGovernance).votingStrategy = (governance as AzoriusGovernance).votingStrategy;
                (currentGovernance as AzoriusGovernance).votesToken = (governance as AzoriusGovernance).votesToken;
                (currentGovernance as AzoriusGovernance).erc721Tokens = (governance as AzoriusGovernance).erc721Tokens;
            }
        });
    },
    getGovernance: (daoKey) => {
        const governance = get().governances[daoKey];
        if (!governance) {
            return EMPTY_GOVERNANCE;
        }
        return governance;
    }
});