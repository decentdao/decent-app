import { Box, BoxProps, IconButton, Tooltip } from '@chakra-ui/react';
import { StarGoldSolid, StarOutline } from '@decent-org/fractal-ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getAddress } from 'viem';
import { useAccountFavorites } from '../../../hooks/DAO/loaders/useFavorites';

interface Props extends BoxProps {
  safeAddress: string;
}

export default function FavoriteIcon({ safeAddress, ...rest }: Props) {
  const { favoritesList, toggleFavorite } = useAccountFavorites();
  const isFavorite = useMemo(
    () => (!!safeAddress ? favoritesList.includes(getAddress(safeAddress)) : false),
    [favoritesList, safeAddress],
  );
  const { t } = useTranslation();
  return (
    <Box {...rest}>
      <Tooltip label={t('favoriteTooltip')}>
        <IconButton
          color="gold.500"
          _hover={{ color: 'gold.500-hover' }}
          variant="ghost"
          minWidth="0px"
          icon={isFavorite ? <StarGoldSolid boxSize="1.5rem" /> : <StarOutline boxSize="1.5rem" />}
          onClick={() => toggleFavorite(safeAddress)}
          aria-label={t('favoriteTooltip')}
        />
      </Tooltip>
    </Box>
  );
}
