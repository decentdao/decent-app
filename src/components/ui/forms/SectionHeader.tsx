import { Box, Text } from '@chakra-ui/react';

interface SectionHeaderProps {
  title: string;
  description: string;
  mb?: number | string;
}

export function SectionHeader({ title, description, mb = 6 }: SectionHeaderProps) {
  return (
    <Box mb={mb}>
      <Text
        color="color-layout-foreground"
        textStyle="text-lg-medium"
        mb={2}
      >
        {title}
      </Text>
      <Text
        textStyle="text-sm-regular"
        color="color-content-muted"
      >
        {description}
      </Text>
    </Box>
  );
}
