import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { Question } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { erc721Abi, getContract } from 'viem';
import { useAccount } from 'wagmi';
import { TOOLTIP_MAXW } from '../../constants/common';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import useBlockTimestamp from '../../hooks/utils/useBlockTimestamp';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { useFractal } from '../../providers/App/AppProvider';
import { AzoriusGovernance, AzoriusProposal, GovernanceType } from '../../types';
import { DEFAULT_DATE_TIME_FORMAT, formatCoin } from '../../utils/numberFormats';
import { AlertBanner } from '../ui/AlertBanner';
import { DecentTooltip } from '../ui/DecentTooltip';
import ContentBox from '../ui/containers/ContentBox';
import DisplayTransaction from '../ui/links/DisplayTransaction';
import EtherscanLink from '../ui/links/EtherscanLink';
import { InfoBoxLoader } from '../ui/loaders/InfoBoxLoader';
import InfoRow from '../ui/proposal/InfoRow';
import ProposalCreatedBy from '../ui/proposal/ProposalCreatedBy';
import Divider from '../ui/utils/Divider';
import { QuorumProgressBar } from '../ui/utils/ProgressBar';
import { AzoriusOrSnapshotProposalAction } from './ProposalActions/AzoriusOrSnapshotProposalAction';
import { VoteContextProvider } from './ProposalVotes/context/VoteContext';

function ProposalDetailsSection({
  proposal,
  startBlockTimeStamp,
}: {
  proposal: AzoriusProposal;
  startBlockTimeStamp: number;
}) {
  const { t } = useTranslation(['proposal', 'common', 'navigation']);
  const { eventDate, startBlock, deadlineMs, proposer, transactionHash } = proposal;

  return (
    <ContentBox
      containerBoxProps={{
        border: '1px solid',
        borderColor: 'neutral-3',
        borderRadius: '0.75rem',
        my: 0,
      }}
      title={t('proposalSummaryTitle')}
    >
      <Divider
        variant="darker"
        width="calc(100% + 4rem)"
        mx="-2rem"
        mt={2}
      />
      <Box mx={-2}>
        <InfoRow
          property={t('votingSystem')}
          value={t('singleSnapshotVotingSystem')}
        />
        <InfoRow
          property={t('proposalSummaryStartDate')}
          value={format(startBlockTimeStamp * 1000, DEFAULT_DATE_TIME_FORMAT)}
          tooltip={formatInTimeZone(startBlockTimeStamp * 1000, 'GMT', DEFAULT_DATE_TIME_FORMAT)}
        />
        <InfoRow
          property={t('proposalSummaryEndDate')}
          value={format(deadlineMs, DEFAULT_DATE_TIME_FORMAT)}
          tooltip={formatInTimeZone(deadlineMs, 'GMT', DEFAULT_DATE_TIME_FORMAT)}
        />
        <Flex
          marginTop={4}
          flexWrap="wrap"
          alignItems="center"
        >
          <Text
            color="neutral-7"
            w="full"
          >
            {t('snapshotTaken')}
          </Text>
          <EtherscanLink
            type="block"
            value={startBlock.toString()}
            pl={0}
            isTextLink
          >
            <Flex
              alignItems="center"
              justifyContent="space-between"
            >
              {format(eventDate, DEFAULT_DATE_TIME_FORMAT)}
            </Flex>
          </EtherscanLink>
        </Flex>
        <ProposalCreatedBy proposer={proposer} />
        {transactionHash && (
          <Flex
            marginTop={4}
            alignItems="center"
            flexWrap="wrap"
          >
            <Text
              color="neutral-7"
              w="full"
            >
              {t('transactionHash')}
            </Text>
            <DisplayTransaction txHash={transactionHash} />
          </Flex>
        )}
      </Box>
    </ContentBox>
  );
}

function ProposalVotingSection({
  proposal,
  azoriusGovernance,
  proposalVotingWeight,
}: {
  proposal: AzoriusProposal;
  azoriusGovernance: AzoriusGovernance;
  proposalVotingWeight: string;
}) {
  const { t } = useTranslation(['proposal']);
  const { address } = useAccount();
  const { votesToken, type, erc721Tokens, votingStrategy } = azoriusGovernance;

  const isERC20 = type === GovernanceType.AZORIUS_ERC20;
  const isERC721 = type === GovernanceType.AZORIUS_ERC721;

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

  return (
    <ContentBox
      containerBoxProps={{
        border: '1px solid',
        borderColor: 'neutral-3',
        borderRadius: '0.75rem',
        py: 4,
      }}
    >
      {/* Voting Power */}
      <Flex
        flexWrap="wrap"
        flexDirection="column"
        alignItems="flex-start"
        mx={-2}
      >
        <Flex
          alignItems="center"
          gap={1}
        >
          <Text
            color="neutral-7"
            w="full"
          >
            {t('votingPower')}
          </Text>
          <DecentTooltip
            label={t('votingPowerTooltip')}
            placement="left"
            maxW={TOOLTIP_MAXW}
          >
            <Icon
              as={Question}
              color="neutral-7"
            />
          </DecentTooltip>
        </Flex>

        <Text
          color="celery-0"
          mt={1}
        >
          {proposalVotingWeight}
        </Text>
      </Flex>

      {address && (
        <VoteContextProvider proposal={proposal}>
          <AzoriusOrSnapshotProposalAction proposal={proposal} />
        </VoteContextProvider>
      )}
    </ContentBox>
  );
}

// @todo: QuorumProgressBarSection has been redesigned and moved to the Breakdown section. Need to circle back to this.
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
      helperText={t(
        isERC20
          ? 'proposalSupportERC20SummaryHelper'
          : isERC721
            ? 'proposalSupportERC721SummaryHelper'
            : '',
        {
          quorum: strategyQuorum,
          total: isERC721
            ? totalERC721VotingWeight?.toLocaleString()
            : votesToken
              ? (votesToken.totalSupply / votesTokenDecimalsDenominator).toLocaleString()
              : undefined,
        },
      )}
      reachedQuorum={Number(reachedQuorum)}
      totalQuorum={totalQuorum}
      unit={isERC20 ? '%' : ''}
    />
  );
}

export function AzoriusProposalSummary({ proposal }: { proposal: AzoriusProposal }) {
  const { governance } = useFractal();
  const azoriusGovernance = governance as AzoriusGovernance;
  const startBlockTimeStamp = useBlockTimestamp(Number(proposal.startBlock));

  const { t } = useTranslation(['proposal']);

  const { address } = useAccount();
  const publicClient = useNetworkPublicClient();
  const { votesToken, type } = azoriusGovernance;
  const { startBlock } = proposal;

  const [proposalVotingWeight, setProposalVotingWeight] = useState('0');

  const isERC20 = type === GovernanceType.AZORIUS_ERC20;
  const isERC721 = type === GovernanceType.AZORIUS_ERC721;

  const getErc721VotingWeight = useCallback(async () => {
    if (!address || !azoriusGovernance.erc721Tokens) {
      return 0n;
    }
    const userVotingWeight = (
      await Promise.all(
        azoriusGovernance.erc721Tokens.map(async ({ address: tokenAddress, votingWeight }) => {
          const tokenContract = getContract({
            abi: erc721Abi,
            address: tokenAddress,
            client: publicClient,
          });
          const userBalance = await tokenContract.read.balanceOf([address], {
            blockNumber: startBlock,
          });
          return userBalance * votingWeight;
        }),
      )
    ).reduce((prev, curr) => prev + curr, 0n);
    return userVotingWeight;
  }, [azoriusGovernance.erc721Tokens, publicClient, address, startBlock]);

  useEffect(() => {
    async function loadProposalVotingWeight() {
      if (address) {
        if (isERC20) {
          const strategyContract = getContract({
            abi: abis.LinearERC20Voting,
            address: proposal.votingStrategy,
            client: publicClient,
          });

          const pastVotingWeight = await strategyContract.read.getVotingWeight([
            address,
            Number(proposal.proposalId),
          ]);

          setProposalVotingWeight(
            formatCoin(pastVotingWeight, true, votesToken?.decimals, undefined, false),
          );
        } else if (isERC721) {
          const votingWeight = await getErc721VotingWeight();
          setProposalVotingWeight(votingWeight.toString());
        }
      }
    }

    loadProposalVotingWeight();
  }, [
    address,
    proposal.proposalId,
    proposal.votingStrategy,
    publicClient,
    votesToken?.decimals,
    isERC20,
    isERC721,
    getErc721VotingWeight,
    startBlock,
  ]);

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const notEnoughVotingPowerAtTheTimeOfProposalCreation =
    proposalVotingWeight === '0' && canUserCreateProposal;

  return (
    <Flex
      flexDirection="column"
      gap="0.75rem"
    >
      <ProposalDetailsSection
        proposal={proposal}
        startBlockTimeStamp={startBlockTimeStamp}
      />

      <ProposalVotingSection
        proposal={proposal}
        azoriusGovernance={azoriusGovernance}
        proposalVotingWeight={proposalVotingWeight}
      />

      {notEnoughVotingPowerAtTheTimeOfProposalCreation && (
        <AlertBanner
          message={t('proposalSummaryNotEnoughVotingPower')}
          messageSecondary={t('proposalSummaryNotEnoughVotingPowerSecondary')}
          variant="warning"
          layout="vertical"
        />
      )}

      <QuorumProgressBarSection
        proposal={proposal}
        azoriusGovernance={azoriusGovernance}
      />
    </Flex>
  );
}
