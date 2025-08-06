import { Address, Chain } from 'viem';
import { GovernanceType } from './fractal';

export type TheGraphConfig = {
  space: number; // for dev
  slug: string; // for dev
  id: string; // for prod
};

export type NetworkPrefix = 'base' | 'eth' | 'oeth' | 'matic' | 'sep'; // copy whatever Safe uses

type ContractsBase = {
  gnosisSafeL2Singleton: Address;
  gnosisSafeProxyFactory: Address;
  compatibilityFallbackHandler: Address;

  multiSendCallOnly: Address;

  zodiacModuleProxyFactory: Address;

  linearVotingErc20MasterCopy: Address;
  linearVotingErc20HatsWhitelistingMasterCopy: Address;
  linearVotingErc721MasterCopy: Address;
  linearVotingErc721HatsWhitelistingMasterCopy: Address;

  linearVotingErc20V1MasterCopy: Address;
  linearVotingErc20HatsWhitelistingV1MasterCopy: Address;
  linearVotingErc721V1MasterCopy: Address;
  linearVotingErc721HatsWhitelistingV1MasterCopy: Address;

  moduleAzoriusMasterCopy: Address;
  moduleFractalMasterCopy: Address;

  freezeGuardAzoriusMasterCopy: Address;
  freezeGuardMultisigMasterCopy: Address;

  freezeVotingErc20MasterCopy: Address;
  freezeVotingErc721MasterCopy: Address;
  freezeVotingMultisigMasterCopy: Address;

  votesErc20MasterCopy: Address;
  votesErc20LockableMasterCopy?: Address;
  votesERC20StakedV1MasterCopy?: Address;

  claimErc20MasterCopy: Address;

  decentAutonomousAdminV1MasterCopy: Address;

  paymaster: {
    decentPaymasterV1MasterCopy: Address;
    linearERC20VotingV1ValidatorV1: Address;
    linearERC721VotingV1ValidatorV1: Address;
  };

  keyValuePairs: Address;

  decentHatsCreationModule: Address;
  decentHatsModificationModule: Address;
  decentSablierStreamManagementModule: Address;

  hatsProtocol: Address;
  erc6551Registry: Address;
  hatsAccount1ofNMasterCopy: Address;
  hatsElectionsEligibilityMasterCopy: Address;
  sablierV2Batch: Address;
  sablierV2LockupDynamic: Address;
  sablierV2LockupTranched: Address;
  sablierV2LockupLinear: Address;
  disperse: Address;
};

// Base type containing properties common to all network configs
type NetworkConfigBase = {
  order: number;
  chain: Chain;
  rpcEndpoint: string;
  safeBaseURL: string;
  etherscanBaseURL: string;
  etherscanAPIUrl: string;
  addressPrefix: NetworkPrefix;
  nativeTokenIcon: string;
  isENSSupported: boolean;
  decentSubgraph: TheGraphConfig;
  sablierSubgraph: TheGraphConfig;
  moralis: {
    chainSupported: boolean;
    deFiSupported: boolean;
  };
  staking: {
  };
  createOptions: GovernanceType[];
  stablecoins: {
    usdc: Address;
  };
};

// Type for networks *with* Account Abstraction
type NetworkConfigWithAA = NetworkConfigBase & {
  contracts: ContractsBase & {
    // accountAbstraction is REQUIRED here
    accountAbstraction: {
      entryPointv07: Address;
      lightAccountFactory: Address;
    };
  };
  // bundlerMinimumStake is REQUIRED here
  bundlerMinimumStake: bigint;
};

// Type for networks *without* Account Abstraction
type NetworkConfigWithoutAA = NetworkConfigBase & {
  contracts: ContractsBase & {
    // accountAbstraction is OPTIONAL and UNDEFINED here
    accountAbstraction?: undefined;
  };
  // bundlerMinimumStake is OPTIONAL and UNDEFINED here
  bundlerMinimumStake?: undefined;
};

// The final NetworkConfig is a union of the two possibilities
export type NetworkConfig = NetworkConfigWithAA | NetworkConfigWithoutAA;
