import { Box } from '@chakra-ui/react';
import { useGetMetadata } from '../../hooks/DAO/proposal/useGetMetadata';
import { Activity, FractalProposal, SnapshotProposal } from '../../types';
import Markdown from '../ui/proposal/Markdown';
import { ProposalTitle } from './ActivityDescriptionGovernance';
import { ActivityDescriptionTreasury } from './ActivityDescriptionTreasury';

interface IActivityDescription {
  activity: Activity;
  showFullDescription?: boolean;
}

export function ActivityDescription({ activity, showFullDescription }: IActivityDescription) {
  const metaData = useGetMetadata(activity as FractalProposal);

  const snapshotProposal = activity as SnapshotProposal;

  const description = snapshotProposal.description || metaData.description;

  return (
    <Box
      mr="1rem"
      mt="0.5rem"
    >
      <ProposalTitle
        activity={activity}
        showAuthor
      />
      {description && (
        <Box
          mt={2}
          textColor="#B3B3B3"
        >
          <Markdown
            content={description}
            truncate={!showFullDescription}
            collapsedLines={3}
          />
        </Box>
      )}
      <Box mt={2}>
        {!!activity.transaction && <ActivityDescriptionTreasury activity={activity} />}
      </Box>
    </Box>
  );
}
