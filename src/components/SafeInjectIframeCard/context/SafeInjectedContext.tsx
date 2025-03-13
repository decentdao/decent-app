import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  PropsWithChildren,
} from 'react';
import { getAddress, Hash } from 'viem';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { useAppCommunicator } from '../helpers/communicator';
import {
  InterfaceMessageIds,
  InterfaceMessageProps,
  Methods,
  RequestId,
  RPCPayload,
  SignMessageParams,
  SignTypedMessageParams,
  Transaction,
} from '../types';

export interface TransactionWithId extends Transaction {
  id: number;
}

type SafeInjectContextType = {
  address: string | undefined;
  appUrl: string | undefined;
  //rpcUrl: string | undefined;
  iframeRef: React.RefObject<HTMLIFrameElement> | null;
  latestTransaction: TransactionWithId | undefined;
  setLatestTransaction: React.Dispatch<React.SetStateAction<TransactionWithId | undefined>>;
  setAddress: React.Dispatch<React.SetStateAction<string | undefined>>;
  setAppUrl: React.Dispatch<React.SetStateAction<string | undefined>>;
  //setRpcUrl: React.Dispatch<React.SetStateAction<string | undefined>>;
  sendMessageToIFrame: Function;
};

export const SafeInjectContext = createContext<SafeInjectContextType>({
  address: undefined,
  appUrl: undefined,
  iframeRef: null,
  latestTransaction: undefined,
  setLatestTransaction: () => {},
  setAddress: () => {},
  setAppUrl: () => {},
  sendMessageToIFrame: () => {},
});

export function SafeInjectProvider({
  children,
  defaultAddress,
  chainId = 1,
}: PropsWithChildren<{
  defaultAddress?: string;
  chainId?: number;
}>) {
  const [address, setAddress] = useState<string | undefined>(defaultAddress);
  const [appUrl, setAppUrl] = useState<string>();
  // const ethersProvider = useEthersProvider();
  // const _provider =
  //   ((ethersProvider as providers.FallbackProvider)?.providerConfigs[0]
  //     ?.provider as providers.JsonRpcProvider) || (ethersProvider as providers.JsonRpcProvider);
  // const provider = new providers.StaticJsonRpcProvider(_provider.connection.url);
  const publicClient = useNetworkPublicClient();
  const [latestTransaction, setLatestTransaction] = useState<TransactionWithId>();

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
    communicator?.on(Methods.getSafeInfo, async () => {
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
            response = await publicClient.getBalance({ address: params.params[0] as string });
            break;
          case 'eth_getCode':
            response = await publicClient.getCode({ address: params.params[0] as string });
            break;
          case 'eth_getBlockByHash':
            response = await publicClient.getBlock({ blockHash: params.params[0] as Hash });
            break;
          case 'eth_getBlockByNumber':
            response = await publicClient.getBlock({ blockNumber: params.params[0] as bigint });
            break;
          case 'eth_getStorageAt':
            response = await publicClient.getStorageAt({
              address: params.params[0] as string,
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
              address: params.params[0] as string,
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
      console.debug('found transactions', transactions);
      setLatestTransaction({
        id: parseInt(msg.data.id.toString()),
        ...transactions[0],
      });
      // openConfirmationModal(transactions, msg.data.params.params, msg.data.id)
    });

    communicator?.on(Methods.signMessage, async msg => {
      const { message } = msg.data.params as SignMessageParams;

      // openSignMessageModal(message, msg.data.id, Methods.signMessage)
    });

    communicator?.on(Methods.signTypedMessage, async msg => {
      const { typedData } = msg.data.params as SignTypedMessageParams;

      // openSignMessageModal(typedData, msg.data.id, Methods.signTypedMessage)
    });
  }, [communicator, address]);

  return (
    <SafeInjectContext.Provider
      value={{
        address,
        appUrl,
        iframeRef,
        latestTransaction,
        setLatestTransaction,
        setAddress,
        setAppUrl,
        sendMessageToIFrame,
      }}
    >
      {children}
    </SafeInjectContext.Provider>
  );
}

export const useSafeInject = () => useContext(SafeInjectContext);
