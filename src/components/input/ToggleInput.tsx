import { Flex, InputGroup, Switch } from '@chakra-ui/react';
import { LabelComponent } from '../ui/forms/InputComponent';
import { IToggleInput } from './Interfaces';

export function ToggleInput({ id, label, description, value, onValueChange }: IToggleInput) {
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
          <Switch
            size="md"
            isChecked={value}
            onChange={() => onValueChange?.(!value)}
            variant="secondary"
          />
        </Flex>
      </InputGroup>
    </LabelComponent>
  );
}
