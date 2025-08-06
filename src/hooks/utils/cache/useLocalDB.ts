import { useCallback } from 'react';
import { logError } from '../../../helpers/errorLogging';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { CacheExpiry, CACHE_DEFAULTS, IStorageValue, keyInternal } from './cacheDefaults';

/**
 * Current database version. Must be an integer.
 *
 * The version number must be updated, and any conversion
 * work handled in onupgradeneeded if the structure of the
 * database changes in anyway.
 */
const DB_VERSION = 2;

/**
 * Database object keys.
 */
export enum DBObjectKeys {
  DECODED_TRANSACTIONS = 'DECODED_TRANSACTIONS',
  MULTISIG_METADATA = 'MULTISIG_METADATA',
  SAFE_API = 'SAFE_API',
}

/**
 * Helper function to create a promise-based wrapper for indexedDB.
 */
const withIndexedDB = (callback: (db: IDBDatabase) => Promise<any>) => {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open('decent', DB_VERSION);

    openRequest.onupgradeneeded = () => {
      const db = openRequest.result;

      // Create an object store for each DBObjectKey
      for (const key in DBObjectKeys) {
        if (!db.objectStoreNames.contains(key)) {
          db.createObjectStore(key, { keyPath: 'key' });
        }
      }
    };

    openRequest.onsuccess = async () => {
      const db = openRequest.result;
      try {
        const result = await callback(db);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    openRequest.onerror = () => {
      reject(openRequest.error);
    };
  });
};

const setIndexedDBValue = async (
  objectStoreName: string,
  key: string,
  value: any,
  chainId: number,
  expirationMinutes: number = CacheExpiry.ONE_WEEK,
): Promise<void> => {
  const val: IStorageValue = {
    v: value,
    e:
      expirationMinutes === CacheExpiry.NEVER
        ? CacheExpiry.NEVER
        : Date.now() + expirationMinutes * 60000,
  };

  await withIndexedDB(async db => {
    let transaction: IDBTransaction, store: IDBObjectStore;
    try {
      transaction = db.transaction(objectStoreName, 'readwrite');
      store = transaction.objectStore(objectStoreName);
    } catch (e) {
      logError(e);
      return;
    }
    store.put({ key: keyInternal(chainId, key), value: val });
  });
};

const getIndexedDBValue = async (
  storeKey: string,
  key: string,
  chainId: number,
): Promise<any> => {
  return withIndexedDB(async db => {
    let transaction: IDBTransaction, store: IDBObjectStore, request: IDBRequest<any>;

    try {
      transaction = db.transaction(storeKey, 'readonly');
      store = transaction.objectStore(storeKey);
      request = store.get(keyInternal(chainId, key));
    } catch (e) {
      logError(e);
      return Promise.reject(e);
    }

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;

        if (result) {
          const parsed: IStorageValue = result.value;
          if (parsed.e === CacheExpiry.NEVER) {
            resolve(parsed.v);
          } else {
            if (parsed.e < Date.now()) {
              setIndexedDBValue(storeKey, key, null, chainId, CacheExpiry.NEVER);
              resolve(null);
            } else {
              resolve(parsed.v);
            }
          }
        } else if (CACHE_DEFAULTS[key]) {
          resolve(CACHE_DEFAULTS[key]);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  });
};

export const useIndexedDB = (objectStoreName: string) => {
  const { chain } = useNetworkConfigStore();

  const set = useCallback(
    async (key: string, value: any, expirationMinutes: number = CacheExpiry.ONE_WEEK) => {
      await setIndexedDBValue(objectStoreName, key, value, chain.id, expirationMinutes);
    },
    [chain, objectStoreName],
  );

  const get = useCallback(
    async (key: string) => {
      return getIndexedDBValue(objectStoreName, key, chain.id);
    },
    [chain, objectStoreName],
  );

  return [set, get] as const;
};
