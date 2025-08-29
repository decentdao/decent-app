import { legacy } from '@decentdao/decent-contracts';
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
  onGovernanceAccountDataLoaded: (accountData: { balance: bigint; delegatee: Address }) => void;
  onGovernanceLockReleaseAccountDataLoaded: (accountData: {
    balance: bigint;
    delegatee: Address;
  }) => void;
  onGuardAccountDataLoaded: (accountData: GuardAccountData) => void;
  onStakedTokenAccountDataLoaded: (accountData: { balance: bigint }) => void;
  onERC20TokenAccountDataLoaded: (accountData: { balance: bigint }) => void;
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
      if (!account || !votesTokenAddress) {
        return;
      }

      try {
        const votingTokenAccountData = await fetchVotingTokenAccountData(
          votesTokenAddress,
          account,
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
    account,
    fetchVotingTokenAccountData,
    fetchLockReleaseAccountData,
    onGovernanceAccountDataLoaded,
    onGovernanceLockReleaseAccountDataLoaded,
  ]);

  useEffect(() => {
    async function loadGuardAccountData() {
      if (
        account === undefined ||
        freezeVotingType === undefined ||
        freezeVotingAddress === undefined ||
        freezeProposalCreatedTime === undefined ||
        freezeProposalPeriod === undefined ||
        freezePeriod === undefined
      ) {
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
    if (!account || !erc20TokenAddress) {
      return;
    }

    // TypeScript now knows these are defined after the guard
    const definedAccount = account;
    const definedErc20Address = erc20TokenAddress;

    // Initial data load
    async function loadERC20TokenAccountData() {
      try {
        const tokenAccountData = await fetchERC20TokenAccountData(definedErc20Address, definedAccount);
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
        const tokenAccountData = await fetchERC20TokenAccountData(definedErc20Address, definedAccount);
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

    return () => {
      unwatchTransferTo();
      unwatchTransferFrom();
    };
  }, [
    account,
    erc20TokenAddress,
    publicClient,
    fetchERC20TokenAccountData,
    onERC20TokenAccountDataLoaded,
  ]);

  // Combined staked token initial data loading + event listeners
  useEffect(() => {
    if (!account || !stakingAddress) {
      return;
    }

    // TypeScript now knows these are defined after the guard
    const definedAccount = account;
    const definedStakingAddress = stakingAddress;

    // Initial data load
    async function loadStakedTokenAccountData() {
      try {
        const stakedTokenAccountData = await fetchStakedTokenAccountData(definedStakingAddress, definedAccount);
        onStakedTokenAccountDataLoaded(stakedTokenAccountData);
      } catch (e) {
        logError(e as Error);
      }
    }

    loadStakedTokenAccountData();

    // Set up event listeners
    const stakingContract = getContract({
      abi: [
        {
          anonymous: false,
          inputs: [
            { indexed: true, name: 'from', type: 'address' },
            { indexed: true, name: 'to', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' },
          ],
          name: 'Transfer',
          type: 'event',
        },
      ],
      address: definedStakingAddress,
      client: publicClient,
    });

    const handleStakingTransfer = async () => {
      try {
        const stakedTokenAccountData = await fetchStakedTokenAccountData(definedStakingAddress, definedAccount);
        onStakedTokenAccountDataLoaded(stakedTokenAccountData);
      } catch (e) {
        logError(e as Error);
      }
    };

    // Watch for transfers to this account
    const unwatchTransferTo = stakingContract.watchEvent.Transfer(
      { to: definedAccount },
      { onLogs: handleStakingTransfer },
    );

    // Watch for transfers from this account
    const unwatchTransferFrom = stakingContract.watchEvent.Transfer(
      { from: definedAccount },
      { onLogs: handleStakingTransfer },
    );

    return () => {
      unwatchTransferTo();
      unwatchTransferFrom();
    };
  }, [
    account,
    stakingAddress,
    publicClient,
    fetchStakedTokenAccountData,
    onStakedTokenAccountDataLoaded,
  ]);
}
