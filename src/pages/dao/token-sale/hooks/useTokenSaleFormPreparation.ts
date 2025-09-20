import { useMemo } from 'react';
import { Address, getAddress, zeroAddress } from 'viem';
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
  saleTokenEscrowAmount: bigint;
  hedgeyLockupParams: {
    enabled: boolean;
    start: bigint;
    cliff: bigint;
    ratePercentage: bigint;
    period: bigint;
    votingTokenLockupPlans: Address;
  };
}

/** @notice Precision for sale token price calculations (18 decimals) - matches TokenSaleV1 contract */
const PRECISION = BigInt('1000000000000000000'); // 10^18

/** @notice Protocol fees hardcoded per PRD - 2.5% each (totaling 5%) */
const COMMITMENT_TOKEN_PROTOCOL_FEE = BigInt('25000000000000000'); // 2.5% = 0.025 * 10^18
const SALE_TOKEN_PROTOCOL_FEE = BigInt('25000000000000000'); // 2.5% = 0.025 * 10^18

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
      // These values should not be undefined by logic
      if (!safe?.address) {
        throw new Error('DAO address is not available');
      }

      // these values should be defined by logic and validated by the form
      if (
        !values.tokenAddress ||
        !values.maxTokenSupply.bigintValue ||
        !values.startDate ||
        !values.endDate ||
        !values.commitmentToken ||
        !values.protocolFeeReceiver ||
        !values.saleTokenPrice.bigintValue ||
        !values.startDate ||
        !values.endDate
      ) {
        throw new Error('Sale Form not ready');
      }

      // @dev these values may be undefined by logic and validated by the form
      // if undefined, set to default values
      let minCommitment = values.minimumCommitment.bigintValue;
      if (minCommitment === undefined) {
        minCommitment = 1n;
      }
      let maxCommitment = values.maximumCommitment.bigintValue;
      if (maxCommitment === undefined) {
        maxCommitment = PRECISION;
      }

      // Convert dates to timestamps
      const saleStartTimestamp = Math.floor(new Date(values.startDate).getTime() / 1000);
      const saleEndTimestamp = Math.floor(new Date(values.endDate).getTime() / 1000);

      const commitmentToken = values.commitmentToken as Address;
      const saleToken = values.tokenAddress as Address;
      const maximumTotalCommitment = PRECISION; // hardcoded to max value

      // Calculate escrow amount - matches TokenSaleV1 contract logic
      // This is the maximum amount of sale tokens that can be sold plus the sale token protocol fee
      const saleTokenEscrowAmount =
        (maximumTotalCommitment * (PRECISION + SALE_TOKEN_PROTOCOL_FEE)) /
        values.saleTokenPrice.bigintValue;

      // Prepare the data structure expected by the contract
      const preparedData: PreparedTokenSaleData = {
        saleName: values.saleName,
        saleStartTimestamp,
        saleEndTimestamp,
        commitmentToken,
        saleToken,
        verifier: decentVerifierV1,
        saleProceedsReceiver: safe.address,
        saleTokenHolder: safe.address,
        protocolFeeReceiver: getAddress(values.protocolFeeReceiver),
        minimumCommitment: minCommitment,
        maximumCommitment: maxCommitment,
        minimumTotalCommitment: 1n, // hardcoded to 0 for now
        maximumTotalCommitment,
        // Use calculated token price from form
        saleTokenPrice: values.saleTokenPrice.bigintValue,
        commitmentTokenProtocolFee: COMMITMENT_TOKEN_PROTOCOL_FEE,
        saleTokenProtocolFee: SALE_TOKEN_PROTOCOL_FEE,
        saleTokenEscrowAmount,

        // TODO: if hedgeyLockupEnabled is true, don't default to 0n for the other values
        hedgeyLockupParams: {
          enabled: values.hedgeyLockupEnabled,
          start: values.hedgeyLockupStart.bigintValue || 0n,
          cliff: values.hedgeyLockupCliff.bigintValue || 0n,
          ratePercentage: values.hedgeyLockupRatePercentage.bigintValue || 0n,
          period: values.hedgeyLockupPeriod.bigintValue || 0n,
          votingTokenLockupPlans: values.hedgeyVotingTokenLockupPlans
            ? getAddress(values.hedgeyVotingTokenLockupPlans)
            : zeroAddress,
        },
      };

      return preparedData;
    };
  }, [safe?.address, decentVerifierV1]);

  return {
    prepareFormData,
  };
}
