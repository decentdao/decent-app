import { SplitV2Client } from '@0xsplits/splits-sdk';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import useNetworkPublicClient from '../useNetworkPublicClient';
import { useNetworkWalletClient } from '../useNetworkWalletClient';

export const useCreateSplitsClient = () => {
  const {
    chain: { id: chainId },
  } = useNetworkConfigStore();
  const publicClient = useNetworkPublicClient();
  const { data: walletClient } = useNetworkWalletClient();
  const splitsClient = new SplitV2Client({
    chainId,
    publicClient,
    includeEnsNames: false,
    apiConfig: {
      apiKey: '', // You can create an API key by signing up on our app, and accessing your account settings at app.splits.org/settings.
    }, // Splits GraphQL API key config, this is required for the data client to access the splits graphQL API.
    walletClient,
  });

  return splitsClient;
};
