import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import { useValidationAddress } from './common/useValidationAddress';

/**
 * Validation schema for Token Sale form
 * Validates user-facing fields and ensures proper error messages are translated
 */
export const useTokenSaleSchema = () => {
  const { t } = useTranslation(['tokenSale', 'common']);
  const { addressValidationTestSimple } = useValidationAddress();

  const tokenSaleValidationSchema = useMemo(
    () =>
      Yup.object().shape({
        // Project Overview
        saleName: Yup.string()
          .required(t('saleNameRequiredError', { ns: 'tokenSale' }))
          .max(100, t('saleNameMaxLengthError', { ns: 'tokenSale' })),

        // Token Details - tokenAddress is required and must be valid
        tokenAddress: Yup.string()
          .required(t('tokenAddressRequiredError', { ns: 'tokenSale' }))
          .test(addressValidationTestSimple),

        // Calculated fields - these are required to exist but don't need user validation
        tokenName: Yup.string().required(t('tokenNameRequiredError', { ns: 'tokenSale' })),
        tokenSymbol: Yup.string().required(t('tokenSymbolRequiredError', { ns: 'tokenSale' })),

        maxTokenSupply: Yup.object().shape({
          value: Yup.string().required(t('maxTokenSupplyRequiredError', { ns: 'tokenSale' })),
          bigintValue: Yup.mixed().required(),
        }),

        saleTokenPrice: Yup.object().shape({
          value: Yup.string().required(t('saleTokenPriceRequiredError', { ns: 'tokenSale' })),
          bigintValue: Yup.mixed().required(),
        }),

        // Sale Timing
        startDate: Yup.date()
          .required(t('startDateRequiredError', { ns: 'tokenSale' }))
          .min(new Date(), t('startDateFutureError', { ns: 'tokenSale' })),

        // Sale Pricing & Terms - all required with proper constraints
        valuation: Yup.number()
          .required(t('valuationRequiredError', { ns: 'tokenSale' }))
          .positive(t('valuationPositiveError', { ns: 'tokenSale' }))
          .min(1000, t('valuationMinimumError', { ns: 'tokenSale' })),

        minimumFundraise: Yup.number()
          .required(t('minimumFundraiseRequiredError', { ns: 'tokenSale' }))
          .positive(t('minimumFundraisePositiveError', { ns: 'tokenSale' }))
          .min(1, t('minimumFundraiseMinimumError', { ns: 'tokenSale' })),

        fundraisingCap: Yup.number()
          .required(t('fundraisingCapRequiredError', { ns: 'tokenSale' }))
          .positive(t('fundraisingCapPositiveError', { ns: 'tokenSale' }))
          .min(1, t('fundraisingCapMinimumError', { ns: 'tokenSale' }))
          .test(
            'cap-greater-than-minimum',
            t('fundraisingCapGreaterThanMinimumError', { ns: 'tokenSale' }),
            function (value) {
              const { minimumFundraise } = this.parent;
              return !value || !minimumFundraise || value > minimumFundraise;
            },
          ),

        // Purchase limits - optional but must be positive if provided
        minPurchase: Yup.number()
          .nullable()
          .transform((value, originalValue) => (originalValue === '' ? null : value))
          .positive(t('minPurchasePositiveError', { ns: 'tokenSale' })),

        maxPurchase: Yup.number()
          .nullable()
          .transform((value, originalValue) => (originalValue === '' ? null : value))
          .positive(t('maxPurchasePositiveError', { ns: 'tokenSale' }))
          .test(
            'max-greater-than-min',
            t('maxPurchaseGreaterThanMinError', { ns: 'tokenSale' }),
            function (value) {
              const { minPurchase } = this.parent;
              return !value || !minPurchase || value > minPurchase;
            },
          ),

        // Calculated BigIntValuePair fields - required for contract interaction
        minimumCommitment: Yup.object().shape({
          value: Yup.string().required(),
          bigintValue: Yup.mixed().required(),
        }),

        maximumCommitment: Yup.object().shape({
          value: Yup.string().required(),
          bigintValue: Yup.mixed().required(),
        }),

        minimumTotalCommitment: Yup.object().shape({
          value: Yup.string().required(),
          bigintValue: Yup.mixed().required(),
        }),

        maximumTotalCommitment: Yup.object().shape({
          value: Yup.string().required(),
          bigintValue: Yup.mixed().required(),
        }),

        // Address fields - will be set programmatically but must exist
        commitmentToken: Yup.string().nullable(),
        verifier: Yup.string().nullable(),
        saleProceedsReceiver: Yup.string().nullable(),
        protocolFeeReceiver: Yup.string().nullable(),
        saleTokenHolder: Yup.string().nullable(),

        // Protocol fees - calculated fields
        commitmentTokenProtocolFee: Yup.object().shape({
          value: Yup.string().required(),
          bigintValue: Yup.mixed().required(),
        }),

        saleTokenProtocolFee: Yup.object().shape({
          value: Yup.string().required(),
          bigintValue: Yup.mixed().required(),
        }),

        // Buyer Requirements - optional array
        buyerRequirements: Yup.array().of(
          Yup.object().shape({
            type: Yup.string().oneOf(['token', 'nft', 'whitelist']),
            // Additional validation for buyer requirements can be added here
          }),
        ),

        // End date - optional but must be after start date if provided
        endDate: Yup.date()
          .nullable()
          .test(
            'end-after-start',
            t('endDateAfterStartError', { ns: 'tokenSale' }),
            function (value) {
              const { startDate } = this.parent;
              return !value || !startDate || value > startDate;
            },
          ),
      }),
    [t, addressValidationTestSimple],
  );

  return { tokenSaleValidationSchema };
};
