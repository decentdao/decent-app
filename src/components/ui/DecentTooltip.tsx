import { Tooltip, TooltipProps } from '@chakra-ui/react';

export function DecentTooltip(props: TooltipProps) {
  // If children is undefined - the Tooltip will wreck the page entirely.
  // Now normally - this should never happen.
  // But some assets metadata might come malfunctioned - so we need to at least prevent page crashes.

  if (!props.children) {
    return null;
  }

  return (
    <Tooltip
      maxW="20rem"
      placement="top-start"
      {...props}
      hasArrow
      borderRadius="8px"
      padding="0.25rem 0.5rem"
      color="color-black"
      backgroundColor="neutral-9"
    />
  );
}
