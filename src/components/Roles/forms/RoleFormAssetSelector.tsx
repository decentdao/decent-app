import { Flex, FormControl, Image, Text, Icon } from '@chakra-ui/react';
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
import { useFractal } from '../../../providers/App/AppProvider';
import { BigIntValuePair } from '../../../types';
import { RoleFormValues } from '../../../types/roles';
import { formatCoin, formatUSD } from '../../../utils';
import { BigIntInput } from '../../ui/forms/BigIntInput';
import LabelWrapper from '../../ui/forms/LabelWrapper';
import { DropdownMenu } from '../../ui/menus/DropdownMenu';

export function AssetSelector({ formIndex, disabled }: { formIndex: number; disabled?: boolean }) {
  const { t } = useTranslation(['roles', 'treasury', 'modals']);
  const { values, setFieldValue } = useFormikContext<RoleFormValues>();
  const {
    treasury: { assetsFungible },
  } = useFractal();

  const fungibleAssetsWithBalance = assetsFungible.filter(
    asset => parseFloat(asset.balance) > 0 && !asset.nativeToken,
  );

  const selectedAsset = values.roleEditing?.payments?.[formIndex]?.asset;

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
                          textStyle="labels-large"
                          color="white-0"
                        >
                          {item.label}
                        </Text>
                        <Flex
                          alignItems="center"
                          gap={2}
                        >
                          <Text
                            textStyle="body-large"
                            color="neutral-7"
                          >
                            {balanceText}
                          </Text>
                          {usdValue && (
                            <>
                              <Text
                                textStyle="body-large"
                                color="neutral-7"
                              >
                                {'•'}
                              </Text>
                              <Text
                                textStyle="body-large"
                                color="neutral-7"
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
                        color="lilac-0"
                      />
                    )}
                  </>
                );
              }}
            />
          )}
        </Field>
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
                labelColor="neutral-7"
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
