import {
  Button,
  HStack,
  InputGroup,
  InputRightElement,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import { Plus, Minus } from '@phosphor-icons/react';
import { ReactNode } from 'react';
import { SEXY_BOX_SHADOW_T_T } from '../../../constants/common';

export function NumberStepperInput({
  value,
  onChange,
  rightElement,
  disabled,
  isInvalid,
  color,
}: {
  value?: string | number;
  onChange: (val: string) => void;
  rightElement?: ReactNode;
  disabled?: boolean;
  isInvalid?: boolean;
  color?: string;
}) {
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
      value={value}
      onChange={onChange}
      min={0}
      focusInputOnChange
      isDisabled={disabled}
      isInvalid={isInvalid}
    >
      <HStack gap="0.25rem">
        <NumberDecrementStepper>{stepperButton('dec')}</NumberDecrementStepper>
        <InputGroup>
          <NumberInputField
            color={color}
            min={0}
          />
          <InputRightElement mr="1rem">{rightElement}</InputRightElement>
        </InputGroup>
        <NumberIncrementStepper>{stepperButton('inc')}</NumberIncrementStepper>
      </HStack>
    </NumberInput>
  );
}
