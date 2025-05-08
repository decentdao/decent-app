import { Box } from '@chakra-ui/react';
import { useGetMetadata } from '../../hooks/DAO/proposal/useGetMetadata';
import { Proposal, SnapshotProposal } from '../../types';
import Markdown from '../ui/proposal/Markdown';
import { ProposalTitle } from './ActivityDescriptionGovernance';

interface IActivityDescription {
  activity: Proposal;
  showFullDescription?: boolean;
  showAuthor?: boolean;
}

export function ActivityDescription({ activity, showFullDescription }: IActivityDescription) {
  const metaData = useGetMetadata(activity);

  const snapshotProposal = activity as SnapshotProposal;

  const description = snapshotProposal.description || metaData.description;

  return (
    <Box
      mr="1rem"
      mt="0.5rem"
    >
      <ProposalTitle activity={activity} />
      {description && (
        <Box
          mt={2}
          textColor={showFullDescription ? 'white-0' : 'neutral-7'}
        >
          <Markdown
            content={description}
            truncate={!showFullDescription}
            collapsedLines={3}
          />
        </Box>
      )}
    </Box>
  );
}
