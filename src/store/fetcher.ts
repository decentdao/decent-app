import { useEffect, useState } from 'react';
import { Address, getAddress } from 'viem';
import { logError } from '../helpers/errorLogging';
import { useDecentModules } from '../hooks/DAO/loaders/useDecentModules';
import { useNetworkConfigStore } from '../providers/NetworkConfig/useNetworkConfigStore';
import {
  AzoriusProposal,
  DAOKey,
  FractalModuleType,
  FractalProposal,
  ProposalTemplate,
} from '../types';
import { useGovernanceFetcher } from './fetchers/governance';
import { useGuardFetcher } from './fetchers/guard';
import { useNodeFetcher } from './fetchers/node';
import { useRolesFetcher } from './fetchers/roles';
import { useTreasuryFetcher } from './fetchers/treasury';
import { useRolesStore } from './roles/useRolesStore';
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
  const [errorLoading, setErrorLoading] = useState(false);
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
    setSnapshotProposals,
    setProposal,
    setProposals,
    setGuard,
    setGaslessVotingData,
    setAllProposalsLoaded,
  } = useGlobalStore();
  const { chain, getConfigByChainId } = useNetworkConfigStore();

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
  const { setHatKeyValuePairData } = useRolesStore();

  useEffect(() => {
    async function loadDAOData() {
      if (!daoKey || !safeAddress || invalidQuery || wrongNetwork) return;
      try {
        setErrorLoading(false);
        const { safe, daoInfo, modules } = await fetchDAONode({
          safeAddress,
          chainId: chain.id,
        });

        setDaoNode(daoKey, {
          safe,
          daoInfo,
          modules,
        });
        let proposalTemplates: ProposalTemplate[] = [];
        if (daoInfo.proposalTemplatesHash) {
          const fetchedProposalTemplates = await fetchDAOProposalTemplates({
            proposalTemplatesHash: daoInfo.proposalTemplatesHash,
          });
          if (fetchedProposalTemplates) {
            proposalTemplates = fetchedProposalTemplates;
          }
        }
        setProposalTemplates(daoKey, proposalTemplates);

        const onMultisigGovernanceLoaded = () => setMultisigGovernance(daoKey);
        const onAzoriusGovernanceLoaded = (governance: SetAzoriusGovernancePayload) =>
          setAzoriusGovernance(daoKey, governance);
        const onProposalsLoaded = (proposals: FractalProposal[]) => {
          setAllProposalsLoaded(daoKey, true);
          setProposals(daoKey, proposals);
        };
        const onProposalLoaded = (
          proposal: AzoriusProposal,
          index: number,
          totalProposals: number,
        ) => {
          setProposal(daoKey, proposal);

          if (index === totalProposals - 1) {
            setAllProposalsLoaded(daoKey, true);
          }
        };
        const onTokenClaimContractAddressLoaded = (tokenClaimContractAddress: Address) =>
          setTokenClaimContractAddress(daoKey, tokenClaimContractAddress);

        fetchDAOGovernance({
          daoAddress: safeAddress,
          daoModules: modules,
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
          setHatKeyValuePairData({
            contextChainId: chain.id,
            hatsTreeId: rolesData.hatsTreeId,
            streamIdsToHatIds: rolesData.streamIdsToHatIds,
          });
          const gaslessVotingData = await fetchGaslessVotingDAOData({
            safeAddress,
            events: rolesData.events,
          });

          if (gaslessVotingData) {
            setGaslessVotingData(daoKey, gaslessVotingData);
          }
        }
      } catch (e) {
        logError(e);
        setErrorLoading(true);
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
    fetchDAOProposalTemplates,
    fetchDAOGovernance,
    fetchDAOGuard,
    fetchDAONode,
    setProposalTemplates,
    setMultisigGovernance,
    setAzoriusGovernance,
    setProposal,
    setProposals,
    setTokenClaimContractAddress,
    setGuard,
    setAllProposalsLoaded,
    fetchDAOSnapshotProposals,
    setSnapshotProposals,
    fetchRolesData,
    setGaslessVotingData,
    fetchGaslessVotingDAOData,
    setHatKeyValuePairData,
  ]);

  useEffect(() => {
    async function loadDAOTreasury() {
      if (!daoKey || !safeAddress || invalidQuery || wrongNetwork) return;

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
    fetchDAOTreasury,
    setTreasury,
    setTransfers,
    setTransfer,
  ]);

  return { errorLoading };
};
