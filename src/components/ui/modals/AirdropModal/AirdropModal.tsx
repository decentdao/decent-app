import { Box, Button, Flex, HStack, IconButton, Text } from '@chakra-ui/react';
import { MinusCircle, Plus } from '@phosphor-icons/react';
import { Field, FieldAttributes, FieldProps, Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { getAddress, isAddress } from 'viem';
import * as Yup from 'yup';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../../../hooks/useNetworkPublicClient';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { AirdropData, AirdropFormValues, BigIntValuePair } from '../../../../types';
import { formatCoinFromAsset } from '../../../../utils';
import { validateENSName } from '../../../../utils/url';
import { AirdropFormAssetSelector } from '../../../ProposalTemplates/AirdropFormAssetSelector';
import NoDataCard from '../../containers/NoDataCard';
import { BigIntInput } from '../../forms/BigIntInput';
import { AddressInput } from '../../forms/EthAddressInput';
import LabelWrapper from '../../forms/LabelWrapper';
import Divider from '../../utils/Divider';
import { DnDFileInput, parseRecipients } from './DnDFileInput';

export function AirdropModal({
  submitButtonText,
  close,
  airdropData,
}: {
  submitButtonText: string;
  close: () => void;
  airdropData: (airdropData: AirdropData) => void;
}) {
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { assetsFungible },
  } = useDAOStore({ daoKey });

  const publicClient = useNetworkPublicClient();
  const { t } = useTranslation(['modals', 'common']);

  const fungibleAssetsWithBalance = assetsFungible.filter(asset => parseFloat(asset.balance) > 0);

  const airdropValidationSchema = Yup.object().shape({
    selectedAsset: Yup.object()
      .shape({
        tokenAddress: Yup.string().required(),
        name: Yup.string().required(),
        symbol: Yup.string().required(),
        decimals: Yup.number().required(),
        balance: Yup.string().required(),
      })
      .required(),
    recipients: Yup.array()
      .of(
        Yup.object()
          .shape({
            address: Yup.string().required(),
            amount: Yup.object()
              .shape({
                value: Yup.string().required(),
              })
              .required(),
          })
          .required(),
      )
      .required(),
  });

  const handleAirdropSubmit = async (values: AirdropFormValues) => {
    airdropData({
      recipients: await Promise.all(
        values.recipients.map(async recipient => {
          let destAddress = recipient.address;
          if (!isAddress(destAddress) && validateENSName(recipient.address) && publicClient) {
            const ensAddress = await publicClient.getEnsAddress({ name: recipient.address });
            if (ensAddress === null) {
              throw new Error('Invalid ENS name');
            }
            destAddress = ensAddress;
          }
          return {
            address: getAddress(destAddress),
            amount: recipient.amount.bigintValue!,
          };
        }),
      ),
      asset: values.selectedAsset,
    });

    close();
  };

  return (
    <Box>
      <Formik<AirdropFormValues>
        initialValues={{
          selectedAsset: fungibleAssetsWithBalance[0],
          recipients: [{ address: '', amount: { bigintValue: 0n, value: '0' } }],
        }}
        onSubmit={handleAirdropSubmit}
        validationSchema={airdropValidationSchema}
      >
        {({ errors, values, setFieldValue, handleSubmit }) => {
          if (!fungibleAssetsWithBalance.length) {
            return (
              <NoDataCard
                emptyText="noAssetsWithBalance"
                emptyTextNotProposer="noAssetsWithBalanceNotProposer"
                translationNameSpace="modals"
              />
            );
          }

          const totalAmount = values.recipients.reduce(
            (acc, recipient) => acc + (recipient.amount.bigintValue || 0n),
            0n,
          );
          const overDraft = totalAmount > BigInt(values.selectedAsset.balance);
          const isSubmitDisabled = !values.recipients || totalAmount === 0n || overDraft;
          const selectedAssetIndex = fungibleAssetsWithBalance.findIndex(
            asset => asset.tokenAddress === values.selectedAsset.tokenAddress,
          );

          const handleAddressInputPaste = (
            e: React.ClipboardEvent,
            index: number,
            currentRecipients: AirdropFormValues['recipients'],
          ) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text');

            if (!pastedText || !pastedText.includes(',')) {
              setFieldValue(
                'recipients',
                currentRecipients.map((r, i) => {
                  if (i === index) {
                    return { ...r, address: pastedText };
                  }
                  return r;
                }),
              );
            }

            parseRecipients(pastedText, values.selectedAsset.decimals)
              .then(newRecipients => {
                if (newRecipients.length > 0) {
                  // Replace the current empty recipient and add the rest
                  const updatedRecipients = [...currentRecipients];

                  // Replace the current recipient with the first new one
                  updatedRecipients[index] = newRecipients[0];

                  // Add the rest of the recipients
                  if (newRecipients.length > 1) {
                    updatedRecipients.push(...newRecipients.slice(1));
                  }

                  setFieldValue('recipients', updatedRecipients);
                }
              })
              .catch(error => {
                console.error('Error processing pasted text:', error);
              });
          };

          return (
            <Form onSubmit={handleSubmit}>
              <Flex>
                {/* ASSET SELECT */}
                <AirdropFormAssetSelector
                  assets={fungibleAssetsWithBalance}
                  selectedAssetIndex={selectedAssetIndex}
                />
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

              {/* CSV INPUT */}
              <DnDFileInput />

              <Divider my="1.5rem" />

              {/* RECIPIENTS INPUTS */}
              <Field name="recipients">
                {({
                  field,
                }: FieldAttributes<FieldProps<{ address: string; amount: BigIntValuePair }[]>>) =>
                  field.value.map((recipient, index) => {
                    return (
                      <Box
                        key={index}
                        display="flex"
                        alignItems="center"
                        gap="1rem"
                        mb="2.5rem"
                      >
                        <LabelWrapper
                          tooltipContent={
                            index === 0 ? <Text>{t('pasteMultipleRecipients')}</Text> : undefined
                          }
                          label={t('recipientsLabel')}
                          subLabel={t('recipientsSublabel')}
                          errorMessage={
                            field.value &&
                            field.value[index].address &&
                            errors.recipients &&
                            errors.recipients[index] &&
                            (errors.recipients[index] as { address: string }).address
                          }
                        >
                          <AddressInput
                            {...field}
                            onChange={e => {
                              setFieldValue(
                                'recipients',
                                field.value.map((r, i) => {
                                  if (i === index) {
                                    return { ...r, address: e.target.value };
                                  }
                                  return r;
                                }),
                              );
                            }}
                            value={recipient.address}
                            onPaste={e => handleAddressInputPaste(e, index, field.value)}
                          />
                        </LabelWrapper>
                        <LabelWrapper
                          label={t('amountLabel')}
                          subLabel={t('airdropAmountSublabel')}
                        >
                          <BigIntInput
                            {...field}
                            value={recipient.amount.bigintValue}
                            onChange={value => {
                              if (value === null) {
                                console.error('Invalid value');
                              }
                              setFieldValue(
                                'recipients',
                                field.value.map((r, i) => {
                                  if (i === index) {
                                    return { ...r, amount: value };
                                  }
                                  return r;
                                }),
                              );
                            }}
                            parentFormikValue={recipient.amount}
                            decimalPlaces={values.selectedAsset.decimals}
                            placeholder="0"
                            maxValue={
                              BigInt(values.selectedAsset.balance) -
                              BigInt(totalAmount) +
                              BigInt(recipient.amount.bigintValue || 0n)
                            }
                            isInvalid={overDraft}
                            errorBorderColor="color-error-500"
                          />
                        </LabelWrapper>
                        {/* Remove parameter button */}
                        {index !== 0 || values.recipients.length !== 1 ? (
                          <IconButton
                            icon={<MinusCircle />}
                            aria-label={t('removeRecipientLabel')}
                            variant="unstyled"
                            onClick={() =>
                              setFieldValue(
                                `recipients`,
                                values.recipients.filter(
                                  (_recipientToRemove, recipientToRemoveIndex) =>
                                    recipientToRemoveIndex !== index,
                                ),
                              )
                            }
                            minWidth="auto"
                            color="color-lilac-100"
                            _disabled={{ opacity: 0.4, cursor: 'default' }}
                            sx={{ '&:disabled:hover': { color: 'inherit', opacity: 0.4 } }}
                          />
                        ) : (
                          <Box h="2.25rem" />
                        )}
                      </Box>
                    );
                  })
                }
              </Field>

              <Box
                mt="3rem"
                w="100%"
              >
                <Button
                  onClick={() =>
                    setFieldValue('recipients', [
                      ...values.recipients,
                      { address: '', amount: { bigintValue: 0n, value: '0' } },
                    ])
                  }
                  leftIcon={<Plus size="1rem" />}
                >
                  {t('addRecipient')}
                </Button>
              </Box>

              <Divider my="1.5rem" />

              <Button
                marginTop="2rem"
                width="100%"
                type="submit"
                isDisabled={!!errors.recipients || !!errors.selectedAsset || isSubmitDisabled}
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
