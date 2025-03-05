import { Hono } from 'hono';
import { TokenBalance } from '../../src/types/daoTreasury';
import { fetchMoralis } from '../shared/moralisApi';
import { DefiResponse, NFTResponse, TokenResponse } from '../shared/moralisTypes';
import type { Env } from '../types';
import { withBalanceCache } from './balanceCache';
import { getParams } from './middleware';
import {
  transformDefiResponse,
  transformNFTResponse,
  transformTokenResponse,
} from './transformers';

const endpoints = {
  tokens: {
    moralisPath: (address: string) => `/wallets/${address}/tokens`,
    transform: transformTokenResponse,
    postProcess: (data: TokenBalance[]) => data.filter(token => token.balance !== '0'),
    fetch: async ({ chain, address }: { chain: string; address: string }, c: { env: Env }) => {
      const result = await fetchMoralis<TokenResponse>({
        endpoint: endpoints.tokens.moralisPath(address),
        chain,
        apiKey: c.env.MORALIS_API_KEY,
      });
      const transformed = result.map(endpoints.tokens.transform);
      return endpoints.tokens.postProcess(transformed);
    },
  },
  nfts: {
    moralisPath: (address: string) => `/${address}/nft`,
    transform: transformNFTResponse,
    params: {
      format: 'decimal',
      media_items: 'true',
      normalizeMetadata: 'true',
    },
    fetch: async ({ chain, address }: { chain: string; address: string }, c: { env: Env }) => {
      const result = await fetchMoralis<NFTResponse>({
        endpoint: endpoints.nfts.moralisPath(address),
        chain,
        apiKey: c.env.MORALIS_API_KEY,
        params: endpoints.nfts.params,
      });
      return result.map(endpoints.nfts.transform);
    },
  },
  defi: {
    moralisPath: (address: string) => `/wallets/${address}/defi/positions`,
    transform: transformDefiResponse,
    fetch: async ({ chain, address }: { chain: string; address: string }, c: { env: Env }) => {
      const result = await fetchMoralis<DefiResponse>({
        isPaginated: false,
        endpoint: endpoints.defi.moralisPath(address),
        chain,
        apiKey: c.env.MORALIS_API_KEY,
      });
      return result.map(endpoints.defi.transform);
    },
  },
} as const;

type BalanceType = keyof typeof endpoints;
const ALL_BALANCE_TYPES: BalanceType[] = ['tokens', 'nfts', 'defi'];

export const router = new Hono<{ Bindings: Env }>().use('*', getParams).get('/', async c => {
  const { address, network } = c.var;
  const flavors = c.req.queries('flavor') as BalanceType[] | undefined;
  const requestedTypes = flavors?.filter(t => ALL_BALANCE_TYPES.includes(t)) ?? ALL_BALANCE_TYPES;

  const results = await Promise.all(
    requestedTypes.map(async type => {
      const result = await withBalanceCache(c, type, () =>
        endpoints[type].fetch({ chain: network, address }, c),
      );
      return [type, result] as const;
    }),
  );

  const response = Object.fromEntries(results);
  if (results.some(([, result]) => 'error' in result)) {
    return c.json(response, 503);
  }
  return c.json(response);
});
