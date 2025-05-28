import { HStack, Icon, Link, Text } from '@chakra-ui/react';
import { ArrowBendLeftUp } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
/**
 * Displays a link to the current DAO's parent, if it has one.
 */
export function ParentLink() {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { subgraphInfo },
  } = useDAOStore({ daoKey });
  const { addressPrefix } = useNetworkConfigStore();
  const { t } = useTranslation('breadcrumbs');

  if (!subgraphInfo?.parentAddress) {
    return null;
  }

  return (
    <Link
      color="color-green-400"
      _hover={{ textDecoration: 'none', color: 'color-green-950' }}
      to={DAO_ROUTES.dao.relative(addressPrefix, subgraphInfo.parentAddress)}
      marginBottom="1rem"
      as={RouterLink}
      width="fit-content"
    >
      <HStack>
        <Icon
          color="color-lilac-100"
          as={ArrowBendLeftUp}
          width="1.5rem"
          height="1.5rem"
        />
        <Text flexWrap="wrap">{t('parentLink')}</Text>
      </HStack>
    </Link>
  );
}
