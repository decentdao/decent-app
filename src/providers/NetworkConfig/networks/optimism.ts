import { addresses } from '@fractal-framework/fractal-contracts';
import {
  getCompatibilityFallbackHandlerDeployment,
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
} from '@safe-global/safe-deployments';
import { getAddress, zeroAddress } from 'viem';
import { optimism } from 'wagmi/chains';
import { GovernanceType } from '../../../types';
import { NetworkConfig } from '../../../types/network';
import { getEtherscanAPIUrl, getSafeContractDeploymentAddress } from './utils';

const SAFE_VERSION = '1.3.0';

const chain = optimism;
const a = addresses[chain.id];

export const optimismConfig: NetworkConfig = {
  order: 15,
  chain,
  rpcEndpoint: `https://opt-mainnet.g.alchemy.com/v2/${import.meta.env?.VITE_APP_ALCHEMY_API_KEY}`,
  safeBaseURL: 'https://safe-transaction-optimism.safe.global',
  etherscanBaseURL: 'https://optimistic.etherscan.io/',
  etherscanAPIUrl: getEtherscanAPIUrl(chain.id),
  addressPrefix: 'oeth',
  nativeTokenIcon: '/images/coin-icon-op.svg',
  isENSSupported: false,
  decentSubgraph: {
    space: 71032,
    slug: 'fractal-optimism',
    id: 'HUiUhcR6A3BTjw7VoeLj5n2pAPPJ51K5DBD8Q2Uu94MH',
  },
  sablierSubgraph: {
    space: 57079,
    slug: 'sablier-v2-optimism',
    id: 'NZHzd2JNFKhHP5EWUiDxa5TaxGCFbSD4g6YnYr8JGi6',
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

    linearVotingErc20V1MasterCopy: zeroAddress,
    linearVotingErc20HatsWhitelistingV1MasterCopy: zeroAddress,
    linearVotingErc721V1MasterCopy: zeroAddress,
    linearVotingErc721HatsWhitelistingV1MasterCopy: zeroAddress,

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
    sablierV2Batch: '0x6cd7bB0f63aFCc9F6CeDd1Bf1E3Bd4ED078CD019',
    sablierV2LockupDynamic: '0x4994325F8D4B4A36Bd643128BEb3EC3e582192C0',
    sablierV2LockupTranched: '0x90952912a50079bef00D5F49c975058d6573aCdC',
    sablierV2LockupLinear: '0x5C22471A86E9558ed9d22235dD5E0429207ccf4B',
    disperse: '0xD152f549545093347A162Dce210e7293f1452150',
  },
  staking: {},
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
    // native USDC on Optimism
    usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  },
};

export default optimismConfig;
