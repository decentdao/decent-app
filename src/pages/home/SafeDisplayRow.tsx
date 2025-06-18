import { Flex, Image, Show, Spacer, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Address } from 'viem';
import Avatar from '../../components/ui/page/Header/Avatar';
import { DAO_ROUTES } from '../../constants/routes';
import { useNetworkEnsAvatar } from '../../hooks/useNetworkEnsAvatar';
import { createAccountSubstring } from '../../hooks/utils/useGetAccountName';
import { useGetSafeName } from '../../hooks/utils/useGetSafeName';
import { getChainIdFromPrefix, getChainName, getNetworkIcon } from '../../utils/url';

interface SafeDisplayRowProps {
  network: string;
  address: Address;
  name: string | undefined;
  showAddress?: boolean;
  onClick?: () => void;
}

export function SafeDisplayRow({
  address,
  network,
  onClick,
  showAddress,
  name,
}: SafeDisplayRowProps) {
  const navigate = useNavigate();
  const { getSafeName } = useGetSafeName(getChainIdFromPrefix(network));
  const [safeName, setSafeName] = useState(name);

  useEffect(() => {
    if (!safeName) {
      getSafeName(address).then(setSafeName);
    }
  }, [address, getSafeName, safeName]);

  const { t } = useTranslation('dashboard');

  const { data: avatarURL } = useNetworkEnsAvatar({ name: safeName });

  const onClickNav = () => {
    if (onClick) onClick();

    navigate(DAO_ROUTES.dao.relative(network, address));
  };

  const nameColor = showAddress ? 'color-neutral-300' : 'color-white';

  return (
    <Flex
      maxW="100%"
      p="1.5rem"
      my="0.5rem"
      gap="0.75rem"
      alignItems="center"
      onClick={onClickNav}
      backgroundColor="color-neutral-950"
      cursor="pointer"
      _hover={{
        backgroundColor: 'color-neutral-900',
        border: '1px solid',
        borderColor: 'color-neutral-800',
      }}
      transition="all ease-out 300ms"
      borderRadius="0.5rem"
      border="1px solid"
      borderColor="transparent"
      _active={{ borderColor: 'color-neutral-800' }}
    >
      <Avatar
        size="lg"
        address={address}
        url={avatarURL}
      />
      <Flex flexDir="column">
        <Text
          color={safeName ? nameColor : 'color-neutral-400'}
          textStyle={showAddress ? 'text-sm-medium' : 'text-lg-regular'}
        >
          {safeName || t('loadingFavorite')}
        </Text>
        {showAddress && <Text textStyle="text-lg-regular">{createAccountSubstring(address)}</Text>}
      </Flex>

      <Spacer />

      {/* Network Icon */}
      <Flex gap="0.5rem">
        <Image src={getNetworkIcon(network)} />
        <Show above="md">
          <Text>{getChainName(network)}</Text>
        </Show>
      </Flex>
    </Flex>
  );
}
