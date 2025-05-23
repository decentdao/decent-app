import { Text, TextProps } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';

export default function ExampleLabel({ children, ...rest }: PropsWithChildren<TextProps>) {
  return (
    <Text
      bg="neutral-3"
      borderRadius="2px"
      px="6px"
      py="2px"
      color="white-0"
      textStyle="text-xs-mono"
      as="span"
      {...rest}
    >
      {children}
    </Text>
  );
}
