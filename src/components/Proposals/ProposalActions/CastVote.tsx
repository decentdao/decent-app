import { Button, Box, Text, Image, Flex, Radio, RadioGroup, Icon } from '@chakra-ui/react';
import { Check, CheckCircle, Sparkle } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getContract } from 'viem';
import { EntryPoint07Abi } from '../../../assets/abi/EntryPoint07Abi';
import { TOOLTIP_MAXW } from '../../../constants/common';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import useSnapshotProposal from '../../../hooks/DAO/loaders/snapshot/useSnapshotProposal';
import useCastSnapshotVote from '../../../hooks/DAO/proposal/useCastSnapshotVote';
import useCastVote from '../../../hooks/DAO/proposal/useCastVote';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import useCurrentBlockNumber from '../../../hooks/utils/useCurrentBlockNumber';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import {
  AzoriusProposal,
  BigIntValuePair,
  FractalProposal,
  FractalProposalState,
  VOTE_CHOICES,
} from '../../../types';
import { DecentTooltip } from '../../ui/DecentTooltip';
import WeightedInput from '../../ui/forms/WeightedInput';
import { ModalType } from '../../ui/modals/ModalProvider';
import { useDecentModal } from '../../ui/modals/useDecentModal';
import { useVoteContext } from '../ProposalVotes/context/VoteContext';

export function CastVote({ proposal }: { proposal: FractalProposal }) {
  const [selectedVoteChoice, setVoiceChoice] = useState<number>();
  const { t } = useTranslation(['proposal', 'transaction', 'gaslessVoting']);
  const { isLoaded: isCurrentBlockLoaded, currentBlockNumber } = useCurrentBlockNumber();

  const { snapshotProposal, extendedSnapshotProposal, loadSnapshotProposal } =
    useSnapshotProposal(proposal);

  useEffect(() => {
    loadSnapshotProposal();
  }, [loadSnapshotProposal]);

  const azoriusProposal = proposal as AzoriusProposal;

  const publicClient = useNetworkPublicClient();
  // @todo: (gv) Build better UX around castGaslessVotePending (and probably castVotePending)
  const { castVote, castVotePending, castGaslessVote, castGaslessVotePending } = useCastVote(
    proposal.proposalId,
    azoriusProposal.votingStrategy,
  );

  const {
    castSnapshotVote,
    handleChangeSnapshotWeightedChoice,
    handleSelectSnapshotChoice,
    selectedChoice,
    snapshotWeightedChoice,
  } = useCastSnapshotVote(extendedSnapshotProposal);

  const {
    contracts: { entryPointv07 },
  } = useNetworkConfigStore();
  const { canVoteLoading, hasVoted, hasVotedLoading } = useVoteContext();

  const { gaslessVotingEnabled, paymasterAddress } = useDaoInfoStore();

  const gaslessVoteSuccessModal = useDecentModal(ModalType.GASLESS_VOTE_SUCCESS);

  const [paymasterBalance, setPaymasterBalance] = useState<BigIntValuePair>();
  useEffect(() => {
    if (!paymasterAddress || !entryPointv07) return;

    const entryPoint = getContract({
      address: entryPointv07,
      abi: EntryPoint07Abi,
      client: publicClient,
    });

    entryPoint.read.balanceOf([paymasterAddress]).then(balance => {
      setPaymasterBalance({
        value: balance.toString(),
        bigintValue: balance,
      });
    });
  }, [entryPointv07, paymasterAddress, publicClient]);

  // Set a reasonable minimum (slightly higher than the required amount)
  const minimumPaymasterBalance = 60000000000000000n; // 0.06 ETH in wei
  const gaslessFeatureEnabled = useFeatureFlag('flag_gasless_voting');
  const canVoteForFree = useMemo(() => {
    return (
      gaslessFeatureEnabled &&
      gaslessVotingEnabled &&
      paymasterBalance?.bigintValue !== undefined &&
      paymasterBalance.bigintValue > minimumPaymasterBalance
    );
  }, [
    gaslessFeatureEnabled,
    gaslessVotingEnabled,
    minimumPaymasterBalance,
    paymasterBalance?.bigintValue,
  ]);

  // If user is lucky enough - he could create a proposal and proceed to vote on it
  // even before the block, in which proposal was created, was mined.
  // This gives a weird behavior when casting vote fails due to requirement under LinearERC20Voting contract that current block number
  // shouldn't be equal to proposal's start block number. Which is dictated by the need to have voting tokens delegation being "finalized" to prevent proposal hijacking.
  const proposalStartBlockNotFinalized = Boolean(
    !snapshotProposal &&
      isCurrentBlockLoaded &&
      currentBlockNumber &&
      azoriusProposal.startBlock >= currentBlockNumber,
  );

  const disabled =
    castVotePending ||
    castGaslessVotePending ||
    azoriusProposal.state !== FractalProposalState.ACTIVE ||
    proposalStartBlockNotFinalized ||
    canVoteLoading ||
    hasVoted ||
    hasVotedLoading;

  const handleVoteClick = async () => {
    if (selectedVoteChoice !== undefined) {
      if (canVoteForFree) {
        await castGaslessVote({
          selectedVoteChoice,
          onSuccess: gaslessVoteSuccessModal,
          onError: (error: any) => {
            console.error('Gasless voting error:', error);
            toast.error(`${t('castVoteError')}${t('castVoteErrorTempAutoFallback')}`);

            setTimeout(() => {
              castVote(selectedVoteChoice);
            }, 5000);
          },
        });
      } else {
        await castVote(selectedVoteChoice);
      }
    }
  };

  if (snapshotProposal && extendedSnapshotProposal) {
    const isWeighted = extendedSnapshotProposal.type === 'weighted';
    const weightedTotalValue = snapshotWeightedChoice.reduce((prev, curr) => prev + curr, 0);
    const voteDisabled =
      (!isWeighted && typeof selectedChoice === 'undefined') ||
      (isWeighted && weightedTotalValue === 0);

    return (
      <>
        {isWeighted && snapshotWeightedChoice.length > 0
          ? extendedSnapshotProposal.choices.map((choice, i) => (
              <WeightedInput
                key={choice}
                label={choice}
                totalValue={weightedTotalValue}
                value={snapshotWeightedChoice[i]}
                onChange={newValue => handleChangeSnapshotWeightedChoice(i, newValue)}
              />
            ))
          : extendedSnapshotProposal.choices.map((choice, i) => (
              <Button
                key={choice}
                variant="secondary"
                width="full"
                onClick={() => handleSelectSnapshotChoice(i)}
                marginTop={5}
              >
                {selectedChoice === i && (
                  <Icon
                    as={Check}
                    boxSize="1.5rem"
                  />
                )}
                {choice}
              </Button>
            ))}
        <Button
          width="full"
          isDisabled={voteDisabled}
          onClick={() => castSnapshotVote(loadSnapshotProposal)}
          marginTop={5}
          padding="1.5rem 6rem"
          height="auto"
        >
          {t('vote')}
        </Button>
        {hasVoted && (
          <Box
            mt={4}
            color="neutral-6"
            fontWeight="600"
          >
            <Flex>
              <Icon
                boxSize="1.5rem"
                mr={2}
                as={CheckCircle}
              />
              <Text>{t('successCastVote', { ns: 'transaction' })}</Text>
            </Flex>
            <Text>{t('snapshotRecastVoteHelper', { ns: 'transaction' })}</Text>
          </Box>
        )}
        <Box
          mt={4}
          color="neutral-7"
        >
          <Text>{t('poweredBy')}</Text>
          <Flex>
            <Flex mr={1}>
              {/* TODO: replace with <SnapshotIcon /> */}
              <Image
                src="/images/snapshot-icon-fill.svg"
                alt="Snapshot icon"
                mr={1}
              />
              <Text>{t('snapshot')}</Text>
            </Flex>
            {extendedSnapshotProposal.privacy === 'shutter' && (
              <Flex>
                <Image
                  src="/images/shutter-icon.svg"
                  alt="Shutter icon"
                  mr={1}
                />
                <Text>{t('shutter')}</Text>
              </Flex>
            )}
          </Flex>
        </Box>
      </>
    );
  }

  return (
    <DecentTooltip
      placement="left"
      maxW={TOOLTIP_MAXW}
      title={
        proposalStartBlockNotFinalized
          ? t('proposalStartBlockNotFinalized', { ns: 'proposal' })
          : hasVoted
            ? t('currentUserAlreadyVoted', { ns: 'proposal' })
            : undefined
      }
    >
      <RadioGroup
        mt={6}
        mx={-2}
      >
        {VOTE_CHOICES.map(choice => (
          <Radio
            key={choice.value}
            onChange={event => {
              event.preventDefault();
              if (!disabled) {
                setVoiceChoice(choice.value);
              }
            }}
            width="100%"
            isChecked={choice.value === selectedVoteChoice}
            isDisabled={disabled}
            bg="black-0"
            color="lilac--3"
            size="md"
            _disabled={{ bg: 'neutral-6', color: 'neutral-5' }}
            _hover={{ bg: 'black-0', color: 'lilac--4' }}
            _checked={{
              bg: 'black-0',
              color: 'lilac--3',
              borderWidth: '6px',
            }}
            mb={2}
          >
            {t(choice.label)}
          </Radio>
        ))}
        <Button
          marginTop={5}
          padding="3"
          height="3.25rem"
          width="full"
          leftIcon={canVoteForFree ? <Icon as={Sparkle} /> : undefined}
          isDisabled={disabled}
          onClick={handleVoteClick}
        >
          {canVoteForFree ? t('voteForFree') : t('vote')}
        </Button>
      </RadioGroup>
    </DecentTooltip>
  );
}
