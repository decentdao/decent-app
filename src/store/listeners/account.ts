import { abis, legacy } from '@decentdao/decent-contracts';
import { useEffect } from 'react';
import { Address, getContract } from 'viem';
import { useAccount } from 'wagmi';
import { logError } from '../../helpers/errorLogging';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { FreezeVotingType, GuardAccountData } from '../../types';
import { useGovernanceFetcher } from '../fetchers/governance';
import { useGuardFetcher } from '../fetchers/guard';

export function useAccountListeners({
  stakingAddress,
  votesTokenAddress,
  erc20TokenAddress,
  lockReleaseAddress,
  azoriusGuardAddress,
  multisigGuardAddress,
  parentSafeAddress,
  freezeVotingType,
  freezeVotingAddress,
  freezeProposalCreatedTime,
  freezeProposalPeriod,
  freezePeriod,
  onGovernanceAccountDataLoaded,
  onGovernanceLockReleaseAccountDataLoaded,
  onGuardAccountDataLoaded,
  onStakedTokenAccountDataLoaded,
  onERC20TokenAccountDataLoaded,
}: {
  stakingAddress?: Address;
  votesTokenAddress?: Address;
  erc20TokenAddress?: Address;
  lockReleaseAddress?: Address;
  azoriusGuardAddress?: Address;
  multisigGuardAddress?: Address;
  parentSafeAddress?: Address;
  freezeGuardContractAddress?: Address;
  freezeVotingType?: FreezeVotingType;
  freezeVotingAddress?: Address;
  freezeProposalCreatedTime?: bigint;
  freezeProposalPeriod?: bigint;
  freezePeriod?: bigint;
  onGovernanceAccountDataLoaded: (accountData: {
    balance: bigint;
    delegatee: Address;
    allowance: bigint;
  }) => void;
  onGovernanceLockReleaseAccountDataLoaded: (accountData: {
    balance: bigint;
    delegatee: Address;
  }) => void;
  onGuardAccountDataLoaded: (accountData: GuardAccountData) => void;
  onStakedTokenAccountDataLoaded: (accountData: {
    balance: bigint;
    stakerData: { stakedAmount: bigint; lastStakeTimestamp: bigint };
    claimableRewards: bigint[];
  }) => void;
  onERC20TokenAccountDataLoaded: (accountData: { balance: bigint; allowance: bigint }) => void;
}) {
  const { address: account } = useAccount();
  const publicClient = useNetworkPublicClient();
  const {
    fetchVotingTokenAccountData,
    fetchLockReleaseAccountData,
    fetchStakedTokenAccountData,
    fetchERC20TokenAccountData,
  } = useGovernanceFetcher();
  const { fetchGuardAccountData } = useGuardFetcher();

  useEffect(() => {
    async function loadAccountData() {
      if (!votesTokenAddress) {
        return;
      }
      if (!account) {
        onGovernanceAccountDataLoaded({
          balance: 0n,
          delegatee: '0x0000000000000000000000000000000000000000',
          allowance: 0n,
        });
        return;
      }

      try {
        const votingTokenAccountData = await fetchVotingTokenAccountData(
          votesTokenAddress,
          account,
          stakingAddress,
        );
        onGovernanceAccountDataLoaded(votingTokenAccountData);

        if (lockReleaseAddress) {
          const lockReleaseAccountData = await fetchLockReleaseAccountData(
            lockReleaseAddress,
            account,
          );
          onGovernanceLockReleaseAccountDataLoaded(lockReleaseAccountData);
        }
      } catch (e) {
        logError(e as Error);
      }
    }

    loadAccountData();
  }, [
    votesTokenAddress,
    lockReleaseAddress,
    stakingAddress,
    account,
    fetchVotingTokenAccountData,
    fetchLockReleaseAccountData,
    onGovernanceAccountDataLoaded,
    onGovernanceLockReleaseAccountDataLoaded,
  ]);

  useEffect(() => {
    async function loadGuardAccountData() {
      if (
        freezeVotingType === undefined ||
        freezeVotingAddress === undefined ||
        freezeProposalCreatedTime === undefined ||
        freezeProposalPeriod === undefined ||
        freezePeriod === undefined
      ) {
        return;
      }
      if (!account) {
        onGuardAccountDataLoaded({
          userHasFreezeVoted: false,
          userHasVotes: false,
        });
        return;
      }

      try {
        const guardAccountData = await fetchGuardAccountData({
          account,
          azoriusGuardAddress,
          multisigGuardAddress,
          freezeVotingType,
          freezeVotingAddress,
          freezeProposalCreatedTime,
          freezeProposalPeriod,
          freezePeriod,
          parentSafeAddress,
        });

        if (guardAccountData) {
          onGuardAccountDataLoaded(guardAccountData);
        }
      } catch {
        // Silent failure - background data loading, don't interrupt user workflow
      }
    }

    loadGuardAccountData();
  }, [
    account,
    azoriusGuardAddress,
    multisigGuardAddress,
    parentSafeAddress,
    freezeVotingType,
    freezeVotingAddress,
    freezeProposalCreatedTime,
    freezeProposalPeriod,
    freezePeriod,
    fetchGuardAccountData,
    onGuardAccountDataLoaded,
  ]);

  // Combined ERC20 token initial data loading + event listeners
  useEffect(() => {
    if (!erc20TokenAddress) {
      return;
    }
    if (!account) {
      onERC20TokenAccountDataLoaded({ balance: 0n, allowance: 0n });
      return;
    }

    // TypeScript now knows these are defined after the guard
    const definedAccount = account;
    const definedErc20Address = erc20TokenAddress;

    // Initial data load
    async function loadERC20TokenAccountData() {
      try {
        const tokenAccountData = await fetchERC20TokenAccountData(
          definedErc20Address,
          definedAccount,
          stakingAddress,
        );
        onERC20TokenAccountDataLoaded(tokenAccountData);
      } catch (e) {
        logError(e as Error);
      }
    }

    loadERC20TokenAccountData();

    // Set up event listeners
    const erc20Contract = getContract({
      abi: legacy.abis.VotesERC20,
      address: definedErc20Address,
      client: publicClient,
    });

    const handleTransfer = async () => {
      try {
        const tokenAccountData = await fetchERC20TokenAccountData(
          definedErc20Address,
          definedAccount,
          stakingAddress,
        );
        onERC20TokenAccountDataLoaded(tokenAccountData);
      } catch (e) {
        logError(e as Error);
      }
    };

    // Watch for transfers to this account
    const unwatchTransferTo = erc20Contract.watchEvent.Transfer(
      { to: definedAccount },
      { onLogs: handleTransfer },
    );

    // Watch for transfers from this account
    const unwatchTransferFrom = erc20Contract.watchEvent.Transfer(
      { from: definedAccount },
      { onLogs: handleTransfer },
    );

    // Watch for approval events (allowance changes)
    const handleApproval = async () => {
      try {
        const tokenAccountData = await fetchERC20TokenAccountData(
          definedErc20Address,
          definedAccount,
          stakingAddress,
        );
        onERC20TokenAccountDataLoaded(tokenAccountData);
      } catch (e) {
        logError(e as Error);
      }
    };

    const unwatchApproval = erc20Contract.watchEvent.Approval(
      { owner: definedAccount },
      { onLogs: handleApproval },
    );

    return () => {
      unwatchTransferTo();
      unwatchTransferFrom();
      unwatchApproval();
    };
  }, [
    account,
    erc20TokenAddress,
    stakingAddress,
    publicClient,
    fetchERC20TokenAccountData,
    onERC20TokenAccountDataLoaded,
  ]);
  // Combined staked token initial data loading + event listeners
  useEffect(() => {
    if (!stakingAddress) {
      return;
    }
    if (!account) {
      onStakedTokenAccountDataLoaded({
        balance: 0n,
        stakerData: { stakedAmount: 0n, lastStakeTimestamp: 0n },
        claimableRewards: [],
      });
      return;
    }

    // TypeScript now knows these are defined after the guard
    const definedAccount = account;
    const definedStakingAddress = stakingAddress;

    // Initial data load
    async function loadStakedTokenAccountData() {
      try {
        const stakedTokenAccountData = await fetchStakedTokenAccountData(
          definedStakingAddress,
          definedAccount,
        );
        onStakedTokenAccountDataLoaded(stakedTokenAccountData);
      } catch (e) {
        logError(e as Error);
      }
    }

    loadStakedTokenAccountData();

    // Set up event listeners
    const stakingContract = getContract({
      abi: abis.deployables.VotesERC20StakedV1,
      address: definedStakingAddress,
      client: publicClient,
    });

    const handleStakingUpdate = async () => {
      try {
        const stakedTokenAccountData = await fetchStakedTokenAccountData(
          definedStakingAddress,
          definedAccount,
        );
        onStakedTokenAccountDataLoaded(stakedTokenAccountData);
      } catch (e) {
        logError(e as Error);
      }
    };

    // Watch for transfers to this account
    const unwatchTransferTo = stakingContract.watchEvent.Transfer(
      { to: definedAccount },
      { onLogs: handleStakingUpdate },
    );

    // Watch for transfers from this account
    const unwatchTransferFrom = stakingContract.watchEvent.Transfer(
      { from: definedAccount },
      { onLogs: handleStakingUpdate },
    );
    // Watch for RewardsClaimed events for this account
    const unwatchRewardsClaimed = stakingContract.watchEvent.RewardsClaimed(
      { staker: definedAccount },
      { onLogs: handleStakingUpdate },
    );

    const unwatchStake = stakingContract.watchEvent.Staked(
      { staker: definedAccount },
      { onLogs: handleStakingUpdate },
    );

    const unwatchUnStake = stakingContract.watchEvent.Unstaked(
      { staker: definedAccount },
      { onLogs: handleStakingUpdate },
    );

    return () => {
      unwatchTransferTo();
      unwatchTransferFrom();
      unwatchRewardsClaimed();
      unwatchStake();
      unwatchUnStake();
    };
  }, [
    account,
    stakingAddress,
    publicClient,
    fetchStakedTokenAccountData,
    onStakedTokenAccountDataLoaded,
  ]);
}
