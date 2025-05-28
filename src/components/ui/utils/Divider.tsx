import { Box, BoxProps } from '@chakra-ui/react';

export default function Divider({
  variant = 'dark',
  vertical = false,
  ...rest
}: { variant?: 'light' | 'dark' | 'darker'; vertical?: boolean } & BoxProps) {
  const isDark = variant === 'dark';
  const isDarker = variant === 'darker';
  // @todo - This divider should be removed and we should be using the one directly from Chakra
  // But we need proper styling on theme level
  const border1stColor = isDarker ? '#000000AD' : isDark ? 'color-black' : 'color-neutral-950';
  const border2ndColor = isDarker
    ? 'white-alpha-08'
    : isDark
      ? 'color-neutral-900'
      : 'color-neutral-800';
  return (
    <Box
      height={vertical ? '100%' : '0'}
      width={vertical ? '0' : '100%'}
      borderTop={vertical ? 'none' : '1px solid'}
      borderBottom={vertical ? 'none' : '1px solid'}
      borderLeft={vertical ? '1px solid' : 'none'}
      borderRight={vertical ? '1px solid' : 'none'}
      borderTopColor={vertical ? 'transparent' : border1stColor}
      borderBottomColor={vertical ? 'transparent' : border2ndColor}
      borderLeftColor={vertical ? border1stColor : 'transparent'}
      borderRightColor={vertical ? border2ndColor : 'transparent'}
      {...rest}
    />
  );
}
