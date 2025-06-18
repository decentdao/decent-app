import { useMemo } from 'react';
import * as Yup from 'yup';
import { TokenCreationType, BigIntValuePair } from '../../../types';
import { useValidationAddress } from '../common/useValidationAddress';
import { useDAOCreateTests } from './useDAOCreateTests';

/**
 * Reusable validation schema for ERC20 token configuration
 * Can be used independently without the full DAO creation form
 */
export const useERC20TokenSchema = () => {
  const { addressValidationTestSimple } = useValidationAddress();
  const {
    maxAllocationValidation,
    allocationValidationTest,
    uniqueAllocationValidationTest,
    validERC20Address,
  } = useDAOCreateTests();

  const erc20TokenShape = useMemo(
    () =>
      Yup.object().shape({
        tokenName: Yup.string().when('tokenCreationType', {
          is: (value: TokenCreationType) => !!value && value === TokenCreationType.NEW,
          then: __schema => __schema.required(),
        }),
        tokenSymbol: Yup.string().when('tokenCreationType', {
          is: (value: TokenCreationType) => !!value && value === TokenCreationType.NEW,
          then: __schema => __schema.required(),
        }),
        tokenSupply: Yup.object().shape({
          value: Yup.string().when('tokenCreationType', {
            is: (value: TokenCreationType) => !!value && value === TokenCreationType.NEW,
            then: __schema => __schema.required(),
          }),
        }),
        locked: Yup.string().when('tokenCreationType', {
          is: (value: TokenCreationType) => !!value && value === TokenCreationType.NEW,
          then: __schema => __schema.required(),
        }),
        tokenImportAddress: Yup.string().when('tokenCreationType', {
          is: (value: TokenCreationType) => !!value && value === TokenCreationType.IMPORTED,
          then: __schema => __schema.test(addressValidationTestSimple).test(validERC20Address),
        }),
        parentAllocationAmount: Yup.object().when({
          is: (value: BigIntValuePair) => !!value.value,
          then: schema =>
            schema.shape({
              value: Yup.string().test(maxAllocationValidation),
            }),
        }),
        tokenAllocations: Yup.array().when('tokenCreationType', {
          is: (value: TokenCreationType) => !!value && value === TokenCreationType.NEW,
          then: __schema =>
            __schema.min(1).of(
              Yup.object().shape({
                address: Yup.string()
                  .test(allocationValidationTest)
                  .test(uniqueAllocationValidationTest),
                amount: Yup.object()
                  .required()
                  .shape({
                    value: Yup.string().test(maxAllocationValidation),
                  }),
              }),
            ),
        }),
      }),
    [
      addressValidationTestSimple,
      validERC20Address,
      maxAllocationValidation,
      allocationValidationTest,
      uniqueAllocationValidationTest,
    ],
  );

  const erc20TokenValidation = useMemo(
    () =>
      Yup.object().shape({
        erc20Token: erc20TokenShape,
      }),
    [erc20TokenShape],
  );

  return { erc20TokenValidation, erc20TokenShape };
};
