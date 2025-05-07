import { TokenInfoResponse } from '@safe-global/api-kit';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Address, getAddress, zeroAddress } from 'viem';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { useStore } from '../../../providers/App/AppProvider';
import useBalancesAPI from '../../../providers/App/hooks/useBalancesAPI';
import { useSafeAPI } from '../../../providers/App/hooks/useSafeAPI';
import { TreasuryAction } from '../../../providers/App/treasury/action';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import {
  TokenEventType,
  TransferDisplayData,
  TransferType,
  TransferWithTokenInfo,
} from '../../../types';
import { formatCoin } from '../../../utils';
import { CacheExpiry, CacheKeys } from '../../utils/cache/cacheDefaults';
import { setValue } from '../../utils/cache/useLocalStorage';
import { useFilterSpamTokens } from '../../utils/useFilterSpamTokens';
import { useCurrentDAOKey } from '../useCurrentDAOKey';

function getTransferEventType(transferFrom: string, safeAddress: Address | undefined) {
  if (transferFrom === zeroAddress) {
    return TokenEventType.MINT;
  }
  if (transferFrom === safeAddress) {
    return TokenEventType.WITHDRAW;
  } else {
    return TokenEventType.DEPOSIT;
  }
}
export const useDecentTreasury = () => {
  // tracks the current valid DAO address / chain; helps prevent unnecessary calls
  const loadKey = useRef<string | null>();
  const { daoKey } = useCurrentDAOKey();
  const {
    action,
    node: { safe },
  } = useStore({ daoKey });
  const filterSpamTokens = useFilterSpamTokens({
    includeNativeToken: true,
    includeZeroBalanceToken: true,
  });
  const safeAPI = useSafeAPI();
  const { getTokenBalances, getNFTBalances, getDeFiBalances } = useBalancesAPI();

  const { chain, nativeTokenIcon } = useNetworkConfigStore();
  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');
  const safeAddress = safe?.address;

  const formatTransfer = useCallback(
    ({ transfer, isLast }: { transfer: TransferWithTokenInfo; isLast: boolean }) => {
      const symbol = transfer.tokenInfo.symbol;
      const decimals = transfer.tokenInfo.decimals;

      const formattedTransfer: TransferDisplayData = {
        eventType: getTransferEventType(transfer.from, safeAddress),
        transferType: transfer.type as TransferType,
        executionDate: transfer.executionDate,
        image: transfer.tokenInfo.logoUri ?? '/images/coin-icon-default.svg',
        assetDisplay:
          transfer.type === TransferType.ERC721_TRANSFER
            ? `${transfer.tokenInfo.name} #${transfer.tokenId}`
            : formatCoin(transfer.value, true, decimals, symbol),
        fullCoinTotal:
          transfer.type === TransferType.ERC721_TRANSFER
            ? undefined
            : formatCoin(transfer.value, false, decimals, symbol),
        transferAddress: safeAddress === transfer.from ? transfer.to : transfer.from,
        transactionHash: transfer.transactionHash,
        tokenId: transfer.tokenId,
        tokenInfo: transfer.tokenInfo,
        isLast,
      };
      return formattedTransfer;
    },
    [safeAddress],
  );

  const loadTreasury = useCallback(async () => {
    if (!safeAddress || !safeAPI || storeFeatureEnabled) {
      return;
    }

    const [
      transfers,
      { data: tokenBalances, error: tokenBalancesError },
      { data: nftBalances, error: nftBalancesError },
      { data: defiBalances, error: defiBalancesError },
    ] = await Promise.all([
      safeAPI.getTransfers(safeAddress),
      getTokenBalances(safeAddress),
      getNFTBalances(safeAddress),
      getDeFiBalances(safeAddress),
    ]);

    const flattenedTransfers = transfers;

    if (tokenBalancesError) {
      toast.warning(tokenBalancesError, { duration: 2000 });
    }
    if (nftBalancesError) {
      toast.warning(nftBalancesError, { duration: 2000 });
    }
    if (defiBalancesError) {
      toast.warning(defiBalancesError, { duration: 2000 });
    }
    const assetsFungible = filterSpamTokens(tokenBalances || []);
    const assetsNonFungible = nftBalances || [];
    const assetsDeFi = defiBalances || [];

    const totalAssetsFungibleUsd = assetsFungible.reduce(
      (prev, curr) => prev + (curr.usdValue || 0),
      0,
    );
    const totalAssetsDeFiUsd = assetsDeFi.reduce(
      (prev, curr) => prev + (curr.position?.balanceUsd || 0),
      0,
    );

    const totalUsdValue = totalAssetsFungibleUsd + totalAssetsDeFiUsd;

    const treasuryData = {
      assetsFungible,
      assetsDeFi,
      assetsNonFungible,
      totalUsdValue,
      transfers: null, // transfers not yet loaded. these are setup below
    };

    action.dispatch({ type: TreasuryAction.UPDATE_TREASURY, payload: treasuryData });

    const tokenAddressesOfTransfers = flattenedTransfers
      // map down to just the addresses, with a type of `string | undefined`
      .map(transfer => transfer.tokenAddress)
      // no undefined or null addresses
      .filter(address => address !== undefined && address !== null)
      // make unique
      .filter((value, index, self) => self.indexOf(value) === index)
      // turn them into Address type
      .map(address => getAddress(address));

    const transfersTokenInfo = await Promise.all(
      tokenAddressesOfTransfers.map(async address => {
        const fallbackTokenBalance = tokenBalances?.find(
          tokenBalanceData => getAddress(tokenBalanceData.tokenAddress) === address,
        );

        if (fallbackTokenBalance) {
          const fallbackTokenInfo = {
            address,
            name: fallbackTokenBalance.name,
            symbol: fallbackTokenBalance.symbol,
            decimals: fallbackTokenBalance.decimals,
            logoUri: fallbackTokenBalance.logo,
          };
          setValue(
            { cacheName: CacheKeys.TOKEN_INFO, tokenAddress: address },
            fallbackTokenInfo,
            CacheExpiry.NEVER,
          );
          return fallbackTokenInfo;
        }

        const tokenInfo = await safeAPI.getToken(address);
        setValue(
          { cacheName: CacheKeys.TOKEN_INFO, tokenAddress: address },
          tokenInfo,
          CacheExpiry.NEVER,
        );
        return tokenInfo;
      }),
    );

    if (flattenedTransfers.length === 0) {
      action.dispatch({ type: TreasuryAction.SET_TRANSFERS_LOADED });
    }

    flattenedTransfers
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .forEach(async (transfer, index, _transfers) => {
        // @note assume native token if no token address
        let tokenInfo: TokenInfoResponse = {
          address: '',
          name: chain.nativeCurrency.name,
          symbol: chain.nativeCurrency.symbol,
          decimals: chain.nativeCurrency.decimals,
          logoUri: nativeTokenIcon,
        };
        const transferTokenAddress = transfer.tokenAddress;
        if (transferTokenAddress) {
          const tokenData = transfersTokenInfo.find(
            _token => _token && getAddress(_token.address) === getAddress(transferTokenAddress),
          );
          if (tokenData) {
            tokenInfo = tokenData;
          }
        }

        const formattedTransfer: TransferDisplayData = formatTransfer({
          transfer: { ...transfer, tokenInfo },
          isLast: _transfers.length - 1 === index,
        });

        action.dispatch({ type: TreasuryAction.ADD_TRANSFER, payload: formattedTransfer });

        if (_transfers.length - 1 === index) {
          action.dispatch({ type: TreasuryAction.SET_TRANSFERS_LOADED });
        }
      });
  }, [
    safeAddress,
    safeAPI,
    getTokenBalances,
    getNFTBalances,
    getDeFiBalances,
    filterSpamTokens,
    action,
    chain.nativeCurrency.name,
    chain.nativeCurrency.symbol,
    chain.nativeCurrency.decimals,
    nativeTokenIcon,
    formatTransfer,
    storeFeatureEnabled,
  ]);

  useEffect(() => {
    if (storeFeatureEnabled) {
      return;
    }

    if (!safeAddress) {
      loadKey.current = null;
      return;
    }

    const newLoadKey = `${chain.id}${safeAddress}`;
    if (newLoadKey !== loadKey.current) {
      loadKey.current = newLoadKey;
      loadTreasury();
    }
  }, [action, chain.id, safeAddress, loadTreasury, storeFeatureEnabled]);

  return;
};
