export const HEADER_HEIGHT = '4.5rem';
export const CONTENT_HEIGHT = `calc(100vh - ${HEADER_HEIGHT})`;
export const BACKGROUND_SEMI_TRANSPARENT = 'green'; // This will make it obvious anywhere this happens to be used that a reskin is in order. After all usages are replaced, this constant should be removed.
/**
 * Max width for most informational Tooltips. However we don't add max width
 * to some Tooltips that shouldn't wrap no matter how long, such as token amounts.
 */
export const TOOLTIP_MAXW = '18rem';
export const ADDRESS_MULTISIG_METADATA = '0xdA00000000000000000000000000000000000Da0';
