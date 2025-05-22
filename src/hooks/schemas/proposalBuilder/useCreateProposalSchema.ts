import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useCurrentDAOKey } from '../../DAO/useCurrentDAOKey';
import { useValidationAddress } from '../common/useValidationAddress';

/**
 * validation schema for Create Proposal workflow
 * @dev https://www.npmjs.com/package/yup
 */
const useCreateProposalSchema = () => {
  const { t } = useTranslation('proposal');
  const { addressValidationTest } = useValidationAddress();
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  const labelOrValueValidationTest: Yup.TestFunction<string | undefined, Yup.AnyObject> = (
    _,
    context,
  ) => {
    if (!context.parent.signature) {
      return true;
    }

    if (!!context.parent.label || !!context.parent.value || !!context.parent.valueArray) {
      return true;
    }

    return false;
  };

  const bigintValidationTest: Yup.TestFunction<any, Yup.AnyObject> = value => {
    if (value === undefined || value === null) {
      return true; // Allow undefined or null values if not required
    }
    if (typeof value === 'bigint') {
      return true;
    }
    return false;
  };

  const transactionValidationSchema = useMemo(
    () =>
      Yup.array().of(
        Yup.object().shape({
          targetAddress: Yup.string().test(addressValidationTest),
          ethValue: Yup.object().shape({
            value: Yup.string(),
          }),
          functionName: Yup.string().matches(/^[a-z0-9]+$/i, {
            message: t('functionNameError'),
          }),
          parameters: Yup.array().of(
            Yup.object().shape({
              signature: Yup.string(),
              label: Yup.string().test({
                message: t('labelOrValueRequired'),
                test: labelOrValueValidationTest,
              }),
              value: Yup.string().test({
                message: t('labelOrValueRequired'),
                test: labelOrValueValidationTest,
              }),
              valueArray: Yup.array().of(
                Yup.string().test({
                  message: t('labelOrValueRequired'),
                  test: labelOrValueValidationTest,
                }),
              ),
            }),
          ),
        }),
      ),
    [addressValidationTest, t],
  );

  const createProposalValidation = useMemo(
    () =>
      Yup.object()
        .shape({
          transactions: transactionValidationSchema,
          streams: Yup.array().of(
            Yup.object().shape({
              type: Yup.string().oneOf(['tranched']).required(),
              tokenAddress: Yup.string().test(addressValidationTest).required(),
              recipientAddress: Yup.string().test(addressValidationTest).required(),
              startDate: Yup.date().required(),
              tranches: Yup.array()
                .of(
                  Yup.object().shape({
                    amount: Yup.object()
                      .shape({
                        value: Yup.string().required(),
                        bigintValue: Yup.mixed()
                          .test('bigint', t('invalidBigIntValue'), bigintValidationTest)
                          .notRequired(),
                      })
                      .required(),
                    duration: Yup.object()
                      .shape({
                        value: Yup.string().required(),
                        bigintValue: Yup.mixed()
                          .test('bigint', t('invalidBigIntValue'), bigintValidationTest)
                          .notRequired(),
                      })
                      .required(),
                  }),
                )
                .required(),
              totalAmount: Yup.object()
                .shape({
                  value: Yup.string().required(),
                  bigintValue: Yup.mixed()
                    .test('bigint', t('invalidBigIntValue'), bigintValidationTest)
                    .notRequired(),
                })
                .required(),
              cancelable: Yup.boolean().required(),
              transferable: Yup.boolean().required(),
            }),
          ),
          proposalMetadata: Yup.object().shape({
            title: Yup.string().trim().required().max(50),
            description: Yup.string().trim().notRequired(),
            documentationUrl: Yup.string().trim().notRequired(),
            nonce: Yup.number()
              .required()
              .moreThan((!!safe && safe.nonce - 1) || 0),
          }),
        })
        .test('at-least-one-transactions-or-streams', t('atLeastOneRequired'), value => {
          return !!(
            (value.transactions?.length && value.transactions.length > 0) ||
            (value.streams?.length && value.streams.length > 0)
          );
        }),
    [addressValidationTest, t, safe, transactionValidationSchema],
  );
  return { createProposalValidation, transactionValidationSchema };
};

export default useCreateProposalSchema;
