import { Box, Flex, Icon, Show, Text } from '@chakra-ui/react';
import { CaretDown } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { useNetworkEnsAvatar } from '../../../../hooks/useNetworkEnsAvatar';
import { useGetAccountName } from '../../../../hooks/utils/useGetAccountName';
import Avatar from '../../page/Header/Avatar';

function ConnectWalletButton() {
  const { t } = useTranslation('menu');
  return (
    <Flex
      alignItems="center"
      gap="1"
    >
      {t('connectWallet')}
      <Show above="md">
        <Icon
          as={CaretDown}
          boxSize="1.5rem"
        />
      </Show>
    </Flex>
  );
}

function WalletMenuButton() {
  const user = useAccount();
  const account = user.address;
  const { displayName: accountDisplayName } = useGetAccountName(account);
  const { data: avatarURL } = useNetworkEnsAvatar({ name: accountDisplayName });

  if (!account) {
    return null;
  }

  return (
    <Flex
      alignItems="center"
      gap={{ base: '0.25rem', md: '0.75rem' }}
    >
      <Box>
        <Avatar
          address={account}
          url={avatarURL}
          size="md"
        />
      </Box>
      <Show above="md">
        <Text
          textStyle={{ base: 'labels-small', md: 'body-large' }}
          mb="1px"
        >
          {accountDisplayName}
        </Text>
        <Icon
          as={CaretDown}
          boxSize={{ base: '1rem', md: '1.5rem' }}
        />
      </Show>
    </Flex>
  );
}

export function AccountMenuButton() {
  const user = useAccount();
  return user.address ? <WalletMenuButton /> : <ConnectWalletButton />;
}
