import { addresses } from '@fractal-framework/fractal-contracts';
import {
  getCompatibilityFallbackHandlerDeployment,
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
} from '@safe-global/safe-deployments';
import { getAddress } from 'viem';
import { sepolia } from 'wagmi/chains';
import { GovernanceType } from '../../../types';
import { NetworkConfig } from '../../../types/network';
import { getEtherscanAPIUrl, getSafeContractDeploymentAddress } from './utils';

const SAFE_VERSION = '1.3.0';

const chain = sepolia;
const a = addresses[chain.id];

export const sepoliaConfig: NetworkConfig = {
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

    linearVotingErc20MasterCopy: getAddress(a.LinearERC20Voting),
    linearVotingErc20HatsWhitelistingMasterCopy: getAddress(
      a.LinearERC20VotingWithHatsProposalCreation,
    ),
    linearVotingErc721MasterCopy: getAddress(a.LinearERC721Voting),
    linearVotingErc721HatsWhitelistingMasterCopy: getAddress(
      a.LinearERC721VotingWithHatsProposalCreation,
    ),

    linearVotingErc20V1MasterCopy: getAddress(a.LinearERC20VotingV1),
    linearVotingErc20HatsWhitelistingV1MasterCopy: getAddress(
      a.LinearERC20VotingWithHatsProposalCreationV1,
    ),
    linearVotingErc721V1MasterCopy: getAddress(a.LinearERC721VotingV1),
    linearVotingErc721HatsWhitelistingV1MasterCopy: getAddress(
      a.LinearERC721VotingWithHatsProposalCreationV1,
    ),

    moduleAzoriusMasterCopy: getAddress(a.Azorius),
    moduleFractalMasterCopy: getAddress(a.FractalModule),

    freezeGuardAzoriusMasterCopy: getAddress(a.AzoriusFreezeGuard),
    freezeGuardMultisigMasterCopy: getAddress(a.MultisigFreezeGuard),

    freezeVotingErc20MasterCopy: getAddress(a.ERC20FreezeVoting),
    freezeVotingErc721MasterCopy: getAddress(a.ERC721FreezeVoting),
    freezeVotingMultisigMasterCopy: getAddress(a.MultisigFreezeVoting),

    votesErc20MasterCopy: getAddress(a.VotesERC20),
    votesErc20LockableMasterCopy: getAddress(a.VotesERC20LockableV1),

    claimErc20MasterCopy: getAddress(a.ERC20Claim),

    decentAutonomousAdminV1MasterCopy: getAddress(a.DecentAutonomousAdminV1),

    paymaster: {
      decentPaymasterV1MasterCopy: getAddress(a.DecentPaymasterV1),
      linearERC20VotingV1ValidatorV1: getAddress(a.LinearERC20VotingV1ValidatorV1),
      linearERC721VotingV1ValidatorV1: getAddress(a.LinearERC721VotingV1ValidatorV1),
    },

    keyValuePairs: getAddress(a.KeyValuePairs),

    decentHatsCreationModule: getAddress(a.DecentHatsCreationModule),
    decentHatsModificationModule: getAddress(a.DecentHatsModificationModule),
    decentSablierStreamManagementModule: getAddress(a.DecentSablierStreamManagementModule),

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
  },
  staking: {},
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
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },
};

export default sepoliaConfig;
