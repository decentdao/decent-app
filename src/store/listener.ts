import { useCallback } from 'react';
import { Address } from 'viem';
import {
  AzoriusProposal,
  DAOKey,
  ERC721ProposalVote,
  GovernanceType,
  ProposalVote,
  ProposalVotesSummary,
} from '../types';
import { useAccountListeners } from './listeners/account';
import { useGovernanceListeners } from './listeners/governance';
import { useGlobalStore } from './store';

/**
 * useStoreListener orchestrates communication between various real-time listeners and Global store.
 * Underlying listeners could get updates from whatever source(on-chain, WebSocket, etc.), which then would be reflected in the store.
 */
export const useStoreListener = ({ daoKey }: { daoKey: DAOKey | undefined }) => {
  const {
    setGovernanceAccountData,
    setGovernanceLockReleaseAccountData,
    getDaoNode,
    getGovernance,
    getGuard,
    setProposal,
    setProposalVote,
    setGuardAccountData,
  } = useGlobalStore();

  const governance = daoKey ? getGovernance(daoKey) : undefined;
  const lockedVotesTokenAddress = governance?.lockReleaseAddress;
  const votesTokenAddress = governance?.votesTokenAddress;
  const azoriusModuleAddress = governance?.moduleAzoriusAddress;
  const erc20StrategyAddress =
    governance?.linearVotingErc20Address ||
    governance?.linearVotingErc20WithHatsWhitelistingAddress;
  const erc721StrategyAddress =
    governance?.linearVotingErc721Address ||
    governance?.linearVotingErc721WithHatsWhitelistingAddress;

  const node = daoKey ? getDaoNode(daoKey) : undefined;
  const parentSafeAddress = node?.subgraphInfo?.parentAddress;

  const guard = daoKey ? getGuard(daoKey) : undefined;
  const azoriusGuardAddress =
    governance?.type === GovernanceType.AZORIUS_ERC20 ||
    governance?.type === GovernanceType.AZORIUS_ERC721
      ? guard?.freezeGuardContractAddress
      : undefined;
  const multisigGuardAddress =
    governance?.type === GovernanceType.MULTISIG ? guard?.freezeGuardContractAddress : undefined;
  const freezeVotingType = guard?.freezeVotingType;
  const freezeVotingAddress = guard?.freezeVotingContractAddress;
  const freezeProposalCreatedTime = guard?.freezeProposalCreatedTime;
  const freezeProposalPeriod = guard?.freezeProposalPeriod;
  const freezePeriod = guard?.freezePeriod;

  const onProposalCreated = useCallback(
    (proposal: AzoriusProposal) => {
      if (daoKey) {
        setProposal(daoKey, proposal);
      }
    },
    [daoKey, setProposal],
  );

  const onGovernanceAccountDataUpdated = useCallback(
    (governanceAccountData: { balance: bigint; delegatee: Address }) => {
      if (daoKey) {
        setGovernanceAccountData(daoKey, governanceAccountData);
      }
    },
    [daoKey, setGovernanceAccountData],
  );

  const onLockReleaseAccountDataUpdated = useCallback(
    (lockReleaseAccountData: { balance: bigint; delegatee: Address }) => {
      if (daoKey) {
        setGovernanceLockReleaseAccountData(daoKey, lockReleaseAccountData);
      }
    },
    [daoKey, setGovernanceLockReleaseAccountData],
  );

  const onERC20VoteCreated = useCallback(
    (proposalId: string, votesSummary: ProposalVotesSummary, vote: ProposalVote) => {
      if (daoKey) {
        setProposalVote(daoKey, proposalId, votesSummary, vote);
      }
    },
    [daoKey, setProposalVote],
  );

  const onERC721VoteCreated = useCallback(
    (proposalId: string, votesSummary: ProposalVotesSummary, vote: ERC721ProposalVote) => {
      if (daoKey) {
        setProposalVote(daoKey, proposalId, votesSummary, vote);
      }
    },
    [daoKey, setProposalVote],
  );

  useGovernanceListeners({
    lockedVotesTokenAddress,
    votesTokenAddress,
    azoriusModuleAddress,
    erc20StrategyAddress,
    erc721StrategyAddress,
    onProposalCreated,
    onGovernanceAccountDataUpdated,
    onLockReleaseAccountDataUpdated,
    onERC20VoteCreated,
    onERC721VoteCreated,
  });

  const onGuardAccountDataLoaded = useCallback(
    (guardAccountData: { userHasFreezeVoted: boolean; userHasVotes: boolean }) => {
      if (daoKey) {
        setGuardAccountData(daoKey, guardAccountData);
      }
    },
    [daoKey, setGuardAccountData],
  );

  const onGovernanceAccountDataLoaded = useCallback(
    (accountData: { balance: bigint; delegatee: Address }) => {
      if (daoKey) {
        setGovernanceAccountData(daoKey, accountData);
      }
    },
    [daoKey, setGovernanceAccountData],
  );

  const onGovernanceLockReleaseAccountDataLoaded = useCallback(
    (accountData: { balance: bigint; delegatee: Address }) => {
      if (daoKey) {
        setGovernanceLockReleaseAccountData(daoKey, accountData);
      }
    },
    [daoKey, setGovernanceLockReleaseAccountData],
  );

  useAccountListeners({
    votesTokenAddress,
    azoriusGuardAddress,
    multisigGuardAddress,
    freezeVotingType: freezeVotingType || undefined,
    freezeVotingAddress: freezeVotingAddress || undefined,
    freezeProposalCreatedTime: freezeProposalCreatedTime || undefined,
    freezeProposalPeriod: freezeProposalPeriod || undefined,
    freezePeriod: freezePeriod || undefined,
    lockReleaseAddress: lockedVotesTokenAddress,
    parentSafeAddress: parentSafeAddress || undefined,
    onGuardAccountDataLoaded,
    onGovernanceAccountDataLoaded,
    onGovernanceLockReleaseAccountDataLoaded,
  });
};
