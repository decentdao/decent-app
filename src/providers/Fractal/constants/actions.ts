export enum GnosisAction {
  SET_SAFE_SERVICE_CLIENT,
  SET_SAFE,
  SET_SAFE_TRANSACTIONS,
  SET_MODULES,
  SET_GUARD,
  SET_DAO_NAME,
  INVALIDATE,
  RESET,
}

export enum GovernanceAction {
  ADD_GOVERNANCE_DATA,
  RESET,
}

export enum TreasuryAction {
  UPDATE_GNOSIS_SAFE_FUNGIBLE_ASSETS,
  UPDATE_GNOSIS_SAFE_NONFUNGIBLE_ASSETS,
  UPDATE_GNOSIS_SAFE_TRANSFERS,
  RESET,
}

export enum AccountAction {
  UPDATE_DAO_FAVORITES,
  UPDATE_AUDIT_MESSAGE,
  RESET,
}
