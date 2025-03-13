import axios from 'axios';
import detectProxyTarget from 'evm-proxy-detection';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const loadABI = async () => {
      if (target && ((ensAddress && isAddress(ensAddress)) || isAddress(target))) {
        try {
          const requestFunc = ({ method, params }: { method: any; params: any }) =>
            client.request({ method, params });

          const implementationAddress = await detectProxyTarget(ensAddress || target, requestFunc);

          const response = await axios.get(
            `${etherscanAPIUrl}&module=contract&action=getabi&address=${implementationAddress || ensAddress || target}`,
          );
          const responseData = response.data;

          if (responseData.status === '1') {
            const fetchedABI = JSON.parse(responseData.result);
            setABI(fetchedABI);
          } else {
            setABI([]);
          }
        } catch (e) {
          setABI([]);
          logError(e, 'Error fetching ABI for smart contract');
        }
      } else {
        setABI([]);
      }
    };
    loadABI();
  }, [target, ensAddress, etherscanAPIUrl, client]);

  return abi;
}
