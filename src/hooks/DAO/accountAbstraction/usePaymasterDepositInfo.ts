import { useEffect, useState } from 'react';
import { getContract } from 'viem';
import { EntryPoint07Abi } from '../../../assets/abi/EntryPoint07Abi';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import useNetworkPublicClient from '../../useNetworkPublicClient';
import { useCurrentDAOKey } from '../useCurrentDAOKey';

interface DepositInfo {
  balance: bigint;
  stake: bigint;
  staked: boolean;
  unstakeDelaySec: number;
  withdrawTime: number;
}

export function usePaymasterDepositInfo() {
  const {
    contracts: { accountAbstraction },
  } = useNetworkConfigStore();
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { paymasterAddress },
  } = useDAOStore({ daoKey });

  const publicClient = useNetworkPublicClient();

  const [depositInfo, setDepositInfo] = useState<DepositInfo>();

  useEffect(() => {
    const getDepositInfo = async () => {
      if (!paymasterAddress || !accountAbstraction) return;
      const entryPoint = getContract({
        address: accountAbstraction.entryPointv07,
        abi: EntryPoint07Abi,
        client: publicClient,
      });

      const ret = await entryPoint.read.getDepositInfo([paymasterAddress]);
      setDepositInfo({ ...ret, balance: ret.deposit });
    };

    getDepositInfo();
  }, [paymasterAddress, publicClient, accountAbstraction]);

  return {
    depositInfo,
  };
}
