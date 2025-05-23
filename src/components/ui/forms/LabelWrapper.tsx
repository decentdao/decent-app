import { Box, Flex, FormLabel, Text, Image } from '@chakra-ui/react';
import { Info } from '@phosphor-icons/react';
import { DecentTooltip } from '../DecentTooltip';

// @todo there is some type cleanup needed here
export interface LabelWrapperProps {
  label?: string;
  subLabel?: JSX.Element | string | null;
  isRequired?: boolean;
  errorMessage?: string | null;
  tooltipContent?: JSX.Element;
  htmlFor?: string;
  children: JSX.Element | JSX.Element[];
  labelColor?: string;
}

function LabelWrapper({
  label,
  subLabel,
  errorMessage,
  tooltipContent,
  children,
  isRequired,
  labelColor = 'white-0',
}: LabelWrapperProps) {
  return (
    <Box position="relative">
      <FormLabel m="0px">
        <Flex
          gap="2"
          alignItems="center"
          h="fit-content"
          color={labelColor}
          mb="2"
          textStyle="labels-large"
        >
          <Text>{label}</Text>
          {isRequired && <Text color="color-lilac-100">*</Text>}
          {!!tooltipContent && (
            <DecentTooltip
              hasArrow
              label={tooltipContent}
              closeDelay={500}
            >
              <Info />
            </DecentTooltip>
          )}
        </Flex>
        {children}
        <Box
          textStyle="labels-large"
          color="neutral-7"
          mt="2"
          h="0.5rem"
        >
          {errorMessage && (
            <Flex gap="0.25rem">
              <Image src="/images/input-error.svg" />
              <Text
                color="red-0"
                mt="0.2rem"
                mb="0.25rem"
              >
                {errorMessage}
              </Text>
            </Flex>
          )}
          {!!subLabel && subLabel}
        </Box>
      </FormLabel>
    </Box>
  );
}

LabelWrapper.displayName = 'LabelWrapper';
export default LabelWrapper;
