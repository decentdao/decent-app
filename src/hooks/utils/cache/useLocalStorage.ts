import { parseISO } from 'date-fns';
import { useCallback } from 'react';
import { useNetworkConfig } from '../../../providers/NetworkConfig/NetworkConfigProvider';
import { CacheExpiry, IStorageValue, CACHE_DEFAULTS, keyInternal } from './cacheDefaults';

function bigintReplacer(key: any, value: any) {
  return typeof value === 'bigint'
    ? `bigint:${value.toString()}`
    : value instanceof Date
      ? value.toISOString()
      : value;
}

function proposalObjectReviver(key: any, value: any) {
  if (typeof value === 'string') {
    if (value.startsWith('bigint:')) return BigInt(value.substring(7));
    const isoStringRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (isoStringRegex.test(value)) return parseISO(value);
  }

  return value;
}

export const setValue = (
  key: string,
  value: any,
  chainId: number,
  expirationMinutes: number = CacheExpiry.ONE_WEEK,
  isVersioned: boolean = false,
): void => {
  if (typeof window !== 'undefined') {
    const val: IStorageValue = {
      v: value,
      e:
        expirationMinutes === CacheExpiry.NEVER
          ? CacheExpiry.NEVER
          : Date.now() + expirationMinutes * 60000,
    };

    localStorage.setItem(
      keyInternal(chainId, key, isVersioned),
      JSON.stringify(val, bigintReplacer),
    );
  }
};

export const getValue = (key: string, chainId: number, isVersioned: boolean): any => {
  if (typeof window !== 'undefined') {
    const rawVal = localStorage.getItem(keyInternal(chainId, key, isVersioned));
    if (rawVal) {
      const parsed: IStorageValue = JSON.parse(rawVal, proposalObjectReviver);
      if (parsed.e === CacheExpiry.NEVER) {
        return parsed.v;
      } else {
        if (parsed.e < Date.now()) {
          localStorage.removeItem(keyInternal(chainId, key, isVersioned));
          return null;
        } else {
          return parsed.v;
        }
      }
    } else if (CACHE_DEFAULTS[key]) {
      return CACHE_DEFAULTS[key];
    } else {
      return null;
    }
  }
};

/**
 * A hook which returns a getter and setter for local storage cache,
 * with an optional expiration (in minutes) param.
 *
 * Each value set/get is specific to the currently connected chainId.
 *
 * The default expiration is 1 week. Use CacheExpiry.NEVER to keep
 * the value cached indefinitely.
 *
 * All JSON parsing is done internally, you should only need to pass
 * the value, array, or object you would like to cache.
 */
export const useLocalStorage = () => {
  const { chain } = useNetworkConfig();

  const set = useCallback(
    (
      key: string,
      value: any,
      expirationMinutes: number = CacheExpiry.ONE_WEEK,
      isVersioned: boolean = false,
    ) => {
      setValue(key, value, chain.id, expirationMinutes, isVersioned);
    },
    [chain],
  );

  const get = useCallback(
    (key: string, isVersioned: boolean = false) => {
      return getValue(key, chain.id, isVersioned);
    },
    [chain],
  );

  return { setValue: set, getValue: get };
};
