import { Box, Flex, Grid, GridItem, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ExtendedSnapshotProposal, FractalProposalState } from '../../../types';
import StatusBox from '../../ui/badges/StatusBox';
import ContentBox from '../../ui/containers/ContentBox';
import { ProposalCountdown } from '../../ui/proposal/ProposalCountdown';
import Divider from '../../ui/utils/Divider';
import { VotesPercentage } from '../ProposalVotes';
import SnapshotProposalVoteItem from './SnapshotProposalVoteItem';
import useTotalVotes from './hooks/useTotalVotes';

interface ISnapshotProposalVotes {
  proposal: ExtendedSnapshotProposal;
}

export default function SnapshotProposalVotes({ proposal }: ISnapshotProposalVotes) {
  const { t } = useTranslation('proposal');
  const { totalVotesCasted } = useTotalVotes({ proposal });
  const { votes, votesBreakdown, choices, strategies, privacy, state, type } = proposal;

  return (
    <>
      <ContentBox
        containerBoxProps={{
          bg: 'transparent',
          border: '1px solid',
          borderColor: 'color-neutral-900',
          borderRadius: '0.5rem',
        }}
      >
        <Flex justifyContent="space-between">
          <Text textStyle="text-xl-regular">{t('breakdownTitle')}</Text>
          <Flex>
            <Text
              color="color-white"
              textStyle="text-xl-regular"
            >
              {t('totalVotes')}
            </Text>
            <Text
              ml={1}
              textStyle="text-xl-regular"
            >
              {totalVotesCasted}
              {strategies.map((strategy, index) =>
                strategy.params.symbol ? (
                  <Box
                    mx={1}
                    key={index}
                    display="inline-block"
                    as="span"
                  >
                    <StatusBox>{strategy.params.symbol}</StatusBox>
                  </Box>
                ) : null,
              )}
            </Text>
          </Flex>
        </Flex>
        <Grid>
          <GridItem
            colSpan={4}
            rowGap={4}
          >
            {choices.map((choice, i) => {
              const votesBreakdownChoice =
                type === 'weighted' ? votesBreakdown[i + 1] : votesBreakdown[choice];

              const choicePercentageFromTotal =
                totalVotesCasted > 0 ? (votesBreakdownChoice.total * 100) / totalVotesCasted : 0;

              return (
                <VotesPercentage
                  key={choice}
                  label={choice}
                  percentage={Number(choicePercentageFromTotal.toFixed(1))}
                />
              );
            })}
          </GridItem>
        </Grid>
      </ContentBox>
      {votes && votes.length !== 0 && (
        <ContentBox containerBoxProps={{ bg: 'transparent' }}>
          <Text textStyle="text-xl-regular">
            {t('votesTitle')} ({votes.length})
          </Text>
          <Divider my={4} />
          <Flex
            flexWrap="wrap"
            gap={4}
          >
            {privacy === 'shutter' && state !== FractalProposalState.CLOSED ? (
              <Flex
                justifyContent="center"
                width="100%"
              >
                <Text color="color-neutral-300">{t('shutterVotesHidden')} |</Text>
                <ProposalCountdown
                  proposal={proposal}
                  showIcon={false}
                />
              </Flex>
            ) : (
              <Grid
                templateColumns={
                  proposal.type === 'weighted' ? 'repeat(4, auto)' : 'repeat(3, auto)'
                }
                rowGap={4}
                columnGap={5}
                overflowX="auto"
                whiteSpace="nowrap"
              >
                {votes.map(vote => (
                  <SnapshotProposalVoteItem
                    key={vote.voter}
                    vote={vote}
                    proposal={proposal}
                  />
                ))}
              </Grid>
            )}
          </Flex>
        </ContentBox>
      )}
    </>
  );
}
