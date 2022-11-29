import { Box, Flex, IconButton, Text } from '@chakra-ui/react';
import {
  ArrowDownSm,
  StarGoldSolid,
  StarOutline,
  Copy,
  ArrowRightSm,
} from '@decent-org/fractal-ui';
import useDAOName from '../../../hooks/DAO/useDAOName';
import { useCopyText } from '../../../hooks/utils/useCopyText';
import useDisplayName from '../../../hooks/utils/useDisplayName';
import { useFractal } from '../../../providers/Fractal/hooks/useFractal';
import { ManageDAOMenu } from '../menus/ManageDAO/ManageDAOMenu';

interface IDAOInfoCard {
  safeAddress: string;
  toggleExpansion?: () => void;
  expanded?: boolean;
  numberOfChildrenDAO?: number;
  viewChildren?: boolean;
}

export function DAOInfoCard({
  safeAddress,
  toggleExpansion,
  expanded,
  numberOfChildrenDAO,
}: IDAOInfoCard) {
  const {
    account: {
      favorites: { isConnectedFavorited, toggleFavorite },
    },
  } = useFractal();
  const copyToClipboard = useCopyText();
  const { accountSubstring } = useDisplayName(safeAddress);
  const { daoRegistryName } = useDAOName({ address: safeAddress });
  return (
    <Flex
      justifyContent="space-between"
      w="full"
    >
      <Flex alignItems="center">
        {/* CARET */}
        {!!toggleExpansion && (
          <IconButton
            variant="ghost"
            minWidth="0px"
            aria-label="Favorite Toggle"
            icon={
              expanded ? (
                <ArrowDownSm
                  boxSize="1.5rem"
                  mr="1.5rem"
                />
              ) : (
                <ArrowRightSm
                  boxSize="1.5rem"
                  mr="1.5rem"
                />
              )
            }
            onClick={toggleExpansion}
          />
        )}
        {/* DAO NAME AND INFO */}
        <Flex
          flexDirection="column"
          gap="0.5rem"
        >
          <Flex
            alignItems="center"
            gap="1rem"
          >
            <Text
              as="h1"
              textStyle="text-2xl-mono-regular"
              color="grayscale.100"
            >
              {daoRegistryName}
            </Text>
            <IconButton
              variant="ghost"
              minWidth="0px"
              aria-label="Favorite Toggle"
              icon={
                isConnectedFavorited ? (
                  <StarGoldSolid boxSize="1.5rem" />
                ) : (
                  <StarOutline boxSize="1.5rem" />
                )
              }
              onClick={() => toggleFavorite(safeAddress)}
            />
            {!!numberOfChildrenDAO && (
              <Box
                bg="chocolate.500"
                borderRadius="4px"
                p="0.25rem 0.5rem"
              >
                <Text textStyle="text-sm-mono-semibold">{numberOfChildrenDAO}</Text>
              </Box>
            )}
          </Flex>
          <Flex
            alignItems="center"
            onClick={() => copyToClipboard(safeAddress)}
            gap="0.5rem"
          >
            <Text
              textStyle="text-base-mono-regular"
              color="grayscale.100"
            >
              {accountSubstring}
            </Text>
            <Copy />
          </Flex>
        </Flex>
      </Flex>
      {/* Veritical Elipsis */}
      {/* @todo add viewable conditions */}
      <ManageDAOMenu safeAddress={safeAddress} />
    </Flex>
  );
}

export function DAONodeCard(props: IDAOInfoCard) {
  const {
    gnosis: { safe },
  } = useFractal();

  const isCurrentDAO = props.safeAddress === safe.address;
  const border = isCurrentDAO ? { border: '1px solid', borderColor: 'drab.500' } : undefined;

  return (
    <Box
      h="6.75rem"
      bg="black.900-semi-transparent"
      p="1rem"
      borderRadius="0.5rem"
      w="full"
      {...border}
    >
      <DAOInfoCard {...props} />
    </Box>
  );
}
