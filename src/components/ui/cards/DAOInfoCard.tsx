import { Box, Center, Flex, Image, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import { useAccountFavorites } from '../../../hooks/DAO/loaders/useFavorites';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { getNetworkIcon } from '../../../utils/url';
import { SnapshotButton } from '../badges/Snapshot';
import { FavoriteIcon } from '../icons/FavoriteIcon';
import AddressCopier from '../links/AddressCopier';
import { BarLoader } from '../loaders/BarLoader';
import { ManageDAOMenu } from '../menus/ManageDAO/ManageDAOMenu';
/**
 * Info card used on the DAO homepage.
 */
export function DAOInfoCard() {
  const node = useDaoInfoStore();
  const { addressPrefix } = useNetworkConfigStore();
  // for non Fractal Safes
  const displayedAddress = node.safe?.address;
  const { displayName } = useGetAccountName(displayedAddress);
  const { toggleFavorite, isFavorite } = useAccountFavorites();

  // node hasn't loaded yet
  if (!node || !displayedAddress) {
    return (
      <Flex
        w="full"
        minH="full"
      >
        <Center w="100%">
          <BarLoader />
        </Center>
      </Flex>
    );
  }

  const daoName = node.subgraphInfo?.daoName || displayName;

  return (
    <Box>
      <Flex
        direction="column"
        gap="1.5rem"
      >
        <Flex
          alignItems="center"
          columnGap="0.5rem"
          justifyContent="space-between"
          flexGrow={1}
        >
          <Flex
            alignItems="center"
            columnGap="0.5rem"
          >
            <Image src={getNetworkIcon(addressPrefix)} />
            {/* PARENT TAG */}
            {!!node.subgraphInfo && node.subgraphInfo.childAddresses.length > 0 && (
              <Link
                to={DAO_ROUTES.hierarchy.relative(addressPrefix, displayedAddress)}
                as={RouterLink}
                _hover={{ textDecoration: 'none', bg: 'neutral-4' }}
                _active={{ bg: 'neutral-3', borderColor: 'neutral-4' }}
                bg="neutral-3"
                color="lilac-0"
                borderRadius="625rem"
                p="0.25rem 0.75rem"
                textStyle="body-large"
              >
                Parent
              </Link>
            )}
          </Flex>
          <Flex
            alignItems="center"
            gap={4}
          >
            {/* FAVORITE ICON */}
            <FavoriteIcon
              isFavorite={isFavorite(displayedAddress)}
              toggleFavoriteCallback={() => toggleFavorite(displayedAddress, daoName)}
            />
            {/* SETTINGS MENU BUTTON */}
            <ManageDAOMenu />
          </Flex>
        </Flex>
        {/* DAO NAME AND ACTIONS */}

        <Flex
          alignItems="flex-start"
          columnGap="0.5rem"
        >
          {/* DAO NAME */}
          <Text
            textStyle="heading-large"
            data-testid="DAOInfo-name"
          >
            {daoName}
          </Text>
        </Flex>

        {/* DAO ADDRESS */}
        <AddressCopier address={displayedAddress} />

        {/* SNAPSHOT ICON LINK */}
        {node.subgraphInfo?.daoSnapshotENS && (
          <SnapshotButton snapshotENS={node.subgraphInfo.daoSnapshotENS} />
        )}
      </Flex>
    </Box>
  );
}
