import { Box, Text, BoxProps } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { CONTENT_MAXW } from '../../../constants/common';
import Divider from '../utils/Divider';

export function TitledInfoBox({
  title,
  titleTestId,
  children,
  subTitle,
  ...rest
}: {
  title: string;
  titleTestId: string;
  subTitle?: ReactNode;
  children: ReactNode;
} & BoxProps) {
  return (
    <Box
      py={{ base: '1rem', lg: '1.5rem' }}
      borderRadius={{ base: '0.75rem', lg: '0.5rem' }}
      maxW={CONTENT_MAXW}
      {...rest}
    >
      <Text
        data-testid={titleTestId}
        textStyle="text-xl-regular"
        px={{ base: '1rem', lg: '1.5rem' }}
      >
        {title}
      </Text>
      {subTitle && subTitle}
      <Divider
        my="1rem"
        variant="darker"
      />
      {children}
    </Box>
  );
}
