import { useMemo } from 'react';
import { Address, zeroAddress } from 'viem';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { TokenSaleFormValues } from '../../../../types/tokenSale';

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

      if (!values.tokenAddress) {
        throw new Error('No token selected');
      }

      if (
        !values.startDate ||
        !values.endDate ||
        !values.saleTokenPrice.bigintValue ||
        !values.saleTokenPrice.value ||
        !values.saleTokenPrice.value ||
        !values.saleTokenPrice.value ||
        !values.protocolFeeReceiver ||
        !values.saleTokenProtocolFee.bigintValue ||
        !values.minimumCommitment.bigintValue ||
        !values.maximumCommitment.bigintValue ||
        !values.minimumTotalCommitment.bigintValue ||
        !values.maximumTotalCommitment.bigintValue ||
        !values.commitmentTokenProtocolFee.bigintValue
      ) {
        throw new Error('Sale Form not ready');
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
        saleToken: values.tokenAddress as Address,
        verifier: decentVerifierV1,
        saleProceedsReceiver: safe.address,
        protocolFeeReceiver: values.protocolFeeReceiver,
        minimumCommitment: values.minimumCommitment.bigintValue,
        maximumCommitment: values.maximumCommitment.bigintValue,
        minimumTotalCommitment: values.minimumTotalCommitment.bigintValue,
        maximumTotalCommitment: values.maximumTotalCommitment.bigintValue,
        // Use calculated token price from form
        saleTokenPrice: values.saleTokenPrice.bigintValue,
        commitmentTokenProtocolFee: values.commitmentTokenProtocolFee.bigintValue,
        saleTokenProtocolFee: values.saleTokenProtocolFee.bigintValue,
        saleTokenHolder: safe.address,

        // TODO: if hedgeyLockupEnabled is true, don't default to 0n for the other values
        hedgeyLockupParams: {
          enabled: values.hedgeyLockupEnabled,
          start: values.hedgeyLockupStart.bigintValue || 0n,
          cliff: values.hedgeyLockupCliff.bigintValue || 0n,
          ratePercentage: values.hedgeyLockupRatePercentage.bigintValue || 0n,
          period: values.hedgeyLockupPeriod.bigintValue || 0n,
          votingTokenLockupPlans: values.hedgeyVotingTokenLockupPlans || zeroAddress,
        },
      };

      return preparedData;
    };
  }, [safe?.address, decentVerifierV1]);

  return {
    prepareFormData,
  };
}
