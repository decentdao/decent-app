import { Box, Button, CloseButton, Flex, Text } from '@chakra-ui/react';
import { FormikContextType } from 'formik';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePaymasterDepositInfo } from '../../../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { formatCoinUnits } from '../../../../utils/numberFormats';
import { BigIntInput } from '../../forms/BigIntInput';
import { AddressInput } from '../../forms/EthAddressInput';
import LabelWrapper from '../../forms/LabelWrapper';
import { AssetSelector } from '../../utils/AssetSelector';
import { SafeSettingsEdits, SafeSettingsFormikErrors } from '../SafeSettingsModal';

export function WithdrawGasTankModal({
  close,
  formikContext,
}: {
  close: () => void;
  formikContext: FormikContextType<SafeSettingsEdits>;
}) {
  console.log('withdraw modals');
  const { depositInfo } = usePaymasterDepositInfo();

  const { t } = useTranslation('gaslessVoting');

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  const { values, setFieldValue } = formikContext;
  const { errors } = formikContext;

  const paymasterGasTankErrors = (errors as SafeSettingsFormikErrors).paymasterGasTank;
  console.log({ paymasterGasTankErrors });

  useEffect(() => {
    // clear the form when there are no values or if they match the existing values
    if (
      !values.paymasterGasTank?.withdraw?.amount &&
      !values.paymasterGasTank?.withdraw?.recipientAddress
    ) {
      setFieldValue('paymasterGasTank.withdraw', undefined);
    }
  }, [setFieldValue, values]);

  const inputBigint = values.paymasterGasTank?.withdraw?.amount?.bigintValue;
  const inputBigintIsZero = inputBigint !== undefined ? inputBigint === 0n : undefined;
  const isSubmitDisabled =
    !values.paymasterGasTank?.withdraw?.amount ||
    inputBigintIsZero ||
    paymasterGasTankErrors?.withdraw?.amount !== undefined;

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
          <LabelWrapper>
            <BigIntInput
              value={values.paymasterGasTank?.withdraw?.amount?.bigintValue}
              onChange={value => {
                console.log({ value: value });
                setFieldValue('paymasterGasTank.withdraw.amount', value.value ? value : undefined);
              }}
              parentFormikValue={values.paymasterGasTank?.withdraw?.amount}
              placeholder="0"
              isInvalid={paymasterGasTankErrors?.withdraw?.amount !== undefined}
              errorBorderColor="color-error-500"
            />
          </LabelWrapper>

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
              color={
                paymasterGasTankErrors?.withdraw?.amount !== undefined
                  ? 'color-error-500'
                  : 'color-neutral-300'
              }
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
        <LabelWrapper errorMessage={paymasterGasTankErrors?.withdraw?.recipientAddress}>
          <AddressInput
            value={values.paymasterGasTank?.withdraw?.recipientAddress}
            onChange={e => {
              setFieldValue('paymasterGasTank.withdraw.recipientAddress', e.target.value);
            }}
            isInvalid={
              values.paymasterGasTank?.withdraw?.recipientAddress !== undefined &&
              paymasterGasTankErrors?.withdraw?.recipientAddress !== undefined
            }
          />
        </LabelWrapper>
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
          onClick={() => {
            setFieldValue('paymasterGasTank.withdraw', undefined);
            close();
          }}
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
