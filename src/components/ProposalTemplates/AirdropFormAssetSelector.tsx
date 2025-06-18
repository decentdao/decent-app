import { Select } from '@chakra-ui/react';
import { CaretDown } from '@phosphor-icons/react';
import { Field, FieldAttributes, FieldProps, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { parseUnits } from 'viem';
import useLockedToken from '../../hooks/DAO/useLockedToken';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { AirdropFormValues, TokenBalance } from '../../types';
import LabelWrapper from '../ui/forms/LabelWrapper';

export function AirdropFormAssetSelector({
  assets,
  selectedAssetIndex,
}: {
  assets: TokenBalance[];
  selectedAssetIndex: number;
}) {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<AirdropFormValues>();

  const {
    contracts: { disperse },
  } = useNetworkConfigStore();
  const { tokenState } = useLockedToken({
    token: values.selectedAsset.tokenAddress,
    account: disperse,
  });

  return (
    <Field name="selectedAsset">
      {({ field }: FieldAttributes<FieldProps<TokenBalance>>) => (
        <LabelWrapper
          errorMessage={
            tokenState.canTransfer ? undefined : t('streamIsNotTransferable', { ns: 'proposal' })
          }
          label={t('selectLabel', { ns: 'modals' })}
        >
          <Select
            {...field}
            bgColor="color-black"
            borderColor="color-neutral-900"
            rounded="sm"
            cursor="pointer"
            iconSize="1.5rem"
            icon={<CaretDown />}
            onChange={e => {
              const newAsset = assets[Number(e.target.value)];
              setFieldValue('selectedAsset', newAsset);
              const newDecimals = newAsset.decimals;
              setFieldValue(
                'recipients',
                values.recipients.map(r => {
                  return {
                    ...r,
                    amount: {
                      value: r.amount.value,
                      bigintValue: parseUnits(r.amount.value, newDecimals),
                    },
                  };
                }),
              );
            }}
            value={selectedAssetIndex}
          >
            {assets.map((asset, index) => (
              <option
                key={index}
                value={index}
              >
                {asset.symbol}
              </option>
            ))}
          </Select>
        </LabelWrapper>
      )}
    </Field>
  );
}
