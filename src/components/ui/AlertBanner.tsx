import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { WarningCircle } from '@phosphor-icons/react';

interface AlertBannerProps {
  message: string;
  variant: 'warning' | 'error' | 'info';
  layout: 'horizontal' | 'vertical';
  messageSecondary?: string;
}

export function AlertBanner({ message, variant, layout, messageSecondary }: AlertBannerProps) {
  const variantProps = {
    warning: {
      bg: 'color-yellow-950',
      color: 'color-yellow-200',
    },
    error: {
      bg: 'color-error-900',
      color: 'color-error-500',
    },
    info: {
      bg: 'color-neutral-900',
      color: 'color-lilac-100',
    },
  }[variant];

  return (
    <Box
      width="100%"
      borderRadius="0.75rem"
      bg={variantProps.bg}
      p={6}
    >
      <Flex
        alignItems={layout === 'horizontal' ? 'center' : 'flex-start'}
        flexDirection={layout === 'horizontal' ? 'row' : 'column'}
        gap={4}
      >
        <Icon
          as={WarningCircle}
          boxSize="1.5rem"
          color={variantProps.color}
        />
        <Text
          color={variantProps.color}
          textStyle="text-base-regular"
        >
          {message}
        </Text>
        {messageSecondary && (
          <Text
            color={variantProps.color}
            textStyle="text-base-regular"
          >
            {messageSecondary}
          </Text>
        )}
      </Flex>
    </Box>
  );
}
