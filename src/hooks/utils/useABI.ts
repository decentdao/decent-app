import axios from 'axios';
import detectProxyTarget from 'evm-proxy-detection';
import { useCallback, useEffect, useState } from 'react';
import { getAddress, isAddress, PublicClient, zeroAddress } from 'viem';
import { logError } from '../../helpers/errorLogging';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useNetworkEnsAddress } from '../useNetworkEnsAddress';
import useNetworkPublicClient from '../useNetworkPublicClient';

export type ABIElement = {
  type: 'function' | 'constructor' | 'fallback' | 'event';
  name: string;
  stateMutability: 'view' | 'nonpayable' | 'pure';
  inputs: { type: string; name: string; internalType: string }[];
};

// doc: https://help.safe.global/en/articles/40838-what-is-a-fallback-handler-and-how-does-it-relate-to-safe
// code: https://github.com/safe-global/safe-smart-account/blob/v1.3.0/contracts/base/FallbackManager.sol
async function getSafeFallbackHandlerAddress(publicClient: PublicClient, contractAddress: string) {
  const FALLBACK_HANDLER_STORAGE_SLOT =
    '0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5';

  try {
    const rawStorageValue = await publicClient.getStorageAt({
      address: getAddress(contractAddress),
      slot: FALLBACK_HANDLER_STORAGE_SLOT,
    });
    const fallbackHandler = `0x${rawStorageValue?.slice(-40)}`;
    if (fallbackHandler === zeroAddress) {
      return null;
    }

    return fallbackHandler;
  } catch (error) {
    return null;
  }
}

export function useABI(target?: string) {
  const [abi, setABI] = useState<ABIElement[]>([]);
  const { etherscanAPIUrl, chain } = useNetworkConfigStore();
  const { data: ensAddress } = useNetworkEnsAddress({
    name: target?.toLowerCase(),
    chainId: chain.id,
  });
  const client = useNetworkPublicClient();
  const loadABI = useCallback(
    async (targetAddress?: string): Promise<ABIElement[]> => {
      const address = targetAddress || target;
      if (address && ((ensAddress && isAddress(ensAddress)) || isAddress(address))) {
        try {
          const requestFunc = ({ method, params }: { method: any; params: any }) =>
            client.request({ method, params });

          const implementationAddress = await detectProxyTarget(ensAddress || address, requestFunc);
          const fallbackHandlerAddress = await getSafeFallbackHandlerAddress(
            client,
            ensAddress || address,
          );

          const response = await axios.get(
            `${etherscanAPIUrl}&module=contract&action=getabi&address=${implementationAddress || ensAddress || address}`,
          );
          const responseData = response.data;

          if (responseData.status === '1') {
            let fetchedABI = JSON.parse(responseData.result);

            if (fallbackHandlerAddress !== null) {
              const fallbackAbiResponse = await axios.get(
                `${etherscanAPIUrl}&module=contract&action=getabi&address=${fallbackHandlerAddress}`,
              );
              const fallbackAbiResponseData = fallbackAbiResponse.data;
              if (fallbackAbiResponseData.status === '1') {
                const fetchedFallbackAbi = JSON.parse(fallbackAbiResponseData.result);
                fetchedABI = fetchedABI.concat(fetchedFallbackAbi);
              }
            }

            setABI(fetchedABI);
            return fetchedABI;
          } else {
            setABI([]);
            return [];
          }
        } catch (e) {
          setABI([]);
          logError(e, 'Error fetching ABI for smart contract');
          return [];
        }
      } else {
        setABI([]);
        return [];
      }
    },
    [target, ensAddress, etherscanAPIUrl, client],
  );

  useEffect(() => {
    loadABI();
  }, [loadABI]);

  return { abi, loadABI };
}
