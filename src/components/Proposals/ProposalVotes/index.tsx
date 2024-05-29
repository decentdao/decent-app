import { Box, Flex, Grid, GridItem, Text } from '@chakra-ui/react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useFractal } from '../../../providers/App/AppProvider';
import {
  AzoriusGovernance,
  AzoriusProposal,
  GovernanceType,
  ERC721ProposalVote,
} from '../../../types';
import ContentBox from '../../ui/containers/ContentBox';
import { InfoBoxLoader } from '../../ui/loaders/InfoBoxLoader';
import Divider from '../../ui/utils/Divider';
import ProgressBar from '../../ui/utils/ProgressBar';
import ProposalERC20VoteItem from './ProposalERC20VoteItem';
import ProposalERC721VoteItem from './ProposalERC721VoteItem';

export function VotesPercentage({ label, percentage }: { label: string; percentage: number }) {
  return (
    <Flex
      flexWrap="wrap"
      marginTop={2}
    >
      <ProgressBar
        value={percentage}
        label={label}
      />
    </Flex>
  );
}

function ProposalVotes({
  proposal: {
    proposalId,
    votesSummary: { yes, no, abstain },
    votes,
  },
}: {
  proposal: AzoriusProposal;
}) {
  const { governance } = useFractal();

  const azoriusGovernance = governance as AzoriusGovernance;
  const { t } = useTranslation(['common', 'proposal']);
  const totalVotesCasted = useMemo(() => yes + no + abstain, [yes, no, abstain]);

  const isERC20 = useMemo(
    () => azoriusGovernance.type === GovernanceType.AZORIUS_ERC20,
    [azoriusGovernance.type],
  );
  const isERC721 = useMemo(
    () => azoriusGovernance.type === GovernanceType.AZORIUS_ERC721,
    [azoriusGovernance.type],
  );

  const getVotesPercentage = useCallback(
    (voteTotal: bigint): number => {
      if (totalVotesCasted === 0n) {
        return 0;
      }
      return Number((Number((voteTotal * 100000n) / totalVotesCasted) / 1000).toFixed(2));
    },
    [totalVotesCasted],
  );

  if ((isERC20 && !azoriusGovernance.votesToken) || (isERC721 && !azoriusGovernance.erc721Tokens)) {
    return (
      <Box mt={4}>
        <InfoBoxLoader />
      </Box>
    );
  }

  const yesVotesPercentage = getVotesPercentage(yes);
  const noVotesPercentage = getVotesPercentage(no);
  const abstainVotesPercentage = getVotesPercentage(abstain);

  return (
    <Flex
      border="1px solid"
      borderColor="neutral-3"
      borderRadius="0.5rem"
      flexWrap="wrap"
      mt="1.5rem"
    >
      <ContentBox containerBoxProps={{ bg: 'transparent', width: '100%', my: 0 }}>
        <Text textStyle="display-lg">{t('breakdownTitle', { ns: 'proposal' })}</Text>
        <Grid>
          <GridItem rowGap={4}>
            <VotesPercentage
              label={t('yes')}
              percentage={yesVotesPercentage}
            />
            <VotesPercentage
              label={t('no')}
              percentage={noVotesPercentage}
            />
            <VotesPercentage
              label={t('abstain')}
              percentage={abstainVotesPercentage}
            />
          </GridItem>
        </Grid>
      </ContentBox>
      {votes.length !== 0 && (
        <ContentBox containerBoxProps={{ bg: 'transparent', width: '100%', my: 0, paddingTop: 0 }}>
          <Text textStyle="display-lg">{t('votesTitle', { ns: 'proposal' })}</Text>
          <Divider
            my={4}
            variant="darker"
            width="calc(100% + 4rem)"
            mx="-2rem"
          />
          {isERC20 ? (
            <Grid
              templateColumns="repeat(4, auto)"
              rowGap={4}
              columnGap={5}
              overflowX="auto"
              whiteSpace="nowrap"
            >
              {votes.map(vote => {
                return (
                  <ProposalERC20VoteItem
                    key={vote.voter}
                    vote={vote}
                    govTokenTotalSupply={azoriusGovernance.votesToken?.totalSupply || 0n}
                    govTokenDecimals={azoriusGovernance.votesToken?.decimals || 0}
                    govTokenSymbol={azoriusGovernance.votesToken?.symbol || ''}
                  />
                );
              })}
            </Grid>
          ) : isERC721 ? (
            <Grid
              templateColumns="repeat(3, auto)"
              rowGap={4}
              columnGap={2}
              overflowX="auto"
              whiteSpace="nowrap"
            >
              {votes.map(vote => {
                return (
                  <ProposalERC721VoteItem
                    key={vote.voter}
                    vote={vote as ERC721ProposalVote}
                    proposalId={proposalId}
                  />
                );
              })}
            </Grid>
          ) : null}
        </ContentBox>
      )}
    </Flex>
  );
}

export default ProposalVotes;
