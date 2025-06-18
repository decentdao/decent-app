import {
  FormControlOptions,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  InputProps,
} from '@chakra-ui/react';
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { BigIntValuePair } from '../../../types';
export interface BigIntInputProps
  extends Omit<InputProps, 'value' | 'onChange'>,
    FormControlOptions {
  value?: bigint;
  onChange: (value: BigIntValuePair) => void;
  decimalPlaces?: number;
  min?: string;
  max?: string;
  maxValue?: bigint;
  parentFormikValue?: BigIntValuePair;
}
/**
 * This component will add a chakra Input component that accepts and sets a bigint
 *
 * @param value input value to the control as a bigint. If undefined is set then the component will be blank.
 * @param onChange event is raised whenever the component changes. Sends back a resulting `BigIntValuePair` from the new input.
 * @param decimalPlaces number of decimal places to be used to parse the value to set the bigint
 * @param min Setting a minimum value will reset the Input value to min when the component's focus is lost. Can set decimal number for minimum, but must respect the decimalPlaces value.
 * @param max Setting this will cause the value of the Input control to be reset to the maximum when a number larger than it is inputted.
 * @param maxValue The maximum value that can be inputted. This is used to set the max value of the Input control.
 * @param parentFormikValue This needs to be set to `values.yourFormValue` if the value of the Input control is changed outside of the component, for example via `setFieldValue`. This will update the value of the underlying Input control.
 * @param ...rest component accepts all properties for Input and FormControl
 * @returns
 */
export function BigIntInput({
  // @todo `value` can most likely either be removed, or be used for what `parentFormikValue` is currently being used for. Currently it works as nothing more than an initial value.
  // https://linear.app/decent-labs/issue/ENG-1158/remove-bigintinputvalue-not-being-used
  value,
  onChange,
  decimalPlaces = 18,
  min,
  max,
  maxValue,
  parentFormikValue = { value: '', bigintValue: undefined },
  ...rest
}: BigIntInputProps) {
  const { t } = useTranslation('common');
  const [inputValue, setInputValue] = useState<string>(
    value && value !== 0n ? formatUnits(value, decimalPlaces) : '',
  );

  // this will insure the caret in the input component does not shift to the end of the input when the value is changed
  const resetCaretPositionForInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const caret = event.target.selectionStart;
    const element = event.target;
    window.requestAnimationFrame(() => {
      element.selectionStart = caret && caret - 1;
      element.selectionEnd = caret && caret - 1;
    });
  };

  const removeOnlyDecimalPoint = (input: string) => (!input || input === '.' ? '0' : input);

  const truncateDecimalPlaces = useCallback(
    (eventValue: string) => {
      if (eventValue.includes('.')) {
        const [leftDigits, rightDigits] = eventValue.split('.');
        //trunc right side of number if more than max decimal places
        if (rightDigits && rightDigits.length > decimalPlaces) {
          const maxLength = leftDigits.length + decimalPlaces + 1;
          return eventValue.slice(0, maxLength);
        }
      }
      return eventValue;
    },
    [decimalPlaces],
  );

  const processValue = useCallback(
    (event?: React.ChangeEvent<HTMLInputElement>, _value = '') => {
      let stringValue = _value;
      if (event) {
        stringValue = event.target.value;
      }
      if (stringValue === '') {
        onChange({
          value: stringValue,
          bigintValue: undefined,
        });
        setInputValue('');
        return;
      }

      const numberMask =
        decimalPlaces === 0 ? new RegExp('^\\d*$') : new RegExp('^\\d*(\\.\\d*)?$');

      if (!numberMask.test(stringValue)) {
        if (event) {
          resetCaretPositionForInput(event);
          event.preventDefault();
        }
        return;
      }

      let newValue = truncateDecimalPlaces(stringValue);

      let bigintValue = parseUnits(removeOnlyDecimalPoint(newValue), decimalPlaces);

      //set value to max if greater than max
      const maxBigint = max ? parseUnits(max, decimalPlaces) : maxUint256;
      if (bigintValue > maxBigint) {
        newValue = formatUnits(maxBigint, decimalPlaces);
        bigintValue = maxBigint;
      }

      onChange({
        value: removeOnlyDecimalPoint(newValue),
        bigintValue: bigintValue,
      });
      if (event && newValue !== event.target.value) {
        resetCaretPositionForInput(event);
      }
      setInputValue(newValue);
    },
    [decimalPlaces, max, onChange, truncateDecimalPlaces],
  );

  //set value to min if less than min, when focus is lost
  const onBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      if (min) {
        const eventValue = event.target.value;
        const hasValidValue = eventValue && eventValue !== '.';
        const bigintValue = hasValidValue ? parseUnits(eventValue, decimalPlaces) : 0n;
        const minBigint = hasValidValue ? parseUnits(min, decimalPlaces) : 0n;
        if (bigintValue <= minBigint) {
          onChange({
            value: min,
            bigintValue: minBigint,
          });
          setInputValue(min);
        }
      }
    },
    [decimalPlaces, min, onChange],
  );

  // if the parent Formik value prop changes, need to update the value
  useEffect(() => {
    // If parentFormikValue is set to undefined, then the input should be blank
    if (parentFormikValue === undefined) {
      setInputValue('');
      return;
    }

    // If parentFormikValue is the same as the input value, nothing needs to happen.
    if (inputValue === parentFormikValue.value) return;

    // If parentFormikValue does not match the input value (likely because it was set outside of the input's onChange handler),
    // then update the underlying input value so that the change is visible on the UI.
    // But if parentFormikValue.value is false-y, default to whatever is in the input.
    if (parentFormikValue.value !== inputValue) {
      setInputValue(parentFormikValue?.value || inputValue);
    }
  }, [parentFormikValue, inputValue]);

  // if the decimalPlaces change, need to update the value
  useEffect(() => {
    if (!inputValue) return;
    processValue(undefined, inputValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decimalPlaces]);

  return (
    <InputGroup>
      <Input
        value={inputValue}
        onChange={processValue}
        onBlur={onBlur}
        onWheel={e => {
          e.preventDefault();
          e.currentTarget.blur();
        }}
        type="number"
        {...rest}
      />
      {maxValue !== undefined && (
        <InputRightElement width="4.5rem">
          <Button
            h="1.75rem"
            onClick={() => {
              const newValue = {
                value: truncateDecimalPlaces(formatUnits(maxValue, decimalPlaces)),
                bigintValue: maxValue,
              };
              setInputValue(newValue.value);
              onChange(newValue);
            }}
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
