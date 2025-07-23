import { Box, Flex, Text } from '@chakra-ui/react';
import { CaretDown } from '@phosphor-icons/react';

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

export default function RewardsCard() {
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
            Rewards Overview
          </Text>
        </Flex>

        <Flex
          justifyContent="space-between"
          alignItems="flex-start"
          alignSelf="stretch"
        >
          <Text
            color="color-layout-foreground"
            textStyle="text-2xl-regular"
          >
            $2.46K
          </Text>
          <Flex
            height="36px"
            padding="0px 16px"
            justifyContent="center"
            alignItems="center"
            gap="8px"
            borderRadius="8px"
            borderTop="1px solid var(--colors-color-layout-border-primary)"
            background="color-base-primary"
          >
            <Flex
              justifyContent="center"
              alignItems="center"
              gap="8px"
            >
              <Text
                color="color-base-primary-foreground"
                textStyle="text-sm-regular"
              >
                Claim All
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Flex
          direction="column"
          alignItems="flex-start"
          gap="8px"
          alignSelf="stretch"
        >
          <Text
            color="color-content-content4-foreground"
            textStyle="text-sm-regular"
          >
            Pending Rewards
          </Text>
          <Flex
            height="40px"
            padding="0px 16px"
            direction="column"
            justifyContent="center"
            alignItems="flex-start"
            alignSelf="stretch"
            borderRadius="12px"
            border="1px solid var(--colors-color-layout-border)"
            background="color-alpha-black-950"
          >
            <Flex
              padding="16px 0px"
              justifyContent="space-between"
              alignItems="center"
              alignSelf="stretch"
            >
              <Flex
                direction="column"
                justifyContent="center"
                alignItems="flex-start"
                flex="1 0 0"
              >
                <Text
                  alignSelf="stretch"
                  color="color-content-content1-foreground"
                  textStyle="text-sm-regular"
                >
                  View 3 Tokens
                </Text>
              </Flex>
              <CaretDown />
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      <Flex
        direction="column"
        alignItems="flex-start"
        gap="8px"
        alignSelf="stretch"
      >
        <Flex
          justifyContent="space-between"
          alignItems="flex-start"
          alignSelf="stretch"
        >
          <Text
            color="color-content-content1-foreground"
            textStyle="text-sm-regular"
          >
            Lock Period
          </Text>
          <Text
            color="color-content-content4-foreground"
            textStyle="text-sm-regular"
          >
            30 Days
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}
