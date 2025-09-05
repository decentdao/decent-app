import { useEffect, useState } from 'react';
import { Address, getAddress, zeroAddress } from 'viem';
import useFeatureFlag from '../helpers/environmentFeatureFlags';
import { logError } from '../helpers/errorLogging';
import useNetworkPublicClient from '../hooks/useNetworkPublicClient';
import { useTimeHelpers } from '../hooks/utils/useTimeHelpers';
import { getDaoData, getDaoRevenueSharingWallets, getDaoProposals } from '../providers/App/decentAPI';
import { useNetworkConfigStore } from '../providers/NetworkConfig/useNetworkConfigStore';
import {
  AzoriusProposal,
  DAOKey,
  DAOSubgraph,
  DecentModule,
  FractalModuleType,
  FractalProposal,
  FractalProposalState,
  FractalTokenType,
  GovernanceType,
  ProposalTemplate,
  SafeWithNextNonce,
} from '../types';
import { blocksToSeconds } from '../utils/contract';
import { useGovernanceFetcher } from './fetchers/governance';
import { useGuardFetcher } from './fetchers/guard';
import { useKeyValuePairsFetcher } from './fetchers/keyValuePairs';
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
    setRevShareWallets,
  } = useGlobalStore();
  const { getTimeDuration } = useTimeHelpers();
  const publicClient = useNetworkPublicClient();
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
  const { fetchDAORoles } = useRolesFetcher();
  const { setHatKeyValuePairData } = useGlobalStore();
  const USE_API = useFeatureFlag('flag_api');

  useEffect(() => {
    async function loadDAODataFromAPI() {
      if (!daoKey || !safeAddress || invalidQuery || wrongNetwork) return;
      try {
        const chainId = chain.id;
        const daoData = await getDaoData(chainId, safeAddress);
        if (!daoData) throw new Error('No info from API');
        const moduleAddresses = daoData.governanceModules.map(mod => mod.address);
        const safe: SafeWithNextNonce = {
          address: getAddress(safeAddress),
          nonce: daoData.safe.nonce,
          nextNonce: daoData.safe.nonce + 1,
          owners: daoData.safe.owners,
          threshold: daoData.safe.threshold,
          modules: moduleAddresses,
          singleton: 'unused',
          fallbackHandler: 'unused',
          guard: daoData.governanceGuard?.address || zeroAddress,
          version: 'unused'
        }

        const childAddresses = daoData.subDaos.map(sub => sub.address);
        const daoInfo: DAOSubgraph = {
          daoName: daoData.name,
          parentAddress: daoData.parentAddress,
          childAddresses,
          daoSnapshotENS: daoData.snapshotENS,
          proposalTemplatesHash: daoData.proposalTemplatesCID,
        };

        const modules: DecentModule[] = daoData.governanceModules.map(mod => ({
          moduleAddress: mod.address,
          moduleType: FractalModuleType[mod.type]
        }))

        setDaoNode(daoKey, {
          safe,
          daoInfo,
          modules,
        });

        const revShareWallets = await getDaoRevenueSharingWallets(chain.id, safeAddress);
        if (revShareWallets) {
          setRevShareWallets(daoKey, revShareWallets);
        }

        const stakingData = await fetchStakingDAOData(safeAddress);
        setStakingData(daoKey, stakingData);
        
        const azoriusModule = daoData.governanceModules.find(mod => mod.type === 'AZORIUS');
        if (azoriusModule) {
          const strategy = azoriusModule.strategies[0];
          const isErc20 = strategy?.votingTokens[0]?.type === 'ERC20';
          
          // Convert blocks to seconds
          console.log('Azorius module data:', {
            timelockPeriod: azoriusModule.timelockPeriod,
            executionPeriod: azoriusModule.executionPeriod,
            votingPeriod: strategy?.votingPeriod
          });
          
          const votingPeriodSeconds = strategy?.votingPeriod 
            ? await blocksToSeconds(strategy.votingPeriod, publicClient)
            : undefined;
          const timelockPeriodSeconds = azoriusModule.timelockPeriod !== null && azoriusModule.timelockPeriod !== undefined
            ? await blocksToSeconds(azoriusModule.timelockPeriod, publicClient)
            : undefined;
          const executionPeriodSeconds = azoriusModule.executionPeriod !== null && azoriusModule.executionPeriod !== undefined
            ? await blocksToSeconds(azoriusModule.executionPeriod, publicClient)
            : undefined;
          
          const governance: SetAzoriusGovernancePayload = {
            moduleAzoriusAddress: azoriusModule.address,
            votesToken: undefined,
            erc721Tokens: undefined,
            linearVotingErc20Address: isErc20 ? strategy?.address : undefined,
            linearVotingErc721Address: !isErc20 ? strategy?.address : undefined,
            isLoaded: true,
            strategies: azoriusModule.strategies.map(s => ({
              address: s.address,
              type: s.votingTokens[0]?.type === 'ERC20' ? FractalTokenType.erc20 : FractalTokenType.erc721,
              withWhitelist: false,
              version: s.version,
            })),
            votingStrategy: {
              votingPeriod: votingPeriodSeconds ? { 
                value: BigInt(votingPeriodSeconds), 
                formatted: getTimeDuration(votingPeriodSeconds)
              } : undefined,
              quorumPercentage: strategy.quorumNumerator !== null && strategy.quorumNumerator !== undefined && strategy.basisNumerator ? (() => {
                // Convert basis points to percentage (e.g., 1000/10000 = 0.1 = 10%)
                const percentage = (strategy.quorumNumerator * 100) / strategy.basisNumerator;
                console.log('Quorum calculation:', { 
                  quorumNumerator: strategy.quorumNumerator, 
                  basisNumerator: strategy.basisNumerator, 
                  percentage 
                });
                return {
                  value: BigInt(Math.floor(percentage)),
                  formatted: percentage.toString()
                };
              })() : undefined,
              timeLockPeriod: (timelockPeriodSeconds && timelockPeriodSeconds >= 0) ? { 
                value: BigInt(timelockPeriodSeconds), 
                formatted: getTimeDuration(timelockPeriodSeconds)
              } : undefined,
              executionPeriod: executionPeriodSeconds ? { 
                value: BigInt(executionPeriodSeconds), 
                formatted: getTimeDuration(executionPeriodSeconds)
              } : undefined,
              proposerThreshold: strategy.requiredProposerWeight ? { 
                value: BigInt(strategy.requiredProposerWeight), 
                formatted: strategy.requiredProposerWeight.toString() 
              } : undefined,
            },
            isAzorius: true,
            type: isErc20 ? GovernanceType.AZORIUS_ERC20 : GovernanceType.AZORIUS_ERC721,
          };
          setAzoriusGovernance(daoKey, governance);
          
          // Fetch and set proposals
          const apiProposals = await getDaoProposals(chain.id, safeAddress);
          if (apiProposals && apiProposals.length > 0) {
            // Transform API proposals to AzoriusProposal format
            const transformedProposals: AzoriusProposal[] = apiProposals.map(p => ({
              proposalId: p.id.toString(),
              proposer: p.proposer,
              transactionHash: p.proposedTxHash,
              title: p.title,
              description: p.description,
              // Required by GovernanceActivity
              eventDate: new Date(p.createdAt * 1000),
              targets: p.transactions.map(tx => tx.to),
              // Required by AzoriusProposal
              votingStrategy: p.votingStrategyAddress,
              transactions: p.transactions.map(tx => ({
                target: tx.to,
                value: tx.value,
                data: tx.data,
                operation: tx.operation.toString()
              })),
              startBlock: BigInt(0), // Not available in API
              endBlock: BigInt(0), // Not available in API
              startTime: BigInt(p.createdAt),
              // @todo: Add proper state mapping based on executedTxHash
              state: p.executedTxHash ? FractalProposalState.EXECUTED : FractalProposalState.ACTIVE,
              votesSummary: {
                yes: BigInt(0),
                no: BigInt(0),
                abstain: BigInt(0),
                quorum: BigInt(0)
              },
              votes: [],
              deadlineMs: 0, // Not available in API
              decodedTransactions: [] // Will need to decode if needed
            }));
            setProposals(daoKey, transformedProposals);
            setAllProposalsLoaded(daoKey, true);
          }
        } else {
          setMultisigGovernance(daoKey);
        }
      } catch (e) {
        console.error('ERROR fetching from API');
        console.error(e)
      }
    }
    
    async function loadDAOData() {
      if (!daoKey || !safeAddress || invalidQuery || wrongNetwork) return;
      try {
        let linearVotingErc20WithHatsWhitelistingAddress: Address | undefined = undefined;
        let linearVotingErc721WithHatsWhitelistingAddress: Address | undefined = undefined;
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

        const revShareWallets = await getDaoRevenueSharingWallets(chain.id, safeAddress);
        if (revShareWallets) {
          setRevShareWallets(daoKey, revShareWallets);
        }
        const onMultisigGovernanceLoaded = () => setMultisigGovernance(daoKey);
        const onAzoriusGovernanceLoaded = (governance: SetAzoriusGovernancePayload) => {
          linearVotingErc20WithHatsWhitelistingAddress =
            governance.linearVotingErc20WithHatsWhitelistingAddress;
          linearVotingErc721WithHatsWhitelistingAddress =
            governance.linearVotingErc721WithHatsWhitelistingAddress;
          setAzoriusGovernance(daoKey, governance);
        };
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
        setStakingData(daoKey, stakingData);

        fetchDAOGuard({
          guardAddress: getAddress(safe.guard),
          _azoriusModule: modules.find(module => module.moduleType === FractalModuleType.AZORIUS),
        }).then(guardData => {
          if (guardData) {
            setGuard(daoKey, guardData);
          }
        });

        const keyValuePairsData = await fetchKeyValuePairsData({
          safeAddress,
        });

        if (keyValuePairsData) {
          setHatKeyValuePairData(daoKey, {
            contextChainId: chain.id,
            hatsTreeId: keyValuePairsData.hatsTreeId,
            streamIdsToHatIds: keyValuePairsData.streamIdsToHatIds,
          });

          const whitelistingVotingStrategy =
            linearVotingErc20WithHatsWhitelistingAddress ||
            linearVotingErc721WithHatsWhitelistingAddress;

          await fetchDAORoles({
            daoKey,
            hatsTreeId: keyValuePairsData.hatsTreeId ?? undefined,
            contextChainId: chain.id,
            // Governance whitelisting strategy may not be loaded yet; we can refetch later if needed
            whitelistingVotingStrategy,
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
    const fetcher = USE_API ? loadDAODataFromAPI : loadDAOData;
    fetcher();
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
