import {
  EthereumTxWithTransfersResponse,
  SafeModuleTransactionWithTransfersResponse,
  SafeMultisigTransactionWithTransfersResponse,
  TokenInfoResponse,
} from '@safe-global/api-kit';
import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { erc20Abi, getAddress } from 'viem';
import { usePublicClient } from 'wagmi';
import { useFractal } from '../../../providers/App/AppProvider';
import useBalancesAPI from '../../../providers/App/hooks/useBalancesAPI';
import { useSafeAPI } from '../../../providers/App/hooks/useSafeAPI';
import { TreasuryAction } from '../../../providers/App/treasury/action';
import { useNetworkConfig } from '../../../providers/NetworkConfig/NetworkConfigProvider';
import {
  TokenEventType,
  TransferDisplayData,
  TransferType,
  TransferWithTokenInfo,
} from '../../../types';
import { formatCoin } from '../../../utils';
import { MOCK_MORALIS_ETH_ADDRESS } from '../../../utils/address';

export const useDecentTreasury = () => {
  // tracks the current valid DAO address / chain; helps prevent unnecessary calls
  const loadKey = useRef<string | null>();
  const {
    node: { daoAddress },
    action,
  } = useFractal();
  const safeAPI = useSafeAPI();
  const { getTokenBalances, getNFTBalances, getDeFiBalances } = useBalancesAPI();

  const { chain, nativeTokenIcon } = useNetworkConfig();

  const publicClient = usePublicClient();

  const formatTransfer = useCallback(
    ({ transfer, isLast }: { transfer: TransferWithTokenInfo; isLast: boolean }) => {
      const symbol = transfer.tokenInfo.symbol;
      const decimals = transfer.tokenInfo.decimals;

      const formattedTransfer: TransferDisplayData = {
        eventType: daoAddress === transfer.from ? TokenEventType.WITHDRAW : TokenEventType.DEPOSIT,
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
        transferAddress: daoAddress === transfer.from ? transfer.to : transfer.from,
        transactionHash: transfer.transactionHash,
        tokenId: transfer.tokenId,
        tokenInfo: transfer.tokenInfo,
        isLast,
      };
      return formattedTransfer;
    },
    [daoAddress],
  );

  const loadTreasury = useCallback(async () => {
    if (!daoAddress || !safeAPI) {
      return;
    }

    const [
      allTransactions,
      { data: tokenBalances, error: tokenBalancesError },
      { data: nftBalances, error: nftBalancesError },
      { data: defiBalances, error: defiBalancesError },
    ] = await Promise.all([
      safeAPI.getAllTransactions(daoAddress),
      getTokenBalances(daoAddress),
      getNFTBalances(daoAddress),
      getDeFiBalances(daoAddress),
    ]);

    const groupedTransactions = allTransactions.results.reduce(
      (acc, tx) => {
        const txType = tx.txType || 'UNKNOWN';
        if (!acc[txType]) {
          acc[txType] = [];
        }
        acc[txType].push(tx);
        return acc;
      },
      {} as Record<
        string,
        Array<
          | SafeModuleTransactionWithTransfersResponse
          | SafeMultisigTransactionWithTransfersResponse
          | EthereumTxWithTransfersResponse
        >
      >,
    );

    const moduleTransactions = (groupedTransactions.MODULE_TRANSACTION ||
      []) as SafeModuleTransactionWithTransfersResponse[];
    const multisigTransactions = (groupedTransactions.MULTISIG_TRANSACTION ||
      []) as SafeMultisigTransactionWithTransfersResponse[];
    const ethereumTransactions = (groupedTransactions.ETHEREUM_TRANSACTION ||
      []) as EthereumTxWithTransfersResponse[];

    const uniqueModuleTransactions = Array.from(
      new Map(moduleTransactions.map(tx => [tx.transactionHash, tx])).values(),
    );

    const uniqueMultisigTransactions = Array.from(
      new Map(multisigTransactions.map(tx => [tx.transactionHash, tx])).values(),
    );

    const uniqueEthereumTransactions = Array.from(
      new Map(ethereumTransactions.map(tx => [tx.txHash, tx])).values(),
    );

    const flattenedTransfers = [
      ...uniqueModuleTransactions.flatMap(tx => tx.transfers || []),
      ...uniqueMultisigTransactions.flatMap(tx => tx.transfers || []),
      ...uniqueEthereumTransactions.flatMap(tx => tx.transfers || []),
    ];

    if (tokenBalancesError) {
      toast(tokenBalancesError, { autoClose: 2000 });
    }
    if (nftBalancesError) {
      toast(nftBalancesError, { autoClose: 2000 });
    }
    if (defiBalancesError) {
      toast(defiBalancesError, { autoClose: 2000 });
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

    // Instead of this block of code, check the commented out snippet
    // below this for a half-implemented alternative.
    const transfersTokenInfo = await Promise.all(
      tokenAddressesOfTransfers.map(async address => {
        try {
          return await safeAPI.getToken(address);
        } catch (e) {
          const fallbackTokenData = tokenBalances?.find(
            tokenBalanceData => getAddress(tokenBalanceData.tokenAddress) === address,
          );
          if (!fallbackTokenData) {
            // Fallback to blockchain call if token info not available

            if (!publicClient) {
              throw new Error('No public client');
            }
            const [name, symbol, decimals] = await Promise.all([
              publicClient.readContract({ address, abi: erc20Abi, functionName: 'name' }),
              publicClient.readContract({ address, abi: erc20Abi, functionName: 'symbol' }),
              publicClient.readContract({ address, abi: erc20Abi, functionName: 'decimals' }),
            ]);

            return {
              address,
              name,
              symbol,
              decimals,
            };
          }

          return {
            address,
            name: fallbackTokenData.name,
            symbol: fallbackTokenData.symbol,
            decimals: fallbackTokenData.decimals,
            logoUri: fallbackTokenData.logo,
          };
        }
      }),
    );

    // ajg 8/14/24
    // For all of these Token Addresses
    // 1. give me all of the data that lives in the cache
    //   (can "getValue" from local storage to grab these token datas)
    // 2. if there are any addresses remaining
    //   get them from the API and store the results in the cache
    //   in a delayed loop

    // The code below this doesn't implement "1.", but does implement "2."

    // const tokenData: TokenInfoResponse[] = [];
    // const batchSize = 5;
    // for (let i = 0; i < tokenAddresses.length; i += batchSize) {
    //   const batch = tokenAddresses.slice(i, i + batchSize);
    //   const batchResults = await Promise.all(batch.map(a => safeAPI.getToken(a)));
    //   tokenData.push(...batchResults);
    //   if (i + batch.length < tokenAddresses.length) {
    //     await new Promise(resolve => setTimeout(resolve, 1000));
    //   }
    // }

    if (flattenedTransfers.length === 0) {
      action.dispatch({ type: TreasuryAction.SET_TRANSFERS_LOADED });
    }

    flattenedTransfers
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .forEach(async (transfer, index, _transfers) => {
        // @note assume native token if no token address
        let tokenInfo: TokenInfoResponse = {
          address: MOCK_MORALIS_ETH_ADDRESS,
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
    action,
    chain.nativeCurrency.decimals,
    chain.nativeCurrency.name,
    chain.nativeCurrency.symbol,
    daoAddress,
    formatTransfer,
    getDeFiBalances,
    getNFTBalances,
    getTokenBalances,
    nativeTokenIcon,
    publicClient,
    safeAPI,
  ]);

  useEffect(() => {
    if (!daoAddress) {
      loadKey.current = null;
      return;
    }

    const newLoadKey = `${chain.id}${daoAddress}`;
    if (newLoadKey !== loadKey.current) {
      loadKey.current = newLoadKey;
      loadTreasury();
    }
  }, [action, chain.id, daoAddress, loadTreasury]);

  return;
};
