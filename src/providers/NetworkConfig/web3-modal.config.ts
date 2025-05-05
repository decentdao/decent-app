import { QueryClient } from '@tanstack/react-query';
import { createSIWEConfig } from "@web3modal/siwe";
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { getNonce, verify, me, logout } from 'decent-sdk';
import { HttpTransport } from 'viem';
import { createSiweMessage } from 'viem/siwe'
import { http } from 'wagmi';
import { Chain } from 'wagmi/chains';
import { NetworkConfig } from '../../types/network';
import { supportedNetworks } from './useNetworkConfigStore';

const supportedWagmiChains = supportedNetworks.map(network => network.chain);

export const walletConnectProjectId = import.meta.env.VITE_APP_WALLET_CONNECT_PROJECT_ID;
export const queryClient = new QueryClient();

const metadata = {
  name: import.meta.env.VITE_APP_NAME,
  description:
    'Are you outgrowing your Multisig? Decent extends Safe treasuries into on-chain hierarchies of permissions, token flows, and governance.',
  url: import.meta.env.VITE_APP_SITE_URL,
  icons: [`${import.meta.env.VITE_APP_SITE_URL}/favicon-96x96.png`],
};

export const transportsReducer = (
  accumulator: Record<string, HttpTransport>,
  network: NetworkConfig,
) => {
  accumulator[network.chain.id] = http(network.rpcEndpoint);
  return accumulator;
};

export const wagmiConfig = defaultWagmiConfig({
  chains: supportedWagmiChains as [Chain, ...Chain[]],
  projectId: walletConnectProjectId,
  metadata,
  transports: supportedNetworks.reduce(transportsReducer, {}),
});

const siweConfig = createSIWEConfig({
  enabled: true,
  getNonce: async () => {
    const nonce = await getNonce();
    return nonce;
  },
  createMessage: (args) => {
    const address = args.address.split(':')[2];
    return createSiweMessage({ ...args, address: address as `0x${string}`});
  },
  getMessageParams: async () => {
    const siweArgs = {
      domain: import.meta.env.VITE_APP_SITE_URL,
      uri: import.meta.env.VITE_APP_SITE_URL,
      chains: supportedWagmiChains.map(chain => chain.id),
    };
    return siweArgs;
  },
  verifyMessage: async ({ message, signature }) => {
    const user = await verify({
      message,
      signature: signature as `0x${string}`,
    });
    return Boolean(user);
  },
  getSession: async () => {
    const user = await me();
    return {
      address: user.address,
      chainId: 1,
    };
  },
  signOut: async () => {
    const result = await logout();
    return result === 'ok';
  },
});

if (walletConnectProjectId) {
  createWeb3Modal({
    wagmiConfig,
    projectId: walletConnectProjectId,
    metadata,
    siweConfig,
  });
}
