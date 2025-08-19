import { Address } from 'viem';

// Define the base asset structure with only used properties
interface StreamAsset {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
}

export interface Stream {
  id: string;
  startTime: string;
  endTime: string;
  cancelable: boolean;
  canceled: boolean;
  category: string;
  cliff: boolean;
  cliffTime: string | null;
  depositAmount: string;
  recipient: string;
  contract: Address;
  asset: StreamAsset;
}

// Define the top-level query response
export interface StreamsQueryResponse {
  streams: Stream[];
}

export const StreamsQuery = `query StreamsQuery($recipientAddress: Bytes) {
  streams(where: { recipient: $recipientAddress }) {
    id
    startTime
    endTime
    canceled
    cancelable
    category
    cliff
    cliffTime
    depositAmount
    recipient
    contract {
      address
    }
    asset {
      name
      symbol
      address
      decimals
    }
  }
}`;
