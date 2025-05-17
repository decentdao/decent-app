import { Box, BoxProps } from '@chakra-ui/react';
import { ReactNode, MouseEvent } from 'react';
import ContentBoxTitle from './ContentBoxTitle';

interface ContentBoxProps {
  title?: string;
  children: ReactNode;
  containerBoxProps?: BoxProps;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

function ContentBox({ title, children, containerBoxProps, onClick }: ContentBoxProps) {
  return (
    <Box
      rounded="lg"
      p="1.5rem"
      my="1.25rem"
      bg="neutral-2"
      {...containerBoxProps}
      cursor={!!onClick ? 'pointer' : 'default'}
      onClick={onClick}
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

export function SectionTopContentBox({ children }: { children: ReactNode }) {
  return (
    <ContentBox
      containerBoxProps={{
        bg: 'neutral-2',
        border: '1px solid',
        borderColor: 'neutral-3',
        rounded: 'unset',
        borderTopLeftRadius: '0.5rem',
        borderTopRightRadius: '0.5rem',
        py: 2,
        px: 4,
        my: 0,
        mt: 4,
      }}
    >
      {children}
    </ContentBox>
  );
}
export function SectionBottomContentBox({ children }: { children: ReactNode }) {
  return (
    <ContentBox
      containerBoxProps={{
        bg: 'neutral-2',
        border: '1px solid',
        borderColor: 'neutral-3',
        rounded: 'unset',
        py: 2,
        px: 4,
        borderBottomLeftRadius: '0.5rem',
        borderBottomRightRadius: '0.5rem',
        my: 0,
      }}
    >
      {children}
    </ContentBox>
  );
}

export default ContentBox;
