import { Text, InputProps, Flex, Icon } from '@chakra-ui/react';
import { SealWarning } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Address, isAddress } from 'viem';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { useResolveENSName } from '../../../hooks/utils/useResolveENSName';
import { validateENSName } from '../../../utils/url';
import { DecentTooltip } from '../DecentTooltip';
import { AddressInput } from './EthAddressInput';

export function AddressInputInfo(props: InputProps) {
  const [showInput, setShowInput] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<Address>();
  const { resolveENSName } = useResolveENSName();

  const propValue = props.value;

  const isPropValueAddress =
    propValue !== '' && !!propValue && typeof propValue === 'string' && isAddress(propValue);

  useEffect(() => {
    if (!isPropValueAddress) {
      setResolvedAddress(undefined);
      return;
    }
    if (isAddress(propValue)) {
      setResolvedAddress(undefined);
      return;
    }
    // check if there
    if (validateENSName(propValue)) {
      resolveENSName(propValue).then(ra => {
        setResolvedAddress(ra.resolvedAddress);
      });
      return;
    }
    setResolvedAddress(undefined);
  }, [isPropValueAddress, propValue, resolveENSName]);

  if (!showInput && propValue) {
    const displayedValue = isPropValueAddress ? createAccountSubstring(propValue) : propValue;

    return (
      <Flex
        alignItems="center"
        justifyContent="space-between"
        w="full"
        h="full"
        px="1rem"
        onClick={() => {
          setShowInput(true);
        }}
        onBlur={() => {
          setShowInput(false);
        }}
        _hover={{
          bg: 'color-alpha-white-950',
        }}
      >
        <Text
          cursor="pointer"
          _hover={{
            bg: 'color-alpha-white-950',
          }}
          textStyle="text-sm-regular"
          color="color-layout-foreground"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {displayedValue}
        </Text>
        {resolvedAddress && (
          <DecentTooltip
            label="While ENS is displayed, the full wallet 
          address will appear in the agreement."
          >
            <Icon
              as={SealWarning}
              boxSize="1rem"
            />
          </DecentTooltip>
        )}
      </Flex>
    );
  }
  return (
    <AddressInput
      {...props}
      onBlur={() => {
        setShowInput(false);
      }}
      autoFocus
    />
  );
}
