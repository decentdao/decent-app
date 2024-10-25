import { Box, Flex, Icon, Image, Text } from '@chakra-ui/react';
import { CaretCircleRight, CaretRight } from '@phosphor-icons/react';
import { formatDuration, intervalToDuration } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Address, getAddress, zeroAddress } from 'viem';
import useAvatar from '../../../hooks/utils/useAvatar';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import { BigIntValuePair } from '../../../types';
import { Card } from '../../ui/cards/Card';
import EtherscanLink from '../../ui/links/EtherscanLink';
import Avatar from '../../ui/page/Header/Avatar';
import EditBadge from './EditBadge';
import { EditBadgeStatus } from './types';

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

  const avatarURL = useAvatar(wearerAddress || zeroAddress);
  const { t } = useTranslation(['roles']);

  return (
    <Flex alignItems="center">
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
        ml="1rem"
      >
        <Text
          textStyle="display-lg"
          color="white-0"
        >
          {name}
        </Text>
        <Text
          textStyle="button-small"
          color="neutral-7"
        >
          {displayName ?? t('unassigned')}
        </Text>
        {paymentsCount !== undefined && (
          <Flex
            mt="1rem"
            gap="0.25rem"
          >
            <Text
              textStyle="button-small"
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
                textStyle="helper-text-small"
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

function Payment({
  payment,
}: {
  payment: {
    asset: {
      address: Address;
      name: string;
      symbol: string;
      decimals: number;
      logo: string;
    };
    amount: BigIntValuePair;
    startDate: Date;
    endDate: Date;
    cliffDate?: Date;
  };
}) {
  const { t } = useTranslation(['roles']);
  const format = ['years', 'days', 'hours'];
  const endDate = formatDuration(
    intervalToDuration({
      start: payment.startDate,
      end: payment.endDate,
    }),
    { format },
  );
  const cliffDate =
    payment.cliffDate &&
    formatDuration(
      intervalToDuration({
        start: payment.startDate,
        end: payment.cliffDate,
      }),
      { format },
    );
  return (
    <Flex flexDir="column">
      <Box
        mt="0.25rem"
        ml="4rem"
      >
        <Text
          textStyle="button-small"
          color="neutral-7"
        >
          {t('payment')}
        </Text>
        <Flex
          textStyle="body-base"
          color="white-0"
          gap="0.25rem"
          alignItems="center"
          my="0.5rem"
        >
          <Image
            src={payment.asset.logo}
            fallbackSrc="/images/coin-icon-default.svg"
            alt={payment.asset.symbol}
            w="1.25rem"
            h="1.25rem"
          />
          {payment.amount.value}
          <EtherscanLink
            color="white-0"
            _hover={{ bg: 'transparent' }}
            textStyle="body-base"
            padding={0}
            borderWidth={0}
            value={payment.asset?.address ?? null}
            type="token"
            wordBreak="break-word"
          >
            {payment.asset.symbol}
          </EtherscanLink>
          <Flex
            flexDir="column"
            gap="0.25rem"
          >
            <Text>{endDate && `${t('after')} ${endDate}`}</Text>
          </Flex>
        </Flex>
        <Text>{cliffDate && `${t('cliff')} ${t('after')} ${cliffDate}`}</Text>
      </Box>
    </Flex>
  );
}

export function RoleCard({
  name,
  wearerAddress,
  paymentsCount,
  editStatus,
  handleRoleClick,
}: {
  editStatus?: EditBadgeStatus;
  handleRoleClick: () => void;
  name: string;
  wearerAddress?: Address;
  paymentsCount?: number;
}) {
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
        <Flex
          alignItems="center"
          gap="1rem"
        >
          <EditBadge editStatus={editStatus} />
        </Flex>
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
}: {
  handleRoleClick: () => void;
  name?: string;
  editStatus?: EditBadgeStatus;
  wearerAddress?: Address;
  payments?: {
    asset: {
      address: Address;
      name: string;
      symbol: string;
      decimals: number;
      logo: string;
    };
    amount: BigIntValuePair;
    startDate: Date;
    endDate: Date;
    cliffDate?: Date;
  }[];
}) {
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
      {payments &&
        payments.map((payment, index) => (
          <Payment
            key={index}
            payment={payment}
          />
        ))}
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
    >
      <Flex justifyContent="space-between">
        <Text
          textStyle="display-lg"
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
