import { Box, Flex } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from '../../../assets/theme/custom/icons/Check';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { AzoriusGovernance, AzoriusProposal } from '../../../types';

export default function QuorumBadge({ proposal }: { proposal: AzoriusProposal }) {
  const { daoKey } = useCurrentDAOKey();
  const { governance } = useDAOStore({ daoKey });
  const { t } = useTranslation('common');

  const azoriusGovernance = governance as AzoriusGovernance;
  const { votesToken, erc721Tokens, votingStrategy } = azoriusGovernance;

  const { votesSummary } = proposal;

  const totalVotesCasted = votesSummary.yes + votesSummary.no + votesSummary.abstain;

  const votesTokenDecimalsDenominator = useMemo(
    () => 10n ** BigInt(votesToken?.decimals || 0),
    [votesToken?.decimals],
  );

  const reachedQuorum = useMemo(() => {
    if (erc721Tokens !== undefined) {
      return totalVotesCasted - votesSummary.no;
    }

    if (votesToken !== undefined) {
      return (totalVotesCasted - votesSummary.no) / votesTokenDecimalsDenominator;
    }

    return 0n;
  }, [erc721Tokens, totalVotesCasted, votesSummary, votesToken, votesTokenDecimalsDenominator]);

  const quorumDisplay = useMemo(() => {
    if (!votingStrategy) return null;
    return !!votingStrategy.quorumPercentage
      ? `${votingStrategy.quorumPercentage.formatted}%`
      : !!votingStrategy.quorumThreshold
        ? votingStrategy.quorumThreshold.formatted
        : null;
  }, [votingStrategy]);

  const strategyQuorum = useMemo(() => {
    if (!votingStrategy) return 0n;
    return erc721Tokens !== undefined
      ? votingStrategy.quorumThreshold!.value
      : votesToken !== undefined
        ? votingStrategy.quorumPercentage!.value
        : 0n;
  }, [erc721Tokens, votesToken, votingStrategy]);

  if (votesToken !== undefined && erc721Tokens !== undefined) {
    return null;
  }

  const totalQuorum = erc721Tokens !== undefined ? strategyQuorum : 0n;

  const meetsQuorum = votesToken
    ? (votesToken.totalSupply / votesTokenDecimalsDenominator / 100n) * strategyQuorum <
      reachedQuorum
    : reachedQuorum >= totalQuorum;

  const displayColor =
    totalVotesCasted !== 0n && meetsQuorum ? 'color-green-600' : 'color-neutral-300';
  return (
    <Box
      rounded="md"
      textStyle="text-sm-medium"
      borderColor={displayColor}
      textColor={displayColor}
      border="1px solid"
      px="0.5rem"
      h="1.5rem"
      lineHeight={1.5}
    >
      <Flex
        gap={2}
        alignItems="center"
      >
        <Check boxSize={4} />
        <Box>{t('quorum', { ns: 'common' })}</Box>
        <Box>{quorumDisplay}</Box>
      </Flex>
    </Box>
  );
}
