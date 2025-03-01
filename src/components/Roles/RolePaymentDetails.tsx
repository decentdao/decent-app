import { Box, Button, Flex, Grid, GridItem, Icon, Image, Tag, Text } from '@chakra-ui/react';
import { CalendarBlank, Download, Link } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Address, getAddress, Hex } from 'viem';
import { useAccount } from 'wagmi';
import { DETAILS_BOX_SHADOW } from '../../constants/common';
import { DAO_ROUTES } from '../../constants/routes';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { useRolesStore } from '../../store/roles/useRolesStore';
import { BigIntValuePair } from '../../types';
import { DEFAULT_DATE_FORMAT, formatCoin } from '../../utils';
import { isDemoMode } from '../../utils/demoMode';
import { ModalType } from '../ui/modals/ModalProvider';
import { useDecentModal } from '../ui/modals/useDecentModal';

function getPaymentContainerProps(section: 'top' | 'bottom', isActiveStream: boolean) {
  const borderTopRadius = section === 'top' ? '0.75rem' : '0';
  const borderBottomRadius = section === 'bottom' ? '0.75rem' : '0';
  const borderBottom = section === 'bottom' ? '1px solid' : 'none';

  return isActiveStream
    ? {
        bg: 'neutral-2',
        sx: undefined,
        boxShadow: DETAILS_BOX_SHADOW,
        borderTopRadius,
        borderBottomRadius,
        py: '1rem',
      }
    : {
        sx: {
          p: {
            color: 'neutral-6',
          },
        },
        bg: 'none',
        boxShadow: 'none',
        border: '1px solid',
        borderBottom,
        borderTopRadius,
        borderBottomRadius,
        py: '1rem',
        borderColor: 'neutral-4',
      };
}

function PaymentDate({ label, date }: { label: string; date?: Date }) {
  const { t } = useTranslation(['roles']);
  return (
    <Flex
      flexDir="column"
      gap="0.5rem"
    >
      <Text
        textStyle="labels-small"
        color="neutral-7"
      >
        {t(label)}
      </Text>
      <Flex
        gap="0.25rem"
        alignItems="center"
      >
        <Icon
          boxSize="1rem"
          as={CalendarBlank}
          color={date ? 'lilac-0' : 'neutral-6'}
        />
        <Text
          textStyle="labels-small"
          color={date ? 'white-0' : 'neutral-6'}
        >
          {date ? format(date, DEFAULT_DATE_FORMAT) : '---'}
        </Text>
      </Flex>
    </Flex>
  );
}

function TermedAssigned({ termNumber }: { termNumber: number }) {
  const { t } = useTranslation(['roles']);
  return (
    <Flex
      flexDir="column"
      gap="0.5rem"
    >
      <Text
        textStyle="labels-small"
        color="neutral-7"
      >
        {t('assigned')}
      </Text>
      <Flex
        alignItems="center"
        gap={2}
      >
        <Icon
          boxSize="1rem"
          as={Link}
          color="lila-0"
        />
        <Text
          textStyle="labels-small"
          color="white-0"
        >
          {t('termNumber', { number: termNumber })}
        </Text>
      </Flex>
    </Flex>
  );
}

function GreenStreamingDot({ isStreaming }: { isStreaming: boolean }) {
  if (!isStreaming) {
    return null;
  }
  return (
    <Box
      boxSize="0.75rem"
      borderRadius="100%"
      bg="celery--2"
      border="1px solid"
      borderColor="celery--5"
    />
  );
}
interface PaymentDetailsTopProps {
  payment: {
    asset: { logo: string; symbol: string; decimals: number };
    amount: BigIntValuePair;
    isCancelled: boolean;
    isCancelling?: boolean;
    isStreaming: () => boolean;
    isCancelableStream: boolean;
  };
  onClick?: () => void;
  isActiveStream: boolean;
}
function PaymentDetailsTop({ payment, onClick, isActiveStream }: PaymentDetailsTopProps) {
  const { t } = useTranslation(['roles']);
  return (
    <Box
      onClick={onClick}
      cursor={onClick ? 'pointer' : 'default'}
      {...getPaymentContainerProps('top', isActiveStream)}
    >
      <Flex
        flexDir="column"
        mx={4}
      >
        <Flex justifyContent="space-between">
          <Flex gap={2}>
            <Image
              h="1.5rem"
              src={payment.asset.logo}
              fallbackSrc="/images/coin-icon-default.svg"
            />
            <Text
              textStyle="heading-small"
              color="white-0"
            >
              {payment.amount?.bigintValue
                ? formatCoin(
                    payment.amount.bigintValue,
                    false,
                    payment.asset.decimals,
                    payment.asset.symbol,
                  )
                : undefined}
            </Text>
          </Flex>
          <Flex gap={6}>
            {(payment.isCancelled || payment.isCancelling) && (
              <Tag
                variant="outlined"
                color="red-1"
                outline="unset"
                border="1px solid"
                py={0}
                px={2}
                height={6}
                borderRadius="lg"
              >
                {t('cancelled')}
              </Tag>
            )}
            {!payment.isCancelableStream && (
              <Tag
                variant="outlined"
                color="yellow-0"
                outline="unset"
                border="1px solid"
                py={0}
                px={2}
                height={6}
                borderRadius="lg"
              >
                {t('nonCancelable')}
              </Tag>
            )}
            <GreenStreamingDot isStreaming={payment.isStreaming()} />
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}

interface PaymentDetailsBottomProps {
  payment: {
    startDate: Date;
    endDate: Date;
    cliffDate?: Date;
    withdrawableAmount?: bigint;
  };
  assignedTerm?: { termNumber: number };
  canWithdraw: boolean;
  handleClickWithdraw: () => void;
}
function PaymentDetailsBottom({
  payment,
  assignedTerm,
  canWithdraw,
  handleClickWithdraw,
}: PaymentDetailsBottomProps) {
  const { t } = useTranslation(['roles']);
  return (
    <Box {...getPaymentContainerProps('bottom', !payment.startDate ? false : true)}>
      <Grid
        mx={4}
        templateAreas='"starting dividerOne cliff dividerTwo ending"'
        templateColumns="1fr 24px 1fr 24px 1fr"
      >
        <GridItem area="starting">
          {assignedTerm ? (
            <TermedAssigned termNumber={assignedTerm.termNumber} />
          ) : (
            <PaymentDate
              label="starting"
              date={payment.startDate}
            />
          )}
        </GridItem>
        <GridItem area="dividerOne">
          <Box
            borderLeft="1px solid"
            borderColor="white-alpha-08"
            h="full"
            boxShadow={DETAILS_BOX_SHADOW}
            w="0"
          />
        </GridItem>
        <GridItem area="cliff">
          <PaymentDate
            label="cliff"
            date={payment.cliffDate}
          />
        </GridItem>
        <GridItem area="dividerTwo">
          <Box
            borderLeft="1px solid"
            borderColor="white-alpha-08"
            h="full"
            boxShadow={DETAILS_BOX_SHADOW}
            w="0"
          />
        </GridItem>
        <GridItem area="ending">
          <PaymentDate
            label="ending"
            date={payment.endDate}
          />
        </GridItem>
      </Grid>
      {canWithdraw && (
        <Box
          mt={4}
          px={4}
        >
          <Button
            w="full"
            isDisabled={!((payment?.withdrawableAmount ?? 0n) > 0n)}
            leftIcon={<Download />}
            onClick={handleClickWithdraw}
          >
            {t('withdraw')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
interface RolePaymentDetailsProps {
  roleHatWearerAddress?: Address;
  roleHatSmartAccountAddress?: Address;
  roleHatId?: Hex;
  roleTerms: { termEndDate: Date; termNumber: number; nominee: string }[];
  payment: {
    streamId?: string;
    contractAddress?: Address;
    recipient?: Address;
    asset: {
      logo: string;
      symbol: string;
      decimals: number;
      address: Address;
    };
    amount: BigIntValuePair;
    startDate: Date;
    endDate: Date;
    cliffDate?: Date;
    isCancelled: boolean;
    isCancelling?: boolean;
    isCancelableStream: boolean;
    isStreaming: () => boolean;
    withdrawableAmount?: bigint;
  };
  onClick?: () => void;
  showWithdraw?: boolean;
}
export function RolePaymentDetails({
  payment,
  onClick,
  showWithdraw,
  roleHatWearerAddress,
  roleHatSmartAccountAddress,
  roleHatId,
  roleTerms,
}: RolePaymentDetailsProps) {
  const { safe } = useDaoInfoStore();
  const { address: connectedAccount } = useAccount();
  const { addressPrefix } = useNetworkConfigStore();
  const { refreshWithdrawableAmount } = useRolesStore();
  const navigate = useNavigate();
  const publicClient = useNetworkPublicClient();
  const canWithdraw = useMemo(() => {
    if (
      connectedAccount &&
      (connectedAccount === payment.recipient || connectedAccount === roleHatWearerAddress) &&
      !!showWithdraw
    ) {
      return true;
    }
    return isDemoMode();
  }, [connectedAccount, payment.recipient, showWithdraw, roleHatWearerAddress]);

  const assignedTerm = useMemo(() => {
    return roleTerms.find(term => term.termEndDate.getTime() === payment.endDate.getTime());
  }, [payment.endDate, roleTerms]);

  const [modalType, props] = useMemo(() => {
    if (!payment.streamId || !payment.contractAddress || !roleHatWearerAddress || !roleHatId) {
      return [ModalType.NONE] as const;
    }
    let recipient = roleHatWearerAddress;
    if (assignedTerm) {
      if (!assignedTerm.nominee) {
        throw new Error('Assigned term nominee is missing');
      }
      recipient = getAddress(assignedTerm.nominee);
    }
    return [
      ModalType.WITHDRAW_PAYMENT,
      {
        paymentAssetLogo: payment.asset.logo,
        paymentAssetSymbol: payment.asset.symbol,
        paymentAssetDecimals: payment.asset.decimals,
        paymentStreamId: payment.streamId,
        paymentContractAddress: payment.contractAddress,
        onSuccess: () => refreshWithdrawableAmount(roleHatId, payment.streamId!, publicClient),
        withdrawInformation: {
          withdrawableAmount: payment.withdrawableAmount,
          recipient,
          roleHatSmartAccountAddress,
        },
      },
    ] as const;
  }, [
    payment,
    roleHatSmartAccountAddress,
    roleHatWearerAddress,
    refreshWithdrawableAmount,
    publicClient,
    roleHatId,
    assignedTerm,
  ]);

  const withdraw = useDecentModal(modalType, props);

  const handleClickWithdraw = useCallback(() => {
    if (safe?.address) {
      navigate(DAO_ROUTES.roles.relative(addressPrefix, safe.address));
      withdraw();
    }
  }, [addressPrefix, navigate, safe?.address, withdraw]);

  const isActiveStream =
    !payment.isCancelled && Date.now() < payment.endDate.getTime() && !payment.isCancelling;

  return (
    <Flex
      my="0.75rem"
      w="full"
      position="relative"
    >
      <Box
        w="full"
        zIndex={2}
        transitionDuration="300ms"
        transitionProperty="all"
        transitionTimingFunction="ease-out"
      >
        <PaymentDetailsTop
          payment={payment}
          onClick={onClick}
          isActiveStream={isActiveStream}
        />

        <PaymentDetailsBottom
          payment={payment}
          assignedTerm={assignedTerm}
          canWithdraw={canWithdraw}
          handleClickWithdraw={handleClickWithdraw}
        />
      </Box>
    </Flex>
  );
}
