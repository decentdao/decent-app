import { Link, LinkProps } from '@chakra-ui/react';
import { Ref } from 'react';

export default function ExternalLink({
  children,
  internalRef,
  isTextLink,
  styleVariant = 'green',
  ...rest
}: LinkProps & {
  styleVariant?: 'grey' | 'green' | 'black';
  isTextLink?: boolean;
  internalRef?: Ref<any>;
}) {
  const textLinkStyles = {
    green: {
      hover: {
        textDecoration: 'underline',
      },
      active: {
        color: 'celery--2',
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
  };

  const pillLinkStyles = {
    green: {
      hover: {
        bg: 'celery--6',
        borderColor: 'celery--6',
      },
      active: {
        bg: 'celery--5',
        borderColor: 'celery--5',
        borderWidth: '1px',
      },
    },
    grey: {
      hover: {
        bg: 'neutral-2',
        borderColor: 'neutral-4',
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
  };

  const linkColor = {
    green: 'celery-0',
    grey: 'neutral-6',
    black: 'black',
  };

  return (
    <Link
      color={linkColor[styleVariant]}
      padding="0.25rem 0.75rem"
      gap="0.25rem"
      borderRadius="625rem"
      borderColor="transparent"
      borderWidth="1px"
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
      {children}
    </Link>
  );
}
