import { Box, BoxProps } from '@chakra-ui/react';

export function InfoBox({ children, ...rest }: BoxProps) {
  return (
    <Box
      h="100%"
      minHeight="10.6rem"
      p="1.5rem"
      mx="0.3rem"
      borderWidth="0.06rem"
      borderColor="color-neutral-900"
      borderRadius="0.75rem"
      {...rest}
    >
      {children}
    </Box>
  );
}
