import { useEffect } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { FreezeVotingType, GuardAccountData } from '../../types';
import { useGovernanceFetcher } from '../fetchers/governance';
import { useGuardFetcher } from '../fetchers/guard';

export function useAccountListeners({
  votesTokenAddress,
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
}: {
  votesTokenAddress?: Address;
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
}) {
  const { address: account } = useAccount();
  const { fetchVotingTokenAccountData, fetchLockReleaseAccountData } = useGovernanceFetcher();
  const { fetchGuardAccountData } = useGuardFetcher();
  useEffect(() => {
    async function loadAccountData() {
      if (!account || !votesTokenAddress) {
        return;
      }

      const votingTokenAccountData = await fetchVotingTokenAccountData(votesTokenAddress, account);

      onGovernanceAccountDataLoaded(votingTokenAccountData);

      if (lockReleaseAddress) {
        const lockReleaseAccountData = await fetchLockReleaseAccountData(
          lockReleaseAddress,
          account,
        );

        onGovernanceLockReleaseAccountDataLoaded(lockReleaseAccountData);
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
    }

    loadGuardAccountData();
  }, [
    account,
    fetchGuardAccountData,
    onGuardAccountDataLoaded,
    azoriusGuardAddress,
    multisigGuardAddress,
    parentSafeAddress,
    freezeVotingType,
    freezeVotingAddress,
    freezeProposalCreatedTime,
    freezeProposalPeriod,
    freezePeriod,
  ]);
}
