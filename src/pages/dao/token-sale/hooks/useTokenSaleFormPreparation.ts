import { useMemo } from 'react';
import { Address, getAddress, zeroAddress, parseUnits } from 'viem';
import { PRECISION, USDC_DECIMALS } from '../../../../constants/common';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { TokenSaleFormValues } from '../../../../types/tokenSale';
import {
  COMMITMENT_TOKEN_PROTOCOL_FEE,
  calculateSaleTokenProtocolFeeForContract,
  calculateGrossTokensFromNet,
} from '../../../../utils/tokenSaleCalculations';
import { combineDateTimeToUTC } from '../../../../utils/timezoneUtils';

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
        !values.saleTokenSupply.bigintValue ||
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

      // User input is now NET tokens for sale (what buyers actually get)
      // Calculate gross amount needed (net tokens + protocol fee)
      const netTokensForSale = values.saleTokenSupply.bigintValue;

      // Calculate gross tokens needed for escrow (includes protocol fee)
      const saleTokenEscrowAmount = calculateGrossTokensFromNet(netTokensForSale);

      // Calculate max commitment capacity from net tokens for sale
      // This is the calculated fundraising cap: netTokensForSale * tokenPrice
      // Token price is in USDC units per PRECISION sale tokens (contract format)
      // netTokensForSale is in token raw units, so we need to convert to PRECISION units
      const maxPossibleCommitmentFromTokens =
        (netTokensForSale * values.saleTokenPrice.bigintValue) / PRECISION;

      // Use the calculated fundraising cap (no user input override)
      const finalMaxCommitment = maxPossibleCommitmentFromTokens;

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

      let maxCommitment = finalMaxCommitment; // Default to calculated max commitment
      if (
        values.maxPurchase &&
        values.maxPurchase.trim() !== '' &&
        parseFloat(values.maxPurchase) > 0
      ) {
        maxCommitment = parseUnits(values.maxPurchase, USDC_DECIMALS);
      }

      let maximumTotalCommitment = maxPossibleCommitmentFromTokens;

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
      // Combine date and time in user's timezone, then convert to UTC
      const saleStartTimestamp = combineDateTimeToUTC(values.startDate, values.startTime);
      const saleEndTimestamp = combineDateTimeToUTC(values.endDate, values.endTime);

      const commitmentToken = values.commitmentToken as Address;
      const saleToken = values.tokenAddress as Address;

      // Validation: ensure treasury has enough tokens for the user-specified amount
      if (saleTokenEscrowAmount > treasuryTokenBalance) {
        throw new Error(
          `Treasury has insufficient tokens. Required: ${(Number(saleTokenEscrowAmount) / Number(10 ** selectedTokenBalance.decimals)).toLocaleString()}, Available: ${(Number(treasuryTokenBalance) / Number(10 ** selectedTokenBalance.decimals)).toLocaleString()}`,
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
        saleTokenEscrowAmount: saleTokenEscrowAmount,

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
        `Required Escrow (User Input, includes fee): ${saleTokenEscrowAmount.toString()} tokens`,
      );
      console.log(`Balance Sufficient: ${treasuryTokenBalance >= saleTokenEscrowAmount}`);

      console.log('🚀 ~ preparedData:', preparedData);

      return preparedData;
    };
  }, [safe?.address, decentVerifierV1, treasury.assetsFungible]);

  return {
    prepareFormData,
  };
}
