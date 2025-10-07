import { abis } from '@decentdao/decent-contracts';
import { useCallback, useState } from 'react';
import { Address, getContract, parseUnits } from 'viem';
import { USDC_DECIMALS } from '../../../constants/common';
import { logError } from '../../../helpers/errorLogging';
import { useNetworkWalletClient } from '../../useNetworkWalletClient';
import { useTransaction } from '../../utils/useTransaction';

interface TokenSaleContractParams {
  tokenSaleAddress: Address;
  verificationSignature?: string; // Optional for settlement functions
  signatureExpiration?: number; // Optional for settlement functions
  amount?: string; // For commitment functions
  recipientAddress?: Address; // For buyerSettle
}

export function useTokenSaleContract() {
  const { data: walletClient } = useNetworkWalletClient();
  const [contractCall, pending] = useTransaction();

  const [isLoading, setIsLoading] = useState<{
    increaseCommitmentNative: boolean;
    increaseCommitmentERC20: boolean;
    buyerSettle: boolean;
    sellerSettle: boolean;
  }>({
    increaseCommitmentNative: false,
    increaseCommitmentERC20: false,
    buyerSettle: false,
    sellerSettle: false,
  });

  const increaseCommitmentNative = useCallback(
    async ({
      tokenSaleAddress,
      verificationSignature,
      signatureExpiration,
      amount = '0.01',
    }: TokenSaleContractParams) => {
      if (!walletClient) {
        throw new Error('Wallet client is not available');
      }

      if (!verificationSignature || !signatureExpiration) {
        throw new Error(
          'Verification signature and expiration are required for commitment functions',
        );
      }

      setIsLoading(prev => ({ ...prev, increaseCommitmentNative: true }));

      try {
        const tokenSaleContract = getContract({
          address: tokenSaleAddress,
          abi: abis.deployables.TokenSaleV1,
          client: walletClient,
        });

        // Convert amount to wei (assuming ETH)
        const value = parseUnits(amount, 18);

        contractCall({
          contractFn: () =>
            tokenSaleContract.write.increaseCommitmentNative(
              [verificationSignature as `0x${string}`, signatureExpiration],
              {
                value,
              },
            ),
          pendingMessage: `Increasing commitment with native token (${amount} ETH)...`,
          successMessage: `Successfully increased commitment with ${amount} ETH`,
          failedMessage: `Failed to increase commitment with ${amount} ETH`,
        });
      } catch (error) {
        logError(error, 'Error increasing commitment with native token');
        throw error;
      } finally {
        setIsLoading(prev => ({ ...prev, increaseCommitmentNative: false }));
      }
    },
    [walletClient, contractCall],
  );

  const increaseCommitmentERC20 = useCallback(
    async ({
      tokenSaleAddress,
      verificationSignature,
      signatureExpiration,
      amount = '100',
    }: TokenSaleContractParams) => {
      if (!walletClient) {
        throw new Error('Wallet client is not available');
      }

      if (!verificationSignature || !signatureExpiration) {
        throw new Error(
          'Verification signature and expiration are required for commitment functions',
        );
      }

      setIsLoading(prev => ({ ...prev, increaseCommitmentERC20: true }));

      try {
        const tokenSaleContract = getContract({
          address: tokenSaleAddress,
          abi: abis.deployables.TokenSaleV1,
          client: walletClient,
        });

        // @dev assuming commitment token is 6 decimals (USDC)
        const amountWei = parseUnits(amount, USDC_DECIMALS);

        contractCall({
          contractFn: () =>
            tokenSaleContract.write.increaseCommitmentERC20([
              amountWei,
              verificationSignature as `0x${string}`,
              signatureExpiration,
            ]),
          pendingMessage: `Increasing commitment with ${amount} USDC...`,
          successMessage: `Successfully increased commitment with ${amount} USDC`,
          failedMessage: `Failed to increase commitment with ${amount} USDC`,
        });
      } catch (error) {
        logError(error, 'Error increasing commitment with ERC20 token');
        throw error;
      } finally {
        setIsLoading(prev => ({ ...prev, increaseCommitmentERC20: false }));
      }
    },
    [walletClient, contractCall],
  );

  const buyerSettle = useCallback(
    async ({ tokenSaleAddress, recipientAddress }: TokenSaleContractParams) => {
      if (!walletClient) {
        throw new Error('Wallet client is not available');
      }

      if (!recipientAddress) {
        throw new Error('Recipient address is required for buyer settlement');
      }

      setIsLoading(prev => ({ ...prev, buyerSettle: true }));

      try {
        const tokenSaleContract = getContract({
          address: tokenSaleAddress,
          abi: abis.deployables.TokenSaleV1,
          client: walletClient,
        });

        contractCall({
          contractFn: () => tokenSaleContract.write.buyerSettle([recipientAddress]),
          pendingMessage: 'Settling as buyer...',
          successMessage: 'Successfully settled as buyer',
          failedMessage: 'Failed to settle as buyer',
        });
      } catch (error) {
        logError(error, 'Error settling as buyer');
        throw error;
      } finally {
        setIsLoading(prev => ({ ...prev, buyerSettle: false }));
      }
    },
    [walletClient, contractCall],
  );

  const sellerSettle = useCallback(
    async ({ tokenSaleAddress }: TokenSaleContractParams) => {
      if (!walletClient) {
        throw new Error('Wallet client is not available');
      }

      setIsLoading(prev => ({ ...prev, sellerSettle: true }));

      try {
        const tokenSaleContract = getContract({
          address: tokenSaleAddress,
          abi: abis.deployables.TokenSaleV1,
          client: walletClient,
        });

        contractCall({
          contractFn: () => tokenSaleContract.write.sellerSettle(),
          pendingMessage: 'Settling as seller...',
          successMessage: 'Successfully settled as seller',
          failedMessage: 'Failed to settle as seller',
        });
      } catch (error) {
        logError(error, 'Error settling as seller');
        throw error;
      } finally {
        setIsLoading(prev => ({ ...prev, sellerSettle: false }));
      }
    },
    [walletClient, contractCall],
  );

  return {
    increaseCommitmentNative,
    increaseCommitmentERC20,
    buyerSettle,
    sellerSettle,
    isLoading,
    pending,
  };
}
