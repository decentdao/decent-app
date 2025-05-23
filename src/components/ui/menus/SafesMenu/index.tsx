import { Box, Button, Hide, Icon, IconButton, Show, Text, useDisclosure } from '@chakra-ui/react';
import { CaretDown, Star } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useAccountFavorites } from '../../../../hooks/DAO/loaders/useFavorites';
import { AllSafesDrawer } from '../../../../pages/home/AllSafesDrawer';
import { OptionMenu } from '../OptionMenu';
import { SafeMenuItem } from './SafeMenuItem';

export function SafesMenu() {
  const { t } = useTranslation('home');
  const {
    isOpen: isSafesDrawerOpen,
    onOpen: onSafesDrawerOpen,
    onClose: onSafesDrawerClose,
  } = useDisclosure();

  const { favoritesList } = useAccountFavorites();

  return (
    <Box>
      <Hide above="md">
        <IconButton
          variant="tertiary"
          aria-label="Search Safe"
          onClick={onSafesDrawerOpen}
          size="icon-lg"
          icon={
            <Icon
              as={Star}
              color="white-0"
              boxSize="1.5rem"
              aria-hidden
            />
          }
        />
      </Hide>

      <Show above="md">
        <OptionMenu
          trigger={
            <Button
              as="div"
              variant="tertiary"
              alignItems="center"
              gap={2}
              px={0}
              color="white-0"
            >
              <Text>{t('mySafes')}</Text>
              <Icon
                as={CaretDown}
                boxSize="1.5rem"
              />
            </Button>
          }
          options={
            !favoritesList.length
              ? [
                  {
                    optionKey: 'empty-favorites',
                    onClick: () => {},
                    renderer: () => (
                      <Text padding="1rem">{t('emptyFavorites', { ns: 'dashboard' })}</Text>
                    ),
                  },
                ]
              : favoritesList.map(favorite => ({
                  optionKey: `${favorite.networkPrefix}:${favorite.address}`,
                  onClick: () => {},
                  renderer: () => (
                    <SafeMenuItem
                      name={favorite.name}
                      address={favorite.address}
                      network={favorite.networkPrefix}
                    />
                  ),
                }))
          }
          buttonAs={Button}
          buttonProps={{
            variant: 'tertiary',
            color: 'white-0',
            _hover: { color: 'white-0', bg: 'color-neutral-900' },
            _active: {
              color: 'white-0',
              bg: 'color-neutral-900',
            },
            paddingX: '0.75rem',
            paddingY: '0.25rem',
          }}
          closeOnSelect={false}
          showOptionSelected
          showOptionCount
        />
      </Show>

      <AllSafesDrawer
        isOpen={isSafesDrawerOpen}
        onClose={onSafesDrawerClose}
        onOpen={onSafesDrawerOpen}
      />
    </Box>
  );
}
