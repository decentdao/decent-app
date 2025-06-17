import {
  Flex,
  Input,
  InputGroup,
  InputProps,
  InputRightElement,
  NumberInput,
  NumberInputField,
  NumberInputProps,
} from '@chakra-ui/react';

interface InputWithAddonProps extends InputProps {
  addonContent: React.ReactNode;
}

export function InputWithAddon({ addonContent, ...props }: InputWithAddonProps) {
  return (
    <InputGroup>
      <Input
        pr="6.5rem"
        {...props}
      />
      <InputRightElement
        width="auto"
        pr={3}
        pointerEvents="none"
        borderLeft="1px solid"
        mt="-4px"
        borderLeftColor="white-alpha-16"
      >
        <Flex
          align="center"
          h="100%"
          pl={3}
        >
          {addonContent}
        </Flex>
      </InputRightElement>
    </InputGroup>
  );
}

interface NumberInputWithAddonProps extends NumberInputProps {
  addonContent: React.ReactNode;
}

export function NumberInputWithAddon({ addonContent, ...props }: NumberInputWithAddonProps) {
  return (
    <InputGroup>
      <NumberInput
        w="full"
        {...props}
      >
        <NumberInputField
          pr="6.5rem"
          placeholder={props.placeholder}
        />
      </NumberInput>
      <InputRightElement
        width="auto"
        pr={3}
        pointerEvents="none"
        borderLeft="1px solid"
        mt="-4px"
        borderLeftColor="white-alpha-16"
      >
        <Flex
          align="center"
          h="100%"
          pl={3}
        >
          {addonContent}
        </Flex>
      </InputRightElement>
    </InputGroup>
  );
}
