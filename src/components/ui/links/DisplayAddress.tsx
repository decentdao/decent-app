import { Flex, Text, LinkProps } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { Address } from 'viem';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import EtherscanLink from './EtherscanLink';

export function DisplayAddress({
  address,
  truncate,
  children,
  isTextLink,
  ...rest
}: {
  address: Address;
  truncate?: boolean;
  isTextLink?: boolean;
  children?: ReactNode;
} & LinkProps) {
  const displayAddress = useGetAccountName(address, truncate);
  const textStyle = rest.textStyle;
  return (
    <EtherscanLink
      {...rest}
      isTextLink
      type="address"
      value={address}
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
        minW="fit-content"
      >
        <Text
          as="span"
          isTruncated
          textStyle={textStyle}
        >
          {children || displayAddress.displayName}
        </Text>
      </Flex>
    </EtherscanLink>
  );
}
