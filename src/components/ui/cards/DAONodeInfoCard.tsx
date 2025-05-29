import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { Address } from 'viem';
import { useAccountFavorites } from '../../../hooks/DAO/loaders/useFavorites';
import { DaoHierarchyStrategyType } from '../../../types';
import { SnapshotButton } from '../badges/Snapshot';
import { FavoriteIcon } from '../icons/FavoriteIcon';
import AddressCopier from '../links/AddressCopier';

export const NODE_HEIGHT_REM = 6.75;
export const NODE_MARGIN_TOP_REM = 1.25;

/**
 * Info card used on each DAO in the hierarchy page.
 *
 * It is *very* important to understand that all DAO info needs to be passed into
 * this component, as this card is independent of your current DAO context, since
 * it is used in the hierarchy, where there are multiple DAO nodes being displayed.
 *
 * Simply using the useDAOStore() hook to get info will end up with the current DAO's
 * context being displayed in ALL the node cards in a hierarchy, which is incorrect.
 */
export function DAONodeInfoCard(props: {
  daoAddress: Address;
  daoName: string;
  daoSnapshotENS: string | null;
  isCurrentViewingDAO: boolean;
  votingStrategies: DaoHierarchyStrategyType[];
}) {
  const { daoAddress, daoName, daoSnapshotENS, isCurrentViewingDAO, votingStrategies } = props;

  const { toggleFavorite, isFavorite } = useAccountFavorites();

  return (
    <Box
      minH={`${NODE_HEIGHT_REM}rem`}
      bg="color-neutral-950"
      _hover={
        !isCurrentViewingDAO
          ? {
              bg: 'color-neutral-900',
              border: '1px solid',
              borderColor: 'color-neutral-800',
            }
          : {}
      }
      p="1.5rem"
      width="100%"
      borderRadius="0.75rem"
      border={isCurrentViewingDAO ? '4px solid' : '1px'}
      borderColor={isCurrentViewingDAO ? 'color-neutral-800' : 'transparent'}
    >
      <Flex justifyItems="space-between">
        <Flex w="full">
          <VStack
            gap="0.5rem"
            alignItems="left"
          >
            {/* DAO NAME */}
            <Flex
              gap="0.5rem"
              alignItems="center"
            >
              {/* DAO NAME */}

              <Text textStyle="text-2xl-regular">{daoName}</Text>

              {/* FAVORITE ICON */}
              <FavoriteIcon
                isFavorite={isFavorite(daoAddress)}
                toggleFavoriteCallback={() => toggleFavorite(daoAddress, daoName)}
                data-testid="DAOInfo-favorite"
              />

              {/* SNAPSHOT ICON LINK */}
              {daoSnapshotENS && <SnapshotButton snapshotENS={daoSnapshotENS} />}
            </Flex>

            {/* DAO ADDRESS */}
            <AddressCopier address={daoAddress} />
          </VStack>
        </Flex>
        <Flex gap="0.5rem">
          {votingStrategies.map((type, index) => (
            <Box
              key={index}
              borderRadius="9999px"
              bg="color-neutral-900"
              px="0.75rem"
              py="0.25rem"
              h="fit-content"
            >
              <Text
                textStyle="label-large"
                color="color-lilac-100"
                whiteSpace="nowrap"
              >
                {/* Convert multisig badge casing here since it's already been cached to avoid another migration */}
                {type === 'MULTISIG' ? `${type[0]}${type.slice(1).toLocaleLowerCase()}` : type}
              </Text>
            </Box>
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}
