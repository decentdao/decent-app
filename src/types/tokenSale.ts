import { Address } from 'viem';

export interface TokenSaleData {
  address: Address;
  name: string;
  saleToken: Address;
  commitmentToken: Address;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  saleTokenPrice: bigint;
  maximumTotalCommitment: bigint;
  totalCommitments: bigint;
  saleStartTimestamp: bigint;
  saleEndTimestamp: bigint;
  minimumCommitment: bigint;
  maximumCommitment: bigint;
  saleState: number; // 0: NOT_STARTED, 1: ACTIVE, 2: SUCCEEDED, 3: FAILED
  saleProceedsReceiver: Address;
  // Computed fields for compatibility
  isActive: boolean;
}

export interface TokenSaleStats {
  totalSales: number;
  activeSales: number;
  totalRaised: bigint;
}
