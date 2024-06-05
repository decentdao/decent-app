import { normalize } from 'viem/ens';
import * as networks from '../providers/NetworkConfig/networks';
export const isValidUrl = (urlString: string) => {
  try {
    const url = new URL(urlString);
    return !!url;
  } catch (e) {
    return false;
  }
};

/**
 * Tests whether the given string *could* be an ENS address.
 * Useful for preventing unnecessary resolver calls for strings that
 * aren't valid ENS names anyway.
 */
export const validateENSName = (ensAddress?: string): boolean => {
  if (!ensAddress) return false;

  const name = ensAddress.substring(0, ensAddress.lastIndexOf('.')).trim();
  const isValidLength = [...name].length >= 3;
  if (!isValidLength) return false;

  try {
    normalize(ensAddress);
    return true;
  } catch (e) {
    return false;
  }
};

export const addNetworkPrefix = (address: string, chainId: number): string => {
  const network = Object.values(networks).find(_network => _network.chain.id === chainId);
  if (!network) {
    throw new Error(`No network found for chainId ${chainId}`);
  }
  return `${network?.addressPrefix}:${address}`;
};

export const getNetworkIcon = (_networkPrefix: string): string => {
  const network = Object.values(networks).find(
    _network => _network.addressPrefix === _networkPrefix,
  );
  if (!network) {
    throw new Error(`No network found for networkPrefix ${_networkPrefix}`);
  }
  return network?.nativeTokenIcon;
};

export const getChainName = (_networkPrefix: string): string => {
  const network = Object.values(networks).find(
    _network => _network.addressPrefix === _networkPrefix,
  );
  if (!network) {
    throw new Error(`No network found for chainId ${_networkPrefix}`);
  }
  return network.chain.name;
};

export const getChainIdFromPrefix = (_networkPrefix: string): number => {
  const network = Object.values(networks).find(
    _network => _network.addressPrefix === _networkPrefix,
  );
  if (!network) {
    throw new Error(`No network found for chainId ${_networkPrefix}`);
  }
  return network.chain.id;
};
