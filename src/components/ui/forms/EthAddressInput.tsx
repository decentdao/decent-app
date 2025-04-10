import { Input, InputProps } from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

/**
 * A simple Input for Ethereum addresses. Input validation is provided via Yup
 * in {@link useValidationAddress}
 */
export function AddressInput({ value, onChange, ...rest }: InputProps) {
  const [localValue, setLocalValue] = useState<string | number | readonly string[] | undefined>(
    value,
  );

  const debounceValue = useMemo(
    () =>
      debounce((event: ChangeEvent<HTMLInputElement>) => {
        if (onChange) onChange(event);
      }, 500),
    [onChange],
  );

  useEffect(() => {
    return () => {
      debounceValue.cancel();
    };
  }, [debounceValue]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      setLocalValue(inputValue);
      // @dev assume that if the input is 42 characters long that typing is finished, skip debounce
      if (inputValue.length === 42) {
        if (onChange) onChange(event);
      } else {
        debounceValue(event);
      }
    },
    [debounceValue, onChange],
  );

  return (
    <Input
      // preface id with "search" to prevent showing 1password
      // https://1password.community/discussion/comment/606453/#Comment_606453
      onChange={e => handleChange(e)}
      id="searchButActuallyEthAddress"
      autoComplete="off"
      placeholder="0x0000...0000"
      value={localValue}
      {...rest}
    />
  );
}
