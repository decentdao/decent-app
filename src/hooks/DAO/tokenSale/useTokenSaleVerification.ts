import { useCallback, useState } from 'react';
import { Address } from 'viem';
import { logError } from '../../../helpers/errorLogging';
import { getTokenSaleVerification, VerificationSignature } from '../../../providers/App/decentAPI';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
// eslint-disable-next-line import/extensions
import { useNetworkWalletClient } from '../../useNetworkWalletClient';
import { useCurrentDAOKey } from '../useCurrentDAOKey';

// EIP-712 types for token sale verification
const VERIFICATION_TYPES = {
  Verification: [
    { name: 'saleAddress', type: 'address' },
    { name: 'signerAddress', type: 'address' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

export function useTokenSaleVerification() {
  const { chain } = useNetworkConfigStore();
  const { safeAddress } = useCurrentDAOKey();
  const { data: walletClient } = useNetworkWalletClient();

  const [isLoading, setIsLoading] = useState(false);
  const [verificationSignature, setVerificationSignature] = useState<VerificationSignature | null>(
    null,
  );

  const getVerificationSignature = useCallback(
    async (tokenSaleAddress: Address, userAddress: Address) => {
      if (!walletClient?.account) {
        throw new Error('Wallet not connected');
      }

      setIsLoading(true);

      try {
        if (!safeAddress) {
          throw new Error('Safe address is not available');
        }

        // Create simplified typed data structure for signing
        const typedData = {
          domain: {
            name: 'Decent Token Sale',
            version: '1',
            chainId: chain.id,
          },
          types: VERIFICATION_TYPES,
          primaryType: 'Verification' as const,
          message: {
            saleAddress: tokenSaleAddress,
            signerAddress: userAddress,
            timestamp: Date.now(),
          },
        };

        // Sign the typed data with the user's wallet first
        const userSignature = await walletClient.signTypedData({
          account: walletClient.account.address,
          ...typedData,
        });

        // Now call the API with the signature for authentication
        const apiVerificationData = await getTokenSaleVerification(
          chain.id,
          safeAddress,
          tokenSaleAddress,
          {
            address: walletClient.account.address,
            message: typedData.message,
            signature: userSignature,
          },
        );

        if (!apiVerificationData) {
          throw new Error('Failed to get verification data from API');
        }

        // Create the final verification signature object
        // The verifier's signature is what the smart contract will verify
        const finalVerificationSignature: VerificationSignature = {
          data: apiVerificationData.data,
          signature: apiVerificationData.data.verifierSignature, // Use verifier's signature for contracts
        };

        setVerificationSignature(finalVerificationSignature);

        return finalVerificationSignature;
      } catch (error) {
        logError(error, 'Error getting token sale verification signature');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, chain.id, safeAddress],
  );

  const clearSignature = useCallback(() => {
    setVerificationSignature(null);
  }, []);

  return {
    getVerificationSignature,
    clearSignature,
    verificationSignature,
    isLoading,
  };
}
