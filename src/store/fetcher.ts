import { useEffect } from 'react';
import { Address, getAddress } from 'viem';
import { useAccount } from 'wagmi';
import useFeatureFlag from '../helpers/environmentFeatureFlags';
import { useDecentModules } from '../hooks/DAO/loaders/useDecentModules';
import { useNetworkConfigStore } from '../providers/NetworkConfig/useNetworkConfigStore';
import {
  AzoriusProposal,
  DAOKey,
  FractalGovernance,
  FractalGovernanceContracts,
  FractalModuleType,
  FractalProposal,
  GovernanceType,
} from '../types';
import { useGovernanceFetcher } from './fetchers/governance';
import { useGuardFetcher } from './fetchers/guard';
import { useNodeFetcher } from './fetchers/node';
import { useTreasuryFetcher } from './fetchers/treasury';
import { useGlobalStore } from './store';

export const useStoreFetcher = ({
  daoKey,
  safeAddress,
  invalidQuery,
  wrongNetwork,
}: {
  daoKey: DAOKey | undefined;
  safeAddress: Address | undefined;
  invalidQuery: boolean;
  wrongNetwork: boolean;
}) => {
  const lookupModules = useDecentModules();
  const {
    setDaoNode,
    setTransfers,
    setTreasury,
    setTransfer,
    setMultisigGovernance,
    setAzoriusGovernance,
    setProposalTemplates,
    setTokenClaimContractAddress,
    setProposals,
    setProposal,
    setLoadingFirstProposal,
    setGuard,
    setGuardAccountData,
    getGuard,
    getDaoNode,
    getGovernance,
    setGovernanceAccountData,
    setGovernanceLockReleaseAccountData,
  } = useGlobalStore();
  const { chain, getConfigByChainId } = useNetworkConfigStore();
  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');
  const { address: account } = useAccount();

  const { fetchDAONode } = useNodeFetcher();
  const { fetchDAOTreasury } = useTreasuryFetcher();
  const {
    fetchDAOGovernance,
    fetchDAOProposalTemplates,
    fetchVotingTokenAccountData,
    fetchLockReleaseAccountData,
  } = useGovernanceFetcher();
  const { fetchDAOGuard, fetchGuardAccountData } = useGuardFetcher();

  useEffect(() => {
    async function loadDAOData() {
      if (!daoKey || !safeAddress || invalidQuery || wrongNetwork || !storeFeatureEnabled) return;
      const { safe, daoInfo, modules } = await fetchDAONode({
        safeAddress,
        chainId: chain.id,
      });

      setDaoNode(daoKey, {
        safe,
        daoInfo,
        modules,
      });

      if (daoInfo.proposalTemplatesHash) {
        const proposalTemplates = await fetchDAOProposalTemplates({
          proposalTemplatesHash: daoInfo.proposalTemplatesHash,
        });
        if (proposalTemplates) {
          setProposalTemplates(daoKey, proposalTemplates);
        }
      }

      const onLoadingFirstProposalStateChanged = (loading: boolean) =>
        setLoadingFirstProposal(daoKey, loading);
      const onMultisigGovernanceLoaded = () => setMultisigGovernance(daoKey);
      const onAzoriusGovernanceLoaded = (
        governance: FractalGovernance & FractalGovernanceContracts,
      ) => setAzoriusGovernance(daoKey, governance);
      const onProposalsLoaded = (proposals: FractalProposal[]) => setProposals(daoKey, proposals);
      const onProposalLoaded = (proposal: AzoriusProposal) => setProposal(daoKey, proposal);
      const onTokenClaimContractAddressLoaded = (tokenClaimContractAddress: Address) =>
        setTokenClaimContractAddress(daoKey, tokenClaimContractAddress);

      fetchDAOGovernance({
        daoAddress: safeAddress,
        daoModules: modules,
        onLoadingFirstProposalStateChanged,
        onMultisigGovernanceLoaded,
        onAzoriusGovernanceLoaded,
        onProposalsLoaded,
        onProposalLoaded,
        onTokenClaimContractAddressLoaded,
      });

      const guardData = await fetchDAOGuard({
        guardAddress: getAddress(safe.guard),
        _azoriusModule: modules.find(module => module.moduleType === FractalModuleType.AZORIUS),
      });

      if (guardData) {
        setGuard(daoKey, guardData);
      }
    }

    loadDAOData();
  }, [
    safeAddress,
    daoKey,
    lookupModules,
    chain,
    setDaoNode,
    getConfigByChainId,
    invalidQuery,
    wrongNetwork,
    storeFeatureEnabled,
    fetchDAOProposalTemplates,
    fetchDAOGovernance,
    fetchDAOGuard,
    fetchDAONode,
    setProposalTemplates,
    setMultisigGovernance,
    setAzoriusGovernance,
    setProposals,
    setProposal,
    setTokenClaimContractAddress,
    setLoadingFirstProposal,
    setGuard,
  ]);

  useEffect(() => {
    async function loadDAOTreasury() {
      if (!daoKey || !safeAddress || invalidQuery || wrongNetwork || !storeFeatureEnabled) return;

      fetchDAOTreasury({
        safeAddress,
        onTreasuryLoaded: treasuryData => setTreasury(daoKey, treasuryData),
        onTransfersLoaded: transfers => setTransfers(daoKey, transfers),
        onTransferLoaded: transfer => setTransfer(daoKey, transfer),
      });
    }

    loadDAOTreasury();
  }, [
    daoKey,
    safeAddress,
    invalidQuery,
    wrongNetwork,
    storeFeatureEnabled,
    fetchDAOTreasury,
    setTreasury,
    setTransfers,
    setTransfer,
  ]);

  useEffect(() => {
    async function loadAccountData() {
      if (
        !daoKey ||
        !safeAddress ||
        invalidQuery ||
        wrongNetwork ||
        !storeFeatureEnabled ||
        !account
      )
        return;

      const governance = getGovernance(daoKey);
      if (governance.type === GovernanceType.AZORIUS_ERC20) {
        if (governance.votesTokenAddress) {
          const { balance, delegatee } = await fetchVotingTokenAccountData(
            governance.votesTokenAddress,
            account,
          );
          setGovernanceAccountData(daoKey, {
            balance,
            delegatee,
          });
        }

        if (governance.lockReleaseAddress) {
          const { balance, delegatee } = await fetchLockReleaseAccountData(
            governance.lockReleaseAddress,
            account,
          );
          setGovernanceLockReleaseAccountData(daoKey, {
            balance,
            delegatee,
          });
        }
      }
    }

    loadAccountData();
  }, [
    daoKey,
    safeAddress,
    invalidQuery,
    wrongNetwork,
    storeFeatureEnabled,
    account,
    getGovernance,
    fetchVotingTokenAccountData,
    fetchLockReleaseAccountData,
    setGovernanceAccountData,
    setGovernanceLockReleaseAccountData,
  ]);

  useEffect(() => {
    async function loadGuardAccountData() {
      if (
        !daoKey ||
        !safeAddress ||
        invalidQuery ||
        wrongNetwork ||
        !storeFeatureEnabled ||
        !account
      )
        return;

      const nodeData = getDaoNode(daoKey);
      const guardData = getGuard(daoKey);
      const governanceData = getGovernance(daoKey);

      if (
        guardData.isGuardLoaded &&
        guardData.freezeGuardContractAddress &&
        guardData.freezeVotingType &&
        guardData.freezeVotingContractAddress
      ) {
        const guardAccountData = await fetchGuardAccountData({
          account,
          azoriusGuardAddress:
            governanceData.type === GovernanceType.AZORIUS_ERC20 ||
            governanceData.type === GovernanceType.AZORIUS_ERC721
              ? guardData.freezeGuardContractAddress
              : undefined,
          multisigGuardAddress:
            governanceData.type === GovernanceType.MULTISIG
              ? guardData.freezeGuardContractAddress
              : undefined,
          freezeVotingType: guardData.freezeVotingType,
          freezeVotingAddress: guardData.freezeVotingContractAddress,
          freezeProposalCreatedTime: guardData.freezeProposalCreatedTime || 0n,
          freezeProposalPeriod: guardData.freezeProposalPeriod || 0n,
          freezePeriod: guardData.freezePeriod || 0n,
          _parentSafeAddress: nodeData.subgraphInfo?.parentAddress || null,
        });

        if (guardAccountData) {
          setGuardAccountData(daoKey, guardAccountData);
        }
      }
    }

    loadGuardAccountData();
  }, [
    daoKey,
    safeAddress,
    invalidQuery,
    wrongNetwork,
    storeFeatureEnabled,
    account,
    getGuard,
    fetchGuardAccountData,
    setGuardAccountData,
    getDaoNode,
    getGovernance,
  ]);
};
