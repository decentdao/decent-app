import { Box, Flex, FormControl, Icon, Image, Text } from '@chakra-ui/react';
import { CheckCircle } from '@phosphor-icons/react';
import {
  Field,
  FieldInputProps,
  FieldMetaProps,
  FormikErrors,
  FormikProps,
  useFormikContext,
} from 'formik';
import { useTranslation } from 'react-i18next';
import { getAddress } from 'viem';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import useLockedToken from '../../../hooks/DAO/useLockedToken';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { BigIntValuePair } from '../../../types';
import { RoleFormValues } from '../../../types/roles';
import { formatCoin, formatUSD } from '../../../utils';
import { BigIntInput } from '../../ui/forms/BigIntInput';
import LabelWrapper from '../../ui/forms/LabelWrapper';
import { DropdownMenu } from '../../ui/menus/DropdownMenu';

export function AssetSelector({ formIndex, disabled }: { formIndex: number; disabled?: boolean }) {
  const { t } = useTranslation(['roles', 'treasury', 'modals']);
  const { values, setFieldValue } = useFormikContext<RoleFormValues>();
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { assetsFungible },
  } = useDAOStore({ daoKey });
  const {
    contracts: { sablierV2Batch, sablierV2LockupTranched },
  } = useNetworkConfigStore();
  const selectedAsset = values.roleEditing?.payments?.[formIndex]?.asset;
  const { tokenState: tokenStateOfBatch } = useLockedToken(
    selectedAsset?.address
      ? {
          token: selectedAsset.address,
          account: sablierV2Batch,
        }
      : undefined,
  );
  const { tokenState: tokenStateOfTranched } = useLockedToken(
    selectedAsset?.address
      ? {
          token: selectedAsset.address,
          account: sablierV2LockupTranched,
        }
      : undefined,
  );
  const tokenCanTransfer = tokenStateOfBatch.canTransfer && tokenStateOfTranched.canTransfer;

  const fungibleAssetsWithBalance = assetsFungible.filter(
    asset => parseFloat(asset.balance) > 0 && !asset.nativeToken,
  );

  const dropdownItems = fungibleAssetsWithBalance.map(asset => ({
    value: asset.tokenAddress,
    label: asset.symbol,
    icon: asset.logo ?? asset.thumbnail ?? '/images/coin-icon-default.svg',
    selected: selectedAsset?.address === asset.tokenAddress,
    assetData: {
      name: asset.name,
      balance: asset.balance,
      decimals: asset.decimals,
      usdValue: asset.usdValue,
      symbol: asset.symbol,
    },
  }));

  return (
    <>
      <FormControl
        my="0.5rem"
        isDisabled={disabled}
      >
        <Field name={`roleEditing.payments.${formIndex}.asset`}>
          {() => (
            <DropdownMenu<{
              assetData: {
                name: string;
                balance: string;
                decimals: number;
                usdValue?: number;
                symbol: string;
              };
            }>
              items={dropdownItems}
              selectedItem={dropdownItems.find(item => item.selected)}
              onSelect={item => {
                const chosenAsset = fungibleAssetsWithBalance.find(
                  asset => asset.tokenAddress === getAddress(item.value),
                );
                if (chosenAsset) {
                  setFieldValue(`roleEditing.payments.${formIndex}.asset`, {
                    ...chosenAsset,
                    logo: chosenAsset.logo ?? '',
                    address: chosenAsset.tokenAddress,
                  });
                } else {
                  setFieldValue(`roleEditing.payments.${formIndex}.asset`, undefined);
                }
              }}
              title={t('titleAssets', { ns: 'treasury' })}
              isDisabled={disabled}
              selectPlaceholder={t('selectLabel', { ns: 'modals' })}
              emptyMessage={t('emptyRolesAssets', { ns: 'roles' })}
              renderItem={(item, isSelected) => {
                const { balance, decimals, usdValue, symbol } = item.assetData;
                const balanceText = formatCoin(balance, true, decimals, symbol, true);

                return (
                  <>
                    <Flex
                      alignItems="center"
                      gap="1rem"
                    >
                      <Image
                        src={item.icon}
                        fallbackSrc="/images/coin-icon-default.svg"
                        boxSize="2rem"
                      />
                      <Flex flexDir="column">
                        <Text
                          textStyle="text-sm-medium"
                          color="color-white"
                        >
                          {item.label}
                        </Text>
                        <Flex
                          alignItems="center"
                          gap={2}
                        >
                          <Text
                            textStyle="text-lg-regular"
                            color="color-neutral-300"
                          >
                            {balanceText}
                          </Text>
                          {usdValue && (
                            <>
                              <Text
                                textStyle="text-lg-regular"
                                color="color-neutral-300"
                              >
                                {'•'}
                              </Text>
                              <Text
                                textStyle="text-lg-regular"
                                color="color-neutral-300"
                              >
                                {formatUSD(usdValue)}
                              </Text>
                            </>
                          )}
                        </Flex>
                      </Flex>
                    </Flex>
                    {isSelected && (
                      <Icon
                        as={CheckCircle}
                        boxSize="1.5rem"
                        color="color-lilac-100"
                      />
                    )}
                  </>
                );
              }}
            />
          )}
        </Field>
        {!tokenCanTransfer && (
          <Box
            textStyle="text-sm-medium"
            color="color-neutral-300"
            mt="2"
            h="0.5rem"
          >
            <Flex gap="0.25rem">
              <Image src="/images/input-error.svg" />
              <Text
                color="color-error-500"
                mt="0.2rem"
                mb="0.25rem"
              >
                {t('streamIsNotTransferable', { ns: 'proposal' })}
              </Text>
            </Flex>
          </Box>
        )}
      </FormControl>
      <FormControl
        my="1rem"
        isDisabled={disabled}
      >
        <Field name={`roleEditing.payments.${formIndex}.amount`}>
          {({
            field,
            meta,
            form: { setFieldTouched },
          }: {
            field: FieldInputProps<BigIntValuePair>;
            meta: FieldMetaProps<BigIntValuePair>;
            form: FormikProps<RoleFormValues>;
          }) => {
            const paymentAmountBigIntError = meta.error as FormikErrors<BigIntValuePair>;
            const paymentAmountBigIntTouched = meta.touched;
            const inputDisabled = !values?.roleEditing?.payments?.[formIndex]?.asset || disabled;

            return (
              <LabelWrapper
                label={t('totalAmount')}
                labelColor="color-neutral-300"
                errorMessage={
                  paymentAmountBigIntTouched && paymentAmountBigIntError?.bigintValue
                    ? paymentAmountBigIntError.bigintValue
                    : undefined
                }
              >
                <BigIntInput
                  isDisabled={inputDisabled}
                  value={field.value?.bigintValue}
                  parentFormikValue={values?.roleEditing?.payments?.[formIndex]?.amount}
                  onChange={valuePair => {
                    setFieldValue(`roleEditing.payments.${formIndex}.amount`, valuePair, true);
                  }}
                  decimalPlaces={selectedAsset?.decimals}
                  onBlur={() => {
                    setFieldTouched(`roleEditing.payments.${formIndex}.amount`, true);
                  }}
                  cursor={inputDisabled ? 'not-allowed' : 'pointer'}
                  placeholder="0"
                />
              </LabelWrapper>
            );
          }}
        </Field>
      </FormControl>
    </>
  );
}
