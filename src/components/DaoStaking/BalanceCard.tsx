import { Box, Flex, Text } from '@chakra-ui/react';

function BalanceEntry({ label, value }: { label: string; value: string }) {
  return (
    <Flex
      justifyContent="space-between"
      alignItems="flex-start"
      alignSelf="stretch"
    >
      <Text
        width="122px"
        color="color-content-content1-foreground"
        textStyle="text-sm-regular"
      >
        {label}
      </Text>
      <Text
        width="122px"
        height="14px"
        color="color-content-content4-foreground"
        textStyle="text-sm-regular"
        textAlign="end"
      >
        {value}
      </Text>
    </Flex>
  );
}

function ProgressLabel({ color, label }: { color: string; label: string }) {
  return (
    <Flex
      alignItems="center"
      gap="8px"
    >
      <Flex
        width="8px"
        height="8px"
        padding="0px 4px"
        justifyContent="center"
        alignItems="center"
        flexShrink={0}
        aspectRatio="1/1"
        borderRadius="9999px"
        background={color}
      ></Flex>
      <Text
        color="color-primary-100"
        textStyle="text-xs-regular"
      >
        {label}
      </Text>
    </Flex>
  );
}

export default function BalanceCard() {
  return (
    <Flex
      padding="14px 12px"
      direction="column"
      alignItems="flex-start"
      gap="16px"
      alignSelf="stretch"
      borderRadius="14px"
      border="1px solid var(--colors-color-layout-border)"
      boxShadow="0px 1px 2px 0px rgba(0, 0, 0, 0.05)"
    >
      <Flex
        direction="column"
        justifyContent="center"
        alignItems="flex-start"
        gap="16px"
        alignSelf="stretch"
      >
        <Flex
          alignItems="center"
          gap="8px"
          alignSelf="stretch"
        >
          <Text
            color="color-charcoal-400"
            textStyle="labels-large"
          >
            Balance Overview
          </Text>
        </Flex>

        <Flex
          direction="column"
          alignItems="flex-start"
          gap="8px"
          alignSelf="stretch"
        >
          <BalanceEntry
            label="Total Balance"
            value="$500.00K"
          />
          <BalanceEntry
            label="Staked"
            value="$175.00K"
          />
          <BalanceEntry
            label="Available"
            value="$325.00K"
          />
        </Flex>

        <Flex
          alignItems="center"
          gap="8px"
          alignSelf="stretch"
        >
          <Flex
            direction="column"
            alignItems="flex-start"
            gap="8px"
            flex="1 0 0"
          >
            <Flex
              alignItems="center"
              gap="8px"
              alignSelf="stretch"
            >
              <Flex
                direction="column"
                justifyContent="center"
                alignItems="flex-start"
                flex="1 0 0"
                borderRadius="9999px"
                background="color-primary-100"
              >
                <Box
                  width="192px"
                  height="6px"
                  borderRadius="9999px 0px 0px 9999px"
                  background="color-primary-400"
                ></Box>
              </Flex>
            </Flex>

            <Flex
              justifyContent="space-between"
              alignItems="flex-start"
              alignSelf="stretch"
            >
              <ProgressLabel
                color="color-primary-400"
                label="85% Staked"
              />
              <ProgressLabel
                color="color-primary-100"
                label="15% Available"
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
