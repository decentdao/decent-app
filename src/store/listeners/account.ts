import { useEffect } from 'react';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { FreezeVotingType } from '../../types';
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
  onGuardAccountDataLoaded: (accountData: {
    userHasFreezeVoted: boolean;
    userHasVotes: boolean;
  }) => void;
}) {
  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');
  const { address: account } = useAccount();
  const { fetchVotingTokenAccountData, fetchLockReleaseAccountData } = useGovernanceFetcher();
  const { fetchGuardAccountData } = useGuardFetcher();
  useEffect(() => {
    async function loadAccountData() {
      if (!account || !votesTokenAddress || !storeFeatureEnabled) {
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
    storeFeatureEnabled,
  ]);

  useEffect(() => {
    async function loadGuardAccountData() {
      if (
        !account ||
        !freezeVotingType ||
        !freezeVotingAddress ||
        typeof freezeProposalCreatedTime === 'undefined' ||
        typeof freezeProposalPeriod === 'undefined' ||
        typeof freezePeriod === 'undefined' ||
        !storeFeatureEnabled
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
    storeFeatureEnabled,
  ]);
}
