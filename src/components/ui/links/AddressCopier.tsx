import { ButtonProps } from '@chakra-ui/react';
import { CopySimple } from '@phosphor-icons/react';
import { Address } from 'viem';
import { useCopyText } from '../../../hooks/utils/useCopyText';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import CeleryButtonWithIcon from '../utils/CeleryButtonWithIcon';

interface AddressCopierProps extends ButtonProps {
  address: Address;
  variant?: 'primary' | 'secondary';
  displayAs?: 'truncated' | 'displayName' | 'address';
}

/**
 * A component that displays a truncated address, along with the "copy to clipboard"
 * icon to the right of it.
 */
export default function AddressCopier({
  address,
  variant = 'primary',
  displayAs = 'truncated',
  ...rest
}: AddressCopierProps) {
  const { accountSubstring, displayName } = useGetAccountName(address);
  const copyToClipboard = useCopyText();
  const isTruncated = displayAs === 'truncated';
  const isDisplayName = displayAs === 'displayName';

  let displayedText: string | Address = address;
  if (isTruncated) {
    displayedText = accountSubstring || address;
  } else if (isDisplayName) {
    displayedText = displayName || address;
  }

  return (
    <CeleryButtonWithIcon
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard(address);
      }}
      width="fit-content"
      {...rest}
      text={displayedText}
      icon={CopySimple}
      iconPosition="end"
      {...(variant === 'secondary' && {
        _hover: {
          bg: 'none',
        },
        _active: {
          bg: 'none',
        },
      })}
    />
  );
}
