import { FormikProps } from 'formik';
import { Address } from 'viem';
import { DAOCreateMode } from '../components/DaoCreator/formComponents/EstablishEssentials';
import { BigIntValuePair } from './common';
import { GovernanceType, VotingStrategyType } from './fractal';

export enum CreatorSteps {
  ESSENTIALS = 'essentials',
  MULTISIG_DETAILS = 'multisig',
  ERC20_DETAILS = 'erc20Token',
  ERC721_DETAILS = 'erc721Token',
  AZORIUS_DETAILS = 'azorius',
  FREEZE_DETAILS = 'freeze',
}

export const RootMultisigSteps = [CreatorSteps.ESSENTIALS, CreatorSteps.MULTISIG_DETAILS];
export const ChildMultisigSteps = [
  CreatorSteps.ESSENTIALS,
  CreatorSteps.MULTISIG_DETAILS,
  CreatorSteps.FREEZE_DETAILS,
];

export const RootERC20Steps = [
  CreatorSteps.ESSENTIALS,
  CreatorSteps.ERC20_DETAILS,
  CreatorSteps.AZORIUS_DETAILS,
];
export const ChildERC20Steps = [
  CreatorSteps.ESSENTIALS,
  CreatorSteps.ERC20_DETAILS,
  CreatorSteps.AZORIUS_DETAILS,
  CreatorSteps.FREEZE_DETAILS,
];

export const RootERC721Steps = [
  CreatorSteps.ESSENTIALS,
  CreatorSteps.ERC721_DETAILS,
  CreatorSteps.AZORIUS_DETAILS,
];
export const ChildERC721Steps = [
  CreatorSteps.ESSENTIALS,
  CreatorSteps.ERC721_DETAILS,
  CreatorSteps.AZORIUS_DETAILS,
  CreatorSteps.FREEZE_DETAILS,
];

export enum TokenCreationType {
  IMPORTED = 'imported',
  NEW = 'new',
}
export interface ICreationStepProps extends Omit<FormikProps<CreatorFormState>, 'handleSubmit'> {
  transactionPending?: boolean;
  isSubDAO?: boolean;
  mode: DAOCreateMode;
  steps: CreatorSteps[];
}

export interface CreatorFormState<T = BigIntValuePair> {
  essentials: DAOEssentials;
  multisig: SafeConfiguration;
  azorius: DAOGovernorModuleConfig<T>;
  erc20Token: DAOGovernorERC20Token<T>;
  erc721Token: DAOGovernorERC721Token<T>;
  freeze: DAOFreezeGuardConfig<T>;
}

export type DAOEssentials = {
  daoName: string;
  governance: GovernanceType;
  snapshotENS: string;
  gaslessVoting: boolean;
};

export type DAOGovernorERC20Token<T = bigint> = {
  tokenCreationType: TokenCreationType;
  tokenImportAddress?: Address;
  tokenName: string;
  tokenSymbol: string;
  tokenSupply: T;
  tokenAllocations: { amount: T; address: string }[];
  parentAllocationAmount: T;
};

export type ERC721TokenConfig<T = bigint> = {
  tokenAddress?: Address;
  tokenWeight: T;
};

export type DAOGovernorERC721Token<T = bigint> = {
  nfts: ERC721TokenConfig<T>[];
  quorumThreshold: T;
};

export type DAOGovernorModuleConfig<T = bigint> = {
  votingStrategyType: VotingStrategyType;
  quorumPercentage: T;
  timelock: T;
  votingPeriod: T;
  executionPeriod: T;
};

export type DAOFreezeGuardConfig<T = bigint> = {
  executionPeriod: T;
  timelockPeriod: T;
  freezeVotesThreshold: T;
  freezeProposalPeriod: T;
  freezePeriod: T;
  attachFractalModule: boolean;
};

export interface SafeConfiguration {
  trustedAddresses: string[];
  signatureThreshold: number;
  numOfSigners?: number;
  customNonce: number;
}

export interface SubDAO<T = bigint>
  extends SafeConfiguration,
    AzoriusGovernanceDAO<T>,
    DAOFreezeGuardConfig<T> {}

export interface AzoriusGovernanceDAO<T = bigint>
  extends DAOEssentials,
    DAOGovernorModuleConfig<T> {}

export interface AzoriusERC20DAO<T = bigint>
  extends AzoriusGovernanceDAO<T>,
    DAOGovernorERC20Token<T> {
  isVotesToken?: boolean;
  isTokenImported?: boolean;
}

export interface AzoriusERC721DAO<T = bigint>
  extends AzoriusGovernanceDAO<T>,
    DAOGovernorERC721Token<T> {}

export interface SafeMultisigDAO extends DAOEssentials, SafeConfiguration {}

export type DAOTrigger = (
  daoData: SafeMultisigDAO | AzoriusERC20DAO | AzoriusERC721DAO | SubDAO,
  customNonce?: number,
) => void;

export type AddressValidationMap = Map<string, AddressValidation>;

export type AddressValidation = {
  address: string;
  isValidAddress: boolean;
};

export type TokenAllocation<T = bigint> = {
  amount: T;
  address: Address;
};

export type CreateDAOFunc = (
  daoData: SafeMultisigDAO,
  successCallback: DeployDAOSuccessCallback,
) => void;
export type DeployDAOSuccessCallback = (address: string) => void;
export type DAODetails = {
  daoName: string;
  governance: GovernanceType;
};
