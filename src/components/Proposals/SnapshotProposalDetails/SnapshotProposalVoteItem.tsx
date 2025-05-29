import { Flex, GridItem, Text } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { useGetAccountName } from '../../../hooks/utils/useGetAccountName';
import {
  DecentSnapshotVote,
  ExtendedSnapshotProposal,
  SnapshotWeightedVotingChoice,
} from '../../../types';
import StatusBox from '../../ui/badges/StatusBox';

interface ISnapshotProposalVoteItem {
  proposal: ExtendedSnapshotProposal;
  vote: DecentSnapshotVote;
}

export default function SnapshotProposalVoteItem({ proposal, vote }: ISnapshotProposalVoteItem) {
  const { t } = useTranslation('common');
  const { displayName } = useGetAccountName(vote.voter);
  const user = useAccount();

  const isWeighted = proposal.type === 'weighted';
  const voteSymbol = useMemo(() => {
    return proposal.strategies
      .filter(
        (strategy, index) => !!strategy.params.symbol && vote.votingWeightByStrategy[index] > 0,
      )
      .map(strategy => strategy.params.symbol)
      .join();
  }, [proposal.strategies, vote.votingWeightByStrategy]);

  const totalVoteWeightedWeight = useMemo(() => {
    return vote.votingWeightByStrategy.reduce((prev, curr) => prev + curr, 0);
  }, [vote.votingWeightByStrategy]);

  return (
    <>
      <GridItem>
        <Text color="color-neutral-300">
          {displayName}
          {user.address === vote.voter && t('isMeSuffix')}
        </Text>
      </GridItem>
      <GridItem colSpan={isWeighted ? 2 : 1}>
        {isWeighted ? (
          <Flex
            gap={1}
            flexWrap="wrap"
          >
            {Object.keys(vote.choice as SnapshotWeightedVotingChoice).map((choiceIdx: any) => {
              if (!(vote.choice as SnapshotWeightedVotingChoice)[choiceIdx]) {
                return null;
              }
              return (
                <StatusBox key={choiceIdx}>
                  <Text color="color-neutral-300">
                    {proposal.choices[(choiceIdx as number) - 1]}
                  </Text>
                </StatusBox>
              );
            })}
          </Flex>
        ) : (
          <StatusBox>
            <Text color="color-neutral-300">{proposal.choices[(vote.choice as number) - 1]}</Text>
          </StatusBox>
        )}
      </GridItem>
      <GridItem>
        {isWeighted ? (
          <Flex
            gap={1}
            flexWrap="wrap"
          >
            {proposal.strategies.map((strategy, strategyIdx) => {
              const choiceWeight =
                (vote.votingWeightByStrategy[strategyIdx] / totalVoteWeightedWeight) *
                vote.votingWeight;
              if (!choiceWeight) {
                return null;
              }
              return (
                <StatusBox key={strategyIdx}>
                  <Text color="color-neutral-300">
                    {choiceWeight} {strategy.params.symbol}
                  </Text>
                </StatusBox>
              );
            })}
          </Flex>
        ) : (
          <Text color="color-neutral-300">
            {vote.votingWeight} {voteSymbol}
          </Text>
        )}
      </GridItem>
    </>
  );
}
