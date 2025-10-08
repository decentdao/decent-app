import { legacy, addresses } from '@decentdao/decent-contracts';
import {
  getCompatibilityFallbackHandlerDeployment,
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
} from '@safe-global/safe-deployments';
import { sepolia } from 'wagmi/chains';
import { GovernanceType } from '../../../types';
import { NetworkConfig } from '../../../types/network';
import {
  getEtherscanAPIUrl,
  getSafeContractDeploymentAddress,
  getAddressFromContractDeploymentInfo,
} from './utils';

const SAFE_VERSION = '1.3.0';

const chain = sepolia;
const a = legacy.addresses[chain.id];

const sepoliaConfig: NetworkConfig = {
  order: 30,
  chain,
  rpcEndpoint: `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env?.VITE_APP_ALCHEMY_API_KEY}`,
  safeBaseURL: 'https://safe-transaction-sepolia.safe.global',
  etherscanBaseURL: 'https://sepolia.etherscan.io',
  etherscanAPIUrl: getEtherscanAPIUrl(chain.id),
  addressPrefix: 'sep',
  nativeTokenIcon: '/images/coin-icon-sep.svg',
  isENSSupported: true,
  decentSubgraph: {
    space: 71032,
    slug: 'fractal-sepolia',
    id: 'GNsEo1grZ1dUyyPbPnAutkDtx51t1XN8DhgMHThgo7b2',
  },
  sablierSubgraph: {
    space: 57079,
    slug: 'sablier-v2-sepolia',
    id: '5yDtFSxyRuqyjvGJyyuQhMEW3Uah7Ddy2KFSKVhy9VMa',
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
    sablierV2Batch: '0x04A9c14b7a000640419aD5515Db4eF4172C00E31',
    sablierV2LockupDynamic: '0x73BB6dD3f5828d60F8b3dBc8798EB10fbA2c5636',
    sablierV2LockupTranched: '0x3a1beA13A8C24c0EA2b8fAE91E4b2762A59D7aF5',
    sablierV2LockupLinear: '0x3E435560fd0a03ddF70694b35b673C25c65aBB6C',
    disperse: '0xD152f549545093347A162Dce210e7293f1452150',

    accountAbstraction: {
      entryPointv07: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      lightAccountFactory: '0x0000000000400CdFef5E2714E63d8040b700BC24',
    },

    tokenSaleV1MasterCopy: addresses.deployables.TokenSaleV1,
    decentVerifierV1: addresses.services.VerifierV1,
  },

  moralis: {
    chainSupported: true,
    deFiSupported: false,
  },
  createOptions: [
    GovernanceType.MULTISIG,
    GovernanceType.AZORIUS_ERC20,
    GovernanceType.AZORIUS_ERC721,
  ],
  bundlerMinimumStake: 100_000_000_000_000_000n, // 0.1 ETH,
  stablecoins: {
    usdc: {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      decimals: 6,
      icon: '/images/coin-icon-usdc.svg',
      name: 'USDC',
      symbol: 'USDC',
    },
  },
  tokenSale: {
    protocolFeeReceiver: '0x0000000000000000000000000000000000000000', // Will be set to connected account deploying token sale
  },
};

export default sepoliaConfig;
