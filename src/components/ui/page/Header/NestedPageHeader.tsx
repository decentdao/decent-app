import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

type BackButtonProps = {
  text: string;
} & ( // either onClick or href must be provided, but not both
  | {
      onClick: () => void;
      href?: never;
    }
  | {
      onClick?: never;
      href: string;
    }
);

function BackButton({ text, onClick, href }: BackButtonProps) {
  if (onClick) {
    return (
      <Button
        variant="link"
        width="min-content"
        color="color-neutral-300"
        padding={0}
        leftIcon={<ArrowLeft />}
        onClick={onClick}
      >
        {text}
      </Button>
    );
  }

  return (
    <Button
      as={Link}
      to={href}
      variant="link"
      width="min-content"
      color="color-neutral-300"
      padding={0}
      leftIcon={<ArrowLeft />}
    >
      {text}
    </Button>
  );
}

type NestedPageHeaderProps = PropsWithChildren<{
  title: string;
  backButton: BackButtonProps;
}>;

export default function NestedPageHeader({ title, backButton, children }: NestedPageHeaderProps) {
  return (
    <Flex
      py={6}
      justifyContent="space-between"
      alignItems="center"
    >
      <Box width="25%">
        <BackButton {...backButton} />
      </Box>
      <Text>{title}</Text>
      {children || <Box width="25%" />}
    </Flex>
  );
}
