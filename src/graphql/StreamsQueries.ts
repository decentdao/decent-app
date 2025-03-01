import { Address } from 'viem';

// Define the base asset structure with only used properties
interface StreamAsset {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
}

// Define the contract structure with only used properties
interface StreamContract {
  address: Address;
}

// Define the main stream structure with only used properties
export interface Stream {
  id: string;
  startTime: string;
  endTime: string;
  cancelable: boolean;
  canceled: boolean;
  category: string;
  cliff: boolean;
  cliffTime: string;
  depositAmount: string;
  recipient: string;
  contract: StreamContract;
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
