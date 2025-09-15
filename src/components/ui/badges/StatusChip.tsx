import { Box, Text } from '@chakra-ui/react';

interface StatusChipProps {
  status: 'Active' | 'Closed';
  type: 'active' | 'closed';
}

export function StatusChip({ status, type }: StatusChipProps) {
  const isActive = type === 'active';

  return (
    <Box
      bg={isActive ? 'color-lilac-100' : 'color-content-content2'}
      borderRadius="8px"
      px={1}
      py={0.5}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      minH="20px"
      minW="20px"
    >
      <Text
        textStyle="text-xs-medium"
        color={isActive ? 'color-base-primary-foreground' : 'color-content-content1-foreground'}
        lineHeight="16px"
      >
        {status}
      </Text>
    </Box>
  );
}
