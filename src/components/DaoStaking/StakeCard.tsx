import { Flex, Tab, TabList, Tabs, Text, Image } from '@chakra-ui/react';
import { Info } from '@phosphor-icons/react';

function BottomActions() {
  return (
    <Flex
      direction="column"
      alignItems="flex-start"
      gap={2}
      alignSelf="stretch"
    >
      <Flex
        direction="column"
        alignItems="flex-start"
        gap={2}
        alignSelf="stretch"
      >
        <Flex
          alignItems="flex-start"
          alignSelf="stretch"
        >
          <Text
            color="color-content-muted"
            textStyle="text-xs-regular"
          >
            Amount to Stake
          </Text>
        </Flex>

        <Flex
          padding={2}
          justifyContent="space-between"
          alignItems="center"
          alignSelf="stretch"
          borderRadius={8}
          border="1px solid var(--colors-color-layout-border);"
        >
          <Text
            color="color-layout-foreground"
            textStyle="text-3xl-regular"
          >
            325,000.00
          </Text>
          <Flex
            padding="8px"
            alignItems="center"
            gap="1px"
          >
            <Image
              src=""
              fallbackSrc="/images/coin-icon-default.svg"
              boxSize="2rem"
            />
            <Flex
              padding="0px 4px"
              alignItems="center"
              gap="4px"
            >
              <Text
                color="color-content-content1-foreground"
                textStyle="text-sm-medium"
              >
                DRVN
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Flex
          justifyContent="space-between"
          alignItems="center"
          alignSelf="stretch"
        >
          <Text
            color="color-content-content1-foreground"
            textStyle="text-xs-regular"
          >
            Available:{' '}
            <Text
              as="span"
              color="color-content-content4-foreground"
            >
              325.00L DRVN
            </Text>
          </Text>

          <Flex
            width={10}
            height={5}
            minWidth={5}
            minHeight={5}
            padding="2px 4px"
            justifyContent="center"
            alignItems="center"
            gap={0.25}
            borderRadius={8}
            background="color-content-content2"
          >
            <Text
              color="color-content-content1-foreground"
              textStyle="text-xs-medium"
            >
              Max
            </Text>
          </Flex>
        </Flex>
      </Flex>

      <Flex
        padding="12px 0px"
        justifyContent="flex-end"
        alignItems="flex-start"
        gap={2}
        alignSelf="stretch"
      >
        <Flex
          height="52px"
          padding="0px 32px"
          justifyContent="center"
          alignItems="center"
          gap={2}
          flex="1 0 0"
          borderRadius="8px"
          borderTop="1px solid var(--colors-color-layout-border-primary)"
          background="color-base-primary"
        >
          <Text
            color="color-base-primary-foreground"
            textStyle="text-base-regular"
          >
            Stake TOKEN
          </Text>
        </Flex>
      </Flex>

      <Flex
        padding="12px"
        alignItems="flex-start"
        gap="16px"
        alignSelf="stretch"
        borderRadius="12px"
        border="1px solid var(--colors-color-layout-border)"
        background="color-information-950"
      >
        <Flex
          alignItems="flex-start"
          gap="16px"
          flex="1 0 0"
          color="color-base-information-foreground"
        >
          <Info
            width="24px"
            height="24px"
            format="outline"
            weight="fill"
            color="var(--colors-color-base-information-foreground)"
          />

          <Flex
            direction="column"
            alignItems="flex-start"
            flex="1 0 0"
          >
            <Text
              color="color-base-information-foreground"
              textStyle="text-sm-medium"
            >
              Staking Information
            </Text>
            <Text
              color="color-base-information-foreground"
              textStyle="text-sm-regular"
              whiteSpace="pre-wrap"
            >
              {
                ' • Staking locks all tokens for {minimumStakingPeriod}. \n • Locked tokens can’t be transferred or unstaked.\n • Each new stake resets the lock period.'
              }
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default function StakeCard() {
  return (
    <Flex
      direction="column"
      alignItems="flex-start"
      gap="16px"
    >
      <Flex
        direction="column"
        alignItems="flex-start"
        gap="16px"
      >
        <Flex
          alignItems="flex-start"
          gap={3}
          alignSelf="stretch"
        >
          <Tabs
            variant="solid"
            size="md"
          >
            <TabList>
              <Tab>Stake</Tab>
              <Tab>Unstake</Tab>
            </TabList>
          </Tabs>
        </Flex>
        <BottomActions />
      </Flex>
    </Flex>
  );
}
