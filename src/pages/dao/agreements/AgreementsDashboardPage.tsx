import {
  Box,
  Grid,
  GridItem,
  Text,
  HStack,
  Icon,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { DotsThreeVertical, MagnifyingGlass } from '@phosphor-icons/react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { DETAILS_BOX_SHADOW } from '../../../constants/common';

function AgreementStatusLabel({ status }: { status: 'agreementStatusReadyToSign' }) {
  const { t } = useTranslation('agreements');

  const label = {
    agreementStatusReadyToSign: {
      bg: 'color-neutral-white',
      textColor: 'color-neutral-black',
    },
  };

  return (
    <Flex
      alignItems="center"
      gap="0.5rem"
    >
      <Box
        rounded="0.5rem"
        bg={label[status].bg}
        py="2px"
        px="4px"
      >
        <Text
          textStyle="text-sm-medium"
          color={label[status].textColor}
        >
          {t(status)}
        </Text>
      </Box>
    </Flex>
  );
}

function AgreementSearch() {
  const { t } = useTranslation('agreements');

  return (
    <Flex
      alignItems="center"
      justifyContent="flex-end"
      mb="1rem"
    >
      <InputGroup
        h="full"
        w="50%"
        flexDirection="column"
        justifyContent="center"
      >
        <InputLeftElement ml="0.5rem">
          <Icon
            as={MagnifyingGlass}
            boxSize="1rem"
            color="color-neutral-400"
          />
        </InputLeftElement>
        <Input
          background="color-neutral-950"
          size="baseAddonLeft"
          w="full"
          placeholder={t('agreementSearchPlaceholder')}
          onChange={() => {}}
          value={''}
          isInvalid={false}
          spellCheck="false"
          autoCapitalize="none"
          data-testid="search-input"
          sx={{
            paddingInlineStart: '3rem',
          }}
        />
      </InputGroup>
    </Flex>
  );
}

function AgreementTableHeaderRowItem({ label }: { label?: string }) {
  return (
    <GridItem
      p={4}
      borderBottom="1px solid"
      borderColor="color-neutral-700"
      textStyle="text-sm-medium"
      color="color-neutral-400"
      bg="white-alpha-04"
    >
      {label}
    </GridItem>
  );
}

function AgreementTableRowItem({
  rowContent,
  isEdgeItem,
}: {
  rowContent?: React.ReactNode;
  isEdgeItem: boolean;
}) {
  const border = isEdgeItem ? { borderTop: '1px solid', borderBottom: '1px solid' } : {};
  return (
    <GridItem
      p={4}
      {...border}
      borderColor="color-neutral-700"
      textStyle="text-sm-medium"
      color="color-neutral-400"
    >
      {rowContent}
    </GridItem>
  );
}

interface Agreement {
  id: string;
  title: string;
  amount: string;
  // @dev: this also controls badge UI
  status: 'agreementStatusReadyToSign';
  counterparties: { current: number; total: number };
  deadline: string;
  // TODO: Define actions as string or object array?
  actions: [];
}

function useDAOAgreements() {
  const mockAgreements: Agreement[] = [
    {
      id: '1',
      title: 'Title',
      amount: '$24.00',
      status: 'agreementStatusReadyToSign',
      counterparties: { current: 0, total: 10 },
      deadline: '23/05/2025',
      actions: [],
    },
    {
      id: '2',
      title: 'Title',
      amount: '$24.00',
      status: 'agreementStatusReadyToSign',
      counterparties: { current: 0, total: 10 },
      deadline: '23/05/2025',
      actions: [],
    },
    {
      id: '3',
      title: 'Title',
      amount: '$24.00',
      status: 'agreementStatusReadyToSign',
      counterparties: { current: 0, total: 10 },
      deadline: '23/05/2025',
      actions: [],
    },
  ];

  return { agreements: mockAgreements };
}

function AgreementTable({ agreements }: { agreements: Agreement[] }) {
  const { t } = useTranslation('agreements');

  return (
    <Grid
      templateColumns="1fr 0.8fr 0.8fr 1fr 0.8fr auto"
      borderRadius="0.75rem"
      border="1px solid"
      borderColor="color-charcoal-700"
      className="scroll-dark"
      overflow={{ base: 'auto', md: 'hidden' }}
    >
      {/* Header Row */}
      <AgreementTableHeaderRowItem label={t('agreementTableContractHeader')} />
      <AgreementTableHeaderRowItem label={t('agreementTableAmountHeader')} />
      <AgreementTableHeaderRowItem label={t('agreementTableStatusHeader')} />
      <AgreementTableHeaderRowItem label={t('agreementTableCounterPartiesHeader')} />
      <AgreementTableHeaderRowItem label={t('agreementTableDeadlineHeader')} />
      <AgreementTableHeaderRowItem />

      {/* Data Rows */}
      {agreements.map((agreement, index, arr) => {
        const isLastRow = index === arr.length - 1;
        const isFirstRow = index === 0;
        const isEdgeItem = isFirstRow || isLastRow;
        return (
          <Fragment key={agreement.id}>
            <AgreementTableRowItem
              rowContent={agreement.title}
              isEdgeItem={isEdgeItem}
            />
            <AgreementTableRowItem
              rowContent={agreement.amount}
              isEdgeItem={isEdgeItem}
            />

            <AgreementTableRowItem
              rowContent={<AgreementStatusLabel status={agreement.status} />}
              isEdgeItem={isEdgeItem}
            />
            <AgreementTableRowItem
              rowContent={
                <HStack>
                  <Text>
                    {agreement.counterparties.current} of {agreement.counterparties.total}
                  </Text>
                </HStack>
              }
              isEdgeItem={isEdgeItem}
            />
            <AgreementTableRowItem
              rowContent={agreement.deadline}
              isEdgeItem={isEdgeItem}
            />
            <AgreementTableRowItem
              rowContent={
                <>
                  {/* TODO: Action Menu */}
                  <Icon as={DotsThreeVertical} />
                </>
              }
              isEdgeItem={isEdgeItem}
            />
          </Fragment>
        );
      })}
    </Grid>
  );
}

export function AgreementsDashboardPage() {
  const { t } = useTranslation('agreements');

  // Mock data for demonstration
  const { agreements } = useDAOAgreements();

  return (
    <>
      <PageHeader
        title={t('agreements')}
        breadcrumbs={[
          {
            terminus: t('agreements'),
            path: '',
          },
        ]}
      />

      <Box
        p="1.5rem"
        boxShadow={DETAILS_BOX_SHADOW}
        borderRadius="0.75rem"
        bg="color-neutral-950"
      >
        <AgreementSearch />

        {agreements.length > 0 ? (
          <AgreementTable agreements={agreements} />
        ) : (
          <Text
            textAlign="center"
            color="color-neutral-800"
            p="1rem"
          >
            {t('noAgreements')}
          </Text>
        )}
      </Box>
    </>
  );
}
