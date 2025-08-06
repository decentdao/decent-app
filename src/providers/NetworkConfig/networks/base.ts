import { legacy, addresses } from '@decentdao/decent-contracts';
import {
  getCompatibilityFallbackHandlerDeployment,
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
} from '@safe-global/safe-deployments';
import { zeroAddress } from 'viem';
import { base } from 'wagmi/chains';
import { GovernanceType } from '../../../types';
import { NetworkConfig } from '../../../types/network';
import {
  getEtherscanAPIUrl,
  getSafeContractDeploymentAddress,
  getAddressFromContractDeploymentInfo,
} from './utils';

const SAFE_VERSION = '1.3.0';

const chain = base;
const a = legacy.addresses[chain.id];

const baseConfig: NetworkConfig = {
  order: 10,
  chain,
  rpcEndpoint: `https://base-mainnet.g.alchemy.com/v2/${import.meta.env?.VITE_APP_ALCHEMY_API_KEY}`,
  safeBaseURL: 'https://safe-transaction-base.safe.global',
  etherscanBaseURL: 'https://basescan.org/',
  etherscanAPIUrl: getEtherscanAPIUrl(chain.id),
  addressPrefix: 'base',
  nativeTokenIcon: '/images/coin-icon-base.svg',
  isENSSupported: false,
  decentSubgraph: {
    space: 71032,
    slug: 'fractal-base',
    id: 'BWv5n6PPqv99y6vAez5M9jNvmKagpSpKprYPoKMb8z4o',
  },
  sablierSubgraph: {
    space: 57079,
    slug: 'sablier-v2-base',
    id: '778GfecD9tsyB4xNnz4wfuAyfHU6rqGr79VCPZKu3t2F',
  },
  contracts: {
    gnosisSafeL2Singleton: getSafeContractDeploymentAddress(
      getSafeL2SingletonDeployment,
      SAFE_VERSION,
      chain.id.toString(),
    ),
    gnosisSafeProxyFactory: getSafeContractDeploymentAddress(
      getProxyFactoryDeployment,
      SAFE_VERSION,
      chain.id.toString(),
    ),
    compatibilityFallbackHandler: getSafeContractDeploymentAddress(
      getCompatibilityFallbackHandlerDeployment,
      SAFE_VERSION,
      chain.id.toString(),
    ),
    multiSendCallOnly: getSafeContractDeploymentAddress(
      getMultiSendCallOnlyDeployment,
      SAFE_VERSION,
      chain.id.toString(),
    ),

    zodiacModuleProxyFactory: '0x000000000000aDdB49795b0f9bA5BC298cDda236',

    linearVotingErc20MasterCopy: getAddressFromContractDeploymentInfo(a.LinearERC20Voting),
    linearVotingErc20HatsWhitelistingMasterCopy: getAddressFromContractDeploymentInfo(
      a.LinearERC20VotingWithHatsProposalCreation,
    ),
    linearVotingErc721MasterCopy: getAddressFromContractDeploymentInfo(a.LinearERC721Voting),
    linearVotingErc721HatsWhitelistingMasterCopy: getAddressFromContractDeploymentInfo(
      a.LinearERC721VotingWithHatsProposalCreation,
    ),

    linearVotingErc20V1MasterCopy: zeroAddress,
    linearVotingErc20HatsWhitelistingV1MasterCopy: zeroAddress,
    linearVotingErc721V1MasterCopy: zeroAddress,
    linearVotingErc721HatsWhitelistingV1MasterCopy: zeroAddress,

    moduleAzoriusMasterCopy: getAddressFromContractDeploymentInfo(a.Azorius),
    moduleFractalMasterCopy: getAddressFromContractDeploymentInfo(a.FractalModule),

    freezeGuardAzoriusMasterCopy: getAddressFromContractDeploymentInfo(a.AzoriusFreezeGuard),
    freezeGuardMultisigMasterCopy: getAddressFromContractDeploymentInfo(a.MultisigFreezeGuard),

    freezeVotingErc20MasterCopy: getAddressFromContractDeploymentInfo(a.ERC20FreezeVoting),
    freezeVotingErc721MasterCopy: getAddressFromContractDeploymentInfo(a.ERC721FreezeVoting),
    freezeVotingMultisigMasterCopy: getAddressFromContractDeploymentInfo(a.MultisigFreezeVoting),

    votesErc20MasterCopy: getAddressFromContractDeploymentInfo(a.VotesERC20),
    votesErc20LockableMasterCopy: addresses.deployables.VotesERC20V1,
    votesERC20StakedV1MasterCopy: addresses.deployables.VotesERC20StakedV1,

    claimErc20MasterCopy: getAddressFromContractDeploymentInfo(a.ERC20Claim),

    decentAutonomousAdminV1MasterCopy: getAddressFromContractDeploymentInfo(
      a.DecentAutonomousAdminV1,
    ),

    paymaster: {
      decentPaymasterV1MasterCopy: getAddressFromContractDeploymentInfo(a.DecentPaymasterV1),
      linearERC20VotingV1ValidatorV1: getAddressFromContractDeploymentInfo(
        a.LinearERC20VotingV1ValidatorV1,
      ),
      linearERC721VotingV1ValidatorV1: getAddressFromContractDeploymentInfo(
        a.LinearERC721VotingV1ValidatorV1,
      ),
    },

    keyValuePairs: getAddressFromContractDeploymentInfo(a.KeyValuePairs),

    decentHatsCreationModule: getAddressFromContractDeploymentInfo(a.DecentHatsCreationModule),
    decentHatsModificationModule: getAddressFromContractDeploymentInfo(
      a.DecentHatsModificationModule,
    ),
    decentSablierStreamManagementModule: getAddressFromContractDeploymentInfo(
      a.DecentSablierStreamManagementModule,
    ),

    hatsProtocol: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
    erc6551Registry: '0x000000006551c19487814612e58FE06813775758',
    hatsAccount1ofNMasterCopy: '0xfEf83A660b7C10a3EdaFdCF62DEee1fD8a875D29',
    hatsElectionsEligibilityMasterCopy: '0xd3b916a8F0C4f9D1d5B6Af29c3C012dbd4f3149E',
    sablierV2Batch: '0xc1c548F980669615772dadcBfEBC29937c29481A',
    sablierV2LockupDynamic: '0xF9E9eD67DD2Fab3b3ca024A2d66Fcf0764d36742',
    sablierV2LockupTranched: '0xf4937657Ed8B3f3cB379Eed47b8818eE947BEb1e',
    sablierV2LockupLinear: '0x4CB16D4153123A74Bc724d161050959754f378D8',
    disperse: '0xD152f549545093347A162Dce210e7293f1452150',
  },

  moralis: {
    chainSupported: true,
    deFiSupported: true,
  },
  createOptions: [
    GovernanceType.MULTISIG,
    GovernanceType.AZORIUS_ERC20,
    GovernanceType.AZORIUS_ERC721,
  ],
  stablecoins: {
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
};

export default baseConfig;
