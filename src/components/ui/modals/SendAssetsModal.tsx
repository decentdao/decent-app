import { Box, Button, Flex, HStack, Select, Text } from '@chakra-ui/react';
import { CaretDown } from '@phosphor-icons/react';
import { Field, FieldAttributes, FieldProps, Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { getAddress } from 'viem';
import * as Yup from 'yup';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useValidationAddress } from '../../../hooks/schemas/common/useValidationAddress';
import { useNetworkEnsAddressAsync } from '../../../hooks/useNetworkEnsAddress';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { BigIntValuePair, TokenBalance } from '../../../types';
import { SendAssetsData } from '../../../utils/dao/prepareSendAssetsActionData';
import { formatCoinFromAsset, formatCoinUnits } from '../../../utils/numberFormats';
import { validateENSName } from '../../../utils/url';
import NoDataCard from '../containers/NoDataCard';
import { BigIntInput } from '../forms/BigIntInput';
import { AddressInput } from '../forms/EthAddressInput';
import LabelWrapper from '../forms/LabelWrapper';
import Divider from '../utils/Divider';

interface SendAssetsFormValues {
  destinationAddress: string;
  selectedAsset: TokenBalance;
  inputAmount?: BigIntValuePair;
}

export function SendAssetsModal({
  submitButtonText,
  close,
  sendAssetsData,
}: {
  submitButtonText: string;
  close: () => void;
  sendAssetsData: (sendAssetData: SendAssetsData) => void;
}) {
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { assetsFungible },
  } = useDAOStore({ daoKey });

  const { getEnsAddress } = useNetworkEnsAddressAsync();
  const { t } = useTranslation(['modals', 'common']);

  const fungibleAssetsWithBalance = assetsFungible.filter(asset => parseFloat(asset.balance) > 0);

  const { addressValidationTest, isValidating } = useValidationAddress();

  const sendAssetsValidationSchema = Yup.object().shape({
    destinationAddress: Yup.string().test(addressValidationTest),
    selectedAsset: Yup.object()
      .shape({
        tokenAddress: Yup.string().required(),
        name: Yup.string().required(),
        symbol: Yup.string().required(),
        decimals: Yup.number().required(),
        balance: Yup.string().required(),
      })
      .required(),
    inputAmount: Yup.object()
      .shape({
        value: Yup.string().required(),
      })
      .required(),
  });

  const handleSendAssetsSubmit = async (values: SendAssetsFormValues) => {
    let destAddress = values.destinationAddress;
    if (validateENSName(values.destinationAddress)) {
      const ensAddress = await getEnsAddress({ name: values.destinationAddress });
      if (ensAddress === null) {
        throw new Error('Invalid ENS name');
      }
      destAddress = ensAddress;
    }

    sendAssetsData({
      transferAmount: values.inputAmount?.bigintValue || 0n,
      asset: values.selectedAsset,
      recipientAddress: getAddress(destAddress),
    });

    close();
  };

  if (!fungibleAssetsWithBalance.length) {
    return (
      <NoDataCard
        emptyText="noAssetsWithBalance"
        emptyTextNotProposer="noAssetsWithBalanceNotProposer"
        translationNameSpace="modals"
      />
    );
  }

  return (
    <Box>
      <Formik<SendAssetsFormValues>
        initialValues={{
          destinationAddress: '',
          selectedAsset: fungibleAssetsWithBalance[0],
          inputAmount: undefined,
        }}
        onSubmit={handleSendAssetsSubmit}
        validationSchema={sendAssetsValidationSchema}
      >
        {({ errors, values, setFieldValue, handleSubmit }) => {
          const overDraft =
            Number(values.inputAmount?.value || '0') >
            formatCoinUnits(
              values.selectedAsset.balance,
              values.selectedAsset.decimals,
              values.selectedAsset.symbol,
            );

          // @dev next couple of lines are written like this, to keep typing equivalent during the conversion from BN to bigint
          const inputBigint = values.inputAmount?.bigintValue;
          const inputBigintIsZero = inputBigint !== undefined ? inputBigint === 0n : undefined;
          const isSubmitDisabled = !values.inputAmount || inputBigintIsZero || overDraft;

          const selectedAssetIndex = fungibleAssetsWithBalance.findIndex(
            asset => asset.tokenAddress === values.selectedAsset.tokenAddress,
          );

          return (
            <Form onSubmit={handleSubmit}>
              <Flex>
                {/* ASSET SELECT */}
                <Field name="selectedAsset">
                  {({ field }: FieldAttributes<FieldProps<TokenBalance>>) => (
                    <Box
                      width="40%"
                      marginEnd="0.75rem"
                    >
                      <LabelWrapper label={t('selectLabel')}>
                        <Select
                          {...field}
                          bgColor="color-black"
                          borderColor="color-neutral-900"
                          rounded="sm"
                          cursor="pointer"
                          iconSize="1.5rem"
                          icon={<CaretDown />}
                          onChange={e => {
                            // New asset selected. First reset the form input amount
                            setFieldValue('inputAmount', undefined);
                            setFieldValue(
                              'selectedAsset',
                              fungibleAssetsWithBalance[Number(e.target.value)],
                            );
                          }}
                          value={selectedAssetIndex}
                        >
                          {fungibleAssetsWithBalance.map((asset, index) => (
                            <option
                              key={index}
                              value={index}
                            >
                              {asset.symbol}
                            </option>
                          ))}
                        </Select>
                      </LabelWrapper>
                    </Box>
                  )}
                </Field>

                {/* SEND AMOUNT INPUT */}
                <Field name="inputAmount">
                  {({ field }: FieldAttributes<FieldProps<BigIntValuePair | undefined>>) => (
                    <Box width="60%">
                      <LabelWrapper label={t('amountLabel')}>
                        <BigIntInput
                          {...field}
                          value={field.value?.bigintValue}
                          onChange={value => {
                            setFieldValue('inputAmount', value);
                          }}
                          parentFormikValue={values.inputAmount}
                          decimalPlaces={values.selectedAsset.decimals}
                          placeholder="0"
                          maxValue={BigInt(values.selectedAsset.balance)}
                          isInvalid={overDraft}
                          errorBorderColor="color-error-500"
                        />
                      </LabelWrapper>
                    </Box>
                  )}
                </Field>
              </Flex>

              {/* AVAILABLE BALANCE HINT */}
              <HStack
                justify="space-between"
                textStyle="color-neutral-300"
                color="color-white"
                marginTop="0.75rem"
              >
                <Text
                  color={overDraft ? 'color-error-500' : 'color-neutral-300'}
                  textStyle="text-sm-medium"
                  as="span"
                >
                  {t('selectSublabel', {
                    balance: formatCoinFromAsset(values.selectedAsset, false),
                  })}
                </Text>
              </HStack>

              <Divider my="1.5rem" />

              {/* DESTINATION ADDRESS INPUT */}
              <Field name={'destinationAddress'}>
                {({ field }: FieldAttributes<FieldProps<string>>) => (
                  <LabelWrapper
                    label={t('destinationLabel')}
                    subLabel={t('destinationSublabel')}
                    errorMessage={field.value && errors.destinationAddress}
                  >
                    <AddressInput {...field} />
                  </LabelWrapper>
                )}
              </Field>

              <Divider my="1.5rem" />

              <Button
                marginTop="2rem"
                width="100%"
                type="submit"
                isDisabled={
                  isValidating ||
                  !!errors.destinationAddress ||
                  !!errors.selectedAsset ||
                  !!errors.inputAmount ||
                  isSubmitDisabled
                }
              >
                {submitButtonText}
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
}
