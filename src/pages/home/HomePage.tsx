import { Box, Flex, Hide, Show, Text } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DAOSearch } from '../../components/ui/menus/DAOSearch';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { GettingStarted } from './GettingStarted';
import { MySafes } from './MySafes';

export default function HomePage() {
  const { safe } = useDaoInfoStore();
  const { action } = useDecentStore({ daoKey });
  const { t } = useTranslation('home');

  useEffect(() => {
    // @todo @dev Let's revisit this logic in future when state has been updated
    if (safe?.address) {
      action.resetSafeState();
    }
  }, [safe?.address, action]);

  return (
    <Flex
      direction="column"
      mt="2.5rem"
    >
      {/* Mobile */}
      <Hide above="md">
        <Flex
          direction="column"
          w="100%"
          gap="1.5rem"
        >
          <DAOSearch />
          <Text textStyle="heading-small">{t('mySafes')}</Text>
        </Flex>
      </Hide>

      {/* Desktop */}
      <Show above="md">
        <Flex
          w="100%"
          alignItems="end"
          gap="1rem"
          justifyContent="space-between"
        >
          <Text
            textStyle="heading-small"
            whiteSpace="nowrap"
          >
            {t('mySafes')}
          </Text>
          <Box w="24rem">
            <DAOSearch />
          </Box>
        </Flex>
      </Show>
      <Flex
        direction="column"
        w="full"
        mt="1.5rem"
        gap="1.5rem"
      >
        <MySafes />
        <GettingStarted />
      </Flex>
    </Flex>
  );
}
