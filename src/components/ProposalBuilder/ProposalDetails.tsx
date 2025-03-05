import { Avatar, Box, HStack, Text, VStack } from '@chakra-ui/react';
import { Fragment, PropsWithChildren, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../assets/css/Markdown.css';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { BigIntValuePair } from '../../types/common';
import { CreateProposalTransaction, Stream } from '../../types/proposalBuilder';
import Markdown from '../ui/proposal/Markdown';
import CeleryButtonWithIcon from '../ui/utils/CeleryButtonWithIcon';
import Divider from '../ui/utils/Divider';

function TransactionValueContainer({ children }: PropsWithChildren<{}>) {
  return (
    <Box
      bg="neutral-2"
      borderRadius={4}
      padding={2}
    >
      <Text fontStyle="code-snippet-helper">{children}</Text>
    </Box>
  );
}

export function TransactionsDetails({
  transactions,
}: {
  transactions: CreateProposalTransaction<BigIntValuePair>[];
}) {
  const { t } = useTranslation(['proposalTemplate', 'proposal']);
  const { chain } = useNetworkConfigStore();

  return (
    <>
      {transactions.map((transaction, i) => {
        const valueBiggerThanZero = transaction.ethValue.bigintValue
          ? transaction.ethValue.bigintValue > 0n
          : false;
        return (
          <Fragment key={i}>
            <Text color="neutral-7">{t('labelTargetAddress', { ns: 'proposal' })}</Text>
            {transaction.targetAddress && (
              <TransactionValueContainer>{transaction.targetAddress}</TransactionValueContainer>
            )}
            <Divider />
            <Text color="neutral-7">{t('labelFunctionName', { ns: 'proposal' })}</Text>
            {transaction.functionName && (
              <TransactionValueContainer>{transaction.functionName}</TransactionValueContainer>
            )}
            {transaction.parameters.map((parameter, parameterIndex) => (
              <Fragment key={parameterIndex}>
                <Text color="neutral-7">{t('parameter')}</Text>
                {parameter.signature && (
                  <TransactionValueContainer>{parameter.signature}</TransactionValueContainer>
                )}
                <Text color="neutral-7">{!!parameter.label ? parameter.label : t('value')}</Text>
                {(parameter.label || parameter.value) && (
                  <TransactionValueContainer>
                    {parameter.value || t('userInput')}
                  </TransactionValueContainer>
                )}
              </Fragment>
            ))}
            <Divider />
            <HStack justifyContent="space-between">
              <Text color="neutral-7">{chain.nativeCurrency.symbol}</Text>
              <Text
                textAlign="right"
                color={valueBiggerThanZero ? 'white-0' : 'neutral-7'}
                wordBreak="break-all"
              >
                {valueBiggerThanZero ? transaction.ethValue.value : 'n/a'}
              </Text>
            </HStack>
          </Fragment>
        );
      })}
    </>
  );
}

export function StreamsDetails({ streams }: { streams: Stream[] }) {
  const { t } = useTranslation(['proposalTemplate', 'proposal']);

  return (
    <>
      {streams.map((stream, idx) => (
        <Fragment key={idx}>
          <Text color="neutral-7">{t('labelRecipientAddress', { ns: 'proposal' })}</Text>
          {stream.recipientAddress && (
            <TransactionValueContainer>{stream.recipientAddress}</TransactionValueContainer>
          )}
          <Divider />
          <Text color="neutral-7">{t('labelTotalAmount', { ns: 'proposal' })}</Text>
          {stream.totalAmount && (
            <TransactionValueContainer>{stream.totalAmount.value}</TransactionValueContainer>
          )}
          <Divider />
          <Text color="neutral-7">{t('labelTranches', { ns: 'proposal' })}</Text>
          {stream.tranches.map((tranche, trancheIdx) => (
            <Fragment key={trancheIdx}>
              <Text color="neutral-7">{t('labelTrancheAmount', { ns: 'proposal' })}</Text>
              <TransactionValueContainer>{tranche.amount.value}</TransactionValueContainer>
              <Text color="neutral-7">{t('labelTrancheDuration', { ns: 'proposal' })}</Text>
              <TransactionValueContainer>{tranche.duration.value}</TransactionValueContainer>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </>
  );
}

export function TemplateDetails({ title }: { title: string }) {
  const { t } = useTranslation(['proposalTemplate', 'proposal']);

  return (
    <HStack justifyContent="space-between">
      <Text color="neutral-7">{t('previewThumnbail')}</Text>
      <Avatar
        size="sm"
        w="28px"
        h="28px"
        name={title}
        borderRadius="4px"
        getInitials={(fullTitle: string) => fullTitle.slice(0, 2)}
      />
    </HStack>
  );
}

export default function ProposalDetails({
  title,
  description,
  transactionsDetails,
  templateDetails,
  streamsDetails,
}: {
  title: string;
  description: string;
  transactionsDetails: React.ReactNode;
  templateDetails: React.ReactNode;
  streamsDetails: React.ReactNode;
}) {
  const { t } = useTranslation(['proposalTemplate', 'proposal']);
  const [descriptionCollapsed, setDescriptionCollapsed] = useState(true);

  return (
    <Box
      rounded="lg"
      border="1px solid"
      borderColor="neutral-3"
      p={6}
      maxWidth="400px"
    >
      <VStack
        spacing={3}
        align="left"
      >
        <Text textStyle="heading-small">{t('preview')}</Text>
        <Divider />
        <HStack justifyContent="space-between">
          <Text color="neutral-7">{t('previewTitle')}</Text>
          <Text
            textAlign="right"
            width="66%"
          >
            {title}
          </Text>
        </HStack>
        {templateDetails}
        <HStack justifyContent="space-between">
          <Text color="neutral-7">{t('proposalTemplateDescription')}</Text>
          <CeleryButtonWithIcon
            onClick={() => setDescriptionCollapsed(prevState => !prevState)}
            text={t(descriptionCollapsed ? 'show' : 'hide', { ns: 'common' })}
          />
        </HStack>
        {!descriptionCollapsed && (
          <Markdown
            content={description}
            collapsedLines={100}
          />
        )}
        <Divider />
        {transactionsDetails}
        {streamsDetails}
      </VStack>
    </Box>
  );
}
