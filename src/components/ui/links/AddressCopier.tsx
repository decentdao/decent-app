import { ButtonProps } from '@chakra-ui/react';
import { CopySimple } from '@phosphor-icons/react';
import { Address } from 'viem';
import { useCopyText } from '../../../hooks/utils/useCopyText';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import CeleryButtonWithIcon from '../utils/CeleryButtonWithIcon';

interface AddressCopierProps extends ButtonProps {
  address: Address;
  variant?: 'primary' | 'secondary';
}

/**
 * A component that displays a truncated address, along with the "copy to clipboard"
 * icon to the right of it.
 */
export default function AddressCopier({
  address,
  variant = 'primary',
  ...rest
}: AddressCopierProps) {
  const { accountSubstring } = useGetAccountName(address);
  const copyToClipboard = useCopyText();

  return (
    <CeleryButtonWithIcon
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard(address);
      }}
      width="fit-content"
      {...rest}
      text={accountSubstring || address}
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
