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
          textStyle="text-xl-regular"
          color="color-white"
        >
          {name}
        </Text>
        <Text
          textStyle="text-sm-medium"
          color="color-lilac-100"
          _hover={{
            color: 'color-white',
            bg: 'color-neutral-800',
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
              textStyle="text-sm-medium"
              color="color-neutral-300"
              alignSelf="center"
            >
              {t('activePayments')}
            </Text>
            <Box
              bg="color-green-500"
              color="color-neutral-900"
              borderColor="color-neutral-900"
              borderWidth="2px"
              borderRadius="50%"
              w="1.25rem"
              h="1.25rem"
            >
              <Text
                textStyle="text-xs-medium"
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
            color="color-white"
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
          textStyle="text-xl-regular"
          color="color-lilac-100"
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
            color="color-lilac-100"
            boxSize="1.5rem"
          />
        </Flex>
      </Flex>
    </Card>
  );
}
