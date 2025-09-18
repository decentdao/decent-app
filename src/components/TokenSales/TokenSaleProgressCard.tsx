import { Box, Flex, Progress, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { formatUnits } from 'viem';

interface TokenSaleProgressCardProps {
  raised: bigint;
  goal: bigint;
  minimum: bigint;
  commitmentTokenDecimals: number;
}

export function TokenSaleProgressCard({
  raised,
  goal,
  minimum,
  commitmentTokenDecimals,
}: TokenSaleProgressCardProps) {
  const { t } = useTranslation('tokenSale');
  const raisedFormatted = parseFloat(formatUnits(raised, commitmentTokenDecimals));
  const goalFormatted = parseFloat(formatUnits(goal, commitmentTokenDecimals));
  const minimumFormatted = parseFloat(formatUnits(minimum, commitmentTokenDecimals));

  const progressPercentage = goalFormatted > 0 ? (raisedFormatted / goalFormatted) * 100 : 0;
  const minimumPercentage = goalFormatted > 0 ? (minimumFormatted / goalFormatted) * 100 : 0;

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  return (
    <Box
      p={0}
      position="relative"
    >
      <Box pb={8}>
        <Flex
          justify="space-between"
          align="center"
          mb={2}
        >
          <Text
            textStyle="text-sm-medium"
            color="color-content-content1-foreground"
          >
            {t('raisedLabel', { amount: formatCurrency(raisedFormatted) })}
          </Text>
          <Text
            textStyle="text-sm-medium"
            color="color-content-content1-foreground"
          >
            {t('goalLabel', { amount: formatCurrency(goalFormatted) })}
          </Text>
        </Flex>

        <Box position="relative">
          <Progress
            value={progressPercentage}
            max={100}
            bg="color-alpha-white-900"
            h="8px"
            borderRadius="9999px"
            sx={{
              '& > div': {
                bg: 'color-base-primary',
                borderRadius: '9999px',
              },
            }}
          />
        </Box>
      </Box>

      {/* Minimum marker */}
      {minimumPercentage > 0 && (
        <Box
          position="absolute"
          left={`${Math.min(minimumPercentage, 95)}%`}
          top="44px"
        >
          <Box
            bg="color-content-primary-muted"
            border="1px solid"
            borderColor="color-layout-border-10"
            borderRadius="8px"
            px={1.5}
            py={0.5}
          >
            <Text
              textStyle="text-sm-medium"
              color="color-base-primary"
              whiteSpace="nowrap"
            >
              {t('minimumLabel', { amount: formatCurrency(minimumFormatted) })}
            </Text>
          </Box>

          {/* Vertical line */}
          <Box
            position="absolute"
            left="50%"
            top="-20px"
            w="1px"
            h="20px"
            bg="color-base-primary"
            transform="translateX(-50%)"
          />
        </Box>
      )}
    </Box>
  );
}
