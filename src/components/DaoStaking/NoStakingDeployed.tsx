import { Button, Flex, Text } from '@chakra-ui/react';
import { FileDashed } from '@phosphor-icons/react';

export default function NoStakingDeployed({ deploy }: { deploy: () => void }) {
  return (
    <Flex
      padding={6}
      direction="column"
      alignItems="center"
      gap={4}
      alignSelf="stretch"
      border="1px solid"
      borderColor="color-layout-border"
      borderRadius="md"
      boxShadow="0px 0px 0px var(--spread-1, 1px) var(--color-alpha-white-950, rgba(255, 255, 255, 0.05)) inset"
    >
      <Flex
        w={24}
        h={24}
        padding="8px 16px 12px 16px"
        justifyContent="center"
        alignItems="center"
      >
        <FileDashed size={64} />
      </Flex>

      <Flex
        direction="column"
        alignItems="center"
        gap={6}
        alignSelf="stretch"
      >
        <Flex
          direction="column"
          alignItems="center"
          gap={1}
        >
          <Text
            color="color-content-content1-foreground"
            textAlign="center"
            textStyle="text-2xl-regular"
          >
            Enable Staking for your DAO
          </Text>
          <Text
            color="color-content-content2-foreground"
            textAlign="center"
            textStyle="text-sm-regular"
          >
            Staking allows you to distribute revenue and create powerful on-chain incentives for
            long-term growth.
          </Text>
        </Flex>

        <Button
          variant="primary"
          size="md"
          paddingX={4}
          height={9}
          justifyContent="center"
          alignItems="center"
          onClick={deploy}
        >
          Deploy Contract
        </Button>
      </Flex>
    </Flex>
  );
}
