import { Box, Button, Center, Flex, HStack, Icon, Image, Text } from '@chakra-ui/react';
import { ArrowDown, ArrowUp } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useDateTimeDisplay } from '../../../helpers/dateTime';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { TokenEventType, TransferDisplayData, TransferType } from '../../../types';
import { DecentTooltip } from '../../ui/DecentTooltip';
import DisplayTransaction from '../../ui/links/DisplayTransaction';
import EtherscanLink from '../../ui/links/EtherscanLink';
import { BarLoader } from '../../ui/loaders/BarLoader';

function getTransferEventLabel(eventType: TokenEventType) {
  switch (eventType) {
    case TokenEventType.WITHDRAW:
      return 'labelSent';
    case TokenEventType.DEPOSIT:
      return 'labelReceived';
    case TokenEventType.MINT:
      return 'labelMinted';
    default:
      throw new Error('Unknown event type');
  }
}

function TransferRow({ displayData }: { displayData: TransferDisplayData }) {
  const { t } = useTranslation(['treasury', 'common']);
  const { etherscanBaseURL } = useNetworkConfigStore();

  return (
    <Box
      py="0.25rem"
      px="0.75rem"
      _hover={{ cursor: 'pointer', bg: 'white-alpha-04' }}
      onClick={() => window.open(`${etherscanBaseURL}/tx/${displayData.transactionHash}`, '_blank')}
    >
      <HStack gap="1rem">
        <Flex
          minW="135px"
          alignItems="center"
          gap="0.5rem"
        >
          <Icon
            as={displayData.eventType === TokenEventType.WITHDRAW ? ArrowUp : ArrowDown}
            w="1.25rem"
            h="1.25rem"
            color="color-neutral-300"
          />
          <Box>
            <Text
              textStyle="text-xs-medium"
              color="color-neutral-300"
            >
              {t(getTransferEventLabel(displayData.eventType))}
            </Text>
            <Text>{useDateTimeDisplay(new Date(displayData.executionDate))}</Text>
          </Box>
        </Flex>
        <HStack
          w="30%"
          minW="15rem"
        >
          <Image
            src={displayData.image}
            fallbackSrc={
              displayData.transferType === TransferType.ERC721_TRANSFER
                ? '/images/nft-image-default.svg'
                : '/images/coin-icon-default.svg'
            }
            alt={displayData.assetDisplay}
            w="1.25rem"
            h="1.25rem"
          />
          <DecentTooltip
            label={
              displayData.transferType === TransferType.ERC721_TRANSFER
                ? undefined
                : displayData.fullCoinTotal
            }
            placement="top-start"
          >
            <Text
              noOfLines={1}
              data-testid={
                displayData.transferType === TransferType.ERC721_TRANSFER
                  ? 'link-token-name'
                  : 'link-token-amount'
              }
            >
              {(displayData.eventType === TokenEventType.WITHDRAW ? '- ' : '+ ') +
                displayData.assetDisplay}
            </Text>
          </DecentTooltip>
        </HStack>
        <HStack
          w="40%"
          justifyContent="flex-end"
          textAlign="end"
          onClick={e => e.stopPropagation()}
        >
          <DisplayTransaction
            data-testid="link-transfer-address"
            txHash={displayData.transactionHash}
          />
        </HStack>
      </HStack>
    </Box>
  );
}

function EmptyTransactions() {
  const { t } = useTranslation('treasury');
  return (
    <Text
      color="color-neutral-400"
      data-testid="text-empty-transactions"
      align="center"
      px={{ base: '1rem', lg: '1.5rem' }}
    >
      {t('textEmptyTransactions')}
    </Text>
  );
}

export function Transactions({ shownTransactions }: { shownTransactions: number }) {
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { transfers },
  } = useDAOStore({ daoKey });

  if (transfers === null) {
    return (
      <Center w="100%">
        <BarLoader />
      </Center>
    );
  }
  if (transfers.length === 0) return <EmptyTransactions />;
  return (
    <Box
      overflowX="auto"
      className="scroll-dark"
    >
      {transfers.slice(0, shownTransactions - 1).map((transfer, i) => (
        <TransferRow
          key={i}
          displayData={transfer}
        />
      ))}
    </Box>
  );
}

export function PaginationButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation('treasury');
  return (
    <Flex
      w="full"
      mt="1rem"
      justifyContent="center"
    >
      {/* @todo - this should be <Button variant="button-pill" /> from theme, same as CeleryButtonWithIcon */}
      <Button
        h="1.75rem"
        py="0.25rem"
        px="0.75rem"
        borderRadius="full"
        bg="color-neutral-900"
        color="color-lilac-100"
        onClick={onClick}
      >
        {t('textMoreTransactions')}
      </Button>
    </Flex>
  );
}

export function PaginationCount({ shownTransactions }: { shownTransactions: number }) {
  const { t } = useTranslation('treasury');
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { transfers },
    node: { safe },
  } = useDAOStore({ daoKey });

  const totalTransfers = transfers?.length;
  if (!totalTransfers || !safe?.address) {
    return null;
  }
  return (
    <Flex gap="0.25rem">
      <Text
        color="color-neutral-300"
        textStyle="text-sm-medium"
      >
        {t('transactionsShownCount', {
          count: totalTransfers > shownTransactions ? shownTransactions : totalTransfers,
        })}
      </Text>
      <EtherscanLink
        type="address"
        value={safe.address}
        p={0}
        isTextLink
        textStyle="text-sm-medium"
        borderWidth={0}
      >
        {t('transactionsTotalCount', { count: totalTransfers })}
      </EtherscanLink>
    </Flex>
  );
}
