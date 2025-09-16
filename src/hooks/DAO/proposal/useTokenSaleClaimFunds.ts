import { abis } from '@decentdao/decent-contracts';
import { useCallback } from 'react';
import { Address, getContract } from 'viem';
import { useNetworkWalletClient } from '../../useNetworkWalletClient';
import { useTransaction } from '../../utils/useTransaction';

export const useTokenSaleClaimFunds = () => {
  const { data: walletClient } = useNetworkWalletClient();
  const [contractCall, pending] = useTransaction();

  const claimFunds = useCallback(
    (tokenSaleAddress: Address, tokenSaleName: string) => {
      if (!walletClient) {
        throw new Error('Wallet client is not available');
      }

      const tokenSaleContract = getContract({
        address: tokenSaleAddress,
        abi: abis.deployables.TokenSaleV1,
        client: walletClient,
      });

      contractCall({
        contractFn: () => tokenSaleContract.write.sellerSettle(),
        pendingMessage: `Claiming funds from ${tokenSaleName}...`,
        successMessage: `Successfully claimed funds from ${tokenSaleName}`,
        failedMessage: `Failed to claim funds from ${tokenSaleName}`,
      });
    },
    [walletClient, contractCall],
  );

  return { claimFunds, pending };
};
