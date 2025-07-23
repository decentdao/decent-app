import { Flex, Tab, TabList, Tabs, Text } from '@chakra-ui/react';
import { PropsWithChildren, useState } from 'react';
import StyledTable, { StyledTableData } from './StyledTable';

function BadgeText({ children }: PropsWithChildren) {
  return (
    <Flex
      padding="2px 4px"
      justifyContent="center"
      alignItems="center"
      gap="1px"
      borderRadius="9999px"
      background="color-content-content2"
    >
      <Flex
        padding="0px 2px"
        alignItems="center"
        gap="4px"
      >
        <Flex
          padding="0px 4px"
          justifyContent="center"
          alignItems="center"
          flexShrink={0}
          aspectRatio="1/1"
          borderRadius="9999px"
          background="color-content-content1-foreground"
        ></Flex>
        <Text
          color="color-content-content1-foreground"
          textStyle="text-xs-medium"
        >
          {children}
        </Text>
      </Flex>
    </Flex>
  );
}

const transactionsData: StyledTableData = {
  head: ['Date', 'Action', 'Amount', 'Tx Hash / Link'],
  body: [
    ['10/07/2025 13:33', <BadgeText key={1}>Staked</BadgeText>, '1,500 DRVN', '0x1234...abcd'],
    [
      '08/07/2025 09:23',
      <BadgeText key={2}>Claimed</BadgeText>,
      'Multiple Tokens',
      '0x2234...abcd',
    ],
    ['07/07/2025 10:03', <BadgeText key={3}>Claimed</BadgeText>, '85.50 USDC', '0x3234...abcd'],
    ['06/07/2025 11:33', <BadgeText key={4}>Unstaked</BadgeText>, '5,000 DRVN', '0x4234...abcd'],
  ],
};

const revenueShareHistoryData: StyledTableData = {
  head: ['Date', 'Revenue Source', 'Your Share', 'Tx Hash'],
  body: [
    ['10/07/2025 13:33', 'Protocol Fees', '1,500 DRVN', '0x1234...abcd'],
    ['08/07/2025 09:23', 'Treasury Yield', 'Multiple Tokens', '0x2234...abcd'],
    ['07/07/2025 10:03', 'Partnership Royalties', '85.50 USDC', '0x3234...abcd'],
  ],
};

export default function HistoryCard() {
  const [selectedTab, setSelectedTab] = useState<'Transactions' | 'Revenue Share History'>(
    'Transactions',
  );

  return (
    <>
      <Tabs
        variant="underlined"
        size="md"
      >
        <TabList>
          <Tab onClick={() => setSelectedTab('Transactions')}>Transactions</Tab>
          <Tab onClick={() => setSelectedTab('Revenue Share History')}>Revenue Share History</Tab>
        </TabList>
      </Tabs>

      {selectedTab === 'Transactions' ? (
        <StyledTable data={transactionsData} />
      ) : (
        <StyledTable data={revenueShareHistoryData} />
      )}
    </>
  );
}
