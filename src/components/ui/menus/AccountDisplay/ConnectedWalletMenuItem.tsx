import { Box, Button, Flex, MenuItem, Text } from '@chakra-ui/react';
import { CopySimple } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { useNetworkEnsAvatar } from '../../../../hooks/useNetworkEnsAvatar';
import { useCopyText } from '../../../../hooks/utils/useCopyText';
import { useGetAccountName } from '../../../../hooks/utils/useGetAccountName';
import Avatar from '../../page/Header/Avatar';

/**
 * Display to show a users connected wallet information
 * Allows for copying of address
 */
export function ConnectedWalletMenuItem() {
  const user = useAccount();
  const account = user.address;
  const { displayName: accountDisplayName } = useGetAccountName(account);
  const { data: avatarURL } = useNetworkEnsAvatar({ name: accountDisplayName });
  const copyTextToClipboard = useCopyText();
  const { t } = useTranslation('menu');

  if (!account) {
    return null;
  }
  return (
    <Box
      data-testid="accountMenu-wallet"
      cursor="default"
      pt="0.5rem"
      px="0.25rem"
    >
      <Text
        px="0.5rem"
        textStyle="labels-small"
        color="neutral-7"
      >
        {t('wallet')}
      </Text>
      <MenuItem
        as={Button}
        variant="tertiary"
        alignItems="center"
        aria-label="copy address"
        data-testid="walletmenu-copyAddress"
        onClick={() => copyTextToClipboard(account)}
        whiteSpace="pre-wrap"
        wordBreak="break-all"
        borderRadius="0.75rem"
        h="3rem"
        textOverflow="ellipsis"
        rightIcon={
          <Avatar
            size="lg"
            address={account}
            url={avatarURL}
          />
        }
      >
        <Flex
          alignItems="center"
          gap={2}
          w="full"
        >
          {accountDisplayName}
          <CopySimple size="1.5rem" />
        </Flex>
      </MenuItem>
    </Box>
  );
}
