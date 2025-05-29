import { Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import DraggableDrawer, {
  DrawerControllingProps,
} from '../../components/ui/containers/DraggableDrawer';
import { ErrorBoundary } from '../../components/ui/utils/ErrorBoundary';
import { MySafesErrorFallback } from '../../components/ui/utils/MySafesErrorFallback';
import { useAccountFavorites } from '../../hooks/DAO/loaders/useFavorites';
import { SafeDisplayRow } from './SafeDisplayRow';

export function AllSafesDrawer({ isOpen, onClose, onOpen }: DrawerControllingProps) {
  const { t } = useTranslation('home');
  const { favoritesList } = useAccountFavorites();

  return (
    <DraggableDrawer
      headerContent={
        <Text
          color="color-neutral-300"
          textStyle="text-sm-medium"
        >
          {t('mySafes')}
        </Text>
      }
      isOpen={isOpen}
      onClose={onClose}
      onOpen={onOpen}
    >
      <ErrorBoundary fallback={MySafesErrorFallback}>
        {favoritesList.map(favorite => (
          <SafeDisplayRow
            key={`${favorite.networkPrefix}:${favorite.address}`}
            network={favorite.networkPrefix}
            address={favorite.address}
            name={favorite.name}
            onClick={onClose}
          />
        ))}
      </ErrorBoundary>
    </DraggableDrawer>
  );
}
