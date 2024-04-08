import { Box, Flex, Text } from '@chakra-ui/react';
import { ArrowDown } from '@decent-org/fractal-ui';
import { useTranslation } from 'react-i18next';
import useAvatar from '../../../../hooks/utils/useAvatar';
import useDisplayName from '../../../../hooks/utils/useDisplayName';
import { useFractal } from '../../../../providers/App/AppProvider';
import Avatar from '../../page/Header/Avatar';

export function NotConnected() {
  const { t } = useTranslation('menu');
  return (
    <Flex
      alignItems="center"
      gap="1"
    >
      <Text textStyle="text-sm-mono-medium">{t('connectWallet')}</Text>
      <ArrowDown fill="currentColor" />
    </Flex>
  );
}

export function Connected() {
  const {
    readOnly: { user },
  } = useFractal();
  const account = user.address;
  const { displayName: accountDisplayName } = useDisplayName(account);
  const avatarURL = useAvatar(accountDisplayName);

  if (!account) {
    return null;
  }

  return (
    <Flex
      alignItems="center"
      gap="0.75rem"
    >
      <Box mt="0.125rem">
        <Avatar
          address={account}
          url={avatarURL}
        />
      </Box>
      <Text textStyle="text-sm-mono-semibold">{accountDisplayName}</Text>
      <ArrowDown fill="currentColor" />
    </Flex>
  );
}

export function MenuButtonDisplay() {
  const {
    readOnly: { user },
  } = useFractal();
  if (!user.address) {
    return <NotConnected />;
  }
  return <Connected />;
}
