import { Box, Text } from '@chakra-ui/react';
import DisplayTransaction from '../../ui/links/DisplayTransaction';
import { DecentTooltip } from '../DecentTooltip';

export default function InfoRow({
  property,
  value,
  txHash,
  tooltip,
}: {
  property: string;
  value?: string;
  txHash?: string | null;
  tooltip?: string;
}) {
  return (
    <Box marginTop="1rem">
      <Text
        color="color-neutral-300"
        w="full"
      >
        {property}
      </Text>
      {tooltip === undefined ? (
        txHash ? (
          <DisplayTransaction txHash={txHash} />
        ) : (
          <Text>{value}</Text>
        )
      ) : (
        <DecentTooltip label={tooltip}>
          {txHash ? (
            <DisplayTransaction txHash={txHash} />
          ) : (
            <Text color="color-white">{value}</Text>
          )}
        </DecentTooltip>
      )}
    </Box>
  );
}
