import { Box, Text } from '@chakra-ui/react';

interface StatusChipProps {
  status: 'Active' | 'Closed' | 'Not Started';
  type: 'active' | 'closed' | 'Not Started';
}

export function StatusChip({ status, type }: StatusChipProps) {
  const isActive = type === 'active';

  return (
    <Box
      bg={
        isActive
          ? 'color-lilac-100'
          : type === 'closed'
            ? 'color-content-content2'
            : type === 'Not Started'
              ? 'color-content-content2'
              : 'color-content-content2'
      }
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
        color={
          isActive
            ? 'color-base-primary-foreground'
            : type === 'closed'
              ? 'color-content-content1-foreground'
              : type === 'Not Started'
                ? 'color-content-content1-foreground'
                : 'color-content-content1-foreground'
        }
        lineHeight="16px"
      >
        {status}
      </Text>
    </Box>
  );
}
