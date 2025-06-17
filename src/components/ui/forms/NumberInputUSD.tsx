import { NumberInputProps, NumberInput, NumberInputField, Text, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import { formatUSD } from '../../../utils';
export function NumberInputUSD(props: NumberInputProps) {
  const [showInput, setShowInput] = useState(false);
  if (!showInput) {
    return (
      <Flex
        w="full"
        h="full"
        px="1rem"
        alignItems="center"
        _hover={{
          bg: 'color-alpha-white-950',
        }}
        onClick={() => {
          setShowInput(true);
        }}
        onBlur={() => {
          setShowInput(false);
        }}
      >
        <Text
          cursor="pointer"
          _hover={{
            bg: 'color-alpha-white-950',
          }}
          sx={{
            // first character is a dollar sign
            '&:first-letter': {
              color: 'color-content-muted',
              letterSpacing: '0.2rem',
            },
          }}
          textStyle="text-sm-regular"
          color="color-layout-foreground"
        >
          {formatUSD(props.value || 0)}
        </Text>
      </Flex>
    );
  }
  return (
    <NumberInput
      w="full"
      h="full"
      onBlur={() => {
        setShowInput(false);
      }}
      {...props}
    >
      <NumberInputField
        autoFocus
        w="full"
        h="full"
      />
    </NumberInput>
  );
}
