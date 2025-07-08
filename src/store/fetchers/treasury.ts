import { TokenInfoResponse } from '@safe-global/api-kit';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { Address, getAddress, zeroAddress } from 'viem';
import { CacheExpiry, CacheKeys } from '../../hooks/utils/cache/cacheDefaults';
import { setValue } from '../../hooks/utils/cache/useLocalStorage';
import { useFilterSpamTokens } from '../../hooks/utils/useFilterSpamTokens';
import useBalancesAPI from '../../providers/App/hooks/useBalancesAPI';
import { getDaoSplits } from '../../providers/App/hooks/useDecentAPI';
import { useSafeAPI } from '../../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import {
  DecentTreasury,
  TokenEventType,
  TransferDisplayData,
  TransferType,
  TransferWithTokenInfo,
} from '../../types';
import { formatCoin } from '../../utils';

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

export function useTreasuryFetcher() {
  const safeApi = useSafeAPI();
  const { chain, nativeTokenIcon } = useNetworkConfigStore();
  const filterSpamTokens = useFilterSpamTokens({
    includeNativeToken: true,
    includeZeroBalanceToken: true,
  });
  const { getTokenBalances, getNFTBalances, getDeFiBalances } = useBalancesAPI();

  const formatTransfer = useCallback(
    ({
      transfer,
      isLast,
      safeAddress,
    }: {
      transfer: TransferWithTokenInfo;
      isLast: boolean;
      safeAddress: Address;
    }) => {
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
    [],
  );

  const fetchDAOTreasury = useCallback(
    async ({
      safeAddress,
      onTreasuryLoaded,
      onTransfersLoaded,
      onTransferLoaded,
    }: {
      safeAddress: Address;
      onTreasuryLoaded: (treasuryData: DecentTreasury) => void;
      onTransfersLoaded: (transfers: TransferDisplayData[]) => void;
      onTransferLoaded: (transfer: TransferDisplayData) => void;
    }) => {
      if (!safeApi) return;

      const [
        transfers,
        { data: tokenBalances, error: tokenBalancesError },
        { data: nftBalances, error: nftBalancesError },
        { data: defiBalances, error: defiBalancesError },
      ] = await Promise.all([
        safeApi.getTransfers(safeAddress),
        getTokenBalances(safeAddress),
        getNFTBalances(safeAddress),
        getDeFiBalances(safeAddress),
      ]);

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

      onTreasuryLoaded(treasuryData);

      if (transfers.length === 0) {
        onTransfersLoaded([]);
        return;
      }

      const tokenAddressesOfTransfers = transfers
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

          const tokenInfo = await safeApi.getToken(address);
          setValue(
            { cacheName: CacheKeys.TOKEN_INFO, tokenAddress: address },
            tokenInfo,
            CacheExpiry.NEVER,
          );
          return tokenInfo;
        }),
      );

      transfers
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
            safeAddress,
          });

          onTransferLoaded(formattedTransfer);
        });
    },
    [
      chain,
      nativeTokenIcon,
      formatTransfer,
      getDeFiBalances,
      getNFTBalances,
      getTokenBalances,
      safeApi,
      filterSpamTokens,
    ],
  );

  const fetchDaoSplits = useCallback(
    async (daoAddress: Address) => {
      const splits = await getDaoSplits(chain.id, daoAddress);
      return splits;
    },
    [chain.id],
  );

  return { fetchDAOTreasury, fetchDaoSplits };
}
