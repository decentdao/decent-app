import { Box, Button, Flex, Show, Text, useBreakpointValue, useDisclosure } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '../../components/ui/utils/ErrorBoundary';
import { MySafesErrorFallback } from '../../components/ui/utils/MySafesErrorFallback';
import { useAccountFavorites } from '../../hooks/DAO/loaders/useFavorites';
import { AllSafesDrawer } from './AllSafesDrawer';
import { SafeDisplayRow } from './SafeDisplayRow';

export function MySafes() {
  const { t } = useTranslation('home');
  const { favoritesList } = useAccountFavorites();
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
        <ErrorBoundary fallback={MySafesErrorFallback}>
          {/* SAFES CONTENT */}
          {favoritesList.length === 0 ? (
            <Flex
              justifyContent="center"
              p="1rem"
              my="0.5rem"
              bg="color-neutral-950"
              borderRadius="0.5rem"
            >
              <Text
                color="white-alpha-16"
                align="center"
              >
                {t('emptyFavorites', { ns: 'dashboard' })}
              </Text>
            </Flex>
          ) : (
            <Box>
              {favoritesToShow.map(favorite => (
                <SafeDisplayRow
                  key={`${favorite.networkPrefix}:${favorite.address}`}
                  network={favorite.networkPrefix}
                  address={favorite.address}
                  name={favorite.name}
                />
              ))}
            </Box>
          )}
        </ErrorBoundary>
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
            bg={'color-neutral-900'}
            borderRadius="625rem"
            color={'color-lilac-100'}
            borderWidth="1px"
            borderColor="transparent"
            _hover={{ textDecoration: 'none', bg: 'color-neutral-800' }}
            _active={{ bg: 'color-neutral-900', borderColor: 'color-neutral-800' }}
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
