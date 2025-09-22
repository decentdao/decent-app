import { useMemo } from 'react';
import { Address, getAddress, zeroAddress, parseUnits } from 'viem';
import { USDC_DECIMALS } from '../../../../constants/common';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { TokenSaleFormValues } from '../../../../types/tokenSale';
import {
  COMMITMENT_TOKEN_PROTOCOL_FEE,
  calculateTokenSaleParameters,
  calculateSaleTokenProtocolFeeForContract,
  calculateContractEscrowAmount,
} from '../../../../utils/tokenSaleCalculations';

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

export function useTokenSaleFormPreparation() {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    treasury,
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
        !values.saleTokenPrice.bigintValue
      ) {
        throw new Error('Sale Form not ready');
      }

      // Get the token's treasury balance to validate against
      const selectedTokenBalance = treasury.assetsFungible.find(
        token => token.tokenAddress.toLowerCase() === values.tokenAddress.toLowerCase(),
      );

      if (!selectedTokenBalance) {
        throw new Error(`Token ${values.tokenAddress} not found in treasury`);
      }

      // Parse the treasury balance (this is what the DAO actually holds)
      // selectedTokenBalance.balance is already in raw units, don't convert again!
      const treasuryTokenBalance = BigInt(selectedTokenBalance.balance);

      // Use shared calculation utility
      const calculationResult = calculateTokenSaleParameters({
        treasuryTokenBalance,
        tokenPrice: values.saleTokenPrice.bigintValue,
        tokenDecimals: selectedTokenBalance.decimals,
        fundraisingCap: values.fundraisingCap,
      });

      // If the fundraising cap cannot be supported, throw an error
      if (!calculationResult.canSupportFundraisingCap && calculationResult.errorMessage) {
        throw new Error(calculationResult.errorMessage);
      }

      const maxPossibleCommitment = calculationResult.maxPossibleCommitment;

      // Convert USD form values to BigInt commitment values (in USDC units)
      // minPurchase and maxPurchase are in USD strings, convert to USDC BigInt
      let minCommitment = 1n; // Default minimum commitment (1 wei)
      if (
        values.minPurchase &&
        values.minPurchase.trim() !== '' &&
        parseFloat(values.minPurchase) > 0
      ) {
        minCommitment = parseUnits(values.minPurchase, USDC_DECIMALS);
      }

      let maxCommitment = maxPossibleCommitment; // Default to max possible based on token supply
      if (
        values.maxPurchase &&
        values.maxPurchase.trim() !== '' &&
        parseFloat(values.maxPurchase) > 0
      ) {
        maxCommitment = parseUnits(values.maxPurchase, USDC_DECIMALS);
      }

      // Use the calculated max possible commitment (already accounts for treasury constraints)
      let maximumTotalCommitment = maxPossibleCommitment;

      // Convert minimum fundraise to minimum total commitment
      let minimumTotalCommitment = 1n; // Default minimum
      if (
        values.minimumFundraise &&
        values.minimumFundraise.trim() !== '' &&
        parseFloat(values.minimumFundraise) > 0
      ) {
        minimumTotalCommitment = parseUnits(values.minimumFundraise, USDC_DECIMALS);
      }

      // Convert dates to timestamps
      const saleStartTimestamp = Math.floor(new Date(values.startDate).getTime() / 1000);
      const saleEndTimestamp = Math.floor(new Date(values.endDate).getTime() / 1000);

      const commitmentToken = values.commitmentToken as Address;
      const saleToken = values.tokenAddress as Address;

      // Calculate escrow amount exactly as the contract will
      const contractEscrowAmount = calculateContractEscrowAmount(
        maxPossibleCommitment,
        values.saleTokenPrice.bigintValue,
      );

      // Validation: ensure treasury has enough tokens using contract's calculation
      if (contractEscrowAmount > treasuryTokenBalance) {
        throw new Error(
          `Treasury has insufficient tokens. Required: ${(Number(contractEscrowAmount) / Number(10 ** selectedTokenBalance.decimals)).toLocaleString()}, Available: ${(Number(treasuryTokenBalance) / Number(10 ** selectedTokenBalance.decimals)).toLocaleString()}`,
        );
      }

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
        minimumTotalCommitment,
        maximumTotalCommitment,
        // Use token price in USDC units directly (contract expects USDC units per PRECISION sale tokens)
        saleTokenPrice: values.saleTokenPrice.bigintValue,
        commitmentTokenProtocolFee: COMMITMENT_TOKEN_PROTOCOL_FEE,
        saleTokenProtocolFee: calculateSaleTokenProtocolFeeForContract(),
        saleTokenEscrowAmount: contractEscrowAmount,

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
      // Log treasury balance validation info
      console.log(`Treasury Balance: ${treasuryTokenBalance.toString()} tokens`);
      console.log(
        `Required Escrow (Contract Calculation): ${contractEscrowAmount.toString()} tokens`,
      );
      console.log(`Balance Sufficient: ${treasuryTokenBalance >= contractEscrowAmount}`);

      console.log('🚀 ~ preparedData:', preparedData);

      return preparedData;
    };
  }, [safe?.address, decentVerifierV1, treasury.assetsFungible]);

  return {
    prepareFormData,
  };
}
