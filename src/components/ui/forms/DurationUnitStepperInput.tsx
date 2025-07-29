import {
  InputGroup,
  Button,
  HStack,
  InputRightElement,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  Select,
} from '@chakra-ui/react';
import { Plus, Minus } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SECONDS_IN_DAY,
  SECONDS_IN_HOUR,
  SECONDS_IN_MINUTE,
  SECONDS_IN_YEAR,
} from '../../ProposalBuilder/constants';

interface DurationUnits {
  unit: number;
  label: string;
}

export default function DurationUnitStepperInput({
  secondsValue,
  onSecondsValueChange,
  minSeconds = 0,
  color = 'color-white',
  hideSteppers = false,
  placeholder = '0',
}: {
  secondsValue: number | undefined;
  onSecondsValueChange: (val: number | undefined) => void;
  minSeconds?: number;
  color?: string;
  hideSteppers?: boolean;
  placeholder?: string;
}) {
  const { t } = useTranslation('common');

  const units: DurationUnits[] = [
    {
      unit: SECONDS_IN_DAY,
      label: t('days', { ns: 'common' }),
    },
    {
      unit: SECONDS_IN_HOUR,
      label: t('hours', { ns: 'common' }),
    },
    {
      unit: SECONDS_IN_MINUTE,
      label: t('minutes', { ns: 'common' }),
    },
    {
      unit: SECONDS_IN_YEAR,
      label: t('years', { ns: 'common' }),
    },
  ];
  const [selectedUnit, setSelectedUnit] = useState(units[2]);

  const stepperButton = (direction: 'inc' | 'dec') => (
    <Button
      variant="secondary"
      borderColor="color-neutral-900"
      p="0.5rem"
      size="md"
    >
      {direction === 'inc' ? <Plus size="1.5rem" /> : <Minus size="1.5rem" />}
    </Button>
  );

  return (
    <NumberInput
      value={secondsValue !== undefined ? secondsValue / selectedUnit.unit : undefined}
      onChange={val => onSecondsValueChange(Number(val) * selectedUnit.unit)}
      min={minSeconds / selectedUnit.unit}
      focusInputOnChange
    >
      <HStack gap="0.25rem">
        {!hideSteppers && <NumberDecrementStepper>{stepperButton('dec')}</NumberDecrementStepper>}
        <InputGroup>
          <NumberInputField
            min={0}
            color={color}
            placeholder={placeholder}
          />
          <InputRightElement
            color="color-neutral-700"
            width="auto"
            borderLeft="1px solid"
            borderLeftColor="white-alpha-16"
          >
            <Select
              bgColor="color-black"
              borderColor="color-neutral-900"
              rounded="lg"
              cursor="pointer"
              border="none"
              sx={{
                _focusVisible: {
                  boxShadow: 'none',
                },
              }}
              onChange={e => {
                const unit = units.find(u => u.label === e.target.value);
                if (unit) {
                  // Calculate ceiling value when changing to bigger unit
                  //   , to avoid long decimals.
                  if (secondsValue && unit.unit > selectedUnit.unit) {
                    const ceil = Math.ceil(secondsValue / unit.unit);
                    onSecondsValueChange(ceil * unit.unit);
                  }
                  setSelectedUnit(unit);
                }
              }}
              value={selectedUnit.label}
            >
              {units.map((u, i) => (
                <option
                  key={i}
                  value={u.label}
                >
                  {u.label}
                </option>
              ))}
            </Select>
          </InputRightElement>
        </InputGroup>
        {!hideSteppers && <NumberIncrementStepper>{stepperButton('inc')}</NumberIncrementStepper>}
      </HStack>
    </NumberInput>
  );
}
