import { Box, Center, Flex, Image, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { DAO_ROUTES } from '../../../constants/routes';
import { useAccountFavorites } from '../../../hooks/DAO/loaders/useFavorites';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
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
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe, subgraphInfo },
  } = useDAOStore({ daoKey });
  const { addressPrefix } = useNetworkConfigStore();
  // for non Fractal Safes
  const displayedAddress = safe?.address;
  const { displayName } = useGetAccountName(displayedAddress);
  const { toggleFavorite, isFavorite } = useAccountFavorites();

  // node hasn't loaded yet
  if (!safe || !displayedAddress) {
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

  const daoName = subgraphInfo?.daoName || displayName;

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
            {!!subgraphInfo && subgraphInfo.childAddresses.length > 0 && (
              <Link
                to={DAO_ROUTES.hierarchy.relative(addressPrefix, displayedAddress)}
                as={RouterLink}
                _hover={{ textDecoration: 'none', bg: 'color-neutral-800' }}
                _active={{ bg: 'color-neutral-900', borderColor: 'color-neutral-800' }}
                bg="color-neutral-900"
                color="color-lilac-100"
                borderRadius="625rem"
                p="0.25rem 0.75rem"
                textStyle="text-lg-regular"
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
            textStyle="text-3xl-regular"
            data-testid="DAOInfo-name"
          >
            {daoName}
          </Text>
        </Flex>

        {/* DAO ADDRESS */}
        <AddressCopier address={displayedAddress} />

        {/* SNAPSHOT ICON LINK */}
        {subgraphInfo?.daoSnapshotENS && (
          <SnapshotButton snapshotENS={subgraphInfo.daoSnapshotENS} />
        )}
      </Flex>
    </Box>
  );
}
