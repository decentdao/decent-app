import { Flex, Icon, Text } from '@chakra-ui/react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export function SplitPercentageDisplay({
  percentage,
}: {
  percentage: number | undefined;
  isInvalid?: boolean;
}) {
  const { t } = useTranslation('revenueSharing');

  if (!percentage) {
    return null;
  }
  const isPercentageValid = percentage === 100;

  const iconColor = isPercentageValid ? 'color-success-400' : 'color-error-400';
  const icon = isPercentageValid ? CheckCircle : WarningCircle;

  const text = isPercentageValid ? `${percentage}%` : t('totalError', { percentage });

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
