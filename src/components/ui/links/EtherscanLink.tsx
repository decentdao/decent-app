import { Box, LinkProps } from '@chakra-ui/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import ModalTooltip from '../modals/ModalTooltip';
import ExternalLink from './ExternalLink';

export interface EtherscanLinkProps extends LinkProps {
  // @todo: Remove `type`; create separate optional props for each type; type it so that only one of them can be passed, use that to determine the type of the link when setting `href` below
  type: 'address' | 'block' | 'token' | 'tx';
  value: string | null;
  secondaryValue?: string;
  isTextLink?: boolean;
}

export default function EtherscanLink({
  children,
  type,
  value,
  secondaryValue,
  ...rest
}: EtherscanLinkProps) {
  const { etherscanBaseURL } = useNetworkConfigStore();
  const { t } = useTranslation('common');
  const containerRef = useRef<HTMLDivElement>(null);

  if (!value) {
    return null;
  }

  const href = `${etherscanBaseURL}/${type}/${value}${secondaryValue ? `?a=${secondaryValue}` : ''}`;

  return (
    <ExternalLink
      href={href}
      display="inline-flex"
      {...rest}
    >
      <Box
        ref={containerRef}
        maxW="100%"
        minW="fit-content"
      >
        <ModalTooltip
          label={t('etherscanTip')}
          placement="bottom"
          containerRef={containerRef}
        >
          {children}
        </ModalTooltip>
      </Box>
    </ExternalLink>
  );
}
