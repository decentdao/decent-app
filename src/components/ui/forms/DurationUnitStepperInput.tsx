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
import { SEXY_BOX_SHADOW_T_T } from '../../../constants/common';
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

function findBestDefaultUnit(
  units: DurationUnits[],
  secondsValue: number | undefined,
): DurationUnits {
  const sortedUnits = units.sort((a, b) => a.unit - b.unit);
  if (secondsValue !== undefined) {
    // Find the largest unit that divides the value evenly
    const biggestUnit = sortedUnits.findLast(u => secondsValue % u.unit === 0);
    if (biggestUnit) {
      return biggestUnit;
    }
  }
  // otherwise, return the smallest unit
  return sortedUnits[0];
}

export default function DurationUnitStepperInput({
  secondsValue,
  onSecondsValueChange,
  minSeconds = 0,
  color = 'color-white',
  hideSteppers = false,
  placeholder = '0',
  'data-testid': testId,
}: {
  secondsValue: number | undefined;
  onSecondsValueChange: (val: number | undefined) => void;
  minSeconds?: number;
  color?: string;
  hideSteppers?: boolean;
  placeholder?: string;
  'data-testid'?: string;
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
  const [selectedUnit, setSelectedUnit] = useState(findBestDefaultUnit(units, secondsValue));

  const stepperButton = (direction: 'inc' | 'dec') => (
    <Button
      variant="secondary"
      border="none"
      boxShadow={SEXY_BOX_SHADOW_T_T}
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
      data-testid={testId}
    >
      <HStack gap="0.25rem">
        {!hideSteppers && (
          <NumberDecrementStepper data-testid={testId ? `${testId}-decrement` : undefined}>
            {stepperButton('dec')}
          </NumberDecrementStepper>
        )}
        <InputGroup>
          <NumberInputField
            min={0}
            color={color}
            placeholder={placeholder}
            data-testid={testId ? `${testId}-input` : undefined}
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
              data-testid={testId ? `${testId}-unit-select` : undefined}
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
