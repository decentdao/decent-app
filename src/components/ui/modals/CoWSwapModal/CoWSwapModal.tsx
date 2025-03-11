import { Box } from '@chakra-ui/react';
import { Address } from 'viem';
import { TokenBalance } from '../../../../types';
import { CowSwapWidget, CowSwapWidgetParams, TradeType } from '@cowprotocol/widget-react';

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
  const cowSwapWidgetParams: CowSwapWidgetParams = {
    appCode: 'Decent App', // Add here the name of your app. e.g. "Pig Swap"
    width: '464px',
    height: '420px',
    tradeType: TradeType.SWAP,
  };

  return <CowSwapWidget params={cowSwapWidgetParams} />;
}
