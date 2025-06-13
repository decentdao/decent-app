import { Box, Button, Checkbox, CloseButton, Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAccount, useBalance } from 'wagmi';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useSettingsFormStore } from '../../../../store/settings/useSettingsFormStore';
import { formatCoinUnits } from '../../../../utils/numberFormats';
import { BigIntInput } from '../../forms/BigIntInput';
import { CustomNonceInput } from '../../forms/CustomNonceInput';
import LabelWrapper from '../../forms/LabelWrapper';
import { AssetSelector } from '../../utils/AssetSelector';

export function RefillGasTankModal({
  close,
  setFieldValue,
  showNonceInput = false,
}: {
  close: () => void;
  setFieldValue: (field: string, value: any) => void;
  showNonceInput?: boolean;
}) {
  const { t } = useTranslation('gaslessVoting');
  const { address } = useAccount();
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const { chain } = useNetworkConfigStore();
  const { canUserCreateProposal } = useCanUserCreateProposal();

  const { formState, formErrors } = useSettingsFormStore();
  const values = formState?.paymasterGasTank?.deposit ?? {};
  const paymasterGasTankErrors = formErrors?.paymasterGasTank ?? {};

  const isDirectDeposit = values.isDirectDeposit;

  const { data: balance } = useBalance({
    address: isDirectDeposit ? address : safe?.address,
    chainId: chain?.id,
  });

  const overDraft = Number(values.amount?.value || '0') > formatCoinUnits(balance?.value || 0n);

  const inputBigint = values.amount?.bigintValue;
  const inputBigintIsZero = inputBigint !== undefined ? inputBigint === 0n : undefined;

  // Submit button is disabled if:
  // 1. For non-direct deposits, user cannot create proposals
  // 2. No amount has been input
  // 3. Input amount is zero
  // 4. Input amount exceeds available balance
  const isSubmitDisabled =
    (!isDirectDeposit && !canUserCreateProposal) ||
    !values.amount ||
    inputBigintIsZero ||
    overDraft;

  return (
    <Box>
      <Flex
        justify="space-between"
        align="center"
        mb={4}
      >
        <Text textStyle="text-xl-regular">{t('refillTank')}</Text>
        <CloseButton onClick={close} />
      </Flex>

      <Flex
        align="center"
        mb={6}
        gap={2}
      >
        <Checkbox
          isChecked={values.isDirectDeposit}
          onChange={e => {
            setFieldValue('paymasterGasTank.deposit.isDirectDeposit', e.target.checked);
          }}
          borderColor="color-lilac-100"
          iconColor="color-lilac-100"
          sx={{
            '& .chakra-checkbox__control': {
              borderRadius: '0.25rem',
            },
          }}
        >
          {t('directDeposit')}
        </Checkbox>
      </Flex>

      <Flex
        flexDirection="row"
        justify="space-between"
        border="1px solid"
        borderColor="color-neutral-900"
        borderRadius="0.75rem"
        px={4}
        py={3}
        gap={2}
      >
        <LabelWrapper
          label={t(isDirectDeposit ? 'sendingHintDirectDeposit' : 'sendingHint')}
          labelColor="color-neutral-300"
          errorMessage={paymasterGasTankErrors.deposit?.amount}
        >
          <BigIntInput
            value={values.amount?.bigintValue}
            onChange={value => {
              setFieldValue('paymasterGasTank.deposit.amount', value);
            }}
            parentFormikValue={values.amount}
            decimalPlaces={balance?.decimals || 0}
            placeholder="0"
            maxValue={!isDirectDeposit ? balance?.value || 0n : undefined}
            isInvalid={overDraft || paymasterGasTankErrors.deposit?.amount !== undefined}
            errorBorderColor="color-error-500"
            autoFocus
          />
        </LabelWrapper>

        <Flex
          flexDirection="column"
          alignItems="flex-end"
          gap={2}
          mt={6}
        >
          <AssetSelector
            onlyNativeToken
            disabled
          />
          <Text
            textStyle="text-xs-medium"
            color={
              paymasterGasTankErrors.deposit?.amount !== undefined
                ? 'color-error-500'
                : 'color-neutral-300'
            }
          >
            {t('balance', {
              balance: formatCoinUnits(balance?.value || 0n).toFixed(2),
            })}
          </Text>
        </Flex>
      </Flex>

      <Flex
        mt={4}
        justify="flex-end"
        gap={2}
      >
        <Button
          variant="secondary"
          onClick={close}
        >
          {t('cancel', { ns: 'common' })}
        </Button>
        <Button
          isDisabled={isSubmitDisabled}
          onClick={close}
        >
          {t(isDirectDeposit ? 'depositGas' : 'addGas')}
        </Button>
      </Flex>

      {showNonceInput && !isDirectDeposit && (
        <CustomNonceInput
          nonce={safe?.nextNonce}
          onChange={nonce =>
            setFieldValue('paymasterGasTank.deposit.nonce', nonce ? parseInt(nonce) : undefined)
          }
        />
      )}
    </Box>
  );
}
