import { Box, Button, Checkbox, CloseButton, Flex, Text } from '@chakra-ui/react';
import { FormikContextType } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useBalance } from 'wagmi';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { formatCoinUnits } from '../../../../utils/numberFormats';
import { BigIntInput } from '../../forms/BigIntInput';
import { CustomNonceInput } from '../../forms/CustomNonceInput';
import LabelWrapper from '../../forms/LabelWrapper';
import { AssetSelector } from '../../utils/AssetSelector';
import { SafeSettingsEdits } from '../SafeSettingsModal';

export interface RefillGasData {
  transferAmount: bigint;
  isDirectDeposit: boolean;
  nonceInput: number | undefined;
}

interface RefillFormProps {
  onClose: () => void;
  showNonceInput?: boolean;
  formikContext: FormikContextType<SafeSettingsEdits>;
}

function RefillForm({ onClose, showNonceInput, formikContext }: RefillFormProps) {
  const { t } = useTranslation('gaslessVoting');
  const { address } = useAccount();
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const [nonceInput, setNonceInput] = useState<number | undefined>(safe?.nextNonce);
  const { chain } = useNetworkConfigStore();

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const { values, setFieldValue } = formikContext;

  const isDirectDeposit = values.paymasterGasTank?.deposit?.isDirectDeposit;

  const { data: balance } = useBalance({
    address: isDirectDeposit ? address : safe?.address,
    chainId: chain?.id,
  });

  const overDraft =
    Number(values.paymasterGasTank?.deposit?.amount?.value || '0') >
    formatCoinUnits(balance?.value || 0n);

  const inputBigint = values.paymasterGasTank?.deposit?.amount?.bigintValue;
  const inputBigintIsZero = inputBigint !== undefined ? inputBigint === 0n : undefined;

  // Submit button is disabled if:
  // 1. For non-direct deposits, user cannot create proposals
  // 2. No amount has been input
  // 3. Input amount is zero
  // 4. Input amount exceeds available balance
  const isSubmitDisabled =
    (!isDirectDeposit && !canUserCreateProposal) ||
    !values.paymasterGasTank?.deposit?.amount ||
    inputBigintIsZero ||
    overDraft;

  return (
    <>
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
        >
          <BigIntInput
            value={values.paymasterGasTank?.deposit?.amount?.bigintValue}
            onChange={value => {
              setFieldValue('paymasterGasTank.deposit.amount', value);
            }}
            parentFormikValue={values.paymasterGasTank?.deposit?.amount}
            decimalPlaces={balance?.decimals || 0}
            placeholder="0"
            maxValue={!isDirectDeposit ? balance?.value || 0n : undefined}
            isInvalid={overDraft}
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
            color="color-neutral-300"
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
          onClick={onClose}
        >
          {t('cancel', { ns: 'common' })}
        </Button>
        <Button
          isDisabled={isSubmitDisabled}
          onClick={onClose}
        >
          {t(isDirectDeposit ? 'depositGas' : 'addGas')}
        </Button>
      </Flex>

      {showNonceInput && !isDirectDeposit && (
        <CustomNonceInput
          nonce={nonceInput}
          onChange={nonce => setNonceInput(nonce ? parseInt(nonce) : undefined)}
        />
      )}
    </>
  );
}

export function RefillGasTankModal({
  close,
  formikContext,
}: {
  close: () => void;
  formikContext: FormikContextType<SafeSettingsEdits>;
}) {
  const { t } = useTranslation('gaslessVoting');

  const { values, setFieldValue } = formikContext;

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
          isChecked={values.paymasterGasTank?.deposit?.isDirectDeposit}
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

      <RefillForm
        showNonceInput={false}
        onClose={close}
        formikContext={formikContext}
      />
    </Box>
  );
}
