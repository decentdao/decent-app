import { Box, Button, CloseButton, Flex, Text } from '@chakra-ui/react';
import { Field, FieldAttributes, FieldProps, Form, Formik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, getAddress } from 'viem';
import * as Yup from 'yup';
import { usePaymasterDepositInfo } from '../../../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import { useValidationAddress } from '../../../../hooks/schemas/common/useValidationAddress';
import { BigIntValuePair } from '../../../../types';
import { formatCoinUnits } from '../../../../utils/numberFormats';
import { BigIntInput } from '../../forms/BigIntInput';
import { AddressInput } from '../../forms/EthAddressInput';
import LabelWrapper from '../../forms/LabelWrapper';
import { AssetSelector } from '../../utils/AssetSelector';

interface WithdrawGasFormValues {
  inputAmount?: BigIntValuePair;
  recipientAddress?: Address;
}

export interface WithdrawGasData {
  withdrawAmount: bigint;
  recipientAddress: Address;
}

export function WithdrawGasTankModal({
  close,
  withdrawGasData,
}: {
  close: () => void;
  withdrawGasData: (withdrawGasData: WithdrawGasData) => void;
}) {
  const { depositInfo } = usePaymasterDepositInfo();

  const { t } = useTranslation('gaslessVoting');

  const { isValidating, validateAddress } = useValidationAddress();
  const [recipientAddress, setRecipientAddress] = useState<Address | undefined>(undefined);

  const withdrawGasValidationSchema = Yup.object().shape({
    inputAmount: Yup.object()
      .shape({
        value: Yup.string().required(),
      })
      .required(),
    recipientAddress: Yup.string()
      .required(t('recipientAddressRequired'))
      .test(
        'is-valid-address',
        t('errorInvalidAddress', { ns: 'common' }),
        async (address: string | undefined) => {
          if (!address) return false;

          try {
            const { validation } = await validateAddress({ address });
            setRecipientAddress(getAddress(validation.address));
            return validation.isValidAddress;
          } catch (error) {
            return false;
          }
        },
      ),
  });

  const handleWithdrawGasSubmit = async (values: WithdrawGasFormValues) => {
    if (!recipientAddress) {
      return;
    }

    withdrawGasData({
      withdrawAmount: values.inputAmount?.bigintValue || 0n,
      recipientAddress,
    });

    close();
  };

  return (
    <Box>
      <Formik<WithdrawGasFormValues>
        initialValues={{ inputAmount: undefined, recipientAddress: undefined }}
        onSubmit={handleWithdrawGasSubmit}
        validationSchema={withdrawGasValidationSchema}
      >
        {({ errors, values, setFieldValue, handleSubmit }) => {
          const overDraft =
            Number(values.inputAmount?.value || '0') > formatCoinUnits(depositInfo?.balance ?? 0n);

          const inputBigint = values.inputAmount?.bigintValue;
          const inputBigintIsZero = inputBigint !== undefined ? inputBigint === 0n : undefined;
          const isSubmitDisabled = !values.inputAmount || inputBigintIsZero || overDraft;

          return (
            <Form onSubmit={handleSubmit}>
              <Flex
                justify="space-between"
                align="center"
              >
                <Text textStyle="heading-small">{t('withdrawGas')}</Text>
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
                  {t('withdrawAmount')}
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
                          placeholder="0"
                          maxValue={depositInfo?.balance ?? 0n}
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
                        balance: formatCoinUnits(depositInfo?.balance ?? 0n),
                      })} `}
                      Available
                    </Text>
                  </Flex>
                </Flex>

                <Text
                  textStyle="labels-large"
                  color="neutral-7"
                >
                  {t('withdrawAmount')}
                </Text>
                <Field name="recipientAddress">
                  {({ field }: FieldAttributes<FieldProps<string | undefined>>) => (
                    <LabelWrapper errorMessage={errors.recipientAddress}>
                      <AddressInput
                        {...field}
                        isInvalid={!!errors.recipientAddress}
                      />
                    </LabelWrapper>
                  )}
                </Field>
                <Box h="0.25rem" />
              </Flex>

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
                  isDisabled={
                    isValidating ||
                    !!errors.inputAmount ||
                    !!errors.recipientAddress ||
                    isSubmitDisabled
                  }
                >
                  {t('submitWithdrawAmount')}
                </Button>
              </Flex>
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
}
