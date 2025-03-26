import { Box, Button, CloseButton, Flex, Text, Checkbox } from '@chakra-ui/react';
import { Field, FieldAttributes, FieldProps, Form, Formik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useBalance } from 'wagmi';
import * as Yup from 'yup';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { useDaoInfoStore } from '../../../../store/daoInfo/useDaoInfoStore';
import { BigIntValuePair } from '../../../../types';
import { formatCoinUnits } from '../../../../utils/numberFormats';
import { BigIntInput } from '../../forms/BigIntInput';
import { CustomNonceInput } from '../../forms/CustomNonceInput';
import LabelWrapper from '../../forms/LabelWrapper';
import { AssetSelector } from '../../utils/AssetSelector';

interface RefillGasFormValues {
  inputAmount?: BigIntValuePair;
}

export interface RefillGasData {
  transferAmount: bigint;
  isDirectDeposit: boolean;
  nonceInput: number | undefined;
}

interface RefillFormProps {
  onSubmit: (refillData: RefillGasData) => void;
  onClose: () => void;
  isDirectDeposit: boolean;
  showNonceInput?: boolean;
}

function RefillForm({ onSubmit, onClose, isDirectDeposit, showNonceInput }: RefillFormProps) {
  const { t } = useTranslation('gaslessVoting');
  const { address } = useAccount();
  const { safe } = useDaoInfoStore();
  const [nonceInput, setNonceInput] = useState<number | undefined>(safe?.nextNonce);

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const { data: balance } = useBalance({
    address: isDirectDeposit ? address : safe?.address,
  });

  return (
    <Formik<RefillGasFormValues>
      initialValues={{ inputAmount: undefined }}
      onSubmit={values => {
        onSubmit({
          transferAmount: values.inputAmount?.bigintValue || 0n,
          isDirectDeposit,
          nonceInput: isDirectDeposit ? undefined : nonceInput,
        });
      }}
      validationSchema={Yup.object().shape({
        inputAmount: Yup.object()
          .shape({
            value: Yup.string().required(),
          })
          .required(),
      })}
    >
      {({ values, setFieldValue, handleSubmit }) => {
        const overDraft =
          Number(values.inputAmount?.value || '0') >
          formatCoinUnits(balance?.value || 0n, balance?.decimals || 0, balance?.symbol || '');

        const inputBigint = values.inputAmount?.bigintValue;
        const inputBigintIsZero = inputBigint !== undefined ? inputBigint === 0n : undefined;

        // Submit button is disabled if:
        // 1. For non-direct deposits, user cannot create proposals
        // 2. No amount has been input
        // 3. Input amount is zero
        // 4. Input amount exceeds available balance
        const isSubmitDisabled =
          (!isDirectDeposit && !canUserCreateProposal) ||
          !values.inputAmount ||
          inputBigintIsZero ||
          overDraft;

        return (
          <Form onSubmit={handleSubmit}>
            <Flex
              flexDirection="row"
              justify="space-between"
              border="1px solid"
              borderColor="neutral-3"
              borderRadius="0.75rem"
              px={4}
              py={3}
              gap={2}
            >
              <Field name="inputAmount">
                {({ field }: FieldAttributes<FieldProps<BigIntValuePair | undefined>>) => (
                  <LabelWrapper
                    label={t(isDirectDeposit ? 'sendingHintDirectDeposit' : 'sendingHint')}
                    labelColor="neutral-7"
                  >
                    <BigIntInput
                      {...field}
                      value={field.value?.bigintValue}
                      onChange={value => {
                        setFieldValue('inputAmount', value);
                      }}
                      parentFormikValue={values.inputAmount}
                      decimalPlaces={balance?.decimals || 0}
                      placeholder="0"
                      maxValue={!isDirectDeposit ? balance?.value || 0n : undefined}
                      isInvalid={overDraft}
                      errorBorderColor="red-0"
                      autoFocus
                    />
                  </LabelWrapper>
                )}
              </Field>

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
                  textStyle="labels-small"
                  color="neutral-7"
                >
                  {t('balance', {
                    balance: formatCoinUnits(
                      balance?.value || 0n,
                      balance?.decimals || 0,
                      balance?.symbol || '',
                    ).toFixed(2),
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
                type="submit"
                isDisabled={isSubmitDisabled}
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
          </Form>
        );
      }}
    </Formik>
  );
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
  const { t } = useTranslation('gaslessVoting');
  const [isDirectDeposit, setIsDirectDeposit] = useState(false);

  return (
    <Box>
      <Flex
        justify="space-between"
        align="center"
        mb={4}
      >
        <Text textStyle="heading-small">{t('refillTank')}</Text>
        <CloseButton onClick={close} />
      </Flex>

      <Flex
        align="center"
        mb={6}
        gap={2}
      >
        <Checkbox
          isChecked={isDirectDeposit}
          onChange={e => setIsDirectDeposit(e.target.checked)}
          borderColor="lilac-0"
          iconColor="lilac-0"
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
        isDirectDeposit={isDirectDeposit}
        showNonceInput={showNonceInput}
        onSubmit={refillGasData}
        onClose={close}
      />
    </Box>
  );
}
