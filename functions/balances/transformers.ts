import { getAddress } from 'viem';
import { DefiBalance, NFTBalance, TokenBalance } from '../../src/types/daoTreasury';
import { DefiResponse, NFTResponse, TokenResponse } from '../shared/moralisTypes';

export function transformTokenResponse(token: TokenResponse): TokenBalance {
  return {
    ...token,
    tokenAddress: getAddress(token.token_address),
    verifiedContract: token.verified_contract,
    balanceFormatted: token.balance_formatted,
    nativeToken: token.native_token,
    portfolioPercentage: token.portfolio_percentage,
    logo: token.logo,
    thumbnail: token.thumbnail,
    usdValue: token.usd_value,
    possibleSpam: token.possible_spam,
  };
}

export function transformNFTResponse(nft: NFTResponse): NFTBalance {
  return {
    ...nft,
    tokenAddress: getAddress(nft.token_address),
    tokenId: nft.token_id,
    possibleSpam: !!nft.possible_spam,
    media: nft.media,
    metadata: nft.metadata ? JSON.parse(nft.metadata) : undefined,
    tokenUri: nft.token_uri,
    name: nft.name || undefined,
    symbol: nft.symbol || undefined,
    amount: nft.amount ? parseInt(nft.amount) : undefined,
  };
}

export function transformDefiResponse(defi: DefiResponse): DefiBalance {
  return {
    protocolName: defi.protocol_name,
    protocolId: defi.protocol,
    protocolUrl: defi.protocol_url,
    protocolLogo: defi.protocol_logo,
    position: {
      label: defi.position.label || '',
      tokens: (defi.position.tokens || []).map(token => ({
        contractAddress: token.contract_address,
        tokenType: token.token_type as 'supplied' | 'defi-token',
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        balance: token.balance,
        balanceFormatted: token.balance_formatted,
        logo: token.logo,
        thumbnail: token.thumbnail,
        usdPrice: token.usd_price,
        usdValue: token.usd_value,
        nativeToken: false,
        portfolioPercentage: 0,
        tokenAddress: token.contract_address ? getAddress(token.contract_address) : '0x',
        verifiedContract: true,
      })),
      address: defi.position.address,
      balanceUsd: defi.position.balance_usd || 0,
      totalUnclaimedUsdValue: defi.position.total_unclaimed_usd_value || 0,
      positionDetails: defi.position.position_details || undefined,
    },
  };
}
