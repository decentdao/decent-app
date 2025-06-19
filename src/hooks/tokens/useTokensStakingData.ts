import { useCallback, useEffect, useState } from 'react';
import { Address } from 'viem';
import { getTokenStakingData } from '../../providers/App/hooks/useDecentAPI';
import { StakingTokenData } from '../../types/revenueSharing';

export function useTokensStakingData({
  chainId,
  tokensAddresses,
}: {
  chainId: number;
  tokensAddresses: Address[];
}) {
  const [tokensStakingData, setTokensStakingData] = useState<StakingTokenData[]>([]);

  const fetchTokensStakingData = useCallback(async () => {
    const fetchedTokensStakingData = await Promise.all(
      tokensAddresses.map(async tokenAddress => {
        // TODO: Currently, returned data format is not consistent with the expected one, so we need to fix it
        // either in scope of https://linear.app/decent-labs/issue/ENG-1017/create-token-manager-ux-for-token-holders
        // or in scope of https://linear.app/decent-labs/issue/ENG-799/find-moralis-alternative
        const tokenStakingData = await getTokenStakingData(chainId, tokenAddress);
        if (!tokenStakingData || !tokenStakingData.success) {
          return null;
        }
        return tokenStakingData.data;
      }),
    );
    setTokensStakingData(fetchedTokensStakingData.filter(data => data !== null));
  }, [chainId, tokensAddresses]);

  useEffect(() => {
    fetchTokensStakingData();
  }, [fetchTokensStakingData]);

  return { tokensStakingData };
}
