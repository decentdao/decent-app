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

export function NumberStepperInput({
  value,
  onChange,
  unitHint,
  disabled,
}: {
  value?: string | number;
  onChange: (val: string) => void;
  unitHint?: string;
  disabled?: boolean;
}) {
  const stepperButton = (direction: 'inc' | 'dec') => (
    <Button
      variant="secondary"
      borderColor="neutral-3"
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
    >
      <HStack gap="0.25rem">
        <NumberDecrementStepper>{stepperButton('dec')}</NumberDecrementStepper>
        <InputGroup>
          <NumberInputField min={0} />
          <InputRightElement mr="1rem">{unitHint}</InputRightElement>
        </InputGroup>
        <NumberIncrementStepper>{stepperButton('inc')}</NumberIncrementStepper>
      </HStack>
    </NumberInput>
  );
}
