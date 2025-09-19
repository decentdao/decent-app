import { Box, VStack, Button, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export function EmptyState({ handleCreateSale }: { handleCreateSale: () => void }) {
  const { t } = useTranslation('tokenSale');
  return (
    <Box
      bg="transparent"
      borderRadius="12px"
      p={6}
      textAlign="center"
      border="1px solid"
      borderColor="color-layout-border-10"
      position="relative"
    >
      <Box
        w={24}
        h={24}
        mx="auto"
        mb={4}
      >
        <img
          src="/images/decentsquare.png"
          alt={t('tokenSaleIconAltText')}
          width="96"
          height="96"
          style={{ width: '100%', height: '100%' }}
        />
      </Box>
      <VStack
        spacing={6}
        align="center"
      >
        <VStack
          spacing={1}
          align="center"
        >
          <Text
            textStyle="text-2xl-regular"
            color="color-content-content1-foreground"
          >
            {t('noSalesYetTitle')}
          </Text>
          <Text
            textStyle="text-sm-regular"
            color="color-content-content2-foreground"
            maxW="464px"
          >
            {t('noSalesYetDescription')}
          </Text>
        </VStack>
        <Button onClick={handleCreateSale}>{t('createYourFirstSaleButton')}</Button>
      </VStack>
    </Box>
  );
}
