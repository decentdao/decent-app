import { useEffect, useState } from 'react';
import { Address, getContract } from 'viem';
import { EntryPoint07Abi } from '../../../assets/abi/EntryPoint07Abi';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import useNetworkPublicClient from '../../useNetworkPublicClient';

interface DepositInfo {
  /**
   * Deposited balance on EntryPoint
   */
  deposit: bigint;
  stake: bigint;
  staked: boolean;
  unstakeDelaySec: number;
  withdrawTime: number;
}

/**
 * Get deposit info from entryPoint contract
 * @returns
 */
export function useDepositInfo(account?: Address | null) {
  const {
    contracts: { accountAbstraction },
  } = useNetworkConfigStore();
  const publicClient = useNetworkPublicClient();

  const [depositInfo, setDepositInfo] = useState<DepositInfo>();

  useEffect(() => {
    if (!account || !accountAbstraction) return;
    const entryPoint = getContract({
      address: accountAbstraction.entryPointv07,
      abi: EntryPoint07Abi,
      client: publicClient,
    });

    entryPoint.read.getDepositInfo([account]).then(setDepositInfo);
  }, [account, publicClient, accountAbstraction]);

  return {
    depositInfo,
  };
}
