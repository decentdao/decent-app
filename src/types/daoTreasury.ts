import { Address } from 'viem';

export enum TokenEventType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  MINT = 'MINT',
}

export interface TokenEvent {
  transactionHash: string;
  blockNumber: number;
  eventType: TokenEventType;
  blockTimestamp: number;
}

export type TokenBalance = {
  tokenAddress: Address;
  symbol: string;
  name: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  possibleSpam?: string | boolean; // Empty string means false lol, but still that's a string
  verifiedContract: boolean;
  balanceFormatted: string; // Balance formatted to decimals
  usdPrice?: number;
  usdValue?: number;
  nativeToken: boolean;
  portfolioPercentage: number;
};

// All these props are coming from *all available DeFi protocols*
interface DefiPositionDetails {
  feeTier?: number;
  rangeTnd?: number;
  reserves?: string[];
  currentPrice?: number;
  isInRange?: boolean;
  priceUpper?: number;
  priceLower?: number;
  priceLabel?: string;
  liquidity?: number;
  rangeStart?: number;
  poolAddress?: string;
  positionKey?: string;
  assetStandard?: string;
  apy?: number;
  isDebt?: boolean;
  isVariableDebt?: boolean;
  isStableDebt?: boolean;
  shares?: string;
  reserve0?: string;
  reserve1?: string;
  factory?: string;
  pair?: string;
  shareOfPool?: number;
  noPriceAvailable?: boolean;
  sharesInStrategy?: string;
  strategyAddress?: string;
  baseType?: string;
  healthFactor?: number;
}

type DefiPositionTokenBalance = {
  contractAddress?: string;
  tokenType: 'supplied' | 'defi-token';
} & TokenBalance;

export type DefiPosition = {
  label: string;
  tokens: DefiPositionTokenBalance[];
  address?: string;
  balanceUsd: number;
  totalUnclaimedUsdValue: number;
  positionDetails?: DefiPositionDetails;
};
export type DefiBalance = {
  protocolName?: string;
  protocolId?: string;
  protocolUrl?: string;
  protocolLogo?: string;
  position?: DefiPosition;
};

type NftMediaItem = {
  height: number;
  width: number;
  url: string;
};

export type NFTMedia =
  | {
      originalMediaUrl?: string | undefined;
      mediaCollection?:
        | {
            low: NftMediaItem;
            medium: NftMediaItem;
            high: NftMediaItem;
          }
        | undefined;
    }
  | undefined;

export type NFTBalance = {
  tokenAddress: Address;
  media: NFTMedia;
  metadata?: {
    backgroundImage?: string;
    image?: string;
    imageUrl?: string;
  };
  tokenId: string | number;
  tokenUri?: string | undefined;
  name?: string | undefined;
  symbol?: string | undefined;
  amount?: number | undefined;
  possibleSpam: boolean;
};

export interface TokenDepositEvent extends TokenEvent {
  amount: bigint;
  address: Address;
}

export interface TokenWithdrawEvent extends TokenEvent {
  addresses: string[];
  amount: bigint;
}
export interface ERC721TokenEvent extends TokenEvent {
  contractAddresses: string[];
  tokenIds: bigint[];
}
export interface ERC20TokenEvent extends TokenEvent {
  contractAddresses: string[];
  addresses: string[];
  amounts: bigint[];
}

export type Transaction =
  | TokenDepositEvent
  | TokenWithdrawEvent
  | ERC20TokenEvent
  | ERC721TokenEvent;

export enum TransferType {
  ETHER_TRANSFER = 'ETHER_TRANSFER',
  ERC20_TRANSFER = 'ERC20_TRANSFER',
  ERC721_TRANSFER = 'ERC721_TRANSFER',
}

export enum TokenType {
  ERC20,
  ERC721,
}
