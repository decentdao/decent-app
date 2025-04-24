import { useEffect, useState } from 'react';
import { Address, getContract } from 'viem';
import { EntryPoint07Abi } from '../../../assets/abi/EntryPoint07Abi';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import useNetworkPublicClient from '../../useNetworkPublicClient';

interface DepositInfo {
  balance: bigint;
  stake: bigint;
  staked: boolean;
  unstakeDelaySec: number;
  withdrawTime: number;
}

export function useDepositInfo(account?: Address | null) {
  const {
    contracts: { accountAbstraction },
  } = useNetworkConfigStore();
  const publicClient = useNetworkPublicClient();

  const [depositInfo, setDepositInfo] = useState<DepositInfo>();

  useEffect(() => {
    const getDepositInfo = async () => {
      if (!account || !accountAbstraction) return;
      const entryPoint = getContract({
        address: accountAbstraction.entryPointv07,
        abi: EntryPoint07Abi,
        client: publicClient,
      });

      const ret = await entryPoint.read.getDepositInfo([account]);
      setDepositInfo({ ...ret, balance: ret.deposit });
    };

    getDepositInfo();
  }, [account, publicClient, accountAbstraction]);

  return {
    depositInfo,
  };
}
