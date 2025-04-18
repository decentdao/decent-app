import { TokenInfoResponse } from '@safe-global/api-kit';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Address, getAddress, isAddress, zeroAddress } from 'viem';
import { createDecentSubgraphClient } from '../graphql';
import { DAOQuery, DAOQueryResponse } from '../graphql/DAOQueries';
import useFeatureFlag from '../helpers/environmentFeatureFlags';
import { useDecentModules } from '../hooks/DAO/loaders/useDecentModules';
import { useCurrentDAOKey } from '../hooks/DAO/useCurrentDAOKey';
import { CacheExpiry, CacheKeys } from '../hooks/utils/cache/cacheDefaults';
import { setValue } from '../hooks/utils/cache/useLocalStorage';
import useBalancesAPI from '../providers/App/hooks/useBalancesAPI';
import { useSafeAPI } from '../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../providers/NetworkConfig/useNetworkConfigStore';
import {
  DAOSubgraph,
  TokenEventType,
  TransferDisplayData,
  TransferType,
  TransferWithTokenInfo,
} from '../types';
import { formatCoin } from '../utils';
import { useGlobalStore } from './store';

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

// TODO: This will be split into multiple fetchers and invoking those fetchers, much like SafeController does
export const useGlobalStoreFetcher = () => {
  const safeApi = useSafeAPI();
  const { getTokenBalances, getNFTBalances, getDeFiBalances } = useBalancesAPI();
  const lookupModules = useDecentModules();
  const { daoKey, safeAddress, invalidQuery, wrongNetwork } = useCurrentDAOKey();
  const { setDaoNode, setTransfers, setTreasury, setTransfer } = useGlobalStore();
  const { chain, getConfigByChainId, nativeTokenIcon } = useNetworkConfigStore();
  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');

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

  useEffect(() => {
    async function fetchDaoNode() {
      if (!daoKey || !safeAddress || invalidQuery || wrongNetwork || !storeFeatureEnabled) return;

      const safeInfo = await safeApi.getSafeData(safeAddress);
      const modules = await lookupModules(safeInfo.modules);

      const client = createDecentSubgraphClient(getConfigByChainId(chain.id));
      const graphRawNodeData = await client.query<DAOQueryResponse>(DAOQuery, { safeAddress });

      if (graphRawNodeData.error) {
        console.error('Failed to fetch DAO data', graphRawNodeData.error);
        return;
      }

      const graphDAOData = graphRawNodeData.data?.daos[0];

      if (!graphDAOData) {
        console.error('No graph data found');
        return;
      }

      const daoInfo: DAOSubgraph = {
        parentAddress:
          graphDAOData?.parentAddress && isAddress(graphDAOData.parentAddress)
            ? getAddress(graphDAOData.parentAddress)
            : null,
        childAddresses:
          graphDAOData?.hierarchy?.map((child: { address: string }) => getAddress(child.address)) ??
          [],
        daoName: graphDAOData?.name ?? null,
        daoSnapshotENS: graphDAOData?.snapshotENS ?? null,
        proposalTemplatesHash: graphDAOData?.proposalTemplatesHash ?? null,
      };

      setDaoNode(daoKey, {
        safe: safeInfo,
        daoInfo,
        modules: modules,
      });
    }

    fetchDaoNode();
  }, [
    safeAddress,
    daoKey,
    safeApi,
    lookupModules,
    chain,
    setDaoNode,
    getConfigByChainId,
    invalidQuery,
    wrongNetwork,
    storeFeatureEnabled,
  ]);

  useEffect(() => {
    async function fetchDaoTreasury() {
      if (
        !daoKey ||
        !safeAddress ||
        invalidQuery ||
        wrongNetwork ||
        !storeFeatureEnabled ||
        !safeApi
      )
        return;

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
      const assetsFungible = tokenBalances || [];
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

      setTreasury(daoKey, treasuryData);

      if (transfers.length === 0) {
        setTransfers(daoKey, []);
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
          });

          setTransfer(daoKey, formattedTransfer);
        });
    }

    fetchDaoTreasury();
  }, [
    daoKey,
    safeAddress,
    invalidQuery,
    wrongNetwork,
    storeFeatureEnabled,
    safeApi,
    getTokenBalances,
    getNFTBalances,
    getDeFiBalances,
    setTreasury,
    setTransfers,
    setTransfer,
    chain.nativeCurrency.decimals,
    chain.nativeCurrency.name,
    chain.nativeCurrency.symbol,
    nativeTokenIcon,
    formatTransfer,
  ]);
};
