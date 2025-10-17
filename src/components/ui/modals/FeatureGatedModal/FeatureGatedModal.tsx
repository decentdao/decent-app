import { Box, Button, Flex, Image, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FeatureGatedType, getFeatureGatedConfig } from './types';

interface FeatureGatedModalProps {
  featureType: FeatureGatedType;
  onGoBack: () => void;
  onUpgrade: () => void;
}

export function FeatureGatedModal({ featureType, onGoBack, onUpgrade }: FeatureGatedModalProps) {
  const { t } = useTranslation('subscriptions');
  const config = getFeatureGatedConfig(featureType, t);

  const handleUpgrade = () => {
    // TODO: Implement upgrade navigation
    onUpgrade();
  };

  return (
    <Box>
      <Flex
        direction="column"
        alignItems="stretch"
        w="full"
      >
        {/* Image Section - extends to modal edges */}
        <Box
          aspectRatio="518/291"
          w="full"
          overflow="hidden"
          borderTopRadius="0.75rem"
        >
          <Image
            src={config.image}
            alt={config.title}
            w="full"
            h="full"
            objectFit="cover"
            objectPosition="center"
          />
        </Box>

        {/* Content Section */}
        <Flex
          direction="column"
          gap="0.375rem"
          px="1.5rem"
          pt="1rem"
          pb="0"
        >
          <Text
            textStyle="text-xl-semibold"
            color="color-content-popover-foreground"
            maxW="23.75rem"
          >
            {config.title}
          </Text>
          <Text
            textStyle="text-sm-regular"
            color="color-content-muted-foreground"
            minW="full"
          >
            {config.description}
          </Text>
        </Flex>

        {/* Button Section */}
        <Flex
          gap="0.5rem"
          justify="flex-end"
          p="1.5rem"
          pt="1.5rem"
        >
          <Button
            variant="secondaryV1"
            h="2.25rem"
            px="1rem"
            onClick={onGoBack}
          >
            {t('buttonGoBack')}
          </Button>
          <Button
            variant="primary"
            h="2.25rem"
            px="1rem"
            onClick={handleUpgrade}
          >
            {t('buttonUpgrade')}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
