import { Flex, InputGroup } from '@chakra-ui/react';
import { LabelComponent } from '../ui/forms/InputComponent';
import { NumberStepperInput } from '../ui/forms/NumberStepperInput';
import { IStepperInput } from './Interfaces';

export function StepperInput({
  id,
  label,
  description,
  value,
  unit,
  onValueChange,
}: IStepperInput) {
  return (
    <LabelComponent
      id={id}
      label={label}
      helper={description}
      isRequired
    >
      <InputGroup>
        <Flex
          flexDirection="column"
          gap="0.5rem"
          w="250px"
        >
          <NumberStepperInput
            unitHint={unit}
            value={value}
            onChange={val => onValueChange?.(Number(val))}
          />
        </Flex>
      </InputGroup>
    </LabelComponent>
  );
}
