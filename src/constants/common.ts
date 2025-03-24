import { useBreakpointValue } from '@chakra-ui/react';
import { Hex } from 'viem';

const HEADER_HEIGHT = '4.5rem';
const HEADER_HEIGHT_MOBILE = '3.75rem';

const FOOTER_HEIGHT = '5rem';
const FOOTER_HEIGHT_MOBILE = '0rem';

export const useHeaderHeight = () => {
  const headerHeight = useBreakpointValue({ base: HEADER_HEIGHT_MOBILE, md: HEADER_HEIGHT });
  return headerHeight || HEADER_HEIGHT;
};

export const useFooterHeight = () => {
  const footerHeight = useBreakpointValue({ base: FOOTER_HEIGHT_MOBILE, md: FOOTER_HEIGHT });
  return footerHeight || FOOTER_HEIGHT;
};

export const useContentHeight = () => {
  const headerHeight = useHeaderHeight();
  const footerHeight = useFooterHeight();
  const contentHeight = `calc(100vh - ${headerHeight} - ${footerHeight})`;
  return contentHeight;
};

// TODO get these into the theme
export const DISABLED_INPUT = '#16121929';
export const MOBILE_DRAWER_OVERLAY = '#161219D6';
export const BACKGROUND_SEMI_TRANSPARENT = '#16121980';
export const NEUTRAL_2_82_TRANSPARENT = '#221D25D6';
export const NEUTRAL_2_84 = 'rgba(34, 29, 37, 0.84)';
export const SEXY_BOX_SHADOW_T_T =
  '0px 0px 0px 1px rgba(248, 244, 252, 0.04) inset, 0px 1px 0px 0px rgba(248, 244, 252, 0.04) inset, 0px 0px 0px 1px #100414';

export const CARD_SHADOW =
  '0 1px 0 0 rgba(248, 244, 252, 0.04), 0 1px 1px 0 rgba(248, 244, 252, 0.04), 0 0 1px 1px rgba(16, 4, 20, 1)';
export const DETAILS_SHADOW =
  '0px 1px 0px 0px rgba(248, 244, 252, 0.04) inset, 0px 0px 0px 1px rgba(248, 244, 252, 0.04) inset, 0px 0px 0px 1px rgba(16, 4, 20, 1)';

export const TAB_SHADOW = '0 -1px 0 0 rgba(0, 0, 0, 0.24), 0 1px 0 0 rgba(255, 255, 255, 0.12)';
export const DETAILS_BOX_SHADOW =
  '0px 0px 0px 1px #100414, 0px 0px 0px 1px rgba(248, 244, 252, 0.04) inset, 0px 1px 0px 0px rgba(248, 244, 252, 0.04) inset';
/**
 * Max width for most informational Tooltips. However we don't add max width
 * to some Tooltips that shouldn't wrap no matter how long, such as token amounts.
 */
export const TOOLTIP_MAXW = '18rem';
export const CONTENT_MAXW = 'calc(100vw - 3rem)';
export const ADDRESS_MULTISIG_METADATA = '0xdA00000000000000000000000000000000000Da0';
export const SENTINEL_ADDRESS = '0x0000000000000000000000000000000000000001';

export const SIDEBAR_WIDTH = '4.25rem';

export const MAX_CONTENT_WIDTH = '80rem';

/**
 * @dev DO NOT CHANGE THE SALT
 * @note This SALT is used to generate the account address for the Hats Smart Account
 * @note This has been used in production and changing it will break the predictability of the smart account addresses
 */
export const ERC6551_REGISTRY_SALT: Hex =
  '0x5d0e6ce4fd951366cc55da93f6e79d8b81483109d79676a04bcc2bed6a4b5072';
