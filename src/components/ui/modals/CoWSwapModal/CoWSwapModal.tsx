import { Address } from 'viem';
import { TokenBalance } from '../../../../types';
import { Box } from '@chakra-ui/react';

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
  return <Box>CoWSwap</Box>;
}
