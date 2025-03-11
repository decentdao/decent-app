import { Address } from 'viem';
import useNetworkPublicClient from '../../../../hooks/useNetworkPublicClient';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../../store/daoInfo/useDaoInfoStore';
import { TokenBalance } from '../../../../types';
import {
  CowSwapWidget,
  CowSwapWidgetParams,
  EthereumProvider,
  JsonRpcRequest,
  TradeType,
} from '@cowprotocol/widget-react';

export interface AirdropData {
  recipients: {
    address: Address;
    amount: bigint;
  }[];
  asset: TokenBalance;
  nonceInput: number | undefined; // this is only releveant when the caller action results in a proposal
}

export function CoWSwapModal({
  submitButtonText,
  showNonceInput,
  close,
  airdropData,
}: {
  submitButtonText: string;
  showNonceInput: boolean;
  close: () => void;
  airdropData: (airdropData: AirdropData) => void;
}) {
  const { safe } = useDaoInfoStore();
  const { chain } = useNetworkConfigStore();
  const publicClient = useNetworkPublicClient();

  const address = safe?.address!;
  const cowSwapWidgetParams: CowSwapWidgetParams = {
    appCode: 'Decent App', // Add here the name of your app. e.g. "Pig Swap"
    width: '464px',
    height: '420px',
    tradeType: TradeType.SWAP,
  };

  const provider: EthereumProvider = {
    on(event, args) {
      console.debug('CoWSwapWidget.on', event, args);
    },
    async request(params: JsonRpcRequest): Promise<any> {
      let ret = undefined;

      switch (params.method) {
        case 'eth_requestAccounts':
          ret = [address];
          break;
        case 'eth_getTransactionCount':
          ret = await publicClient.getTransactionCount({ address: address });
          break;
        case 'eth_chainId':
          ret = chain.id;
          break;
        case 'eth_blockNumber':
          ret = await publicClient.getBlockNumber();
          break;
        case 'eth_call':
          ret = await publicClient.call(params.params[0] as any);
          break;
        case 'eth_getCode':
          ret = await publicClient.getBytecode({ address: params.params[0] as Address });
          break;
        //case 'wallet_getCapabilities':
        //case 'eth_sendRawTransaction':
        default:
          ret = undefined;
      }

      console.debug('CoWSwapWidget.request', params.method, params, ret);

      return ret;
    },
    async enable() {
      return;
    },
  };

  return (
    <CowSwapWidget
      params={cowSwapWidgetParams}
      provider={provider}
    />
  );
}
