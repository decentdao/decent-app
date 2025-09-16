import { Alert, AlertTitle, AlertDescription, Button, Flex, Icon } from '@chakra-ui/react';
import { Info, CheckCircle } from '@phosphor-icons/react';

interface TokenSaleBannerProps {
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
  variant?: 'fundraisingBanner' | 'successBanner';
  buttonDisabled?: boolean;
}

export function TokenSaleBanner({
  title,
  description,
  buttonText,
  onButtonClick,
  variant = 'fundraisingBanner',
  buttonDisabled = false,
}: TokenSaleBannerProps) {
  const iconComponent = variant === 'successBanner' ? CheckCircle : Info;
  const color =
    variant === 'successBanner' ? 'color-base-success' : 'color-base-information-foreground';
  return (
    <Alert variant={variant}>
      <Icon
        as={iconComponent}
        color={color}
        boxSize="24px"
      />
      <Flex
        direction="column"
        flex="1"
        gap="0"
      >
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Flex>
      {buttonText && onButtonClick && (
        <Button
          size="xs"
          variant="ghost"
          color="color-charcoal-50"
          textStyle="text-xs-medium"
          px="12px"
          py="0"
          h="32px"
          borderRadius="8px"
          onClick={onButtonClick}
          isDisabled={buttonDisabled}
          _hover={{
            bg: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {buttonText}
        </Button>
      )}
    </Alert>
  );
}
