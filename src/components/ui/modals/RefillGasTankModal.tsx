import { Box, Button, CloseButton, Flex, Text } from '@chakra-ui/react';
import { Field, FieldAttributes, FieldProps, Form, Formik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBalance } from 'wagmi';
import * as Yup from 'yup';
import { useValidationAddress } from '../../../hooks/schemas/common/useValidationAddress';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { BigIntValuePair } from '../../../types';
import { formatCoinUnits } from '../../../utils/numberFormats';
import { BigIntInput } from '../forms/BigIntInput';
import { CustomNonceInput } from '../forms/CustomNonceInput';
import LabelWrapper from '../forms/LabelWrapper';
import { AssetSelector } from '../utils/AssetSelector';

interface RefillGasFormValues {
  inputAmount?: BigIntValuePair;
}

export interface RefillGasData {
  transferAmount: bigint;
  nonceInput: number | undefined;
}

export function RefillGasTankModal({
  showNonceInput,
  close,
  refillGasData,
}: {
  showNonceInput: boolean;
  close: () => void;
  refillGasData: (refillData: RefillGasData) => void;
}) {
  const { safe } = useDaoInfoStore();
  const { data: nativeTokenBalance } = useBalance({
    address: safe?.address,
  });

  const { t } = useTranslation('gaslessVoting');

  const [nonceInput, setNonceInput] = useState<number | undefined>(safe!.nextNonce);

  const { isValidating } = useValidationAddress();

  const refillGasValidationSchema = Yup.object().shape({
    inputAmount: Yup.object()
      .shape({
        value: Yup.string().required(),
      })
      .required(),
  });

  const handleRefillGasSubmit = async (values: RefillGasFormValues) => {
    refillGasData({
      transferAmount: values.inputAmount?.bigintValue || 0n,
      nonceInput,
    });

    close();
  };

  return (
    <Box>
      <Formik<RefillGasFormValues>
        initialValues={{ inputAmount: undefined }}
        onSubmit={handleRefillGasSubmit}
        validationSchema={refillGasValidationSchema}
      >
        {({ errors, values, setFieldValue, handleSubmit }) => {
          const overDraft =
            Number(values.inputAmount?.value || '0') >
            formatCoinUnits(
              nativeTokenBalance?.value || 0n,
              nativeTokenBalance?.decimals || 0,
              nativeTokenBalance?.symbol || '',
            );

          const inputBigint = values.inputAmount?.bigintValue;
          const inputBigintIsZero = inputBigint !== undefined ? inputBigint === 0n : undefined;
          const isSubmitDisabled = !values.inputAmount || inputBigintIsZero || overDraft;

          return (
            <Form onSubmit={handleSubmit}>
              <Flex
                justify="space-between"
                align="center"
              >
                <Text textStyle="heading-small">{t('refillTank')}</Text>
                <CloseButton onClick={close} />
              </Flex>

              <Flex
                flexDirection="column"
                justify="space-between"
                border="1px solid"
                borderColor="neutral-3"
                borderRadius="0.75rem"
                mt={4}
                px={4}
                py={3}
                gap={2}
              >
                <Text
                  textStyle="labels-large"
                  color="neutral-7"
                >
                  {t('amountLabel')}
                </Text>

                <Flex
                  justify="space-between"
                  align="flex-start"
                >
                  <Field name="inputAmount">
                    {({ field }: FieldAttributes<FieldProps<BigIntValuePair | undefined>>) => (
                      <LabelWrapper>
                        <BigIntInput
                          {...field}
                          value={field.value?.bigintValue}
                          onChange={value => {
                            setFieldValue('inputAmount', value);
                          }}
                          parentFormikValue={values.inputAmount}
                          decimalPlaces={nativeTokenBalance?.decimals || 0}
                          placeholder="0"
                          maxValue={nativeTokenBalance?.value || 0n}
                          isInvalid={overDraft}
                          errorBorderColor="red-0"
                        />
                      </LabelWrapper>
                    )}
                  </Field>

                  <Flex
                    flexDirection="column"
                    alignItems="flex-end"
                    gap="0.5rem"
                    mt="0.25rem"
                  >
                    <AssetSelector
                      onlyNativeToken
                      disabled
                    />
                    <Text
                      color={overDraft ? 'red-0' : 'neutral-7'}
                      textStyle="labels-small"
                      px="0.25rem"
                    >
                      {`${t('availableBalance', {
                        balance: formatCoinUnits(
                          nativeTokenBalance?.value || 0n,
                          nativeTokenBalance?.decimals || 0,
                          nativeTokenBalance?.symbol || '',
                        ),
                      })} `}
                      Available
                    </Text>
                  </Flex>
                </Flex>
              </Flex>

              {showNonceInput && (
                <CustomNonceInput
                  nonce={nonceInput}
                  onChange={nonce => setNonceInput(nonce ? parseInt(nonce) : undefined)}
                />
              )}

              <Flex
                marginTop="2rem"
                justifyContent="flex-end"
                gap={2}
              >
                <Button
                  variant="secondary"
                  onClick={close}
                >
                  {t('cancel', { ns: 'common' })}
                </Button>
                <Button
                  type="submit"
                  isDisabled={isValidating || !!errors.inputAmount || isSubmitDisabled}
                >
                  {t('submitRefillAmount')}
                </Button>
              </Flex>
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
}
