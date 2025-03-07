import { Button, Flex, Image, MenuItem, Spacer, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Address } from 'viem';
import { DAO_ROUTES } from '../../../../constants/routes';
import { useNetworkEnsAvatar } from '../../../../hooks/useNetworkEnsAvatar';
import { getNetworkIcon } from '../../../../utils/url';
import Avatar from '../../page/Header/Avatar';

export interface SafeMenuItemProps {
  network: string;
  address: Address;
  name: string;
  showAddress?: boolean;
  onClick?: () => void;
}

export function SafeMenuItem({ address, network, name }: SafeMenuItemProps) {
  const navigate = useNavigate();

  // if by chance the safe name is an ENS name, let's attempt to get the avatar for that
  const { data: avatarURL } = useNetworkEnsAvatar({ name });

  const { t } = useTranslation('dashboard');

  const onClickNav = () => {
    navigate(DAO_ROUTES.dao.relative(network, address));
  };

  return (
    <MenuItem
      as={Button}
      variant="tertiary"
      w="full"
      h="3rem"
      onClick={onClickNav}
      noOfLines={1}
      display="flex"
      alignItems="center"
      justifyContent="flex-start"
      rounded="0.75rem"
      gap={2}
    >
      <Avatar
        address={address}
        url={avatarURL}
      />
      <Flex flexDir="column">
        <Text
          color={name ? 'white-0' : 'neutral-6'}
          textStyle="body-large"
        >
          {name || t('loadingFavorite')}
        </Text>
      </Flex>

      <Spacer />

      {/* Network Icon */}
      <Image src={getNetworkIcon(network)} />
    </MenuItem>
  );
}
