import { Button, Box, Text, Image, Flex, Radio, RadioGroup, Icon } from '@chakra-ui/react';
import { Check, CheckCircle, Sparkle } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getContract } from 'viem';
import { useAccount } from 'wagmi';
import { EntryPointAbi } from '../../../assets/abi/EntryPointAbi';
import { SimpleAccountFactoryAbi } from '../../../assets/abi/SimpleAccountFactoryAbi';
import { ENTRY_POINT_ADDRESS, TOOLTIP_MAXW } from '../../../constants/common';
import useSnapshotProposal from '../../../hooks/DAO/loaders/snapshot/useSnapshotProposal';
import useCastSnapshotVote from '../../../hooks/DAO/proposal/useCastSnapshotVote';
import useCastVote from '../../../hooks/DAO/proposal/useCastVote';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { useNetworkWalletClient } from '../../../hooks/useNetworkWalletClient';
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
import { getUserSmartWalletSalt } from '../../../utils/gaslessVoting';
import { DecentTooltip } from '../../ui/DecentTooltip';
import WeightedInput from '../../ui/forms/WeightedInput';
import { ModalType } from '../../ui/modals/ModalProvider';
import { useDecentModal } from '../../ui/modals/useDecentModal';
import { useVoteContext } from '../ProposalVotes/context/VoteContext';

export function CastVote({ proposal }: { proposal: FractalProposal }) {
  const [selectedVoteChoice, setVoiceChoice] = useState<number>();
  const { t } = useTranslation(['proposal', 'transaction']);
  const { isLoaded: isCurrentBlockLoaded, currentBlockNumber } = useCurrentBlockNumber();

  const { snapshotProposal, extendedSnapshotProposal, loadSnapshotProposal } =
    useSnapshotProposal(proposal);

  useEffect(() => {
    loadSnapshotProposal();
  }, [loadSnapshotProposal]);

  const azoriusProposal = proposal as AzoriusProposal;

  const { castVote, castVotePending, prepareCastVoteData } = useCastVote(
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

  const publicClient = useNetworkPublicClient();
  const {
    rpcEndpoint,
    chain,
    contracts: { simpleAccountFactory },
  } = useNetworkConfigStore();
  const { data: walletClient } = useNetworkWalletClient();
  const { address } = useAccount();
  const { canVoteLoading, hasVoted, hasVotedLoading } = useVoteContext();

  const { gaslessVotingEnabled, paymasterAddress } = useDaoInfoStore();

  const entryPoint = getContract({
    address: ENTRY_POINT_ADDRESS,
    abi: EntryPointAbi,
    client: publicClient,
  });

  const castGaslessVote = async () => {
    if (
      !chain ||
      !address ||
      !paymasterAddress ||
      !walletClient ||
      selectedVoteChoice === undefined
    ) {
      return;
    }

    // Get user's smart wallet address
    const smartWalletSalt = getUserSmartWalletSalt({
      EOA: address,
      chainId: chain.id,
    });
    const smartWalletContract = getContract({
      address: simpleAccountFactory,
      abi: SimpleAccountFactoryAbi,
      client: publicClient,
    });
    const smartWalletAddress = await smartWalletContract.read.getAddress([
      address,
      smartWalletSalt,
    ]);

    const castVoteCallData = prepareCastVoteData(selectedVoteChoice);

    if (!castVoteCallData) {
      throw new Error('Cast vote call data is not valid');
    }

    const validationGasLimit = 100000n;
    const callGasLimit = 100000n;

    // Pack them together into a single bytes32
    const accountGasLimits = ('0x' +
      validationGasLimit.toString(16).padStart(32, '0') + // First 16 bytes
      callGasLimit.toString(16).padStart(32, '0')) as `0x${string}`;

    const userOpData: {
      sender: `0x${string}`;
      nonce: bigint;
      initCode: `0x${string}`;
      callData: `0x${string}`;
      accountGasLimits: `0x${string}`;
      preVerificationGas: bigint;
      gasFees: `0x${string}`;
      paymasterAndData: `0x${string}`;
      signature: `0x${string}`;
    } = {
      sender: smartWalletAddress,
      nonce: await entryPoint.read.getNonce([smartWalletAddress, 0n]),
      initCode: '0x',
      callData: castVoteCallData,
      accountGasLimits,
      gasFees: ('0x' + '0'.padStart(64, '0')) as `0x${string}`,
      preVerificationGas: 50000n,
      signature: '0x', // This is set below
      paymasterAndData: paymasterAddress,
    };
    const userOp = {
      ...userOpData,
      paymaster: paymasterAddress,
    };

    // Sign the UserOperation
    const userOpHash = await entryPoint.read.getUserOpHash([userOpData]);
    const signature = await walletClient.signMessage({
      message: { raw: userOpHash },
    });
    userOp.signature = signature;

    // Send UserOperation to bundler
    const options = {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_sendUserOperation',
        params: [userOp],
      }),
    };

    fetch(rpcEndpoint, options)
      .then(res => res.json())
      .then(res => console.log(res))
      .catch(err => console.error(err));
  };

  const createSmartWallet = useDecentModal(ModalType.CREATE_SMART_WALLET, {
    successCallback: () => {
      castGaslessVote();
    },
  });

  const [paymasterBalance, setPaymasterBalance] = useState<BigIntValuePair>();
  useEffect(() => {
    if (!paymasterAddress) return;

    entryPoint.read.balanceOf([paymasterAddress]).then(balance => {
      setPaymasterBalance({
        value: balance.toString(),
        bigintValue: balance,
      });
    });
  }, [entryPoint.read, paymasterAddress, publicClient]);

  const minimumPaymasterBalance = 0n; // @todo: update to reasonable amount
  const canVoteForFree = useMemo(() => {
    return (
      gaslessVotingEnabled &&
      paymasterBalance?.bigintValue &&
      paymasterBalance.bigintValue > minimumPaymasterBalance
    );
  }, [gaslessVotingEnabled, minimumPaymasterBalance, paymasterBalance?.bigintValue]);

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
    azoriusProposal.state !== FractalProposalState.ACTIVE ||
    proposalStartBlockNotFinalized ||
    canVoteLoading ||
    hasVoted ||
    hasVotedLoading;

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
            {t(choice.label, { ns: 'common' })}
          </Radio>
        ))}
        <Button
          marginTop={5}
          padding="3"
          height="3.25rem"
          width="full"
          leftIcon={canVoteForFree ? <Icon as={Sparkle} /> : undefined}
          isDisabled={disabled}
          onClick={() => {
            if (selectedVoteChoice !== undefined) {
              if (canVoteForFree) {
                createSmartWallet();
              } else {
                castVote(selectedVoteChoice);
              }
            }
          }}
        >
          {canVoteForFree ? t('voteForFree') : t('vote')}
        </Button>
      </RadioGroup>
    </DecentTooltip>
  );
}
