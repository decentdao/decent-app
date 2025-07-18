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
          bg: props.isInvalid ? 'color-error-950' : 'color-alpha-white-950',
        }}
        bg={props.isInvalid ? 'color-error-950' : 'transparent'}
        boxShadow={
          props.isInvalid
            ? '0px 0px 0px 2px #AF3A48, 0px 1px 0px 0px rgba(242, 161, 171, 0.30), 0px 0px 0px 1px rgba(0, 0, 0, 0.80)'
            : 'none'
        }
      >
        <Text
          cursor="pointer"
          textStyle="text-sm-regular"
          color={props.isInvalid ? 'color-error-400' : 'color-layout-foreground'}
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
        // delay to allow the input's debounce to finish
        setTimeout(() => {
          setShowInput(false);
        }, 200);
      }}
      autoFocus
    />
  );
}
