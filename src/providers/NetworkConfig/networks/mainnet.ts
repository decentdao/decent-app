import { legacy, addresses } from '@decentdao/decent-contracts';
import {
  getCompatibilityFallbackHandlerDeployment,
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
} from '@safe-global/safe-deployments';
import { mainnet } from 'wagmi/chains';
import { GovernanceType } from '../../../types';
import { NetworkConfig } from '../../../types/network';
import {
  getEtherscanAPIUrl,
  getSafeContractDeploymentAddress,
  getAddressFromContractDeploymentInfo,
} from './utils';

const SAFE_VERSION = '1.3.0';

const chain = mainnet;
const a = legacy.addresses[chain.id];

export const mainnetConfig: NetworkConfig = {
  order: 0,
  chain,
  rpcEndpoint: `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env?.VITE_APP_ALCHEMY_API_KEY}`,
  safeBaseURL: 'https://safe-transaction-mainnet.safe.global',
  etherscanBaseURL: 'https://etherscan.io',
  etherscanAPIUrl: getEtherscanAPIUrl(chain.id),
  addressPrefix: 'eth',
  nativeTokenIcon: '/images/coin-icon-eth.svg',
  isENSSupported: true,
  decentSubgraph: {
    space: 71032,
    slug: 'fractal-mainnet',
    id: 'EwAjJixmcVMcxoj1qt1o2oae1rbvvZNdfshkfovLrbxp',
  },
  sablierSubgraph: {
    space: 57079,
    slug: 'sablier-v2',
    id: 'AvDAMYYHGaEwn9F9585uqq6MM5CfvRtYcb7KjK7LKPCt',
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

    linearVotingErc20V1MasterCopy: getAddressFromContractDeploymentInfo(a.LinearERC20VotingV1),
    linearVotingErc20HatsWhitelistingV1MasterCopy: getAddressFromContractDeploymentInfo(
      a.LinearERC20VotingWithHatsProposalCreationV1,
    ),
    linearVotingErc721V1MasterCopy: getAddressFromContractDeploymentInfo(a.LinearERC721VotingV1),
    linearVotingErc721HatsWhitelistingV1MasterCopy: getAddressFromContractDeploymentInfo(
      a.LinearERC721VotingWithHatsProposalCreationV1,
    ),

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
    sablierV2Batch: '0xB5Ec9706C3Be9d22326D208f491E5DEef7C8d9f0',
    sablierV2LockupDynamic: '0x9DeaBf7815b42Bf4E9a03EEc35a486fF74ee7459',
    sablierV2LockupTranched: '0xf86B359035208e4529686A1825F2D5BeE38c28A8',
    sablierV2LockupLinear: '0x3962f6585946823440d274aD7C719B02b49DE51E',
    disperse: '0xD152f549545093347A162Dce210e7293f1452150',

    accountAbstraction: {
      entryPointv07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      lightAccountFactory: '0x0000000000400CdFef5E2714E63d8040b700BC24',
    },
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
  bundlerMinimumStake: 100_000_000_000_000_000n, // 0.1 ETH
  stablecoins: {
    usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  },
};

export default mainnetConfig;
