import { Box } from '@chakra-ui/react';
import { ReactNode } from 'react';

export default function StatusBox({ children }: { children: ReactNode }) {
  return (
    <Box
      px="8px"
      py="0"
      height="24px"
      display="inline-flex"
      alignItems="center"
      borderRadius="4px"
      color="neutral-7"
      textStyle="text-sm-medium"
      border="1px solid"
      borderColor="neutral-7"
    >
      {children}
    </Box>
  );
}
