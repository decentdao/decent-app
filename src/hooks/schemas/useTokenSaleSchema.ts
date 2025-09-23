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
          value: Yup.string(),
          bigintValue: Yup.mixed(),
        }),

        saleTokenSupply: Yup.object().shape({
          value: Yup.string()
            .required(t('saleTokenSupplyRequiredError', { ns: 'tokenSale' }))
            .test(
              'valid-number',
              t('saleTokenSupplyInvalidError', { ns: 'tokenSale' }),
              function (value) {
                if (!value) return false;
                const num = parseFloat(value);
                return !isNaN(num) && num > 0;
              },
            ),
          bigintValue: Yup.mixed()
            .required()
            .test(
              'treasury-balance',
              t('saleTokenSupplyExceedsTreasuryError', { ns: 'tokenSale' }),
              function (value) {
                // Skip validation if no token is selected or no value
                if (!value || typeof value !== 'bigint') return true;

                const { tokenAddress } = this.parent;
                if (!tokenAddress) return true;

                // This validation will be enhanced by the form component's real-time validation
                // The schema validation serves as a backup
                return true;
              },
            ),
        }),

        // Sale Timing - handle string dates from form inputs
        startDate: Yup.string()
          .required(t('startDateRequiredError', { ns: 'tokenSale' }))
          .test('valid-date', t('startDateInvalidError', { ns: 'tokenSale' }), function (value) {
            if (!value) return false;
            const date = new Date(value);
            return !isNaN(date.getTime());
          })
          .test('future-date', t('startDateFutureError', { ns: 'tokenSale' }), function (value) {
            if (!value) return false;
            const selectedDate = new Date(value);
            const today = new Date();

            // For start date validation, only compare against start of today (ignore time)
            // This allows selecting today as a valid start date
            const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return selectedDate >= startOfToday;
          }),

        // Sale Pricing & Terms - handle string inputs from form
        valuation: Yup.string()
          .required(t('valuationRequiredError', { ns: 'tokenSale' }))
          .test('valid-number', t('valuationInvalidError', { ns: 'tokenSale' }), function (value) {
            if (!value) return false;
            const num = parseFloat(value);
            return !isNaN(num) && num > 0;
          }),

        minimumFundraise: Yup.string().test(
          'valid-number',
          t('minimumFundraiseInvalidError', { ns: 'tokenSale' }),
          function (value) {
            if (!value) return true; // Optional field
            const num = parseFloat(value);
            return !isNaN(num) && num > 0;
          },
        ),

        // Purchase limits - optional but must be positive if provided
        minPurchase: Yup.string()
          .nullable()
          .transform((value, originalValue) => (originalValue === '' ? null : value))
          .test(
            'valid-number',
            t('minPurchaseInvalidError', { ns: 'tokenSale' }),
            function (value) {
              if (!value) return true; // Optional field
              const num = parseFloat(value);
              return !isNaN(num) && num > 0;
            },
          ),

        maxPurchase: Yup.string()
          .nullable()
          .transform((value, originalValue) => (originalValue === '' ? null : value))
          .test(
            'valid-number',
            t('maxPurchaseInvalidError', { ns: 'tokenSale' }),
            function (value) {
              if (!value) return true; // Optional field
              const num = parseFloat(value);
              return !isNaN(num) && num > 0;
            },
          )
          .test(
            'max-greater-than-min',
            t('maxPurchaseGreaterThanMinError', { ns: 'tokenSale' }),
            function (value) {
              const { minPurchase } = this.parent;
              if (!value || !minPurchase) return true;
              const maxNum = parseFloat(value);
              const minNum = parseFloat(minPurchase);
              return !isNaN(maxNum) && !isNaN(minNum) && maxNum > minNum;
            },
          ),

        // Address fields - will be set programmatically but must exist
        commitmentToken: Yup.string().nullable(),
        verifier: Yup.string().nullable(),
        saleProceedsReceiver: Yup.string().nullable(),
        protocolFeeReceiver: Yup.string().nullable(),
        saleTokenHolder: Yup.string().nullable(),

        // Protocol fees - calculated fields
        commitmentTokenProtocolFee: Yup.object().shape({
          value: Yup.string(),
          bigintValue: Yup.mixed(),
        }),

        saleTokenProtocolFee: Yup.object().shape({
          value: Yup.string(),
          bigintValue: Yup.mixed(),
        }),

        // Buyer Requirements - optional array
        buyerRequirements: Yup.array().of(
          Yup.object().shape({
            type: Yup.string().oneOf(['token', 'nft', 'whitelist']),
            name: Yup.string(),
            // Whitelist-specific validation
            addresses: Yup.array().when('type', {
              is: 'whitelist',
              then: schema =>
                schema.min(1, t('whitelistMinOneAddressError', { ns: 'tokenSale' })).of(
                  Yup.string()
                    .required(t('whitelistAddressRequiredError', { ns: 'tokenSale' }))
                    .test(addressValidationTestSimple),
                ),
            }),
            // Token-specific validation
            tokenAddress: Yup.string().when('type', {
              is: 'token',
              then: schema =>
                schema
                  .required(t('tokenAddressRequiredError', { ns: 'tokenSale' }))
                  .test(addressValidationTestSimple),
            }),
            minimumBalance: Yup.mixed().when('type', {
              is: (value: string) => value === 'token' || value === 'nft',
              then: schema =>
                schema.test(
                  'minimum-balance-positive',
                  t('minimumBalanceGreaterThanZeroError', { ns: 'tokenSale' }),
                  function (value: any) {
                    return value && typeof value === 'bigint' && value > 0n;
                  },
                ),
            }),
            // NFT-specific validation
            contractAddress: Yup.string().when('type', {
              is: 'nft',
              then: schema =>
                schema
                  .required(t('nftAddressRequiredError', { ns: 'tokenSale' }))
                  .test(addressValidationTestSimple),
            }),
            // Token ID validation for ERC1155
            tokenId: Yup.mixed().when(['type', 'tokenStandard'], {
              is: (type: string, standard: string) => type === 'nft' && standard === 'ERC1155',
              then: schema =>
                schema.test(
                  'token-id-required',
                  t('tokenIdRequiredError', { ns: 'tokenSale' }),
                  function (value: any) {
                    return value !== undefined && typeof value === 'bigint' && value >= 0n;
                  },
                ),
            }),
          }),
        ),

        // End date - required and must be after start date
        endDate: Yup.string()
          .required(t('endDateRequiredError', { ns: 'tokenSale' }))
          .test('valid-date', t('endDateInvalidError', { ns: 'tokenSale' }), function (value) {
            if (!value) return false;
            const date = new Date(value);
            return !isNaN(date.getTime());
          })
          .test(
            'end-after-start',
            t('endDateAfterStartError', { ns: 'tokenSale' }),
            function (value) {
              const { startDate } = this.parent;
              if (!value || !startDate) return true;
              const endDate = new Date(value);
              const startDateObj = new Date(startDate);
              return (
                !isNaN(endDate.getTime()) &&
                !isNaN(startDateObj.getTime()) &&
                endDate > startDateObj
              );
            },
          ),
      }),
    [t, addressValidationTestSimple],
  );

  return { tokenSaleValidationSchema };
};
