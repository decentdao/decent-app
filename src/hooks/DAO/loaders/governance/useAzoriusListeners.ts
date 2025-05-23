import { abis } from '@fractal-framework/fractal-contracts';
import { useEffect, useMemo } from 'react';
import { getContract } from 'viem';
import useFeatureFlag from '../../../../helpers/environmentFeatureFlags';
import { logError } from '../../../../helpers/errorLogging';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { FractalGovernanceAction } from '../../../../providers/App/governance/action';
import { CreateProposalMetadata, VotingStrategyType } from '../../../../types';
import {
  decodeTransactions,
  getProposalVotesSummary,
  mapProposalCreatedEventToProposal,
} from '../../../../utils';
import { getAverageBlockTime } from '../../../../utils/contract';
import useNetworkPublicClient from '../../../useNetworkPublicClient';
import { useAddressContractType } from '../../../utils/useAddressContractType';
import { useSafeDecoder } from '../../../utils/useSafeDecoder';
import { useCurrentDAOKey } from '../../useCurrentDAOKey';

export const useAzoriusListeners = () => {
  const { daoKey } = useCurrentDAOKey();
  const {
    action,
    governanceContracts: {
      moduleAzoriusAddress,
      linearVotingErc20Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress,
    },
  } = useDAOStore({ daoKey });
  const decode = useSafeDecoder();
  const publicClient = useNetworkPublicClient();
  const { getAddressContractType } = useAddressContractType();

  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');

  const azoriusContract = useMemo(() => {
    if (!moduleAzoriusAddress) {
      return;
    }

    return getContract({
      abi: abis.Azorius,
      address: moduleAzoriusAddress,
      client: publicClient,
    });
  }, [moduleAzoriusAddress, publicClient]);

  const erc20StrategyContract = useMemo(() => {
    if (!linearVotingErc20Address) {
      return undefined;
    }

    return getContract({
      abi: abis.LinearERC20Voting,
      address: linearVotingErc20Address,
      client: publicClient,
    });
  }, [linearVotingErc20Address, publicClient]);

  const erc20WithHatsProposalCreationStrategyContract = useMemo(() => {
    if (!linearVotingErc20WithHatsWhitelistingAddress) {
      return undefined;
    }

    return getContract({
      abi: abis.LinearERC20VotingWithHatsProposalCreation,
      address: linearVotingErc20WithHatsWhitelistingAddress,
      client: publicClient,
    });
  }, [linearVotingErc20WithHatsWhitelistingAddress, publicClient]);

  const erc721StrategyContract = useMemo(() => {
    if (!linearVotingErc721Address) {
      return undefined;
    }

    return getContract({
      abi: abis.LinearERC721Voting,
      address: linearVotingErc721Address,
      client: publicClient,
    });
  }, [linearVotingErc721Address, publicClient]);

  const erc721WithHatsProposalCreationStrategyContract = useMemo(() => {
    if (!linearVotingErc721WithHatsWhitelistingAddress) {
      return undefined;
    }

    return getContract({
      abi: abis.LinearERC721VotingWithHatsProposalCreation,
      address: linearVotingErc721WithHatsWhitelistingAddress,
      client: publicClient,
    });
  }, [linearVotingErc721WithHatsWhitelistingAddress, publicClient]);

  useEffect(() => {
    if (!azoriusContract || storeFeatureEnabled) {
      return;
    }

    const unwatch = azoriusContract.watchEvent.ProposalCreated({
      onLogs: async logs => {
        for (const log of logs) {
          if (
            !log.args.strategy ||
            !log.args.proposalId ||
            !log.args.metadata ||
            !log.args.transactions ||
            !log.args.proposer
          ) {
            continue;
          }

          // Wait for a block before processing.
          // We've seen that calling smart contract functions in `mapProposalCreatedEventToProposal`
          // which include the `proposalId` error out because the RPC node (rather, the block it's on)
          // doesn't see this proposal yet (despite the event being caught in the app...).
          const averageBlockTime = await getAverageBlockTime(publicClient);
          await new Promise(resolve => setTimeout(resolve, averageBlockTime * 1000));

          const typedTransactions = log.args.transactions.map(t => ({
            ...t,
            to: t.to,
            data: t.data,
            value: t.value,
          }));

          const metaDataEvent: CreateProposalMetadata = JSON.parse(log.args.metadata);
          const proposalData = {
            metaData: {
              title: metaDataEvent.title,
              description: metaDataEvent.description,
              documentationUrl: metaDataEvent.documentationUrl,
            },
            transactions: typedTransactions,
            decodedTransactions: await decodeTransactions(decode, typedTransactions),
          };

          let strategyType: VotingStrategyType | undefined;
          const strategyAddress = log.args.strategy;
          const {
            isLinearVotingErc20,
            isLinearVotingErc721,
            isLinearVotingErc20WithHatsProposalCreation,
            isLinearVotingErc721WithHatsProposalCreation,
          } = await getAddressContractType(strategyAddress);
          if (isLinearVotingErc20 || isLinearVotingErc20WithHatsProposalCreation) {
            strategyType = VotingStrategyType.LINEAR_ERC20;
          } else if (isLinearVotingErc721 || isLinearVotingErc721WithHatsProposalCreation) {
            strategyType = VotingStrategyType.LINEAR_ERC721;
          } else {
            logError('Unknown voting strategy', 'strategyAddress:', strategyAddress);
            continue;
          }

          const proposal = await mapProposalCreatedEventToProposal(
            log.transactionHash,
            log.args.strategy,
            strategyType,
            Number(log.args.proposalId),
            log.args.proposer,
            azoriusContract,
            publicClient,
            undefined,
            undefined,
            undefined,
            proposalData,
          );

          action.dispatch({
            type: FractalGovernanceAction.UPDATE_PROPOSALS_NEW,
            payload: proposal,
          });
        }
      },
    });

    return () => {
      unwatch();
    };
  }, [action, azoriusContract, decode, publicClient, getAddressContractType, storeFeatureEnabled]);

  useEffect(() => {
    if (!erc20StrategyContract || storeFeatureEnabled) {
      return;
    }

    const unwatch = erc20StrategyContract.watchEvent.Voted({
      onLogs: async logs => {
        for (const log of logs) {
          if (!log.args.proposalId || !log.args.voter || !log.args.voteType || !log.args.weight) {
            continue;
          }

          const votesSummary = await getProposalVotesSummary({
            strategyContract: erc20StrategyContract,
            strategyType: VotingStrategyType.LINEAR_ERC20,
            proposalId: log.args.proposalId,
          });

          action.dispatch({
            type: FractalGovernanceAction.UPDATE_NEW_AZORIUS_ERC20_VOTE,
            payload: {
              proposalId: log.args.proposalId.toString(),
              voter: log.args.voter,
              support: log.args.voteType,
              weight: log.args.weight,
              votesSummary,
            },
          });
        }
      },
    });

    return () => {
      unwatch();
    };
  }, [action, erc20StrategyContract, storeFeatureEnabled]);

  useEffect(() => {
    if (!erc20WithHatsProposalCreationStrategyContract || storeFeatureEnabled) {
      return;
    }

    const unwatch = erc20WithHatsProposalCreationStrategyContract.watchEvent.Voted({
      onLogs: async logs => {
        for (const log of logs) {
          if (!log.args.proposalId || !log.args.voter || !log.args.voteType || !log.args.weight) {
            continue;
          }

          const votesSummary = await getProposalVotesSummary({
            strategyContract: erc20WithHatsProposalCreationStrategyContract,
            strategyType: VotingStrategyType.LINEAR_ERC20_HATS_WHITELISTING,
            proposalId: log.args.proposalId,
          });

          action.dispatch({
            type: FractalGovernanceAction.UPDATE_NEW_AZORIUS_ERC20_VOTE,
            payload: {
              proposalId: log.args.proposalId.toString(),
              voter: log.args.voter,
              support: log.args.voteType,
              weight: log.args.weight,
              votesSummary,
            },
          });
        }
      },
    });

    return () => {
      unwatch();
    };
  }, [action, erc20WithHatsProposalCreationStrategyContract, storeFeatureEnabled]);

  useEffect(() => {
    if (!erc721StrategyContract || storeFeatureEnabled) {
      return;
    }

    const unwatch = erc721StrategyContract.watchEvent.Voted({
      onLogs: async logs => {
        for (const log of logs) {
          if (
            !log.args.proposalId ||
            !log.args.voter ||
            !log.args.voteType ||
            !log.args.tokenAddresses ||
            !log.args.tokenIds
          ) {
            continue;
          }

          const votesSummary = await getProposalVotesSummary({
            strategyContract: erc721StrategyContract,
            strategyType: VotingStrategyType.LINEAR_ERC721,
            proposalId: log.args.proposalId,
          });

          action.dispatch({
            type: FractalGovernanceAction.UPDATE_NEW_AZORIUS_ERC721_VOTE,
            payload: {
              proposalId: log.args.proposalId.toString(),
              voter: log.args.voter,
              support: log.args.voteType,
              tokenAddresses: log.args.tokenAddresses.map(tokenAddress => tokenAddress),
              tokenIds: log.args.tokenIds.map(tokenId => tokenId.toString()),
              votesSummary,
            },
          });
        }
      },
    });

    return () => {
      unwatch();
    };
  }, [action, erc721StrategyContract, storeFeatureEnabled]);

  useEffect(() => {
    if (!erc721WithHatsProposalCreationStrategyContract || storeFeatureEnabled) {
      return;
    }

    const unwatch = erc721WithHatsProposalCreationStrategyContract.watchEvent.Voted({
      onLogs: async logs => {
        for (const log of logs) {
          if (
            !log.args.proposalId ||
            !log.args.voter ||
            !log.args.voteType ||
            !log.args.tokenAddresses ||
            !log.args.tokenIds
          ) {
            continue;
          }

          const votesSummary = await getProposalVotesSummary({
            strategyContract: erc721WithHatsProposalCreationStrategyContract,
            strategyType: VotingStrategyType.LINEAR_ERC721_HATS_WHITELISTING,
            proposalId: log.args.proposalId,
          });

          action.dispatch({
            type: FractalGovernanceAction.UPDATE_NEW_AZORIUS_ERC721_VOTE,
            payload: {
              proposalId: log.args.proposalId.toString(),
              voter: log.args.voter,
              support: log.args.voteType,
              tokenAddresses: log.args.tokenAddresses.map(tokenAddress => tokenAddress),
              tokenIds: log.args.tokenIds.map(tokenId => tokenId.toString()),
              votesSummary,
            },
          });
        }
      },
    });

    return () => {
      unwatch();
    };
  }, [action, erc721WithHatsProposalCreationStrategyContract, storeFeatureEnabled]);
};
