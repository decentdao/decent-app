import SafeApiKit, {
  AllTransactionsListResponse,
  AllTransactionsOptions,
  SafeCreationInfoResponse,
  SafeInfoResponse,
  SafeApiKitConfig,
  TokenInfoResponse,
} from '@safe-global/api-kit';
import { useMemo } from 'react';
import { getAddress } from 'viem';
import { CacheExpiry } from '../../../hooks/utils/cache/cacheDefaults';
import {
  DBObjectKeys,
  getIndexedDBValue,
  setIndexedDBValue,
} from '../../../hooks/utils/cache/useLocalDB';
import { SafeWithNextNonce } from '../../../types';
import { useNetworkConfig } from '../../NetworkConfig/NetworkConfigProvider';

class EnhancedSafeApiKit extends SafeApiKit {
  readonly CHAINID: number;

  // holds requests that have yet to return, to avoid calling the same
  // endpoint more than once
  requestMap = new Map<string, Promise<any> | null>();

  constructor({ chainId }: SafeApiKitConfig) {
    super({ chainId });
    this.CHAINID = Number(chainId);
  }

  private async setCache(key: string, value: any, cacheMinutes: number): Promise<void> {
    await setIndexedDBValue(DBObjectKeys.SAFE_API, key, value, this.CHAINID, cacheMinutes);
  }

  private async getCache<T>(key: string): Promise<T> {
    const value: T = await getIndexedDBValue(DBObjectKeys.SAFE_API, key, this.CHAINID);
    return value;
  }

  private async request<T>(
    cacheKey: string,
    cacheMinutes: number,
    endpoint: () => Promise<T>,
  ): Promise<T> {
    let value: T = await this.getCache<T>(cacheKey);
    if (!value) {
      let call = this.requestMap.get(cacheKey);
      if (!call) {
        call = endpoint();
        this.requestMap.set(cacheKey, call);
      }
      value = await call;
      this.requestMap.set(cacheKey, null);
      await this.setCache(cacheKey, value, cacheMinutes);
    }
    return value;
  }
  override async getSafeInfo(safeAddress: string): Promise<SafeInfoResponse> {
    const value = await this.request('getSafeInfo' + safeAddress, 5, () => {
      return super.getSafeInfo(safeAddress);
    });
    return value;
  }
  override async getSafeCreationInfo(safeAddress: string): Promise<SafeCreationInfoResponse> {
    const value = await this.request('getSafeCreationInfo' + safeAddress, CacheExpiry.NEVER, () => {
      return super.getSafeCreationInfo(safeAddress);
    });
    return value;
  }
  override async getAllTransactions(
    safeAddress: string,
    options?: AllTransactionsOptions,
  ): Promise<AllTransactionsListResponse> {
    const value = await this.request(
      'getAllTransactions' + safeAddress + options?.toString(),
      1,
      () => {
        return super.getAllTransactions(safeAddress, options);
      },
    );
    return value;
  }

  async getSafeData(safeAddress: string): Promise<SafeWithNextNonce> {
    const safeInfoResponse = await this.getSafeInfo(safeAddress);
    const nextNonce = await this.getNextNonce(safeAddress);

    return {
      ...safeInfoResponse,
      address: getAddress(safeInfoResponse.address), // TODO: remove this line when typechain PR is merged
      nextNonce,
    };
  }

  override async getToken(tokenAddress: string): Promise<TokenInfoResponse> {
    const value = await this.request('getTokenData' + tokenAddress, CacheExpiry.NEVER, () => {
      return super.getToken(tokenAddress);
    });
    return value;
  }
}

export function useSafeAPI() {
  const { chain } = useNetworkConfig();

  const safeAPI = useMemo(() => {
    return new EnhancedSafeApiKit({ chainId: BigInt(chain.id) });
  }, [chain]);

  return safeAPI;
}
