import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { CaretCircleRight, CaretRight } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Address, getAddress, zeroAddress } from 'viem';
import { useNetworkEnsAvatar } from '../../hooks/useNetworkEnsAvatar';
import { useGetAccountName } from '../../hooks/utils/useGetAccountName';
import { EditBadgeStatus, RoleEditProps, RoleProps } from '../../types/roles';
import { Card } from '../ui/cards/Card';
import Avatar from '../ui/page/Header/Avatar';
import EditBadge from './EditBadge';

export function AvatarAndRoleName({
  wearerAddress,
  name,
  paymentsCount,
}: {
  wearerAddress: Address | undefined;
  name?: string;
  paymentsCount?: number;
}) {
  const { displayName } = useGetAccountName(wearerAddress);

  const { data: avatarURL } = useNetworkEnsAvatar({ name: wearerAddress || zeroAddress });
  const { t } = useTranslation(['roles']);

  return (
    <Flex alignItems="top">
      {wearerAddress ? (
        <Avatar
          size="xl"
          address={getAddress(wearerAddress)}
          url={avatarURL}
        />
      ) : (
        <Box
          boxSize="3rem"
          borderRadius="100%"
          bg="white-alpha-04"
        />
      )}
      <Flex
        direction="column"
        ml="1.5rem"
        gap="0.25rem"
      >
        <Text
          textStyle="heading-small"
          color="white-0"
        >
          {name}
        </Text>
        <Text
          textStyle="labels-large"
          color="lilac-0"
          _hover={{
            color: 'white-0',
            bg: 'neutral-4',
          }}
          maxW="fit-content"
        >
          {displayName ?? t('unassigned')}
        </Text>
        {paymentsCount !== undefined && (
          <Flex
            gap="0.25rem"
            mt="0.5rem"
          >
            <Text
              textStyle="labels-large"
              color="neutral-7"
              alignSelf="center"
            >
              {t('activePayments')}
            </Text>
            <Box
              bg="celery--2"
              color="neutral-3"
              borderColor="neutral-3"
              borderWidth="2px"
              borderRadius="50%"
              w="1.25rem"
              h="1.25rem"
            >
              <Text
                textStyle="labels-small"
                lineHeight="1rem"
                align="center"
              >
                {paymentsCount}
              </Text>
            </Box>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export function RoleCard({
  name,
  wearerAddress,
  paymentsCount,
  handleRoleClick,
  isCurrentTermActive,
}: RoleProps) {
  return (
    <Card
      mb="1rem"
      cursor="pointer"
      onClick={handleRoleClick}
    >
      <Flex justifyContent="space-between">
        <AvatarAndRoleName
          wearerAddress={wearerAddress}
          name={name}
          paymentsCount={paymentsCount}
        />
        <EditBadge
          editStatus={isCurrentTermActive === false ? EditBadgeStatus.Inactive : undefined}
        />
      </Flex>
    </Card>
  );
}

export function RoleCardEdit({
  name,
  wearerAddress,
  payments,
  editStatus,
  handleRoleClick,
}: RoleEditProps) {
  const isRemovedRole = editStatus === EditBadgeStatus.Removed;
  return (
    <Card
      mb="1rem"
      onClick={!isRemovedRole ? handleRoleClick : undefined}
      cursor={!isRemovedRole ? 'pointer' : 'not-allowed'}
    >
      <Flex justifyContent="space-between">
        <AvatarAndRoleName
          wearerAddress={wearerAddress}
          name={name}
          paymentsCount={payments?.length}
        />
        <Flex
          alignItems="center"
          gap="1rem"
        >
          <EditBadge editStatus={editStatus} />
          <Icon
            as={CaretRight}
            color="white-0"
          />
        </Flex>
      </Flex>
    </Card>
  );
}

export function RoleCardShort({
  name,
  editStatus,
  handleRoleClick,
}: {
  name: string;
  editStatus?: EditBadgeStatus;
  handleRoleClick: () => void;
}) {
  return (
    <Card
      onClick={handleRoleClick}
      cursor="pointer"
      my="0.5rem"
      borderRadius="0.75rem"
    >
      <Flex justifyContent="space-between">
        <Text
          textStyle="heading-small"
          color="lilac-0"
        >
          {name}
        </Text>
        <Flex
          alignItems="center"
          gap="1rem"
        >
          <EditBadge editStatus={editStatus} />
          <Icon
            as={CaretCircleRight}
            color="lilac-0"
            boxSize="1.5rem"
          />
        </Flex>
      </Flex>
    </Card>
  );
}
