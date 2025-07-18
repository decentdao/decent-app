import { Flex, Icon, Text } from '@chakra-ui/react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';

export function SplitPercentageDisplay({ percentage }: { percentage: number }) {
  const isBelowZero = percentage < 0;
  const isAboveOneHundred = percentage > 100;
  const isPercentageValid = !isBelowZero && !isAboveOneHundred;

  const iconColor = isPercentageValid ? 'color-success-400' : 'color-error-400';
  const icon = isPercentageValid ? CheckCircle : WarningCircle;

  const text = isPercentageValid ? `${percentage}%` : `${percentage}% Total must equal 100%`;

  return (
    <Flex
      alignItems="center"
      gap="0.25rem"
    >
      <Icon
        as={icon}
        color={iconColor}
      />
      <Text
        textStyle="text-sm-leading-none-medium"
        color="color-content-popover-foreground"
      >
        {text}
      </Text>
    </Flex>
  );
}
