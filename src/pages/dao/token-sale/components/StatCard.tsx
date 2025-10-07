import { Box, Text } from '@chakra-ui/react';

export function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box
      bg="transparent"
      borderRadius="12px"
      p={6}
      border="1px solid"
      borderColor="color-layout-border-10"
      position="relative"
    >
      <Box
        position="absolute"
        top={6}
        right={6}
        color="color-content-muted"
      >
        {icon}
      </Box>
      <Text
        textStyle="text-sm-medium"
        color="color-content-content1-foreground"
        mb={2}
      >
        {label}
      </Text>
      <Text
        textStyle="text-2xl-semibold"
        color="color-content-content1-foreground"
      >
        {value}
      </Text>
    </Box>
  );
}
