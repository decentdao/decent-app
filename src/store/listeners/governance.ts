import { legacy } from '@decentdao/decent-contracts';
import { useEffect } from 'react';
import { Address, getContract } from 'viem';
import { useAccount } from 'wagmi';
import LockReleaseAbi from '../../assets/abi/LockRelease';
import { logError } from '../../helpers/errorLogging';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useAddressContractType } from '../../hooks/utils/useAddressContractType';
import { useSafeDecoder } from '../../hooks/utils/useSafeDecoder';
import {
  AzoriusProposal,
  CreateProposalMetadata,
  ERC721ProposalVote,
  getVoteChoice,
  ProposalVote,
  ProposalVotesSummary,
  VotingStrategyType,
} from '../../types';
import { decodeTransactions } from '../../utils';
import { getProposalVotesSummary, mapProposalCreatedEventToProposal } from '../../utils/azorius';
import { getAverageBlockTime } from '../../utils/contract';
import { useGovernanceFetcher } from '../fetchers/governance';

export function useGovernanceListeners({
  lockedVotesTokenAddress,
  votesTokenAddress,
  moduleAzoriusAddress,
  erc20StrategyAddress,
  erc721StrategyAddress,
  onProposalCreated,
  onProposalExecuted,
  onGovernanceAccountDataUpdated,
  onLockReleaseAccountDataUpdated,
  onERC20VoteCreated,
  onERC721VoteCreated,
}: {
  votesTokenAddress?: Address;
  lockedVotesTokenAddress?: Address;
  moduleAzoriusAddress?: Address;
  erc20StrategyAddress?: Address;
  erc721StrategyAddress?: Address;
  onProposalCreated: (proposal: AzoriusProposal) => void;
  onProposalExecuted: (proposalId: string) => void;
  onGovernanceAccountDataUpdated: (governanceAccountData: {
    balance: bigint;
    delegatee: Address;
  }) => void;
  onLockReleaseAccountDataUpdated: (lockReleaseAccountData: {
    balance: bigint;
    delegatee: Address;
  }) => void;
  onERC20VoteCreated: (
    proposalId: string,
    votesSummary: ProposalVotesSummary,
    vote: ProposalVote,
  ) => void;
  onERC721VoteCreated: (
    proposalId: string,
    votesSummary: ProposalVotesSummary,
    vote: ERC721ProposalVote,
  ) => void;
}) {
  const { fetchVotingTokenAccountData, fetchLockReleaseAccountData } = useGovernanceFetcher();
  const { address } = useAccount();
  const publicClient = useNetworkPublicClient();
  const { getAddressContractType } = useAddressContractType();
  const decode = useSafeDecoder();

  useEffect(() => {
    /**
     * Watch locked token votes when delegation changes.
     */
    if (!address || !lockedVotesTokenAddress) {
      return;
    }

    const lockReleaseContract = getContract({
      abi: LockReleaseAbi,
      address: lockedVotesTokenAddress,
      client: publicClient,
    });

    const handleDelegateChanged = async () => {
      if (!address || !lockedVotesTokenAddress) return;
      try {
        const lockedVotesTokenData = await fetchLockReleaseAccountData(
          lockedVotesTokenAddress,
          address,
        );
        onLockReleaseAccountDataUpdated(lockedVotesTokenData);
      } catch (e) {
        logError(e as Error);
      }
    };

    const unwatchDelegator = lockReleaseContract.watchEvent.DelegateChanged(
      { delegator: address },
      { onLogs: handleDelegateChanged },
    );
    const unwatchFromDelegate = lockReleaseContract.watchEvent.DelegateChanged(
      { fromDelegate: address },
      { onLogs: handleDelegateChanged },
    );
    const unwatchToDelegate = lockReleaseContract.watchEvent.DelegateChanged(
      { toDelegate: address },
      { onLogs: handleDelegateChanged },
    );

    return () => {
      unwatchDelegator();
      unwatchToDelegate();
      unwatchFromDelegate();
    };
  }, [
    address,
    lockedVotesTokenAddress,
    publicClient,
    fetchLockReleaseAccountData,
    onLockReleaseAccountDataUpdated,
  ]);

  useEffect(() => {
    /**
     * Load ERC-20 token votes when delegation changes.
     */
    if (!address || !votesTokenAddress) {
      return;
    }

    const tokenContract = getContract({
      abi: legacy.abis.VotesERC20,
      address: votesTokenAddress,
      client: publicClient,
    });

    const handleERC20DelegateChanged = async () => {
      if (!address || !votesTokenAddress) return;
      try {
        const votingTokenAccountData = await fetchVotingTokenAccountData(
          votesTokenAddress,
          address,
        );
        onGovernanceAccountDataUpdated(votingTokenAccountData);
      } catch (e) {
        logError(e as Error);
        // Silent failure - background data update, don't interrupt user workflow
      }
    };

    const unwatchDelegator = tokenContract.watchEvent.DelegateChanged(
      { delegator: address },
      { onLogs: handleERC20DelegateChanged },
    );
    const unwatchFromDelegate = tokenContract.watchEvent.DelegateChanged(
      { fromDelegate: address },
      { onLogs: handleERC20DelegateChanged },
    );
    const unwatchToDelegate = tokenContract.watchEvent.DelegateChanged(
      { toDelegate: address },
      { onLogs: handleERC20DelegateChanged },
    );

    return () => {
      unwatchDelegator();
      unwatchFromDelegate();
      unwatchToDelegate();
    };
  }, [
    address,
    publicClient,
    votesTokenAddress,
    fetchVotingTokenAccountData,
    onGovernanceAccountDataUpdated,
  ]);

  useEffect(() => {
    /**
     * Listen for proposal creation events.
     */
    if (!moduleAzoriusAddress) {
      return;
    }

    const azoriusContract = getContract({
      abi: legacy.abis.Azorius,
      client: publicClient,
      address: moduleAzoriusAddress,
    });

    const handleProposalCreated = async (logs: any[]) => {
      try {
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

          const typedTransactions = log.args.transactions.map((t: any) => ({
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

          onProposalCreated(proposal);
        }
      } catch (error) {
        logError('Failed to handle proposal creation event', error);
      }
    };

    const handleProposalExecuted = async (logs: any[]) => {
      try {
        for (const log of logs) {
          if (!log.args.proposalId) {
            continue;
          }

          onProposalExecuted(log.args.proposalId.toString());
        }
      } catch (e) {
        logError(e as Error);
      }
    };

    const unwatchProposalCreated = azoriusContract.watchEvent.ProposalCreated({
      onLogs: handleProposalCreated,
    });
    const unwatchProposalExecuted = azoriusContract.watchEvent.ProposalExecuted({
      onLogs: handleProposalExecuted,
    });

    return () => {
      unwatchProposalCreated();
      unwatchProposalExecuted();
    };
  }, [
    moduleAzoriusAddress,
    publicClient,
    getAddressContractType,
    decode,
    onProposalCreated,
    onProposalExecuted,
  ]);

  useEffect(() => {
    /**
     * Listen for proposal vote events for ERC-20 strategy.
     */
    if (!erc20StrategyAddress) {
      return;
    }

    const erc20StrategyContract = getContract({
      abi: legacy.abis.LinearERC20Voting,
      address: erc20StrategyAddress,
      client: publicClient,
    });

    const handleVoted = async (logs: any[]) => {
      try {
        for (const log of logs) {
          if (!log.args.proposalId || !log.args.voter || !log.args.voteType || !log.args.weight) {
            continue;
          }

          const votesSummary = await getProposalVotesSummary({
            strategyContract: erc20StrategyContract,
            strategyType: VotingStrategyType.LINEAR_ERC20,
            proposalId: log.args.proposalId,
          });

          onERC20VoteCreated(log.args.proposalId.toString(), votesSummary, {
            voter: log.args.voter,
            choice: getVoteChoice(log.args.voteType),
            weight: log.args.weight,
          });
        }
      } catch (e) {
        logError(e as Error);
      }
    };

    const unwatch = erc20StrategyContract.watchEvent.Voted({
      onLogs: handleVoted,
    });

    return unwatch;
  }, [erc20StrategyAddress, onERC20VoteCreated, publicClient]);

  useEffect(() => {
    /**
     * Listen for proposal vote events for ERC-721 strategy.
     */
    if (!erc721StrategyAddress) {
      return;
    }

    const erc721StrategyContract = getContract({
      abi: legacy.abis.LinearERC721Voting,
      address: erc721StrategyAddress,
      client: publicClient,
    });

    const handleVoted = async (logs: any[]) => {
      try {
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

          const erc721ProposalVote: ERC721ProposalVote = {
            voter: log.args.voter,
            choice: getVoteChoice(log.args.voteType),
            tokenAddresses: log.args.tokenAddresses.map((tokenAddress: Address) => tokenAddress),
            tokenIds: log.args.tokenIds.map((tokenId: bigint) => tokenId.toString()),
            // TODO: Weight is calculated down the line in the components depending on proposal state. Do we need to store it here?
            weight: 0n,
          };

          onERC721VoteCreated(log.args.proposalId.toString(), votesSummary, erc721ProposalVote);
        }
      } catch (e) {
        logError(e as Error);
      }
    };

    const unwatch = erc721StrategyContract.watchEvent.Voted({
      onLogs: handleVoted,
    });

    return unwatch;
  }, [erc721StrategyAddress, onERC721VoteCreated, publicClient]);
}
