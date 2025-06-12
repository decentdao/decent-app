import { Box, Button, CloseButton, Flex, Text } from '@chakra-ui/react';
import { Field, FieldAttributes, FieldProps, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { usePaymasterDepositInfo } from '../../../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { BigIntValuePair } from '../../../../types';
import { formatCoinUnits } from '../../../../utils/numberFormats';
import { BigIntInput } from '../../forms/BigIntInput';
import { AddressInput } from '../../forms/EthAddressInput';
import LabelWrapper from '../../forms/LabelWrapper';
import { AssetSelector } from '../../utils/AssetSelector';
import { SafeSettingsEdits, SafeSettingsFormikErrors } from '../SafeSettingsModal';

export function WithdrawGasTankModal({ close }: { close: () => void }) {
  const { depositInfo } = usePaymasterDepositInfo();

  const { t } = useTranslation('gaslessVoting');

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();
  const { errors } = useFormikContext<SafeSettingsFormikErrors>();

  const paymasterGasTankErrors = (errors as SafeSettingsFormikErrors).paymasterGasTank;

  const overDraft =
    Number(values.paymasterGasTank?.withdraw?.amount?.value || '0') >
    formatCoinUnits(depositInfo?.balance ?? 0n);

  const inputBigint = values.paymasterGasTank?.withdraw?.amount?.bigintValue;
  const inputBigintIsZero = inputBigint !== undefined ? inputBigint === 0n : undefined;
  const isSubmitDisabled =
    !values.paymasterGasTank?.withdraw?.amount || inputBigintIsZero || overDraft;

  return (
    <Box>
      <Flex
        justify="space-between"
        align="center"
      >
        <Text textStyle="text-xl-regular">{t('withdrawGas')}</Text>
        <CloseButton onClick={close} />
      </Flex>

      <Flex
        flexDirection="column"
        justify="space-between"
        border="1px solid"
        borderColor="color-neutral-900"
        borderRadius="0.75rem"
        mt={4}
        px={4}
        py={3}
        gap={2}
      >
        <Text
          textStyle="text-sm-medium"
          color="color-neutral-300"
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
                    setFieldValue('paymasterGasTank.withdraw.amount', value);
                  }}
                  parentFormikValue={values.paymasterGasTank?.withdraw?.amount}
                  placeholder="0"
                  isInvalid={overDraft}
                  errorBorderColor="color-error-500"
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
              color={overDraft ? 'color-error-500' : 'color-neutral-300'}
              textStyle="text-xs-medium"
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
          textStyle="text-sm-medium"
          color="color-neutral-300"
        >
          {t('recipientAddress')}
        </Text>
        <Field name="recipientAddress">
          {({ field }: FieldAttributes<FieldProps<string | undefined>>) => (
            <LabelWrapper errorMessage={paymasterGasTankErrors?.withdraw?.recipientAddress}>
              <AddressInput
                {...field}
                isInvalid={!!paymasterGasTankErrors?.withdraw?.recipientAddress}
              />
            </LabelWrapper>
          )}
        </Field>
        <Button
          variant="tertiary"
          size="sm"
          alignSelf="flex-end"
          onClick={() => {
            setFieldValue('recipientAddress', safe?.address);
          }}
        >
          {t('toDaoTreasury')}
        </Button>
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
          onClick={close}
          isDisabled={
            !!paymasterGasTankErrors?.withdraw?.amount ||
            !!paymasterGasTankErrors?.withdraw?.recipientAddress ||
            isSubmitDisabled
          }
        >
          {t('submitWithdrawAmount')}
        </Button>
      </Flex>
    </Box>
  );
}
