import { ChainInfo, getSDKVersion, Methods, RPCPayload } from '@safe-global/safe-apps-sdk';
import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { Address, BlockTag, getAddress, Hash } from 'viem';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useAppCommunicator } from '../hooks/useAppCommunicator';
import { InterfaceMessageIds, InterfaceMessageProps, RequestId, TransactionWithId } from '../types';
import { SafeInjectContext } from './SafeInjectContext';

interface SafeInjectProviderProps {
  defaultAddress?: string;
  defaultAppUrl?: string;
  chainId?: number;
  /**
   * Callback function to handle transactions received from the Safe app.
   */
  onTransactionsReceived?: (transactions: TransactionWithId[]) => Promise<boolean>;
  /**
   * Callback function to handle app connection.
   */
  onAppConnected?: (appUrl: string) => void;
}

export function SafeInjectProvider({
  children,
  defaultAddress,
  defaultAppUrl,
  chainId = 1,
  onTransactionsReceived,
  onAppConnected,
}: PropsWithChildren<SafeInjectProviderProps>) {
  const [address, setAddress] = useState<string | undefined>(defaultAddress);
  const [appUrl, setAppUrl] = useState<string | undefined>(defaultAppUrl);
  const [connecting, setConnecting] = useState(true);
  const [connectedAppUrl, setConnectedAppUrl] = useState<string>('');
  const receivedConnection = useCallback(
    (url: string) => {
      setConnectedAppUrl(url);
      onAppConnected?.(url);
    },
    [onAppConnected],
  );
  const { chain } = useNetworkConfigStore();
  const publicClient = useNetworkPublicClient();
  const [latestTransactions, setLatestTransactions] = useState<TransactionWithId[]>([]);
  const receivedTransactions = useCallback(
    (transactions: TransactionWithId[]) => {
      setLatestTransactions(transactions);
      return onTransactionsReceived?.(transactions);
    },
    [onTransactionsReceived],
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const communicator = useAppCommunicator(iframeRef);
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  const sendMessageToIFrame = useCallback(
    function <T extends InterfaceMessageIds>(
      message: InterfaceMessageProps<T>,
      requestId?: RequestId,
    ) {
      const requestWithMessage = {
        ...message,
        requestId: requestId || Math.trunc(window.performance.now()),
        version: getSDKVersion(),
      };

      if (iframeRef) {
        iframeRef.current?.contentWindow?.postMessage(requestWithMessage, appUrl!);
      }
    },
    [iframeRef, appUrl],
  );

  useEffect(() => {
    if (iframeRef) {
      iframeRef.current?.addEventListener('load', () => {
        setConnecting(false);
      });
    }

    communicator?.on(Methods.getSafeInfo, async msg => {
      if (appUrl?.startsWith(msg.origin)) {
        receivedConnection(appUrl);
      }
      const ret = {
        safeAddress: address,
        chainId,
        owners: [] as Address[],
        threshold: 1,
        isReadOnly: false,
      };
      if (safe) {
        ret.owners = safe.owners;
        ret.threshold = safe.threshold;
      }
      return ret;
    });

    communicator?.on(Methods.getChainInfo, async () => {
      const ret: ChainInfo = {
        chainId: chainId.toString(),
        nativeCurrency: { ...chain.nativeCurrency, logoUri: '' },
        chainName: chain.name,
        shortName: chain.name,
        blockExplorerUriTemplate: {
          address: '',
          txHash: '',
          api: chain.blockExplorers?.default.url || '',
        },
      };
      return ret;
    });

    communicator?.on(Methods.getEnvironmentInfo, async () => ({
      origin: document.location.origin,
    }));

    communicator?.on(Methods.rpcCall, async msg => {
      const params = msg.data.params as RPCPayload;

      try {
        let response;
        switch (params.call) {
          case 'eth_call':
            response = (await publicClient.call(params.params[0] as any)).data;
            break;
          case 'eth_gasPrice':
            response = await publicClient.getGasPrice();
            break;
          case 'eth_getLogs':
            response = await publicClient.getLogs(params.params[0] as any);
            break;
          case 'eth_getBalance':
            response = await publicClient.getBalance({ address: params.params[0] as Address });
            break;
          case 'eth_getCode':
            response = await publicClient.getCode({ address: params.params[0] as Address });
            break;
          case 'eth_getBlockByHash':
            response = await publicClient.getBlock({ blockHash: params.params[0] as Hash });
            break;
          case 'eth_getBlockByNumber':
            const tagOrNumber = params.params[0] as BlockTag | bigint;
            const includeTransactions = params.params[1] as boolean;
            if (typeof tagOrNumber === 'string') {
              // so it's a BlockTag type.
              //   type BlockTag = 'latest' | 'earliest' | 'pending' | 'safe' | 'finalized'
              response = await publicClient.getBlock({
                blockTag: tagOrNumber,
                includeTransactions,
              });
            } else {
              // so it's a bigint type.
              response = await publicClient.getBlock({
                blockNumber: tagOrNumber,
                includeTransactions,
              });
            }
            break;
          case 'eth_getStorageAt':
            response = await publicClient.getStorageAt({
              address: params.params[0] as Address,
              slot: params.params[1] as Hash,
            });
            break;
          case 'eth_getTransactionByHash':
            response = await publicClient.getTransaction({ hash: params.params[0] as Hash });
            break;
          case 'eth_getTransactionReceipt':
            response = await publicClient.getTransactionReceipt({ hash: params.params[0] as Hash });
            break;
          case 'eth_getTransactionCount':
            response = await publicClient.getTransactionCount({
              address: params.params[0] as Address,
            });
            break;
          case 'eth_estimateGas':
            const p = params.params[0] as any;
            response = await publicClient.estimateGas({ ...p, account: p.from });
            break;
        }

        // console.debug('[DEBUG] rpcCall', {
        //   method: params.call,
        //   params: params.params[0],
        //   response,
        // });
        return response;
      } catch (err) {
        return err;
      }
    });

    communicator?.on(Methods.sendTransactions, async msg => {
      // @ts-expect-error explore ways to fix this
      const transactions = (msg.data.params.txs as Transaction[]).map(({ to, ...rest }) => {
        if (to) {
          return {
            to: getAddress(to), // checksummed
            ...rest,
          };
        } else {
          return { ...rest };
        }
      });
      const handledPromise = receivedTransactions(
        transactions.map(txn => {
          return {
            id: parseInt(msg.data.id.toString()),
            ...txn,
          };
        }),
      );
      if (handledPromise) {
        const handled = await handledPromise;
        return handled;
      }
    });
  }, [
    communicator,
    address,
    chainId,
    publicClient,
    appUrl,
    receivedTransactions,
    receivedConnection,
    safe,
    chain.nativeCurrency,
    chain.name,
    chain.blockExplorers?.default.url,
  ]);

  return (
    <SafeInjectContext.Provider
      value={{
        address,
        appUrl,
        connecting,
        connectedAppUrl,
        iframeRef,
        latestTransactions,
        setLatestTransactions: receivedTransactions,
        setAddress,
        setAppUrl: s => {
          setConnecting(true);
          setAppUrl(s);
        },
        sendMessageToIFrame,
      }}
    >
      {children}
    </SafeInjectContext.Provider>
  );
}
