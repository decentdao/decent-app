import { Box, Divider, Text, VStack } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface InfoItemProps {
  label: string;
  value: ReactNode;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      w="full"
      py={2}
    >
      <Text
        textStyle="text-sm-regular"
        color="color-content-muted"
        w="122px"
        flexShrink={0}
      >
        {label}
      </Text>
      <Text
        textStyle="text-sm-regular"
        color="color-content-content1-foreground"
        textAlign="right"
        w="122px"
        flexShrink={0}
      >
        {value}
      </Text>
    </Box>
  );
}

interface InfoSectionProps {
  children: ReactNode;
}

function InfoSection({ children }: InfoSectionProps) {
  return (
    <Box px={3}>
      <VStack
        spacing={0}
        align="stretch"
      >
        {children}
      </VStack>
    </Box>
  );
}

interface TokenSaleInfoCardProps {
  title: string;
  children: ReactNode;
}

export function TokenSaleInfoCard({ title, children }: TokenSaleInfoCardProps) {
  return (
    <VStack
      spacing={1}
      align="stretch"
    >
      <Text
        textStyle="text-lg-medium"
        color="color-content-content1-foreground"
      >
        {title}
      </Text>
      <Box
        border="1px solid"
        borderColor="color-layout-border-10"
        borderRadius="12px"
        py={2}
      >
        {children}
      </Box>
    </VStack>
  );
}

TokenSaleInfoCard.Item = InfoItem;
TokenSaleInfoCard.Section = InfoSection;
TokenSaleInfoCard.Divider = function InfoCardDivider() {
  return (
    <Box py={0}>
      <Divider borderColor="color-layout-border-10" />
    </Box>
  );
};
