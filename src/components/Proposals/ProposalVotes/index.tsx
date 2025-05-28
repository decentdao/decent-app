import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import {
  AzoriusGovernance,
  AzoriusProposal,
  ERC721ProposalVote,
  GovernanceType,
} from '../../../types';
import ContentBox from '../../ui/containers/ContentBox';
import { InfoBoxLoader } from '../../ui/loaders/InfoBoxLoader';
import Divider from '../../ui/utils/Divider';
import ProgressBar, { QuorumProgressBar } from '../../ui/utils/ProgressBar';
import ProposalERC20VoteItem from './ProposalERC20VoteItem';
import ProposalERC721VoteItem from './ProposalERC721VoteItem';

function QuorumProgressBarSection({
  proposal,
  azoriusGovernance,
}: {
  proposal: AzoriusProposal;
  azoriusGovernance: AzoriusGovernance;
}) {
  const { t } = useTranslation(['proposal']);
  const { votesToken, type, erc721Tokens, votingStrategy } = azoriusGovernance;
  const {
    votesSummary: { yes, no, abstain },
  } = proposal;

  const totalVotesCasted = useMemo(() => yes + no + abstain, [yes, no, abstain]);

  const isERC20 = type === GovernanceType.AZORIUS_ERC20;
  const isERC721 = type === GovernanceType.AZORIUS_ERC721;

  const totalERC721VotingWeight = useMemo(
    () =>
      erc721Tokens?.reduce(
        (prev, curr) => prev + (curr.totalSupply ? curr.totalSupply * curr.votingWeight : 0n),
        0n,
      ),
    [erc721Tokens],
  );

  const votesTokenDecimalsDenominator = useMemo(
    () => 10n ** BigInt(votesToken?.decimals || 0),
    [votesToken?.decimals],
  );

  if (
    (isERC20 && (!votesToken || !votesToken.totalSupply || !votingStrategy?.quorumPercentage)) ||
    (isERC721 && (!erc721Tokens || !votingStrategy?.quorumThreshold))
  ) {
    return (
      <Box mt={4}>
        <InfoBoxLoader />
      </Box>
    );
  }

  const strategyQuorum =
    isERC20 && votesToken && votingStrategy
      ? votingStrategy.quorumPercentage!.value
      : isERC721 && votingStrategy
        ? votingStrategy.quorumThreshold!.value
        : 1n;

  const reachedQuorum = isERC721
    ? totalVotesCasted - no
    : votesToken
      ? (totalVotesCasted - no) / votesTokenDecimalsDenominator
      : 0n;

  const totalQuorum = isERC721
    ? Number(strategyQuorum)
    : votesToken
      ? (Number(votesToken.totalSupply / votesTokenDecimalsDenominator) * Number(strategyQuorum)) /
        100
      : undefined;

  return (
    <QuorumProgressBar
      helperText={t('proposalQuorumHelperText', {
        quorum: strategyQuorum,
        total: isERC721
          ? totalERC721VotingWeight?.toLocaleString()
          : votesToken
            ? (votesToken.totalSupply / votesTokenDecimalsDenominator).toLocaleString()
            : undefined,
      })}
      reachedQuorum={Number(reachedQuorum)}
      totalQuorum={totalQuorum}
      unit={isERC20 ? '%' : ''}
    />
  );
}

export function VotesPercentage({ label, percentage }: { label: string; percentage: number }) {
  return (
    <Flex
      marginTop={2}
      width="100%"
    >
      <ProgressBar
        value={percentage}
        label={label}
      />
    </Flex>
  );
}

function ProposalVotes({ proposal }: { proposal: AzoriusProposal }) {
  const {
    proposalId,
    votesSummary: { yes, no, abstain },
    votes,
  } = proposal;
  const { daoKey } = useCurrentDAOKey();
  const { governance } = useDAOStore({ daoKey });

  const azoriusGovernance = governance as AzoriusGovernance;
  const { t } = useTranslation('proposal');
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
      borderColor="color-neutral-900"
      borderRadius="0.5rem"
      flexWrap="wrap"
      mt="1.5rem"
    >
      <ContentBox containerBoxProps={{ bg: 'transparent', width: '100%', my: 0 }}>
        <Text textStyle="text-xl-regular">{t('breakdownTitle', { ns: 'proposal' })}</Text>
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
        <Box mt={8}>
          <QuorumProgressBarSection
            proposal={proposal}
            azoriusGovernance={azoriusGovernance}
          />
        </Box>
      </ContentBox>
      {votes.length !== 0 && (
        <ContentBox containerBoxProps={{ bg: 'transparent', width: '100%', my: 0, paddingTop: 0 }}>
          <Text textStyle="text-xl-regular">{t('votesTitle', { ns: 'proposal' })}</Text>
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
