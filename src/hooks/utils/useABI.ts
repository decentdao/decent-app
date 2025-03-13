import axios from 'axios';
import detectProxyTarget from 'evm-proxy-detection';
import { useCallback, useEffect, useState } from 'react';
import { isAddress } from 'viem';
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

export function useABI(target?: string) {
  const [abi, setABI] = useState<ABIElement[]>([]);
  const { etherscanAPIUrl, chain } = useNetworkConfigStore();
  const { data: ensAddress } = useNetworkEnsAddress({
    name: target?.toLowerCase(),
    chainId: chain.id,
  });
  const client = useNetworkPublicClient();
  const loadABI = useCallback(
    async (targetAddress?: string) => {
      const address = targetAddress || target;
      if (address && ((ensAddress && isAddress(ensAddress)) || isAddress(address))) {
        try {
          const requestFunc = ({ method, params }: { method: any; params: any }) =>
            client.request({ method, params });

          const implementationAddress = await detectProxyTarget(ensAddress || address, requestFunc);

          const response = await axios.get(
            `${etherscanAPIUrl}&module=contract&action=getabi&address=${implementationAddress || ensAddress || address}`,
          );
          const responseData = response.data;

          if (responseData.status === '1') {
            const fetchedABI = JSON.parse(responseData.result);
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
