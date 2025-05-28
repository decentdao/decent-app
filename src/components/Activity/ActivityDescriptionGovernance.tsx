import { Box, Flex, Text } from '@chakra-ui/react';
import { useGetMetadata } from '../../hooks/DAO/proposal/useGetMetadata';
import { GovernanceActivity, SnapshotProposal, FractalProposal } from '../../types';

const formatId = (proposalId: string) => {
  if (proposalId.startsWith('0x')) {
    // Multisig id, just give the first 4 characters
    return `#${proposalId.substring(2, 6)}`;
  } else {
    // Azorius id is just incrementing whole number
    return `#${proposalId}`;
  }
};

export function ProposalTitle({ activity }: { activity: FractalProposal }) {
  const metaData = useGetMetadata(activity);

  // Check if it's a SnapshotProposal and set variables accordingly
  const isSnapshotProposal = (activity as SnapshotProposal).snapshotProposalId !== undefined;
  const proposalIdText = isSnapshotProposal
    ? formatId((activity as SnapshotProposal).snapshotProposalId)
    : formatId((activity as GovernanceActivity).proposalId);
  const proposaltitleText = isSnapshotProposal
    ? (activity as SnapshotProposal).title
    : metaData.title || '';

  const titleText = proposalIdText + ' ' + proposaltitleText;
  return (
    <Box
      textStyle="text-xl-regular"
      color="color-white"
      pr="1.5rem"
    >
      <Flex
        alignItems="center"
        gap={2}
        flexWrap="wrap"
      >
        <Text
          as="span"
          textStyle="text-2xl-regular"
          maxW="100%"
        >
          {titleText}
        </Text>
      </Flex>
    </Box>
  );
}
