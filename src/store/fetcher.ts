import { useEffect } from 'react';
import { Address, getAddress } from 'viem';
import useFeatureFlag from '../helpers/environmentFeatureFlags';
import { useDecentModules } from '../hooks/DAO/loaders/useDecentModules';
import { useNetworkConfigStore } from '../providers/NetworkConfig/useNetworkConfigStore';
import { AzoriusProposal, DAOKey, FractalModuleType, FractalProposal } from '../types';
import { useGovernanceFetcher } from './fetchers/governance';
import { useGuardFetcher } from './fetchers/guard';
import { useNodeFetcher } from './fetchers/node';
import { useRolesFetcher } from './fetchers/roles';
import { useTreasuryFetcher } from './fetchers/treasury';
import { SetAzoriusGovernancePayload } from './slices/governances';
import { useGlobalStore } from './store';

/**
 * useDAOStoreFetcher orchestrates fetching all the necessary data for the DAO and updating the Global store.
 * Underlying fetchers could get data from whatever source(on-chain, WebSocket, etc.), which then would be reflected in the store.
 */
export const useDAOStoreFetcher = ({
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
    setSnapshotProposals,
    setProposal,
    setLoadingFirstProposal,
    setGuard,
    setGaslessVotingData,
    setAllProposalsLoaded,
  } = useGlobalStore();
  const { chain, getConfigByChainId } = useNetworkConfigStore();
  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');

  const { fetchDAONode } = useNodeFetcher();
  const { fetchDAOTreasury } = useTreasuryFetcher();
  const {
    fetchDAOGovernance,
    fetchDAOProposalTemplates,
    fetchDAOSnapshotProposals,
    fetchGaslessVotingDAOData,
  } = useGovernanceFetcher();
  const { fetchDAOGuard } = useGuardFetcher();
  const { fetchRolesData } = useRolesFetcher();

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
      const onAzoriusGovernanceLoaded = (governance: SetAzoriusGovernancePayload) =>
        setAzoriusGovernance(daoKey, governance);
      const onProposalsLoaded = (proposals: FractalProposal[]) => {
        setProposals(daoKey, proposals);
        setLoadingFirstProposal(daoKey, false);
        setAllProposalsLoaded(daoKey, true);
      };
      const onProposalLoaded = (
        proposal: AzoriusProposal,
        index: number,
        totalProposals: number,
      ) => {
        setProposal(daoKey, proposal);
        if (index !== 0) {
          setLoadingFirstProposal(daoKey, false);
        }
        if (index === totalProposals - 1) {
          setAllProposalsLoaded(daoKey, true);
        }
      };
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

      fetchDAOGuard({
        guardAddress: getAddress(safe.guard),
        _azoriusModule: modules.find(module => module.moduleType === FractalModuleType.AZORIUS),
      }).then(guardData => {
        if (guardData) {
          setGuard(daoKey, guardData);
        }
      });

      if (daoInfo.daoSnapshotENS) {
        fetchDAOSnapshotProposals({ daoSnapshotENS: daoInfo.daoSnapshotENS }).then(
          snapshotProposals => {
            if (snapshotProposals) {
              setSnapshotProposals(daoKey, snapshotProposals);
            }
          },
        );
      }

      const rolesData = await fetchRolesData({
        safeAddress,
      });

      if (rolesData) {
        const gaslessVotingData = await fetchGaslessVotingDAOData({
          safeAddress,
          events: rolesData.events,
        });

        if (gaslessVotingData) {
          setGaslessVotingData(daoKey, gaslessVotingData);
        }
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
    setAllProposalsLoaded,
    fetchDAOSnapshotProposals,
    setSnapshotProposals,
    fetchRolesData,
    setGaslessVotingData,
    fetchGaslessVotingDAOData,
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
};
