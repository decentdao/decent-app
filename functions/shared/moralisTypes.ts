import { NFTMedia } from '../../src/types/daoTreasury';

export type TokenResponse = {
  balance: string;
  balance_formatted: string;
  decimals: number;
  logo: string;
  name: string;
  native_token: boolean;
  percentage_relative_to_total_supply: number | null;
  portfolio_percentage: number;
  possible_spam: boolean;
  security_score: number;
  symbol: string;
  thumbnail: string;
  token_address: string;
  total_supply: string | null;
  total_supply_formatted: string | null;
  usd_price: number;
  usd_price_24hr_percent_change: number;
  usd_price_24hr_usd_change: number;
  usd_value: number;
  usd_value_24hr_usd_change: number;
  verified_contract: boolean;
};

export type NFTResponse = {
  amount: string;
  token_id: string;
  token_address: string;
  contract_type: string;
  owner_of: string;
  last_metadata_sync: string | null;
  last_token_uri_sync: string | null;
  metadata: string | null;
  block_number: string;
  block_number_minted: string | null;
  name: string;
  symbol: string | null;
  token_hash: string;
  token_uri: string;
  minter_address: string;
  rarity_rank: number | null;
  rarity_percentage: number | null;
  rarity_label: string | null;
  verified_collection: boolean;
  possible_spam: boolean;
  normalized_metadata: any;
  media: NFTMedia;
  collection_logo: string | null;
  collection_banner_image: string | null;
  floor_price: string | null;
  floor_price_usd: string | null;
  floor_price_currency: string | null;
};

interface DefiTokenResponse {
  contract_address?: string;
  token_type: 'supplied' | 'defi-token';
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balance_formatted: string;
  logo?: string;
  thumbnail?: string;
  usd_price?: number;
  usd_value?: number;
}

interface DefiPositionResponse {
  label: string;
  tokens: DefiTokenResponse[];
  address?: string;
  balance_usd: number;
  total_unclaimed_usd_value: number;
  position_details?: Record<string, any>;
}

export interface DefiResponse {
  protocol_name: string;
  protocol: string;
  protocol_url: string;
  protocol_logo: string;
  position: DefiPositionResponse;
}
