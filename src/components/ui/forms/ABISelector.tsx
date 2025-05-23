import { Select, Text } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ABIElement, useABI } from '../../../hooks/utils/useABI';
import { LabelComponent } from './InputComponent';

interface IABISelector {
  /*
   * @param target - target contract address or ENS name
   */
  target?: string;
  onChange: (value: ABIElement) => void;
}

export default function ABISelector({ target, onChange }: IABISelector) {
  const { abi } = useABI(target);
  const { t } = useTranslation('common');

  /*
   * This makes component quite scoped to proposal / proposal template creation
   * but we can easily adopt displayed options based on needs later
   */

  const abiFunctions = useMemo(
    () =>
      abi.filter(
        (abiElement: ABIElement) =>
          abiElement.type === 'function' &&
          abiElement.stateMutability !== 'pure' &&
          abiElement.stateMutability !== 'view',
      ),
    [abi],
  );

  if (!abiFunctions || !abiFunctions.length) {
    return null; // TODO: Show "error state" or "empty state"?
  }

  return (
    <LabelComponent
      label={t('abi')}
      helper={t('abiSelectorHelper')}
      isRequired={false}
    >
      <Select
        placeholder={t('select')}
        variant="outline"
        bg="color-black"
        borderColor="color-neutral-900"
        borderWidth="1px"
        borderRadius="4px"
        color="color-white"
        onChange={e => {
          const selectedFunction = abiFunctions.find(
            (abiFunction: ABIElement) => abiFunction.name === e.target.value,
          );
          if (!selectedFunction) throw new Error('Issue finding selected function');
          onChange(selectedFunction);
        }}
        sx={{ '> option, > optgroup': { bg: 'color-black' } }}
      >
        {abiFunctions.map((abiFunction: ABIElement) => (
          <option key={abiFunction.name}>{abiFunction.name}</option>
        ))}
      </Select>
      <Text
        color="color-neutral-300"
        mt="0.5rem"
      >
        {t('abiSelectorDescription')}
      </Text>
    </LabelComponent>
  );
}
