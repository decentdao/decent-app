import { Flex, Grid, GridItem, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ExtendedSnapshotProposal, FractalProposalState } from '../../../types';
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
  const strategySymbol = strategies[0].params.symbol;

  return (
    <>
      <ContentBox
        containerBoxProps={{
          bg: 'transparent',
          border: '1px solid',
          borderColor: 'neutral-3',
          borderRadius: '0.5rem',
        }}
      >
        <Flex justifyContent="space-between">
          <Text textStyle="display-lg">{t('breakdownTitle')}</Text>
          <Flex>
            <Text
              color="white-0"
              textStyle="display-lg"
            >
              {t('totalVotes')}
            </Text>
            <Text
              ml={1}
              textStyle="display-lg"
            >
              {totalVotesCasted} {strategySymbol}
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
              const votesBreakdownChoiceTotal =
                votesBreakdownChoice && votesBreakdownChoice?.total
                  ? votesBreakdownChoice?.total
                  : 0;
              const choicePercentageFromTotal =
                (votesBreakdownChoiceTotal * 100) / totalVotesCasted;

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
          <Text textStyle="display-lg">
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
                <Text
                  color="neutral-7"
                  textStyle="body-base"
                >
                  {t('shutterVotesHidden')} |
                </Text>
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
                columnGap={2}
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
