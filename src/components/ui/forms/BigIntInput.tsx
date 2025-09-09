import {
  FormControlOptions,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  InputProps,
} from '@chakra-ui/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { parseUnits, formatUnits } from 'viem';
import { BigIntValuePair } from '../../../types';

export interface BigIntInputV2Props
  extends Omit<InputProps, 'value' | 'onChange' | 'type' | 'min' | 'max'>,
    FormControlOptions {
  value?: BigIntValuePair;
  onChange: (value: BigIntValuePair) => void;
  decimals?: number;
  min?: bigint;
  max?: bigint;
  maxValue?: bigint;
}

/**
 * A properly functioning BigInt input component that handles decimal token amounts.
 *
 * Key improvements over the original:
 * - Single source of truth for state (value prop)
 * - No cursor position manipulation
 * - Proper text input with decimal validation
 * - Cleaner min/max handling
 * - Simplified API
 */
export function BigIntInput({
  value = { value: '', bigintValue: undefined },
  onChange,
  decimals = 18,
  min,
  max,
  maxValue,
  ...rest
}: BigIntInputV2Props) {
  const { t } = useTranslation('common');
  const inputRef = useRef<HTMLInputElement>(null);

  // Track if we're in the middle of editing to prevent external updates from interfering
  const [isEditing, setIsEditing] = useState(false);

  // Internal display value - only used during editing
  const [displayValue, setDisplayValue] = useState(value.value);

  // Update display value when external value changes (but not during editing)
  useEffect(() => {
    if (!isEditing) {
      setDisplayValue(value.value);
    }
  }, [value.value, isEditing]);

  const validateAndFormatInput = useCallback(
    (input: string): string => {
      // Allow empty input
      if (input === '') return '';

      // Remove any non-numeric characters except decimal point
      let cleaned = input.replace(/[^0-9.]/g, '');

      // Handle multiple decimal points - keep only the first one
      const decimalIndex = cleaned.indexOf('.');
      if (decimalIndex !== -1) {
        const beforeDecimal = cleaned.substring(0, decimalIndex);
        const afterDecimal = cleaned.substring(decimalIndex + 1).replace(/\./g, '');
        cleaned = beforeDecimal + '.' + afterDecimal;
      }

      // Limit decimal places
      if (decimals === 0) {
        cleaned = cleaned.replace('.', '');
      } else if (cleaned.includes('.')) {
        const [whole, decimal] = cleaned.split('.');
        cleaned = whole + '.' + decimal.substring(0, decimals);
      }

      // Remove leading zeros (except for "0." case)
      if (cleaned.length > 1 && cleaned[0] === '0' && cleaned[1] !== '.') {
        cleaned = cleaned.substring(1);
      }

      return cleaned;
    },
    [decimals],
  );

  const convertToBigInt = useCallback(
    (input: string): bigint | undefined => {
      if (!input || input === '.' || input === '') return undefined;

      try {
        // Handle the case where input ends with decimal point
        const normalizedInput = input.endsWith('.') ? input.slice(0, -1) : input;
        if (!normalizedInput) return undefined;

        return parseUnits(normalizedInput, decimals);
      } catch {
        return undefined;
      }
    },
    [decimals],
  );

  const applyConstraints = useCallback(
    (bigintValue: bigint | undefined): bigint | undefined => {
      if (bigintValue === undefined) return undefined;

      // Apply min constraint
      if (min !== undefined && bigintValue < min) {
        return min;
      }

      // Apply max constraint
      if (max !== undefined && bigintValue > max) {
        return max;
      }

      return bigintValue;
    },
    [min, max],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const validatedValue = validateAndFormatInput(rawValue);

      setDisplayValue(validatedValue);

      const bigintValue = convertToBigInt(validatedValue);
      const constrainedBigintValue = applyConstraints(bigintValue);

      // If constraints were applied, update display value to match
      if (constrainedBigintValue !== bigintValue && constrainedBigintValue !== undefined) {
        const constrainedDisplayValue = formatUnits(constrainedBigintValue, decimals);
        setDisplayValue(constrainedDisplayValue);
        onChange({
          value: constrainedDisplayValue,
          bigintValue: constrainedBigintValue,
        });
      } else {
        onChange({
          value: validatedValue,
          bigintValue: constrainedBigintValue,
        });
      }
    },
    [validateAndFormatInput, convertToBigInt, applyConstraints, onChange, decimals],
  );

  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);

    // Apply min constraint on blur if value is too small
    const currentBigint = convertToBigInt(displayValue);
    if (min !== undefined && currentBigint !== undefined && currentBigint < min) {
      const minDisplayValue = formatUnits(min, decimals);
      setDisplayValue(minDisplayValue);
      onChange({
        value: minDisplayValue,
        bigintValue: min,
      });
    }
  }, [displayValue, convertToBigInt, min, decimals, onChange]);

  const handleMaxClick = useCallback(() => {
    if (maxValue === undefined) return;

    const maxDisplayValue = formatUnits(maxValue, decimals);
    setDisplayValue(maxDisplayValue);
    onChange({
      value: maxDisplayValue,
      bigintValue: maxValue,
    });

    // Focus the input after setting max value
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [maxValue, decimals, onChange]);

  return (
    <InputGroup>
      <Input
        ref={inputRef}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        type="text"
        inputMode="decimal"
        {...rest}
      />
      {maxValue !== undefined && (
        <InputRightElement width="4.5rem">
          <Button
            h="1.75rem"
            onClick={handleMaxClick}
            variant="text"
            size="md"
          >
            {t('max')}
          </Button>
        </InputRightElement>
      )}
    </InputGroup>
  );
}
