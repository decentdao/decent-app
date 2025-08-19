import { NumberInputProps, NumberInput, NumberInputField, Text, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import { formatPercentageV1 } from '../../../utils';
export function NumberInputPercentage(props: NumberInputProps & { isReadOnly?: boolean }) {
  const [showInput, setShowInput] = useState(false);
  const invalid = props.isInvalid;
  const invalidState = {
    bg: 'color-error-950',
    color: 'color-error-400',
    _placeholder: {
      color: 'color-error-500',
    },
    boxShadow:
      '0px 0px 0px 2px #AF3A48, 0px 1px 0px 0px rgba(242, 161, 171, 0.30), 0px 0px 0px 1px rgba(0, 0, 0, 0.80)',
  };
  if (!showInput) {
    return (
      <Flex
        w="full"
        h="full"
        px="1rem"
        alignItems="center"
        _hover={{
          bg: props.isReadOnly ? 'transparent' : 'color-alpha-white-950',
        }}
        onClick={() => {
          if (!props.isReadOnly) {
            setShowInput(true);
          }
        }}
        onBlur={() => {
          setShowInput(false);
        }}
        {...(invalid ? invalidState : {})}
      >
        <Text
          cursor={props.isReadOnly ? "default" : "pointer"}
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
