import { Box, Button, CloseButton, Flex, Text } from '@chakra-ui/react';
import { FormikContextType } from 'formik';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePaymasterDepositInfo } from '../../../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useValidationAddress } from '../../../../hooks/schemas/common/useValidationAddress';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useSettingsFormStore } from '../../../../store/settings/useSettingsFormStore';
import { formatCoinUnits } from '../../../../utils/numberFormats';
import { BigIntInput } from '../../forms/BigIntInput';
import { AddressInput } from '../../forms/EthAddressInput';
import LabelWrapper from '../../forms/LabelWrapper';
import { AssetSelector } from '../../utils/AssetSelector';
import { SafeSettingsEdits } from '../SafeSettingsModal';

type ValidationErrors = {
  amount?: string;
  recipientAddress?: string;
};

function WithdrawGasTankModalContent({ close }: { close: () => void }) {
  const { depositInfo } = usePaymasterDepositInfo();
  const { t } = useTranslation('gaslessVoting');
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  const { formState, updateFormState } = useSettingsFormStore();
  const values = formState ?? {};
  const [paymasterGasTankErrors, setPaymasterGasTankErrors] = useState<ValidationErrors>({});
  const { addressValidationTest } = useValidationAddress();

  // Clean up withdraw object if both fields are empty
  useEffect(() => {
    if (
      values.paymasterGasTank?.withdraw &&
      !values.paymasterGasTank.withdraw.amount &&
      !values.paymasterGasTank.withdraw.recipientAddress
    ) {
      updateFormState({
        paymasterGasTank: {
          ...values.paymasterGasTank,
          withdraw: undefined,
        },
      });
    }
  }, [values.paymasterGasTank?.withdraw, updateFormState, values.paymasterGasTank]);

  const inputBigint = values.paymasterGasTank?.withdraw?.amount?.bigintValue;
  const inputBigintIsZero = inputBigint !== undefined ? inputBigint === 0n : undefined;
  const isSubmitDisabled =
    !values.paymasterGasTank?.withdraw?.amount ||
    inputBigintIsZero ||
    paymasterGasTankErrors.amount !== undefined ||
    paymasterGasTankErrors.recipientAddress !== undefined;

  const validateAmount = (amount: { bigintValue: bigint; value: string } | undefined) => {
    if (!amount) return;
    if (amount.bigintValue === 0n) return 'Amount must be greater than 0';
    if (amount.bigintValue > (depositInfo?.balance ?? 0n))
      return 'Amount exceeds available balance';
    return;
  };

  const validateRecipientAddress = async (address: string | undefined) => {
    if (!address) return 'Recipient address is required';
    try {
      const isValid = await addressValidationTest.test(address);
      if (!isValid) return 'Invalid address';
      return;
    } catch (error) {
      return 'Invalid address';
    }
  };

  const handleFieldUpdate = async (field: string, value: any) => {
    const [section, subsection, fieldName] = field.split('.');
    updateFormState({
      [section]: {
        ...values[section as keyof SafeSettingsEdits],
        [subsection]: {
          ...(values[section as keyof SafeSettingsEdits] as any)?.[subsection],
          [fieldName]: value,
        },
      },
    } as Partial<SafeSettingsEdits>);

    // Update validation errors
    if (field === 'paymasterGasTank.withdraw.amount') {
      setPaymasterGasTankErrors(prev => ({
        ...prev,
        amount: validateAmount(value),
      }));
    } else if (field === 'paymasterGasTank.withdraw.recipientAddress') {
      const error = await validateRecipientAddress(value);
      setPaymasterGasTankErrors(prev => ({
        ...prev,
        recipientAddress: error,
      }));
    }
  };

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
          <LabelWrapper errorMessage={paymasterGasTankErrors.amount}>
            <BigIntInput
              value={values.paymasterGasTank?.withdraw?.amount?.bigintValue}
              onChange={value => {
                handleFieldUpdate(
                  'paymasterGasTank.withdraw.amount',
                  value.value ? value : undefined,
                );
              }}
              parentFormikValue={values.paymasterGasTank?.withdraw?.amount}
              placeholder="0"
              isInvalid={paymasterGasTankErrors.amount !== undefined}
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
                paymasterGasTankErrors.amount !== undefined
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
        <LabelWrapper errorMessage={paymasterGasTankErrors.recipientAddress}>
          <AddressInput
            value={values.paymasterGasTank?.withdraw?.recipientAddress}
            onChange={e => {
              handleFieldUpdate('paymasterGasTank.withdraw.recipientAddress', e.target.value);
            }}
            isInvalid={
              values.paymasterGasTank?.withdraw?.recipientAddress !== undefined &&
              paymasterGasTankErrors.recipientAddress !== undefined
            }
          />
        </LabelWrapper>
        <Button
          variant="tertiary"
          size="sm"
          alignSelf="flex-end"
          onClick={() => {
            handleFieldUpdate('paymasterGasTank.withdraw.recipientAddress', safe?.address);
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
            handleFieldUpdate('paymasterGasTank.withdraw', undefined);
            close();
          }}
        >
          {t('cancel', { ns: 'common' })}
        </Button>
        <Button
          onClick={close}
          isDisabled={
            paymasterGasTankErrors.amount !== undefined ||
            paymasterGasTankErrors.recipientAddress !== undefined ||
            isSubmitDisabled
          }
        >
          {t('submitWithdrawAmount')}
        </Button>
      </Flex>
    </Box>
  );
}

export function WithdrawGasTankModal({
  close,
}: {
  close: () => void;
  formikContext?: FormikContextType<SafeSettingsEdits>;
}) {
  return <WithdrawGasTankModalContent close={close} />;
}
