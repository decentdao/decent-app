import {
  Flex,
  Input,
  InputGroup,
  InputProps,
  InputRightElement,
  InputLeftElement,
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
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export function NumberInputWithAddon({
  leftAddon,
  rightAddon,
  ...props
}: NumberInputWithAddonProps) {
  const hasLeftAddon = !!leftAddon;
  const hasRightAddon = !!rightAddon;

  return (
    <InputGroup>
      {hasLeftAddon && (
        <InputLeftElement pointerEvents="none">
          <Flex
            align="center"
            h="100%"
            pr={3}
            mb="-1px"
          >
            {leftAddon}
          </Flex>
        </InputLeftElement>
      )}
      <NumberInput
        w="full"
        {...props}
      >
        <NumberInputField
          pl={hasLeftAddon ? '1.5rem' : undefined}
          pr={hasRightAddon ? '6.5rem' : undefined}
          placeholder={props.placeholder}
        />
      </NumberInput>
      {hasRightAddon && (
        <InputRightElement
          width="auto"
          p={3}
          pointerEvents="none"
          borderLeft="1px solid"
          borderLeftColor="white-alpha-16"
        >
          {rightAddon}
        </InputRightElement>
      )}
    </InputGroup>
  );
}
