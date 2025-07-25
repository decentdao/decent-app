import { useEffect, useState } from 'react';
import { Address, getAddress } from 'viem';
import { logError } from '../helpers/errorLogging';
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
import { useKeyValuePairsFetcher } from './fetchers/keyValuePairs';
import { useNodeFetcher } from './fetchers/node';
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
    setERC20Token,
    setAllProposalsLoaded,
    setVotesTokenAddress,
    setStakingData,
  } = useGlobalStore();
  const { chain } = useNetworkConfigStore();

  const { fetchDAONode } = useNodeFetcher();
  const { fetchDAOTreasury } = useTreasuryFetcher();
  const {
    fetchDAOGovernance,
    fetchDAOProposalTemplates,
    fetchDAOSnapshotProposals,
    fetchGaslessVotingDAOData,
    fetchMultisigERC20Token,
    fetchStakingDAOData,
  } = useGovernanceFetcher();
  const { fetchDAOGuard } = useGuardFetcher();
  const { fetchKeyValuePairsData } = useKeyValuePairsFetcher();
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
        const keyValuePairsData = await fetchKeyValuePairsData({
          safeAddress,
        });

        if (keyValuePairsData) {
          setHatKeyValuePairData({
            daoKey,
            contextChainId: chain.id,
            hatsTreeId: keyValuePairsData.hatsTreeId,
            streamIdsToHatIds: keyValuePairsData.streamIdsToHatIds,
          });

          const gaslessVotingData = await fetchGaslessVotingDAOData({
            safeAddress,
            events: keyValuePairsData.events,
          });

          if (gaslessVotingData) {
            setGaslessVotingData(daoKey, gaslessVotingData);
          }

          const erc20Token = await fetchMultisigERC20Token({ events: keyValuePairsData.events });
          if (erc20Token) {
            setERC20Token(daoKey, erc20Token);
          }
        }

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

        const onVotesTokenAddressLoaded = (votesTokenAddress: Address) =>
          setVotesTokenAddress(daoKey, votesTokenAddress);

        fetchDAOGovernance({
          daoAddress: safeAddress,
          daoModules: modules,
          onMultisigGovernanceLoaded,
          onAzoriusGovernanceLoaded,
          onProposalsLoaded,
          onProposalLoaded,
          onTokenClaimContractAddressLoaded,
          onVotesTokenAddressLoaded,
        });

        const stakingData = await fetchStakingDAOData(safeAddress);

        if (stakingData) {
          setStakingData(daoKey, stakingData);
        }

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
      } catch (e) {
        logError(e);
        setErrorLoading(true);
      }
    }

    loadDAOData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeAddress, daoKey, chain, invalidQuery, wrongNetwork]);

  useEffect(() => {
    let aborted = false;

    async function loadDAOTreasury() {
      if (!daoKey || !safeAddress || invalidQuery || wrongNetwork) return;

      fetchDAOTreasury({
        safeAddress,
        onTreasuryLoaded: treasuryData => {
          if (!aborted) {
            setTreasury(daoKey, treasuryData);
          }
        },
        onTransfersLoaded: transfers => {
          if (!aborted) {
            setTransfers(daoKey, transfers);
          }
        },
        onTransferLoaded: transfer => {
          if (!aborted) {
            setTransfer(daoKey, transfer);
          }
        },
      });
    }

    loadDAOTreasury();

    return () => {
      aborted = true;
    };
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
