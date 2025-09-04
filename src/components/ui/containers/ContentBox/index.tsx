import { Box, BoxProps } from '@chakra-ui/react';
import { ReactNode, MouseEvent } from 'react';
import ContentBoxTitle from './ContentBoxTitle';

interface ContentBoxProps {
  title?: string;
  children: ReactNode;
  containerBoxProps?: BoxProps;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  testId?: string;
}

function ContentBox({ title, children, containerBoxProps, onClick, testId }: ContentBoxProps) {
  return (
    <Box
      rounded="lg"
      p="1.5rem"
      my="1.25rem"
      bg="color-neutral-950"
      {...containerBoxProps}
      cursor={!!onClick ? 'pointer' : 'default'}
      onClick={onClick}
      data-testid={testId}
    >
      {title && <ContentBoxTitle>{title}</ContentBoxTitle>}
      <Box
        px="2"
        py="4"
      >
        {children}
      </Box>
    </Box>
  );
}

export function SectionContentBox({
  children,
  containerBoxProps,
}: {
  children: ReactNode;
  containerBoxProps?: BoxProps;
}) {
  return (
    <ContentBox
      containerBoxProps={{
        ...containerBoxProps,
        bg: 'color-neutral-950',
        border: '1px solid',
        borderColor: 'color-neutral-900',
        rounded: 'unset',
        py: 2,
        px: 4,
        my: 0,
      }}
    >
      {children}
    </ContentBox>
  );
}

export function ContentBoxTight({
  children,
  containerBoxProps,
}: {
  children: ReactNode;
  containerBoxProps?: BoxProps;
}) {
  return (
    <ContentBox
      containerBoxProps={{
        py: 2,
        px: 4,
        my: 2,
        ...containerBoxProps,
      }}
    >
      {children}
    </ContentBox>
  );
}

export default ContentBox;
