import { Methods, RPCPayload } from '@safe-global/safe-apps-sdk';
import { PropsWithChildren, useState, useRef, useCallback, useEffect } from 'react';
import { Address, getAddress, Hash } from 'viem';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { useAppCommunicator } from '../hooks/useAppCommunicator';
import { InterfaceMessageIds, InterfaceMessageProps, RequestId, TransactionWithId } from '../types';
import { SafeInjectContext } from './SafeInjectContext';

interface SafeInjectProviderProps {
  defaultAddress?: string;
  chainId?: number;
  /**
   * Callback function to handle transactions received from the Safe app.
   */
  onTransactionsReceived?: (transactions: TransactionWithId[]) => void;
}

export function SafeInjectProvider({
  children,
  defaultAddress,
  chainId = 1,
  onTransactionsReceived,
}: PropsWithChildren<SafeInjectProviderProps>) {
  const [address, setAddress] = useState<string | undefined>(defaultAddress);
  const [appUrl, setAppUrl] = useState<string>();
  const [connecting, setConnecting] = useState(false);
  const [connectedAppUrl, setConnectedAppUrl] = useState<string>('');
  const publicClient = useNetworkPublicClient();
  const [latestTransactions, setLatestTransactions] = useState<TransactionWithId[]>([]);
  const receivedTransactions = useCallback(
    (transactions: TransactionWithId[]) => {
      setLatestTransactions(transactions);
      onTransactionsReceived?.(transactions);
    },
    [onTransactionsReceived],
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const communicator = useAppCommunicator(iframeRef);

  const sendMessageToIFrame = useCallback(
    function <T extends InterfaceMessageIds>(
      message: InterfaceMessageProps<T>,
      requestId?: RequestId,
    ) {
      const requestWithMessage = {
        ...message,
        requestId: requestId || Math.trunc(window.performance.now()),
        version: '0.4.2',
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
        console.log('iframe loaded');
        setConnecting(false);
      });
    }

    communicator?.on(Methods.getSafeInfo, async msg => {
      if (appUrl?.startsWith(msg.origin)) {
        setConnectedAppUrl(appUrl);
      }
      const ret = {
        safeAddress: address,
        chainId,
        owners: [],
        threshold: 1,
        isReadOnly: false,
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
            response = await publicClient.getBlock({ blockNumber: params.params[0] as bigint });
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

    communicator?.on(Methods.sendTransactions, msg => {
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
      console.debug('Iframe.sendTransactions', transactions);
      receivedTransactions(
        transactions.map(txn => {
          return {
            id: parseInt(msg.data.id.toString()),
            ...txn,
          };
        }),
      );
      // tell the iframe that we received the transactions
      //   and "confirmed" so it can continue
      return true;
    });
  }, [communicator, address, chainId, publicClient, appUrl, receivedTransactions]);

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
