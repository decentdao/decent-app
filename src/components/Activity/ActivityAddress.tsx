import { Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { useGetAccountName } from '../../hooks/utils/useGetAccountName';
import EtherscanLink from '../ui/links/EtherscanLink';

export function ActivityAddress({
  address,
  isMe = false,
  addComma,
}: {
  address: Address;
  isMe?: boolean;
  addComma?: boolean;
}) {
  const { displayName } = useGetAccountName(address);
  const { t } = useTranslation('common');
  return (
    <EtherscanLink
      type="address"
      value={address}
    >
      <Text w="full">
        {displayName}
        {isMe && t('isMeSuffix')}
        {addComma && ', '}
      </Text>
    </EtherscanLink>
  );
}
