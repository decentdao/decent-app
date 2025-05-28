import { Box, BoxProps } from '@chakra-ui/react';

export function Card({ children, ...rest }: BoxProps) {
  return (
    <Box
      backgroundColor="color-neutral-950"
      _hover={{ backgroundColor: 'color-neutral-900' }}
      _active={{
        backgroundColor: 'color-neutral-950',
        border: '1px solid',
        borderColor: 'color-neutral-900',
      }}
      transition="all ease-out 300ms"
      p="1rem"
      borderRadius="0.75rem"
      border="1px solid"
      borderColor="color-neutral-900"
      cursor={rest.onClick ? 'pointer' : 'default'}
      {...rest}
    >
      {children}
    </Box>
  );
}
