import { parseISO } from 'date-fns';
import {
  CacheExpiry,
  CacheKeyType,
  CacheValue,
  CacheValueType,
  CACHE_VERSIONS,
} from './cacheDefaults';

function bigintReplacer(_: any, value: any) {
  return typeof value === 'bigint'
    ? `bigint:${value.toString()}`
    : value instanceof Date
      ? value.toISOString()
      : value;
}

function proposalObjectReviver(_: any, value: any) {
  if (typeof value === 'string') {
    if (value.startsWith('bigint:')) return BigInt(value.substring(7));
    const isoStringRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (isoStringRegex.test(value)) return parseISO(value);
  }

  return value;
}

export const setValue = (
  key: CacheKeyType,
  value: any,
  expirationMinutes: number = CacheExpiry.ONE_WEEK,
): void => {
  const val: CacheValue = {
    v: value,
    e:
      expirationMinutes === CacheExpiry.NEVER
        ? CacheExpiry.NEVER
        : Date.now() + expirationMinutes * 60000,
  };
  localStorage.setItem(
    JSON.stringify({ ...key, version: CACHE_VERSIONS[key.cacheName] }),
    JSON.stringify(val, bigintReplacer),
  );
};

export const getValue = <T extends CacheKeyType>(key: T): CacheValueType<T> | null => {
  const version = CACHE_VERSIONS[key.cacheName];
  const rawVal = localStorage.getItem(JSON.stringify({ ...key, version }));
  if (rawVal) {
    const parsed: CacheValue = JSON.parse(rawVal, proposalObjectReviver);
    if (parsed.e === CacheExpiry.NEVER || parsed.e >= Date.now()) {
      return parsed.v as CacheValueType<T>;
    } else {
      localStorage.removeItem(JSON.stringify({ ...key, version }));
      return null;
    }
  } else {
    return null;
  }
};
