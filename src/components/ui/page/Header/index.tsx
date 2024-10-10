import {
  Box,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Hide,
  Icon,
  IconButton,
  Show,
  useDisclosure,
} from '@chakra-ui/react';
import { List, MagnifyingGlass } from '@phosphor-icons/react';
import { RefObject, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DecentLogo } from '../../../../assets/theme/custom/icons/DecentLogo';
import { DecentSignature } from '../../../../assets/theme/custom/icons/DecentSignature';
import {
  MOBILE_DRAWER_OVERLAY,
  NEUTRAL_2_82_TRANSPARENT,
  SEXY_BOX_SHADOW_T_T,
  useHeaderHeight,
} from '../../../../constants/common';
import { BASE_ROUTES } from '../../../../constants/routes';
import { AccountDisplay } from '../../menus/AccountDisplay';
import { DAOSearch } from '../../menus/DAOSearch';
import { SafesMenu } from '../../menus/SafesMenu';
import { ModalType } from '../../modals/ModalProvider';
import { useDecentModal } from '../../modals/useDecentModal';
import { Footer } from '../Footer';
import { NavigationLinks } from '../Navigation/NavigationLinks';

function HeaderLogo() {
  const { t } = useTranslation('navigation');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement | null>(null);

  return (
    <Flex
      alignItems="center"
      direction="column"
      justifyContent="space-between"
      flexGrow={1}
    >
      <Hide above="md">
        <>
          <IconButton
            ref={btnRef}
            aria-label="drawer-menu"
            onClick={onOpen}
            size="icon-lg"
            variant="tertiary"
            icon={
              <Icon
                boxSize="1.5rem"
                as={List}
                color="white-0"
                aria-hidden
              />
            }
          />
          <Drawer
            placement="left"
            isOpen={isOpen}
            onClose={onClose}
          >
            <DrawerOverlay
              bg={MOBILE_DRAWER_OVERLAY}
              backdropFilter="blur(6px)"
            />
            <DrawerContent
              bg={NEUTRAL_2_82_TRANSPARENT}
              border="none"
              borderTopRightRadius="1rem"
              borderBottomRightRadius="1rem"
              boxShadow={SEXY_BOX_SHADOW_T_T}
            >
              <Flex p="1rem">
                <Link
                  data-testid="navigationLogo-homeLink"
                  to={BASE_ROUTES.landing}
                  aria-label={t('ariaLabelFractalBrand')}
                  onClick={onClose}
                >
                  <DecentLogo
                    aria-hidden
                    h="1.8rem"
                    w="1.5rem"
                  />
                </Link>
              </Flex>
              <Flex
                height="full"
                direction="column"
                my="1rem"
              >
                <NavigationLinks closeDrawer={onClose} />
                <Box mx="0.25rem">
                  <Footer />
                </Box>
              </Flex>
            </DrawerContent>
          </Drawer>
        </>
      </Hide>
      <Show above="md">
        <Link
          data-testid="navigationLogo-homeLink"
          to={BASE_ROUTES.landing}
          aria-label={t('ariaLabelFractalBrand')}
        >
          <DecentSignature
            aria-hidden
            height="1.5rem"
            width="auto"
            mr="1.75rem"
          />
        </Link>
      </Show>
    </Flex>
  );
}

function Header({ headerContainerRef }: { headerContainerRef: RefObject<HTMLDivElement | null> }) {
  const searchSafe = useDecentModal(ModalType.SEARCH_SAFE);
  const HEADER_HEIGHT = useHeaderHeight();

  return (
    <Flex
      w="full"
      bg={NEUTRAL_2_82_TRANSPARENT}
      justifyContent="space-between"
      alignItems="center"
      px={{ base: '1rem', md: '1.5rem' }}
      maxW="100vw"
      borderBottom="1px"
      borderBottomColor="neutral-3"
      // Doesn't seem to work either way arghhh
      box-shadow={{
        base: SEXY_BOX_SHADOW_T_T,
        md: '0px',
      }}
    >
      <HeaderLogo />
      <Show above="md">
        <Box
          w="full"
          mr="1rem"
        >
          <DAOSearch />
        </Box>
      </Show>

      <Flex
        w="full"
        h={HEADER_HEIGHT}
        justifyContent="flex-end"
        alignItems="center"
        gap={{ base: '2rem', md: '1rem' }}
      >
        <Hide above="md">
          <IconButton
            variant="tertiary"
            aria-label="Search Safe"
            onClick={searchSafe}
            size="icon-lg"
            icon={
              <Icon
                as={MagnifyingGlass}
                boxSize="1.5rem"
                color="white-0"
                aria-hidden
              />
            }
            cursor="pointer"
          />
        </Hide>
        <SafesMenu />
        <AccountDisplay containerRef={headerContainerRef} />
      </Flex>
    </Flex>
  );
}

export default Header;
