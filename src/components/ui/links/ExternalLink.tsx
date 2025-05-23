import { Flex, Link, LinkProps } from '@chakra-ui/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Ref } from 'react';

type StyleVariants = 'grey' | 'green' | 'black' | 'lilac';

export default function ExternalLink({
  children,
  internalRef,
  isTextLink,
  styleVariant = 'green',
  ...rest
}: LinkProps & {
  styleVariant?: StyleVariants;
  isTextLink?: boolean;
  internalRef?: Ref<any>;
}) {
  const textLinkStyles = {
    green: {
      hover: {
        textDecoration: 'underline',
      },
      active: {
        color: 'color-green-500',
      },
    },
    grey: {
      hover: {
        textDecoration: 'underline',
      },
      active: {
        color: 'neutral-6',
      },
    },
    black: {
      hover: {
        textDecoration: 'underline',
      },
      active: {
        color: 'black',
      },
    },
    lilac: {
      hover: {
        textDecoration: 'underline',
      },
      active: {
        color: 'lilac--3',
      },
    },
  };

  const pillLinkStyles = {
    green: {
      hover: {
        bg: 'color-green-950',
        borderColor: 'color-green-950',
      },
      active: {
        bg: 'color-green-800',
        borderColor: 'color-green-800',
        borderWidth: '1px',
      },
    },
    grey: {
      hover: {
        bg: 'neutral-2',
      },
      active: {
        bg: 'neutral-5',
        borderColor: 'neutral-5',
        borderWidth: '1px',
      },
    },
    black: {
      hover: {
        bg: 'black',
        borderColor: 'black',
      },
      active: {
        bg: 'black',
        borderColor: 'black',
        borderWidth: '1px',
      },
    },
    lilac: {
      hover: {
        bg: 'lilac-3',
        borderColor: 'lilac-3',
      },
      active: {
        bg: 'lilac--3',
        borderColor: 'lilac--3',
        borderWidth: '1px',
      },
    },
  };

  const linkColor = {
    green: 'color-green-400',
    grey: 'neutral-6',
    black: 'black',
    lilac: 'lilac--3',
  };

  return (
    <Link
      padding="0.25rem 0.75rem"
      color={linkColor[styleVariant]}
      gap="0.25rem"
      borderColor="transparent"
      borderWidth="1px"
      borderRadius="625rem"
      w="fit-content"
      _hover={isTextLink ? textLinkStyles[styleVariant].hover : pillLinkStyles[styleVariant].hover}
      _active={
        isTextLink ? textLinkStyles[styleVariant].active : pillLinkStyles[styleVariant].active
      }
      target="_blank"
      rel="noreferrer"
      textDecoration="none"
      ref={internalRef}
      {...rest}
    >
      <Flex
        gap="0.25rem"
        alignItems="center"
      >
        {children}
        {isTextLink && <ArrowUpRight />}
      </Flex>
    </Link>
  );
}
