import { useMemo } from 'react';
import { Address } from 'viem';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { TokenSaleFormValues } from '../types';

export interface PreparedTokenSaleData {
  saleName: string;
  saleStartTimestamp: number;
  saleEndTimestamp: number;
  commitmentToken: Address;
  saleToken: Address;
  verifier: Address;
  saleProceedsReceiver: Address;
  protocolFeeReceiver: Address;
  minimumCommitment: bigint;
  maximumCommitment: bigint;
  minimumTotalCommitment: bigint;
  maximumTotalCommitment: bigint;
  saleTokenPrice: bigint;
  commitmentTokenProtocolFee: bigint;
  saleTokenProtocolFee: bigint;
  saleTokenHolder: Address;
  hedgeyLockupParams: {
    enabled: boolean;
    start: bigint;
    cliff: bigint;
    ratePercentage: bigint;
    period: bigint;
    votingTokenLockupPlans: Address;
  };
}

export function useTokenSaleFormPreparation() {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const {
    contracts: { decentVerifierV1 },
  } = useNetworkConfigStore();

  const prepareFormData = useMemo(() => {
    return (values: TokenSaleFormValues): PreparedTokenSaleData | null => {
      if (!safe?.address) {
        throw new Error('DAO address is not available');
      }

      if (!values.selectedToken) {
        throw new Error('No token selected');
      }

      if (!values.startDate || !values.endDate) {
        throw new Error('Sale dates are required');
      }

      if (!decentVerifierV1) {
        throw new Error('Verifier contract not available');
      }

      // Convert dates to timestamps
      const saleStartTimestamp = Math.floor(values.startDate.getTime() / 1000);
      const saleEndTimestamp = Math.floor(values.endDate.getTime() / 1000);

      const commitmentToken = values.commitmentToken as Address;

      // Prepare the data structure expected by the contract
      const preparedData: PreparedTokenSaleData = {
        saleName: values.saleName || 'Token Sale',
        saleStartTimestamp,
        saleEndTimestamp,
        commitmentToken,
        saleToken: values.selectedToken.tokenAddress,
        verifier: decentVerifierV1,
        saleProceedsReceiver: safe.address,
        protocolFeeReceiver: values.protocolFeeReceiver || safe.address,
        minimumCommitment: values.minimumCommitment.bigintValue || BigInt('1000000'),
        maximumCommitment: values.maximumCommitment.bigintValue || BigInt('50000000'),
        minimumTotalCommitment: values.minimumTotalCommitment.bigintValue || BigInt('5000000'),
        maximumTotalCommitment: values.maximumTotalCommitment.bigintValue || BigInt('9500000000'),
        // Keep token price mocked as requested
        saleTokenPrice: BigInt('1000000'), // $1.00 per token (USDC has 6 decimals)
        commitmentTokenProtocolFee:
          values.commitmentTokenProtocolFee.bigintValue || BigInt('50000000000000000'),
        saleTokenProtocolFee:
          values.saleTokenProtocolFee.bigintValue || BigInt('50000000000000000'),
        saleTokenHolder: safe.address,
        hedgeyLockupParams: {
          enabled: values.hedgeyLockupEnabled,
          start: values.hedgeyLockupStart.bigintValue || 0n,
          cliff: values.hedgeyLockupCliff.bigintValue || 0n,
          ratePercentage: values.hedgeyLockupRatePercentage.bigintValue || 0n,
          period: values.hedgeyLockupPeriod.bigintValue || 0n,
          votingTokenLockupPlans:
            values.hedgeyVotingTokenLockupPlans ||
            ('0x0000000000000000000000000000000000000000' as Address),
        },
      };

      return preparedData;
    };
  }, [safe?.address, decentVerifierV1]);

  return {
    prepareFormData,
  };
}
