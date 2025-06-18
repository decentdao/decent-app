import { Box, BoxProps } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

interface StyledBoxProps extends BoxProps {
  to?: string;
}

export function StyledBox({ children, to, ...rest }: StyledBoxProps) {
  return (
    <Box
      as={to ? Link : undefined}
      to={to}
      bg="color-neutral-950"
      p={{ base: '0.75rem', md: '1.5rem' }}
      borderRadius="0.5rem"
      {...rest}
    >
      {children}
    </Box>
  );
}
