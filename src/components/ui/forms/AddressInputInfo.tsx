import { Text, InputProps, Flex, Icon } from '@chakra-ui/react';
import { SealWarning } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Address, isAddress } from 'viem';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { useGetSafeName } from '../../../hooks/utils/useGetSafeName';
import { useResolveENSName } from '../../../hooks/utils/useResolveENSName';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { validateENSName } from '../../../utils/url';
import { DecentTooltip } from '../DecentTooltip';
import { AddressInput } from './EthAddressInput';

export function AddressInputInfo(props: InputProps) {
  const { resolveENSName } = useResolveENSName();

  const [resolvedAddress, setResolvedAddress] = useState<Address>();
  const { chain } = useNetworkConfigStore();
  const { getSafeName } = useGetSafeName(chain.id);
  const [resolvedDisplayName, setResolvedDisplayName] = useState<string | undefined>();

  const [showInput, setShowInput] = useState(false);

  const propValue = props.value;

  const isPropValueAddress =
    propValue !== '' && !!propValue && typeof propValue === 'string' && isAddress(propValue);

  useEffect(() => {
    if (!propValue) {
      setResolvedAddress(undefined);
      setResolvedDisplayName(undefined);
      return;
    }
    if (!isPropValueAddress) {
      setResolvedAddress(undefined);
      setResolvedDisplayName(undefined);
      return;
    }
    if (isAddress(propValue)) {
      getSafeName(propValue as Address).then(setResolvedDisplayName);
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
  }, [isPropValueAddress, propValue, resolveENSName, getSafeName, showInput]);

  if ((!showInput && propValue) || props.isReadOnly) {
    const displayedValue = resolvedDisplayName
      ? resolvedDisplayName
      : isPropValueAddress
        ? createAccountSubstring(propValue)
        : propValue;

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
          bg: props.isReadOnly
            ? 'transparent'
            : props.isInvalid
              ? 'color-error-950'
              : 'color-alpha-white-950',
        }}
        bg={props.isReadOnly ? 'transparent' : props.isInvalid ? 'color-error-950' : 'transparent'}
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
        {(resolvedAddress || resolvedDisplayName) && (
          <DecentTooltip
            label="While DAO Name or ENS is displayed, the full wallet 
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
