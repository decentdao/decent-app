import { Box, Button, Flex, Show, Text, useBreakpointValue, useDisclosure } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccountFavorites } from '../../hooks/DAO/loaders/useFavorites';
import { useNetworkConfig } from '../../providers/NetworkConfig/NetworkConfigProvider';
import { AllSafesDrawer } from './AllSafesDrawer';
import { SafeDisplayRow } from './SafeDisplayRow';

export function MySafes() {
  const { t } = useTranslation('home');
  const { favoritesList } = useAccountFavorites();
  const { addressPrefix } = useNetworkConfig();
  const [showAll, setShowAll] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleClick = useBreakpointValue({
    base: onOpen,
    md: () => setShowAll(true),
  });

  const favoritesToShow = showAll ? favoritesList : favoritesList.slice(0, 5);
  return (
    <Box>
      <Box w="full">
        {/* SAFES CONTENT */}
        {favoritesList.length === 0 ? (
          <Flex
            direction={{ base: 'column', md: 'row' }}
            columnGap="0.5rem"
            justifyContent="center"
            p="1rem"
            maxW="100%"
            my="0.5rem"
            bg="neutral-2"
            borderRadius="0.5rem"
          >
            <Text
              color="white-alpha-16"
              align="center"
            >
              {t('emptyFavorites', { ns: 'dashboard' })}
            </Text>
            <Text
              color="white-alpha-16"
              align="center"
            >
              {t('emptyFavoritesSubtext', { ns: 'dashboard' })}
            </Text>
          </Flex>
        ) : (
          <Box>
            {favoritesToShow.map(favorite => (
              <SafeDisplayRow
                key={favorite}
                network={addressPrefix}
                address={favorite}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* VIEW ALL BUTTON */}
      {favoritesList.length > 5 && !showAll && (
        <Flex
          justifyContent="center"
          p="1rem"
        >
          {/* TODO: This Button style should be made a variant in UI repo */}
          <Button
            variant="primary"
            bg={'neutral-3'}
            borderRadius="625rem"
            color={'lilac-0'}
            borderWidth="1px"
            borderColor="transparent"
            _hover={{ textDecoration: 'none', bg: 'neutral-4' }}
            _active={{ bg: 'neutral-3', borderColor: 'neutral-4' }}
            size={'sm'}
            p={'0.25rem 0.75rem'}
            width={'fit-content'}
            onClick={handleClick}
          >
            {t('viewAll')}
          </Button>
        </Flex>
      )}
      <Show below="md">
        <AllSafesDrawer
          isOpen={isOpen}
          onClose={onClose}
          onOpen={onOpen}
        />
      </Show>
    </Box>
  );
}
