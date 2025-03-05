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
      bg: 'yellow--2',
      color: 'yellow-0',
    },
    error: {
      bg: 'red--2',
      color: 'red-0',
    },
    info: {
      bg: 'neutral-3',
      color: 'lilac-0',
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
          textStyle="body-small"
        >
          {message}
        </Text>
        {messageSecondary && (
          <Text
            color={variantProps.color}
            textStyle="body-small"
          >
            {messageSecondary}
          </Text>
        )}
      </Flex>
    </Box>
  );
}
