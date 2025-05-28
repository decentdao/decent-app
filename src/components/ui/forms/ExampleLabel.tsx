import { Text, TextProps } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';

export default function ExampleLabel({ children, ...rest }: PropsWithChildren<TextProps>) {
  return (
    <Text
      bg="color-neutral-900"
      borderRadius="2px"
      px="6px"
      py="2px"
      color="color-white"
      textStyle="text-xs-mono"
      as="span"
      {...rest}
    >
      {children}
    </Text>
  );
}
