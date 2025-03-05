import {
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
} from '@safe-global/safe-deployments';
import { useEffect, useState } from 'react';
import { Address, createPublicClient, http, isAddress, toHex } from 'viem';
import { getSafeContractDeploymentAddress } from '../../providers/NetworkConfig/networks/utils';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { NetworkConfig } from '../../types/network';

const safeVersions = ['1.3.0', '1.4.1'];

const safe130bytecode =
  '0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea2646970667358221220d1429297349653a4918076d650332de1a1068c5f3e07c5c82360c277770b955264736f6c63430007060033';
const safe141bytecode =
  '0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea264697066735822122003d1488ee65e08fa41e58e888a9865554c535f2c77126a82cb4c0f917f31441364736f6c63430007060033';

function getSafeSingleton(chainId: number, safeVersion: string): string | undefined {
  try {
    const singleton = getSafeContractDeploymentAddress(
      getSafeSingletonDeployment,
      safeVersion,
      chainId.toString(),
    );
    return singleton.toLowerCase().replace('0x', '');
  } catch (err) {
    return undefined;
  }
}

function getSafeL2Singleton(chainId: number, safeVersion: string): string | undefined {
  try {
    const singleton = getSafeContractDeploymentAddress(
      getSafeL2SingletonDeployment,
      safeVersion,
      chainId.toString(),
    );
    return singleton.toLowerCase().replace('0x', '');
  } catch (err) {
    return undefined;
  }
}

function getSafeSingletons(chainId: number): string[] {
  const safeSingletons = safeVersions
    .map(version => getSafeSingleton(chainId, version))
    .filter(singleton => singleton != undefined);
  const safeL2Singletons = safeVersions
    .map(version => getSafeL2Singleton(chainId, version))
    .filter(singleton => singleton != undefined);
  return [safeSingletons, safeL2Singletons].flat();
}

export async function getIsSafe(address: Address, networkConfig: NetworkConfig): Promise<boolean> {
  try {
    const publicClient = createPublicClient({
      chain: networkConfig.chain,
      transport: http(networkConfig.rpcEndpoint),
    });

    const bytecode = (await publicClient.getBytecode({ address: address }))?.toLowerCase();
    if (bytecode != safe130bytecode && bytecode != safe141bytecode) {
      return false;
    }

    const store = await publicClient.getStorageAt({
      address: address,
      slot: toHex(0),
    });

    if (store === undefined) {
      return false;
    }

    // We have the bytecode, let's just find if any of the single addresses are there
    const safeSingletons = getSafeSingletons(networkConfig.chain.id);
    return safeSingletons.some(singleton => store === `0x000000000000000000000000${singleton}`);
  } catch (error) {
    console.log(error);
    return false;
  }
}

export const useIsSafe = (address: string | undefined) => {
  const [isSafeLoading, setSafeLoading] = useState<boolean>(false);
  const [isSafe, setIsSafe] = useState<boolean | undefined>();

  // currently connected chain
  const { chain, getConfigByChainId } = useNetworkConfigStore();
  const networkConfig = getConfigByChainId(chain.id);

  useEffect(() => {
    setSafeLoading(true);
    setIsSafe(undefined);

    if (!address || !isAddress(address)) {
      setIsSafe(false);
      setSafeLoading(false);
      return;
    }

    getIsSafe(address, networkConfig)
      .then(setIsSafe)
      .then(() => setIsSafe(true))
      .catch(() => setIsSafe(false))
      .finally(() => setSafeLoading(false));
  }, [address, networkConfig]);

  return { isSafe, isSafeLoading };
};
