import { Box, HStack, Image, Spacer, Text, Tooltip } from '@chakra-ui/react';
import { SquareSolidArrowDown, SquareSolidArrowUp } from '@decent-org/fractal-ui';
import { useTranslation } from 'react-i18next';
import { useDateTimeDisplay } from '../../../../helpers/dateTime';
import { useFractal } from '../../../../providers/App/AppProvider';
import { TransferType, AssetTransfer } from '../../../../types';
import { DisplayAddress } from '../../../ui/links/DisplayAddress';
import EtherscanLinkAddress from '../../../ui/links/EtherscanLinkAddress';
import EtherscanLinkTransaction from '../../../ui/links/EtherscanLinkTransaction';
import Divider from '../../../ui/utils/Divider';
import {
  TokenEventType,
  TransferDisplayData,
  useFormatTransfers,
} from '../hooks/useFormatTransfers';

function TransferRow({ displayData }: { displayData: TransferDisplayData }) {
  const { t } = useTranslation(['treasury', 'common']);
  return (
    <Box>
      <HStack
        align="center"
        marginTop="1rem"
        marginBottom={displayData.isLast ? '0rem' : '1rem'}
      >
        <HStack w="33%">
          <EtherscanLinkTransaction txHash={displayData.transactionHash}>
            {displayData.eventType == TokenEventType.WITHDRAW ? (
              <SquareSolidArrowUp
                w="1.5rem"
                h="1.5rem"
                color="grayscale.100"
              />
            ) : (
              <SquareSolidArrowDown
                w="1.5rem"
                h="1.5rem"
                color="#60B55E"
              />
            )}
          </EtherscanLinkTransaction>
          <Box paddingStart="0.5rem">
            <Text
              textStyle="text-sm-sans-regular"
              color="grayscale.100"
            >
              {t(displayData.eventType == TokenEventType.WITHDRAW ? 'labelSent' : 'labelReceived')}
            </Text>
            <Text
              textStyle="text-base-sans-regular"
              color="chocolate.200"
            >
              {useDateTimeDisplay(new Date(displayData.executionDate))}
            </Text>
          </Box>
        </HStack>
        <HStack w="33%">
          <Image
            src={displayData.image}
            fallbackSrc={
              displayData.transferType === TransferType.ERC721_TRANSFER
                ? '/images/nft-image-default.svg'
                : '/images/coin-icon-default.svg'
            }
            alt={displayData.assetDisplay}
            w="1.5rem"
            h="1.5rem"
          />
          <Tooltip
            label={
              displayData.transferType === TransferType.ERC721_TRANSFER
                ? undefined
                : displayData.fullCoinTotal
            }
            placement="top-start"
          >
            <Text
              textStyle="text-base-sans-regular"
              maxWidth="15rem"
              noOfLines={1}
              color={
                displayData.eventType === TokenEventType.WITHDRAW ? 'grayscale.100' : '#60B55E'
              }
              data-testid={
                displayData.transferType === TransferType.ERC721_TRANSFER
                  ? 'link-token-name'
                  : 'link-token-amount'
              }
            >
              {(displayData.eventType == TokenEventType.WITHDRAW ? '- ' : '+ ') +
                displayData.assetDisplay}
            </Text>
          </Tooltip>
        </HStack>
        <HStack w="33%">
          <Spacer />
          <DisplayAddress
            data-testid="link-transfer-address"
            address={displayData.transferAddress}
          />
        </HStack>
      </HStack>
      {!displayData.isLast && <Divider />}
    </Box>
  );
}

function EmptyTransactions() {
  const { t } = useTranslation('treasury');
  return (
    <Text
      textStyle="text-base-sans-regular"
      color="grayscale.100"
      data-testid="text-empty-transactions"
      marginTop="1rem"
      align="center"
    >
      {t('textEmptyTransactions')}
    </Text>
  );
}

function MoreTransactions({ address }: { address: string | null }) {
  const { t } = useTranslation('treasury');
  return (
    <EtherscanLinkAddress address={address}>
      <Text
        textStyle="text-sm-sans-regular"
        color="grayscale.100"
        data-testid="link-more-transactions"
        marginTop="1rem"
        align="center"
      >
        {t('textMoreTransactions')}
      </Text>
    </EtherscanLinkAddress>
  );
}

export function Transactions() {
  const {
    node: { daoAddress },
    treasury: { transfers },
  } = useFractal();

  const displayData: TransferDisplayData[] = useFormatTransfers(
    transfers ? (transfers.results as AssetTransfer[]) : [],
    daoAddress!,
  );

  if (!transfers || transfers.results.length === 0) return <EmptyTransactions />;

  return (
    <Box>
      {displayData.map((transfer, index) => {
        return (
          <TransferRow
            key={index}
            displayData={transfer}
          />
        );
      })}
      {transfers.next && <MoreTransactions address={daoAddress} />}
    </Box>
  );
}
