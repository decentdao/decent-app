import {
  Box,
  Button,
  Grid,
  GridItem,
  Text,
  Badge,
  HStack,
  Icon,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { DotsThreeVertical, MagnifyingGlass } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { DETAILS_BOX_SHADOW } from '../../../constants/common';

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

function useDAOAgreements() {
  const mockAgreements = [
    {
      id: '1',
      title: 'Title',
      amount: '$24.00',
      status: 'Ready to sign',
      counterparties: { current: 0, total: 10 },
      deadline: '23/05/2025',
    },
    {
      id: '2',
      title: 'Title',
      amount: '$24.00',
      status: 'Ready to sign',
      counterparties: { current: 0, total: 10 },
      deadline: '23/05/2025',
    },
    {
      id: '3',
      title: 'Title',
      amount: '$24.00',
      status: 'Ready to sign',
      counterparties: { current: 0, total: 10 },
      deadline: '23/05/2025',
    },
  ];

  return { agreements: mockAgreements };
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
      >
        {/* Additional actions to right of title */}
        <Button
          onClick={() => {
            // TODO: Open agreement creation modal
          }}
        >
          {t('createAgreement')}
        </Button>
      </PageHeader>

      <Box
        p="1.5rem"
        boxShadow={DETAILS_BOX_SHADOW}
        borderRadius="0.75rem"
        bg="color-neutral-950"
      >
        <AgreementSearch />
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
              <>
                <AgreementTableRowItem
                  rowContent={agreement.title}
                  isEdgeItem={isEdgeItem}
                />
                <AgreementTableRowItem
                  rowContent={agreement.amount}
                  isEdgeItem={isEdgeItem}
                />

                <AgreementTableRowItem
                  rowContent={
                    <Badge
                      borderRadius="full"
                      px={3}
                      py={1}
                      bg="white"
                      color="black"
                    >
                      {agreement.status}
                    </Badge>
                  }
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
              </>
            );
          })}
        </Grid>
      </Box>
    </>
  );
}
