import { addresses } from '@fractal-framework/fractal-contracts';
import {
  getCompatibilityFallbackHandlerDeployment,
  getMultiSendCallOnlyDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
} from '@safe-global/safe-deployments';
import { getAddress } from 'viem';
import { mainnet } from 'wagmi/chains';
import { GovernanceType } from '../../../types';
import { NetworkConfig } from '../../../types/network';
import { getSafeContractDeploymentAddress } from './utils';

const SAFE_VERSION = '1.3.0';

const chain = mainnet;
const a = addresses[chain.id];

export const mainnetConfig: NetworkConfig = {
  order: 0,
  chain,
  rpcEndpoint: `https://eth-mainnet.g.alchemy.com/v2/${import.meta.env?.VITE_APP_ALCHEMY_API_KEY}`,
  moralisSupported: true,
  safeBaseURL: 'https://safe-transaction-mainnet.safe.global',
  etherscanBaseURL: 'https://etherscan.io',
  etherscanAPIUrl: `https://api.etherscan.io/api?apikey=${import.meta.env?.VITE_APP_ETHERSCAN_MAINNET_API_KEY}`,
  addressPrefix: 'eth',
  nativeTokenIcon: '/images/coin-icon-eth.svg',
  subgraph: {
    space: 71032,
    slug: 'fractal-mainnet',
    version: 'v0.1.1',
  },
  sablierSubgraph: {
    space: 57079,
    slug: 'sablier-v2',
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
    zodiacModuleProxyFactoryOld: getAddress(a.ModuleProxyFactory),

    linearVotingErc20MasterCopy: getAddress(a.LinearERC20Voting),
    linearVotingErc721MasterCopy: getAddress(a.LinearERC721Voting),

    moduleAzoriusMasterCopy: getAddress(a.Azorius),
    moduleFractalMasterCopy: getAddress(a.FractalModule),

    freezeGuardAzoriusMasterCopy: getAddress(a.AzoriusFreezeGuard),
    freezeGuardMultisigMasterCopy: getAddress(a.MultisigFreezeGuard),

    freezeVotingErc20MasterCopy: getAddress(a.ERC20FreezeVoting),
    freezeVotingErc721MasterCopy: getAddress(a.ERC721FreezeVoting),
    freezeVotingMultisigMasterCopy: getAddress(a.MultisigFreezeVoting),

    votesErc20MasterCopy: getAddress(a.VotesERC20),
    votesErc20WrapperMasterCopy: getAddress(a.VotesERC20Wrapper),

    claimErc20MasterCopy: getAddress(a.ERC20Claim),

    fractalRegistry: getAddress(a.FractalRegistry),
    keyValuePairs: getAddress(a.KeyValuePairs),
    decentHatsMasterCopy: getAddress(a.DecentHats_0_1_0),
    decentSablierMasterCopy: getAddress(a.DecentSablierStreamManagement),

    hatsProtocol: '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137',
    erc6551Registry: '0x000000006551c19487814612e58FE06813775758',
    hatsAccount1ofNMasterCopy: '0xfEf83A660b7C10a3EdaFdCF62DEee1fD8a875D29',
    sablierV2Batch: '0xB5Ec9706C3Be9d22326D208f491E5DEef7C8d9f0',
    sablierV2LockupDynamic: '0x9DeaBf7815b42Bf4E9a03EEc35a486fF74ee7459',
    sablierV2LockupTranched: '0xf86B359035208e4529686A1825F2D5BeE38c28A8',
    sablierV2LockupLinear: '0x3962f6585946823440d274aD7C719B02b49DE51E',
  },
  staking: {
    lido: {
      rewardsAddress: '0x8202E3cBa328CCf3eeA5bF0A11596c5297Cf7525',
      stETHContractAddress: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      withdrawalQueueContractAddress: '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1',
    },
  },
  moralis: {
    deFiSupported: true,
  },
  createOptions: [GovernanceType.MULTISIG, GovernanceType.AZORIUS_ERC20],
};

export default mainnetConfig;
