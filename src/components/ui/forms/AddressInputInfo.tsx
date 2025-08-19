import { Text, InputProps, Flex, Icon } from '@chakra-ui/react';
import { SealWarning } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, isAddress } from 'viem';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { useGetSafeName } from '../../../hooks/utils/useGetSafeName';
import { useResolveENSName } from '../../../hooks/utils/useResolveENSName';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { validateENSName } from '../../../utils/url';
import { DecentTooltip } from '../DecentTooltip';
import { AddressInput } from './EthAddressInput';

export function AddressInputInfo(props: InputProps & { staticDisplayValue?: string }) {
  const { t } = useTranslation('common');
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
          if (!props.isReadOnly) {
            setShowInput(true);
          }
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
      >
        <Text
          cursor={props.isReadOnly ? 'default' : 'pointer'}
          textStyle="text-sm-regular"
          color={props.isInvalid ? 'color-error-400' : 'color-layout-foreground'}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {props.staticDisplayValue ?? displayedValue}
        </Text>
        {(resolvedAddress || resolvedDisplayName) && (
          <DecentTooltip label={t('addressInfoTooltip')}>
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
