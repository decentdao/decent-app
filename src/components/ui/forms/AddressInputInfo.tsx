import { Text, InputProps, Flex, Icon } from '@chakra-ui/react';
import { SealWarning } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Address, isAddress } from 'viem';
import { useResolveENSName } from '../../../hooks/utils/useResolveENSName';
import { validateENSName } from '../../../utils/url';
import { DecentTooltip } from '../DecentTooltip';
import { AddressInput } from './EthAddressInput';

export function AddressInputInfo(props: InputProps) {
  const [showInput, setShowInput] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<Address>();
  const { resolveENSName } = useResolveENSName();

  useEffect(() => {
    if (props.value === '' || !props.value || typeof props.value !== 'string') {
      setResolvedAddress(undefined);
      return;
    }
    if (isAddress(props.value)) {
      setResolvedAddress(undefined);
      return;
    }
    // check if there
    if (validateENSName(props.value)) {
      resolveENSName(props.value).then(ra => {
        setResolvedAddress(ra.resolvedAddress);
      });
      return;
    }
    setResolvedAddress(undefined);
  }, [props.value, resolveENSName]);

  if (!showInput && props.value) {
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
          {props.value}
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
