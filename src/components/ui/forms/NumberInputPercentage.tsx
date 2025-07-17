import { NumberInputProps, NumberInput, NumberInputField, Text, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import { formatPercentageV1 } from '../../../utils';
export function NumberInputPercentage(props: NumberInputProps) {
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
          w="full"
          position="relative"
          sx={{
            // last character is a dollar sign
            '&::after': {
              content: '"%"',
              color: 'color-content-muted',
              position: 'absolute',
              left: '4rem',
            },
          }}
          textStyle="text-sm-regular"
          color="color-layout-foreground"
        >
          {formatPercentageV1(props.value || 0, 100)}
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
