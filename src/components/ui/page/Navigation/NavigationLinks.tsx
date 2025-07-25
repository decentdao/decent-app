import { Box, Flex, Hide } from '@chakra-ui/react';
import {
  BookOpen,
  Coins,
  GitFork,
  HandCoins,
  House,
  Question,
  UsersThree,
} from '@phosphor-icons/react';
import { DAO_ROUTES } from '../../../../constants/routes';
import { URL_DOCS, URL_FAQ } from '../../../../constants/url';
import useFeatureFlag from '../../../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { LanguageSwitcher } from '../../../../i18n/LanguageSwitcher';
import Divider from '../../utils/Divider';
import { NavigationLink } from './NavigationLink';

function ExternalLinks({ closeDrawer }: { closeDrawer?: () => void }) {
  return (
    <Box
      mb={6}
      mt={{ base: 0, md: 6 }}
      maxWidth={{ md: 12, '3xl': '100%' }}
      _hover={{ maxWidth: '100%' }}
      transitionDuration="300ms"
      width={{ base: 'full', md: 'auto' }}
      borderRadius={{ md: 8 }}
      borderWidth={{ md: 1 }}
      borderColor={{ md: 'color-neutral-900' }}
      bg={{ md: 'color-neutral-950' }}
      overflow={{ md: 'hidden' }}
    >
      <NavigationLink
        href={URL_FAQ}
        labelKey="faq"
        testId="navigationExternal-faq"
        NavigationIcon={Question}
        scope="external"
        closeDrawer={closeDrawer}
      />
      <NavigationLink
        href={URL_DOCS}
        labelKey="documentation"
        testId="navigationExternal-documentation"
        NavigationIcon={BookOpen}
        scope="external"
        closeDrawer={closeDrawer}
      />{' '}
      <LanguageSwitcher data-testid="navigation-language" />
    </Box>
  );
}

function InternalLinks({ closeDrawer }: { closeDrawer?: () => void }) {
  const { safeAddress, addressPrefix } = useCurrentDAOKey();
  const isRevShareEnabled = useFeatureFlag('flag_revenue_sharing');

  if (!safeAddress) {
    return null;
  }

  return (
    <Box
      width="full"
      marginY={{ md: 'auto' }}
    >
      <Box
        maxWidth={{ md: 12, '3xl': '100%' }}
        _hover={{ maxWidth: '100%' }}
        transitionDuration="300ms"
        overflow={{ md: 'hidden' }}
        mt={{ md: 12 }}
        mb={{ md: 3 }}
        bg={{ md: '#26212AD6' }}
        borderColor={{ md: 'color-neutral-900' }}
        borderRadius={{ md: 8 }}
        borderWidth={{ md: 1 }}
        backdropFilter={{ md: 'blur(12px)' }}
        boxShadow={{ md: '0px 1px 0px 0px #161219' }}
      >
        <NavigationLink
          href={DAO_ROUTES.dao.relative(addressPrefix, safeAddress)}
          labelKey="home"
          testId="navigation-homeLink"
          NavigationIcon={House}
          scope="internal"
          closeDrawer={closeDrawer}
        />
        <NavigationLink
          href={DAO_ROUTES.roles.relative(addressPrefix, safeAddress)}
          labelKey="roles"
          testId="navigation-rolesLink"
          NavigationIcon={UsersThree}
          scope="internal"
          closeDrawer={closeDrawer}
        />
        <NavigationLink
          href={DAO_ROUTES.treasury.relative(addressPrefix, safeAddress)}
          labelKey="treasury"
          testId="navigation-treasuryLink"
          NavigationIcon={Coins}
          scope="internal"
          closeDrawer={closeDrawer}
        />
        <NavigationLink
          href={DAO_ROUTES.hierarchy.relative(addressPrefix, safeAddress)}
          labelKey="nodes"
          testId="navigation-hierarchyLink"
          NavigationIcon={GitFork}
          scope="internal"
          closeDrawer={closeDrawer}
        />
        {isRevShareEnabled && (
          <NavigationLink
            href={DAO_ROUTES.staking.relative(addressPrefix, safeAddress)}
            labelKey="staking"
            testId="navigation-stakingLink"
            NavigationIcon={HandCoins}
            scope="internal"
            closeDrawer={closeDrawer}
          />
        )}
        <Hide above="md">
          <Divider variant="darker" />
        </Hide>
      </Box>
    </Box>
  );
}

export function NavigationLinks({ closeDrawer }: { closeDrawer?: () => void }) {
  return (
    <Flex
      height="full"
      alignItems="start"
      direction="column"
      justifyContent={{ base: 'flex-start', md: 'flex-end' }}
      flexGrow={1}
    >
      <InternalLinks closeDrawer={closeDrawer} />
      <ExternalLinks closeDrawer={closeDrawer} />
    </Flex>
  );
}
