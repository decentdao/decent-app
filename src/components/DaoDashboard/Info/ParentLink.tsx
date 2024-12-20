import { HStack, Icon, Link, Text } from '@chakra-ui/react';
import { ArrowBendLeftUp } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
/**
 * Displays a link to the current DAO's parent, if it has one.
 */
export function ParentLink() {
  const { subgraphInfo } = useDaoInfoStore();
  const { addressPrefix } = useNetworkConfigStore();
  const { t } = useTranslation('breadcrumbs');

  if (!subgraphInfo?.parentAddress) {
    return null;
  }

  return (
    <Link
      color="celery-0"
      _hover={{ textDecoration: 'none', color: 'celery--6' }}
      to={DAO_ROUTES.dao.relative(addressPrefix, subgraphInfo.parentAddress)}
      marginBottom="1rem"
      as={RouterLink}
      width="fit-content"
    >
      <HStack>
        <Icon
          color="lilac-0"
          as={ArrowBendLeftUp}
          width="1.5rem"
          height="1.5rem"
        />
        <Text flexWrap="wrap">{t('parentLink')}</Text>
      </HStack>
    </Link>
  );
}
