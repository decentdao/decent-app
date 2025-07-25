import { legacy } from '@decentdao/decent-contracts';
import { useCallback, useEffect } from 'react';
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

  const loadLockedVotesToken = useCallback(async () => {
    if (!address || !lockedVotesTokenAddress) {
      return;
    }
    const lockedVotesTokenData = await fetchLockReleaseAccountData(
      lockedVotesTokenAddress,
      address,
    );
    onLockReleaseAccountDataUpdated(lockedVotesTokenData);
  }, [
    address,
    fetchLockReleaseAccountData,
    onLockReleaseAccountDataUpdated,
    lockedVotesTokenAddress,
  ]);

  const loadERC20TokenAccountData = useCallback(async () => {
    if (!address || !votesTokenAddress) {
      return;
    }
    const erc20TokenData = await fetchVotingTokenAccountData(votesTokenAddress, address);
    onGovernanceAccountDataUpdated(erc20TokenData);
  }, [address, fetchVotingTokenAccountData, onGovernanceAccountDataUpdated, votesTokenAddress]);

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

    const unwatchDelegator = lockReleaseContract.watchEvent.DelegateChanged(
      { delegator: address },
      { onLogs: loadLockedVotesToken },
    );
    const unwatchFromDelegate = lockReleaseContract.watchEvent.DelegateChanged(
      { fromDelegate: address },
      { onLogs: loadLockedVotesToken },
    );
    const unwatchToDelegate = lockReleaseContract.watchEvent.DelegateChanged(
      { toDelegate: address },
      { onLogs: loadLockedVotesToken },
    );

    return () => {
      unwatchDelegator();
      unwatchToDelegate();
      unwatchFromDelegate();
    };
  }, [address, lockedVotesTokenAddress, loadLockedVotesToken, publicClient]);

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

    const unwatchDelegator = tokenContract.watchEvent.DelegateChanged(
      { delegator: address },
      { onLogs: loadERC20TokenAccountData },
    );
    const unwatchFromDelegate = tokenContract.watchEvent.DelegateChanged(
      { fromDelegate: address },
      { onLogs: loadERC20TokenAccountData },
    );
    const unwatchToDelegate = tokenContract.watchEvent.DelegateChanged(
      { toDelegate: address },
      { onLogs: loadERC20TokenAccountData },
    );

    return () => {
      unwatchDelegator();
      unwatchFromDelegate();
      unwatchToDelegate();
    };
  }, [address, loadERC20TokenAccountData, publicClient, votesTokenAddress]);

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

    const unwatchProposalCreated = azoriusContract.watchEvent.ProposalCreated({
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

          onProposalCreated(proposal);
        }
      },
    });
    const unwatchProposalExecuted = azoriusContract.watchEvent.ProposalExecuted({
      onLogs: async logs => {
        for (const log of logs) {
          if (!log.args.proposalId) {
            continue;
          }

          onProposalExecuted(log.args.proposalId.toString());
        }
      },
    });

    return () => {
      unwatchProposalCreated();
      unwatchProposalExecuted();
    };
  }, [
    getAddressContractType,
    publicClient,
    decode,
    onProposalCreated,
    onProposalExecuted,
    moduleAzoriusAddress,
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

          onERC20VoteCreated(log.args.proposalId.toString(), votesSummary, {
            voter: log.args.voter,
            choice: getVoteChoice(log.args.voteType),
            weight: log.args.weight,
          });
        }
      },
    });

    return unwatch;
  }, [erc20StrategyAddress, onERC20VoteCreated, getAddressContractType, publicClient, decode]);

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

          const erc721ProposalVote: ERC721ProposalVote = {
            voter: log.args.voter,
            choice: getVoteChoice(log.args.voteType),
            tokenAddresses: log.args.tokenAddresses.map(tokenAddress => tokenAddress),
            tokenIds: log.args.tokenIds.map(tokenId => tokenId.toString()),
            // TODO: Weight is calculated down the line in the components depending on proposal state. Do we need to store it here?
            weight: 0n,
          };

          onERC721VoteCreated(log.args.proposalId.toString(), votesSummary, erc721ProposalVote);
        }
      },
    });

    return unwatch;
  }, [getAddressContractType, publicClient, decode, onERC721VoteCreated, erc721StrategyAddress]);
}
