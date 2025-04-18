import { Box, BoxProps, Button, Icon, IconButton } from '@chakra-ui/react';
import { Star } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { DecentTooltip } from '../DecentTooltip';

interface Props extends BoxProps {
  isFavorite: boolean;
  toggleFavoriteCallback: () => void;
}

export function FavoriteIcon({ isFavorite, toggleFavoriteCallback, ...rest }: Props) {
  const { t } = useTranslation('common');
  return (
    <Box {...rest}>
      <DecentTooltip label={t('favoriteTooltip')}>
        <Button
          variant="tertiary"
          size="icon-md"
          as={IconButton}
          icon={
            <Icon
              as={Star}
              boxSize="1.25rem"
              weight={isFavorite ? 'fill' : 'regular'}
            />
          }
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            toggleFavoriteCallback();
          }}
          aria-label={t('favoriteTooltip')}
        />
      </DecentTooltip>
    </Box>
  );
}
