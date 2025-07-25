import { TokenInfoResponse, TransferResponse } from '@safe-global/api-kit';
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import { Address } from 'viem';
import { ERC20LockedTokenData, ERC721TokenData, VotesTokenData } from './account';
import { DAOOwnedEntities } from './daoGeneral';
import { FreezeGuardType, FreezeVotingType } from './daoGovernance';
import { AzoriusProposal, MultisigProposal, ProposalData } from './daoProposal';
import { DefiBalance, NFTBalance, TokenBalance, TokenEventType, TransferType } from './daoTreasury';
import { ProposalTemplate } from './proposalBuilder';
import { RevenueSharingWallet } from './revShare';
import { SafeInfoResponseWithGuard } from './safeGlobal';
import { SnapshotProposal } from './snapshot';

/**
 * The possible states of a DAO proposal, for both Token Voting (Azorius) and Multisignature
 * (Safe) governance, as well as Snapshot specific states.
 *
 * @note it is required that Azorius-specific states match those on the Azorius contracts,
 * including casing and ordering.  States not specific to Azorius must be placed at the end
 * of this enum.
 */
export enum FractalProposalState {
  /**
   * Proposal is created and can be voted on.  This is the initial state of all
   * newly created proposals.
   *
   * Azorius / Multisig (all proposals).
   */
  ACTIVE = 'stateActive',

  /**
   * A proposal that passes enters the `TIMELOCKED` state, during which it cannot yet be executed.
   * This is to allow time for token holders to potentially exit their position, as well as parent DAOs
   * time to initiate a freeze, if they choose to do so. A proposal stays timelocked for the duration
   * of its `timelockPeriod`.
   *
   * Azorius (all) and multisig *subDAO* proposals.
   */
  TIMELOCKED = 'stateTimeLocked',

  /**
   * Following the `TIMELOCKED` state, a passed proposal becomes `EXECUTABLE`, and can then finally
   * be executed on chain.
   *
   * Azorius / Multisig (all proposals).
   */
  EXECUTABLE = 'stateExecutable',

  /**
   * The final state for a passed proposal.  The proposal has been executed on the blockchain.
   *
   * Azorius / Multisig (all proposals).
   */
  EXECUTED = 'stateExecuted',

  /**
   * A passed proposal which is not executed before its `executionPeriod` has elapsed will be `EXPIRED`,
   * and can no longer be executed.
   *
   * Azorius (all) and multisig *subDAO* proposals.
   */
  EXPIRED = 'stateExpired',

  /**
   * A failed proposal (as defined by its [BaseStrategy](../BaseStrategy.md) `isPassed` function). For a basic strategy,
   * this would mean it received more NO votes than YES or did not achieve quorum.
   *
   * Azorius only.
   */
  FAILED = 'stateFailed',

  /**
   * Proposal fails due to a proposal being executed with the same nonce.
   * A multisig proposal is off-chain, and is signed with a specific nonce.
   * If a proposal with a nonce is executed, any proposal with the same or lesser
   * nonce will be impossible to execute, reguardless of how many signers it has.
   *
   * Multisig only.
   */
  REJECTED = 'stateRejected',

  /**
   * Quorum (or signers) is reached, the proposal can be 'timelocked' for execution.
   * Anyone can move the state from Timelockable to TimeLocked via a transaction.
   *
   * Multisig subDAO only, Azorius DAOs move from ACTIVE to TIMELOCKED automatically.
   */
  TIMELOCKABLE = 'stateTimelockable',

  /**
   * Any Safe is able to have modules attached (e.g. Azorius), which can act essentially as a backdoor,
   * executing transactions without needing the required signers.
   *
   * Safe Module 'proposals' in this sense are single state proposals that are already executed.
   *
   * This is a rare case, but third party modules could potentially generate this state so we allow
   * for badges to properly label this case in the UI.
   *
   * Third party Safe module transactions only.
   */
  MODULE = 'stateModule',

  /**
   * The proposal is pending, meaning it has been created, but voting has not yet begun. This state
   * has nothing to do with Fractal, and is used for Snapshot proposals only, which appear if the
   * DAO's snapshotENS is set.
   */
  PENDING = 'statePending',

  /**
   * The proposal is closed, and no longer able to be signed. This state has nothing to do with Fractal,
   * and is used for Snapshot proposals only, which appear if the DAO's snapshotENS is set.
   */
  CLOSED = 'stateClosed',
}

export type GnosisSafe = {
  // replaces SafeInfoResponseWithGuard and SafeWithNextNonce
  address: Address;
  owners: Address[];
  nonce: number;
  nextNonce: number;
  threshold: number;
  modulesAddresses: Address[];
  guard: Address | null;
};

export interface DAOSubgraph {
  // replaces Part of DaoInfo
  daoName: string | null;
  parentAddress: Address | null;
  childAddresses: Address[];
  daoSnapshotENS: string | null;
  proposalTemplatesHash: string | null;
  gasTankAddress?: Address;
}

// @todo should we add other Decent Module types here?
export enum DecentModuleType {
  // replaces FractalModuleType
  AZORIUS, // Token Module
  FRACTAL, // CHILD GOVERNANCE MODULE
  UNKNOWN, // NON-DECENT MODULE
}

// @todo better typing here, SUBGRAPH has DAO type name,
export interface IDAO {
  // replaces DaoInfo
  safe: GnosisSafe | null;
  subgraphInfo: DAOSubgraph | null;
  modules: DecentModule[] | null;
  revShareWallets?: RevenueSharingWallet[];
}

export interface GovernanceActivity extends ActivityBase {
  proposer: Address | null;
  state: FractalProposalState | null;
  proposalId: string;
  targets: Address[];
  data?: ProposalData;
  title?: string;
}

export interface ActivityBase {
  eventDate: Date;
  transaction?: ActivityTransactionType;
  transactionHash: string;
}

export type ActivityTransactionType = SafeMultisigTransactionResponse;

export interface ITokenAccount {
  userBalance?: bigint;
  userBalanceString: string | undefined;
  delegatee: string | undefined;
  votingWeight?: bigint;
  votingWeightString: string | undefined;
}

export interface FractalStore extends Fractal {}

export interface Fractal {
  guard: FreezeGuard;
  guardAccountData: GuardAccountData;
  governance: FractalGovernance;
  treasury: DecentTreasury;
  governanceContracts: FractalGovernanceContracts;
  guardContracts: FractalGuardContracts;
}

export enum FractalTokenType {
  erc20 = 'ERC20',
  erc721 = 'ERC721',
}

export type FractalVotingStrategy = {
  address: Address;
  type: FractalTokenType;
  withWhitelist: boolean;
  version?: number;
};

export type FractalGovernanceContracts = {
  linearVotingErc20Address?: Address;
  linearVotingErc20WithHatsWhitelistingAddress?: Address;
  linearVotingErc721Address?: Address;
  linearVotingErc721WithHatsWhitelistingAddress?: Address;
  moduleAzoriusAddress?: Address;
  votesTokenAddress?: Address;
  lockReleaseAddress?: Address;
  isLoaded: boolean;
  strategies: FractalVotingStrategy[];
};

export type SafeWithNextNonce = SafeInfoResponseWithGuard & { nextNonce: number };

export type DaoHierarchyStrategyType = 'ERC-20' | 'ERC-721' | 'MULTISIG';
export interface DaoHierarchyInfo {
  safeAddress: Address;
  daoName: string | null;
  daoSnapshotENS: string | null;
  parentAddress: Address | null;
  childAddresses: Address[];
  proposalTemplatesHash: string | null;
  modules: DecentModule[];
  votingStrategies: DaoHierarchyStrategyType[];
}

export interface DecentModule {
  moduleAddress: Address;
  moduleType: FractalModuleType;
}

export enum FractalModuleType {
  AZORIUS,
  FRACTAL,
  UNKNOWN,
}

export interface FractalGuardContracts {
  freezeGuardContractAddress?: Address;
  freezeVotingContractAddress?: Address;
  freezeGuardType: FreezeGuardType | null;
  freezeVotingType: FreezeVotingType | null;
  isGuardLoaded?: boolean;
}

export interface FreezeGuard {
  freezeVotesThreshold: bigint | null; // Number of freeze votes required to activate a freeze
  freezeProposalCreatedTime: bigint | null; // Block number the freeze proposal was created at
  freezeProposalVoteCount: bigint | null; // Number of accrued freeze votes
  freezeProposalPeriod: bigint | null; // Number of blocks a freeze proposal has to succeed
  freezePeriod: bigint | null; // Number of blocks a freeze lasts, from time of freeze proposal creation
  isFrozen: boolean;
}

export interface GuardAccountData {
  userHasFreezeVoted: boolean;
  userHasVotes: boolean;
}

export type TransferWithTokenInfo = TransferResponse & { tokenInfo: TokenInfoResponse };
export interface DecentTreasury {
  totalUsdValue: number;
  assetsFungible: TokenBalance[];
  assetsNonFungible: NFTBalance[];
  assetsDeFi: DefiBalance[];
  transfers: TransferDisplayData[] | null;
}

export type FractalGovernance = AzoriusGovernance | DecentGovernance | SafeMultisigGovernance;

export interface AzoriusGovernance extends Governance {
  votingStrategy: VotingStrategyAzorius | undefined;
  votesToken: VotesTokenData | undefined;
  erc721Tokens?: ERC721TokenData[];
}

export interface DecentGovernance extends AzoriusGovernance {
  lockedVotesToken?: VotesTokenData;
}
export interface SafeMultisigGovernance extends Governance {
  // This is here so that FractalGovernance can be used freely without
  // having to cast `as AzoriusGovernance` in order to access `votesToken`.
  // `SafeMultisigGovernance` doesn't have this, so `undefined` is its only possible value.
  votesToken?: undefined;
}

export type Governance = {
  type?: GovernanceType;
  loadingProposals: boolean;
  allProposalsLoaded: boolean;
  proposals: FractalProposal[] | null;
  pendingProposals: string[] | null;
  proposalTemplates?: ProposalTemplate[] | null;
  tokenClaimContractAddress?: Address;
  isAzorius: boolean;
  erc20Token: ERC20LockedTokenData | undefined;
} & DAOOwnedEntities;

export interface VotingStrategyAzorius extends VotingStrategy {
  strategyType?: VotingStrategyType;
}

interface BIFormattedPair {
  value: bigint;
  formatted?: string;
}

export interface VotingStrategy<Type = BIFormattedPair> {
  votingPeriod?: Type;
  quorumPercentage?: Type;
  quorumThreshold?: Type;
  timeLockPeriod?: Type;
  executionPeriod?: Type;
  proposerThreshold?: Type;
}

export enum GovernanceType {
  MULTISIG = 'labelMultisigGov',
  AZORIUS_ERC20 = 'labelAzoriusErc20Gov',
  AZORIUS_ERC721 = 'labelAzoriusErc721Gov',
}

export enum VotingStrategyType {
  LINEAR_ERC20 = 'labelLinearErc20',
  LINEAR_ERC20_HATS_WHITELISTING = 'labelLinearErc20WithWhitelisting',
  LINEAR_ERC721 = 'labelLinearErc721',
  LINEAR_ERC721_HATS_WHITELISTING = 'labelLinearErc721WithWhitelisting',
}

export type FractalProposal = AzoriusProposal | MultisigProposal | SnapshotProposal;

export interface TransferDisplayData {
  eventType: TokenEventType;
  transferType: TransferType;
  executionDate: string;
  image: string;
  assetDisplay: string;
  fullCoinTotal: string | undefined;
  transferAddress: string;
  isLast: boolean;
  transactionHash: string;
  tokenId: string;
  tokenInfo?: TokenInfoResponse;
}

export enum SortBy {
  Newest = 'newest',
  Oldest = 'oldest',
}
