import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Address,
  erc721Abi,
  formatUnits,
  getContract,
  GetContractEventsReturnType,
  zeroAddress,
} from 'viem';
import { useAccount } from 'wagmi';
import LockReleaseAbi from '../../assets/abi/LockRelease';
import { SENTINEL_ADDRESS } from '../../constants/common';
import { createSnapshotSubgraphClient } from '../../graphql';
import { ProposalsQuery, ProposalsResponse } from '../../graphql/SnapshotQueries';
import { logError } from '../../helpers/errorLogging';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';

import {
  ContractTypeWithVersion,
  useAddressContractType,
} from '../../hooks/utils/useAddressContractType';
import { useSafeDecoder } from '../../hooks/utils/useSafeDecoder';
import { useSafeTransactions } from '../../hooks/utils/useSafeTransactions';
import { useTimeHelpers } from '../../hooks/utils/useTimeHelpers';
import { useUpdateTimer } from '../../hooks/utils/useUpdateTimer';
import useIPFSClient from '../../providers/App/hooks/useIPFSClient';
import { useSafeAPI } from '../../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import {
  AzoriusProposal,
  CreateProposalMetadata,
  DecentModule,
  ERC721TokenData,
  FractalProposal,
  FractalProposalState,
  FractalTokenType,
  FractalVotingStrategy,
  GovernanceType,
  ProposalTemplate,
  SnapshotProposal,
  VotesTokenData,
  VotingStrategyType,
} from '../../types';
import {
  decodeTransactions,
  getAzoriusModuleFromModules,
  mapProposalCreatedEventToProposal,
} from '../../utils/azorius';
import { blocksToSeconds } from '../../utils/contract';
import { getPaymasterAddress } from '../../utils/gaslessVoting';
import { SetAzoriusGovernancePayload } from '../slices/governances';
import { useGlobalStore } from '../store';

/**
 * `useGovernanceFetcher` is used as an abstraction layer over logic of fetching DAO governance data
 * For now it only loads data from on-chain and IPFS
 * In the future it will be extended to support other sources of data
 */
export function useGovernanceFetcher() {
  const ipfsClient = useIPFSClient();
  const decode = useSafeDecoder();
  const { getTimeDuration } = useTimeHelpers();
  const { parseTransactions } = useSafeTransactions();
  const { t } = useTranslation(['dashboard']);
  const publicClient = useNetworkPublicClient();
  const safeApi = useSafeAPI();
  const { getAddressContractType } = useAddressContractType();
  const user = useAccount();
  const snaphshotGraphQlClient = useMemo(() => createSnapshotSubgraphClient(), []);

  const { daoKey } = useCurrentDAOKey();
  const { getGovernance } = useGlobalStore();
  const governance = daoKey ? getGovernance(daoKey) : undefined;
  const cachedProposals = governance?.proposals;

  const {
    contracts: {
      zodiacModuleProxyFactory,
      accountAbstraction,
      paymaster: { decentPaymasterV1MasterCopy },
    },
  } = useNetworkConfigStore();
  const { safeAddress: currentUrlSafeAddress } = useCurrentDAOKey();

  const { setMethodOnInterval, clearIntervals } = useUpdateTimer(currentUrlSafeAddress);

  const fetchDAOGovernance = useCallback(
    async ({
      daoAddress,
      daoModules,
      onMultisigGovernanceLoaded,
      onAzoriusGovernanceLoaded,
      onProposalsLoaded,
      onProposalLoaded,
      onTokenClaimContractAddressLoaded,
      onVotesTokenAddressLoaded,
    }: {
      daoAddress: Address;
      daoModules: DecentModule[];
      onMultisigGovernanceLoaded: () => void;
      onAzoriusGovernanceLoaded: (governance: SetAzoriusGovernancePayload) => void;
      onProposalsLoaded: (proposals: FractalProposal[]) => void;
      onProposalLoaded: (proposal: AzoriusProposal, index: number, totalProposals: number) => void;
      onTokenClaimContractAddressLoaded: (tokenClaimContractAddress: Address) => void;
      onVotesTokenAddressLoaded: (votesTokenAddress: Address) => void;
    }) => {
      const azoriusModule = getAzoriusModuleFromModules(daoModules);
      clearIntervals();
      if (!azoriusModule) {
        onMultisigGovernanceLoaded();
        setMethodOnInterval(async () => {
          const multisigTransactions = await safeApi.getMultisigTransactions(daoAddress);
          const activities = await parseTransactions(multisigTransactions);
          onProposalsLoaded(activities);
        });
      } else {
        const azoriusContract = getContract({
          abi: abis.Azorius,
          address: azoriusModule.moduleAddress,
          client: publicClient,
        });
        const [strategiesAddresses, nextStrategy] = await azoriusContract.read.getStrategies([
          SENTINEL_ADDRESS,
          3n,
        ]);
        const votingStrategies = await Promise.all(
          [...strategiesAddresses, nextStrategy]
            .filter(
              strategyAddress =>
                strategyAddress !== SENTINEL_ADDRESS && strategyAddress !== zeroAddress,
            )
            .map(async strategyAddress => ({
              ...(await getAddressContractType(strategyAddress)),
              strategyAddress,
            })),
        );
        let votesTokenAddress: Address | undefined;
        let lockReleaseAddress: Address | undefined;

        const setGovTokenAddress = async (erc20VotingStrategyAddress: Address) => {
          if (votesTokenAddress) {
            return;
          }
          const ozLinearVotingContract = getContract({
            abi: abis.LinearERC20Voting,
            address: erc20VotingStrategyAddress,
            client: publicClient,
          });

          const govTokenAddress = await ozLinearVotingContract.read.governanceToken();
          // govTokenAddress might be either
          // - a valid VotesERC20 contract
          // - a valid LockRelease contract
          // - or none of these which is against business logic

          const { isVotesErc20 } = await getAddressContractType(govTokenAddress);

          if (isVotesErc20) {
            votesTokenAddress = govTokenAddress;
          } else {
            const possibleLockRelease = getContract({
              address: govTokenAddress,
              abi: LockReleaseAbi,
              client: { public: publicClient },
            });

            try {
              votesTokenAddress = await possibleLockRelease.read.token();
              lockReleaseAddress = govTokenAddress;
            } catch {
              throw new Error('Unknown governance token type');
            }
          }

          onVotesTokenAddressLoaded(votesTokenAddress);
        };

        let strategies: FractalVotingStrategy[] = [];

        const parseProposalMetadata = (metadata: string): CreateProposalMetadata => {
          try {
            const createProposalMetadata: CreateProposalMetadata = JSON.parse(metadata);
            return createProposalMetadata;
          } catch {
            logError('Unable to parse proposal metadata.', 'metadata:', metadata);
            return {
              title: t('metadataFailedParsePlaceholder'),
              description: '',
            };
          }
        };

        const tokenType = (
          votingStrategy: ContractTypeWithVersion,
        ): FractalTokenType | undefined => {
          if (
            votingStrategy.isLinearVotingErc20 ||
            votingStrategy.isLinearVotingErc20WithHatsProposalCreation
          ) {
            return FractalTokenType.erc20;
          } else if (
            votingStrategy.isLinearVotingErc721 ||
            votingStrategy.isLinearVotingErc721WithHatsProposalCreation
          ) {
            return FractalTokenType.erc721;
          } else {
            return undefined;
          }
        };

        const hasWhitelist = (votingStrategy: ContractTypeWithVersion): boolean | undefined => {
          if (
            votingStrategy.isLinearVotingErc20WithHatsProposalCreation ||
            votingStrategy.isLinearVotingErc721WithHatsProposalCreation
          ) {
            return true;
          } else if (votingStrategy.isLinearVotingErc20 || votingStrategy.isLinearVotingErc721) {
            return false;
          } else {
            return undefined;
          }
        };

        if (!votingStrategies) {
          return;
        }

        await Promise.all(
          votingStrategies.map(async votingStrategy => {
            const type = tokenType(votingStrategy);
            const whitelist = hasWhitelist(votingStrategy);
            if (type != undefined && whitelist != undefined) {
              const strategy = {
                address: votingStrategy.strategyAddress,
                type: type,
                withWhitelist: whitelist,
                version: votingStrategy.version,
              };
              strategies.push(strategy);
            }
            if (type == FractalTokenType.erc20) {
              await setGovTokenAddress(votingStrategy.strategyAddress);
            }
          }),
        );

        if (strategies.length > 0) {
          let linearVotingErc20Address = strategies.find(strategy => {
            return strategy.type == FractalTokenType.erc20 && strategy.withWhitelist == false;
          })?.address;
          let linearVotingErc20WithHatsWhitelistingAddress = strategies.find(strategy => {
            return strategy.type == FractalTokenType.erc20 && strategy.withWhitelist == true;
          })?.address;
          let linearVotingErc721Address = strategies.find(strategy => {
            return strategy.type == FractalTokenType.erc721 && strategy.withWhitelist == false;
          })?.address;
          let linearVotingErc721WithHatsWhitelistingAddress = strategies.find(strategy => {
            return strategy.type == FractalTokenType.erc721 && strategy.withWhitelist == true;
          })?.address;

          const erc20VotingStrategyAddress =
            linearVotingErc20Address || linearVotingErc20WithHatsWhitelistingAddress;

          const erc721VotingStrategyAddress =
            linearVotingErc721Address || linearVotingErc721WithHatsWhitelistingAddress;

          if (votesTokenAddress && erc20VotingStrategyAddress) {
            const erc20VotingContract = getContract({
              abi: abis.LinearERC20Voting,
              address: erc20VotingStrategyAddress,
              client: publicClient,
            });

            const tokenContract = getContract({
              abi: abis.VotesERC20,
              address: votesTokenAddress,
              client: publicClient,
            });

            // Prepare multicall requests
            const multicallCalls = [
              {
                ...tokenContract,
                functionName: 'name',
              },
              {
                ...tokenContract,
                functionName: 'symbol',
              },
              {
                ...tokenContract,
                functionName: 'decimals',
              },

              {
                ...tokenContract,
                functionName: 'totalSupply',
              },
            ];

            // Execute multicall
            const [name, symbol, decimals, totalSupply] = await publicClient.multicall({
              contracts: multicallCalls,
              allowFailure: false,
            });
            let balance: bigint = 0n;
            if (user.address) {
              balance = await tokenContract.read.balanceOf([user.address]);
            }

            const tokenData = {
              name: name ? name.toString() : '',
              symbol: symbol ? symbol.toString() : '',
              decimals: decimals ? Number(decimals) : 18,
              address: tokenContract.address,
              totalSupply: totalSupply ? BigInt(totalSupply) : 0n,
              balance,
              delegatee: zeroAddress as Address,
            };

            let lockedVotesTokenData: VotesTokenData | undefined;
            if (lockReleaseAddress) {
              lockedVotesTokenData = {
                balance,
                delegatee: zeroAddress,
                name: tokenData.name,
                symbol: tokenData.symbol,
                decimals: tokenData.decimals,
                totalSupply: tokenData.totalSupply,
                address: lockReleaseAddress,
              };
            }

            // Prepare and execute multicall for governance parameters
            const [
              votingPeriodBlocks,
              quorumNumerator,
              quorumDenominator,
              timeLockPeriod,
              executionPeriod,
              proposerThreshold,
            ] = await publicClient.multicall({
              contracts: [
                {
                  ...erc20VotingContract,
                  functionName: 'votingPeriod',
                },
                {
                  ...erc20VotingContract,
                  functionName: 'quorumNumerator',
                },
                {
                  ...erc20VotingContract,
                  functionName: 'QUORUM_DENOMINATOR',
                },
                {
                  ...azoriusContract,
                  functionName: 'timelockPeriod',
                },
                {
                  ...azoriusContract,
                  functionName: 'executionPeriod',
                },
                {
                  ...erc20VotingContract,
                  functionName: 'requiredProposerWeight',
                },
              ],
              allowFailure: false,
            });

            const quorumPercentage = (quorumNumerator * 100n) / quorumDenominator;
            const votingPeriodValue = await blocksToSeconds(votingPeriodBlocks, publicClient);
            const timeLockPeriodValue = await blocksToSeconds(timeLockPeriod, publicClient);
            const executionPeriodValue = await blocksToSeconds(executionPeriod, publicClient);
            const votingStrategy = {
              votingPeriod: {
                value: BigInt(votingPeriodValue),
                formatted: getTimeDuration(votingPeriodValue),
              },
              proposerThreshold: {
                value: proposerThreshold,
                formatted: formatUnits(proposerThreshold, tokenData.decimals || 18),
              },
              quorumPercentage: {
                value: quorumPercentage,
                formatted: `${quorumPercentage}`,
              },
              timeLockPeriod: {
                value: BigInt(timeLockPeriodValue),
                formatted: getTimeDuration(timeLockPeriodValue),
              },
              executionPeriod: {
                value: BigInt(executionPeriodValue),
                formatted: getTimeDuration(executionPeriodValue),
              },
              strategyType: VotingStrategyType.LINEAR_ERC20,
            };

            onAzoriusGovernanceLoaded({
              moduleAzoriusAddress: azoriusContract.address,
              votesToken: tokenData,
              erc721Tokens: undefined,
              linearVotingErc20Address,
              linearVotingErc20WithHatsWhitelistingAddress,
              linearVotingErc721Address,
              linearVotingErc721WithHatsWhitelistingAddress,
              isLoaded: true,
              strategies,
              votingStrategy,
              isAzorius: true,
              lockedVotesToken: lockedVotesTokenData,
              type: GovernanceType.AZORIUS_ERC20,
            });

            // Fetch Claiming Contract

            const approvals = await tokenContract.getEvents.Approval(undefined, { fromBlock: 0n });
            const firstApproval = approvals[0];

            if (firstApproval && firstApproval.args.spender) {
              const { isClaimErc20 } = await getAddressContractType(firstApproval.args.spender);
              if (isClaimErc20) {
                onTokenClaimContractAddressLoaded(firstApproval.args.spender);
              }
            }

            const erc20VotedEvents = await erc20VotingContract.getEvents.Voted({ fromBlock: 0n });
            const executedEvents = await azoriusContract.getEvents.ProposalExecuted({
              fromBlock: 0n,
            });
            const proposalCreatedEvents = (
              await azoriusContract.getEvents.ProposalCreated({ fromBlock: 0n })
            ).reverse();

            if (!proposalCreatedEvents.length) {
              onProposalsLoaded([]);
              return;
            }
            const entries = proposalCreatedEvents.entries();
            for (const [index, proposalCreatedEvent] of entries) {
              if (proposalCreatedEvent.args.proposalId === undefined) {
                continue;
              }

              const cachedProposal = cachedProposals?.find(
                p => p.proposalId === proposalCreatedEvent?.args?.proposalId?.toString(),
              );
              const isProposalFossilized =
                cachedProposal?.state === FractalProposalState.CLOSED ||
                cachedProposal?.state === FractalProposalState.EXECUTED ||
                cachedProposal?.state === FractalProposalState.FAILED ||
                cachedProposal?.state === FractalProposalState.EXPIRED ||
                cachedProposal?.state === FractalProposalState.REJECTED;

              if (cachedProposal && isProposalFossilized) {
                // @dev skip fossilized proposals, cached proposals already loaded
                continue;
              }
              let proposalData;

              if (
                proposalCreatedEvent.args.proposer === undefined ||
                proposalCreatedEvent.args.strategy === undefined
              ) {
                continue;
              }

              if (proposalCreatedEvent.args.metadata && proposalCreatedEvent.args.transactions) {
                const metadataEvent = parseProposalMetadata(proposalCreatedEvent.args.metadata);

                try {
                  const decodedTransactions = await decodeTransactions(
                    decode,
                    proposalCreatedEvent.args.transactions.map(tx => ({
                      ...tx,
                      to: tx.to,
                      data: tx.data,
                      value: tx.value,
                    })),
                  );

                  proposalData = {
                    metaData: {
                      title: metadataEvent.title,
                      description: metadataEvent.description,
                      documentationUrl: metadataEvent.documentationUrl,
                    },
                    transactions: proposalCreatedEvent.args.transactions.map(tx => ({
                      ...tx,
                      to: tx.to,
                      value: tx.value,
                      data: tx.data,
                    })),
                    decodedTransactions,
                  };
                } catch {
                  logError(
                    'Unable to parse proposal metadata or transactions',
                    'metadata:',
                    proposalCreatedEvent.args.metadata,
                    'transactions:',
                    proposalCreatedEvent.args.transactions,
                  );
                }
              }

              const proposal = await mapProposalCreatedEventToProposal(
                proposalCreatedEvent.transactionHash,
                proposalCreatedEvent.args.strategy,
                VotingStrategyType.LINEAR_ERC20,
                Number(proposalCreatedEvent.args.proposalId),
                proposalCreatedEvent.args.proposer,
                azoriusContract,
                publicClient,
                erc20VotedEvents,
                undefined,
                executedEvents,
                proposalData,
              );

              onProposalLoaded(proposal, index, proposalCreatedEvents.length);
            }
          } else if (erc721VotingStrategyAddress) {
            const erc721LinearVotingContract = getContract({
              abi: abis.LinearERC721Voting,
              address: erc721VotingStrategyAddress,
              client: publicClient,
            });
            const addresses = await erc721LinearVotingContract.read.getAllTokenAddresses();
            const erc721Tokens: ERC721TokenData[] = await Promise.all(
              addresses.map(async address => {
                const tokenContract = getContract({
                  abi: erc721Abi,
                  address,
                  client: publicClient,
                });
                const votingWeight = await erc721LinearVotingContract.read.getTokenWeight([
                  address,
                ]);
                // TODO: Transform to multiCall
                const [name, symbol, tokenMintEvents, tokenBurnEvents] = await Promise.all([
                  tokenContract.read.name(),
                  tokenContract.read.symbol(),
                  tokenContract.getEvents.Transfer({ from: zeroAddress }, { fromBlock: 0n }),
                  tokenContract.getEvents.Transfer({ to: zeroAddress }, { fromBlock: 0n }),
                ]);
                const totalSupply = BigInt(tokenMintEvents.length - tokenBurnEvents.length);
                return { name, symbol, address, votingWeight, totalSupply };
              }),
            );

            // TODO: Transform to multiCall

            const [
              votingPeriodBlocks,
              quorumThreshold,
              proposerThreshold,
              timeLockPeriod,
              executionPeriod,
            ] = await Promise.all([
              erc721LinearVotingContract.read.votingPeriod(),
              erc721LinearVotingContract.read.quorumThreshold(),
              erc721LinearVotingContract.read.proposerThreshold(),
              azoriusContract.read.timelockPeriod(),
              azoriusContract.read.executionPeriod(),
            ]);

            const votingPeriodValue = await blocksToSeconds(votingPeriodBlocks, publicClient);
            const timeLockPeriodValue = await blocksToSeconds(timeLockPeriod, publicClient);
            const executionPeriodValue = await blocksToSeconds(executionPeriod, publicClient);

            const votingStrategy = {
              proposerThreshold: {
                value: proposerThreshold,
                formatted: proposerThreshold.toString(),
              },
              votingPeriod: {
                value: BigInt(votingPeriodValue),
                formatted: getTimeDuration(votingPeriodValue),
              },
              quorumThreshold: {
                value: quorumThreshold,
                formatted: quorumThreshold.toString(),
              },
              timeLockPeriod: {
                value: BigInt(timeLockPeriodValue),
                formatted: getTimeDuration(timeLockPeriodValue),
              },
              executionPeriod: {
                value: BigInt(executionPeriodValue),
                formatted: getTimeDuration(executionPeriodValue),
              },
              strategyType: VotingStrategyType.LINEAR_ERC721,
            };

            onAzoriusGovernanceLoaded({
              moduleAzoriusAddress: azoriusContract.address,
              votesToken: undefined,
              erc721Tokens,
              linearVotingErc20Address,
              linearVotingErc20WithHatsWhitelistingAddress,
              linearVotingErc721Address,
              linearVotingErc721WithHatsWhitelistingAddress,
              isLoaded: true,
              strategies,
              votingStrategy,
              isAzorius: true,
              type: GovernanceType.AZORIUS_ERC721,
            });

            // Now - fetch proposals

            const erc721VotedEvents = await erc721LinearVotingContract.getEvents.Voted({
              fromBlock: 0n,
            });
            const executedEvents = await azoriusContract.getEvents.ProposalExecuted({
              fromBlock: 0n,
            });
            const proposalCreatedEvents = (
              await azoriusContract.getEvents.ProposalCreated({ fromBlock: 0n })
            ).reverse();

            if (!proposalCreatedEvents.length) {
              return;
            }

            for (const [index, proposalCreatedEvent] of proposalCreatedEvents.entries()) {
              if (proposalCreatedEvent.args.proposalId === undefined) {
                continue;
              }

              const cachedProposal = cachedProposals?.find(
                p => p.proposalId === proposalCreatedEvent?.args?.proposalId?.toString(),
              );
              const isProposalFossilized =
                cachedProposal?.state === FractalProposalState.CLOSED ||
                cachedProposal?.state === FractalProposalState.EXECUTED ||
                cachedProposal?.state === FractalProposalState.FAILED ||
                cachedProposal?.state === FractalProposalState.EXPIRED ||
                cachedProposal?.state === FractalProposalState.REJECTED;

              if (cachedProposal && isProposalFossilized) {
                continue;
              }

              let proposalData;

              if (
                proposalCreatedEvent.args.proposer === undefined ||
                proposalCreatedEvent.args.strategy === undefined
              ) {
                continue;
              }

              if (proposalCreatedEvent.args.metadata && proposalCreatedEvent.args.transactions) {
                const metadataEvent = parseProposalMetadata(proposalCreatedEvent.args.metadata);

                try {
                  const decodedTransactions = await decodeTransactions(
                    decode,
                    proposalCreatedEvent.args.transactions.map(tx => ({
                      ...tx,
                      to: tx.to,
                      data: tx.data,
                      value: tx.value,
                    })),
                  );

                  proposalData = {
                    metaData: {
                      title: metadataEvent.title,
                      description: metadataEvent.description,
                      documentationUrl: metadataEvent.documentationUrl,
                    },
                    transactions: proposalCreatedEvent.args.transactions.map(tx => ({
                      ...tx,
                      to: tx.to,
                      value: tx.value,
                      data: tx.data,
                    })),
                    decodedTransactions,
                  };
                } catch {
                  logError(
                    'Unable to parse proposal metadata or transactions',
                    'metadata:',
                    proposalCreatedEvent.args.metadata,
                    'transactions:',
                    proposalCreatedEvent.args.transactions,
                  );
                }
              }

              const proposal = await mapProposalCreatedEventToProposal(
                proposalCreatedEvent.transactionHash,
                proposalCreatedEvent.args.strategy,
                VotingStrategyType.LINEAR_ERC721,
                Number(proposalCreatedEvent.args.proposalId),
                proposalCreatedEvent.args.proposer,
                azoriusContract,
                publicClient,
                undefined,
                erc721VotedEvents,
                executedEvents,
                proposalData,
              );

              onProposalLoaded(proposal, index, proposalCreatedEvents.length);
            }
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      setMethodOnInterval,
      safeApi,
      parseTransactions,
      publicClient,
      getAddressContractType,
      t,
      getTimeDuration,
      decode,
    ],
  );

  const fetchDAOProposalTemplates = useCallback(
    async ({ proposalTemplatesHash }: { proposalTemplatesHash: string }) => {
      const proposalTemplates: ProposalTemplate[] | undefined =
        await ipfsClient.cat(proposalTemplatesHash);

      if (proposalTemplates) {
        const mappedProposalTemplates = proposalTemplates.map(proposalTemplate => ({
          ...proposalTemplate,
          transactions: proposalTemplate.transactions.map(transaction => ({
            ...transaction,
            ethValue: {
              // bigintValue was serialized as a string, so we need to convert it back to a bigint
              bigintValue: BigInt(transaction.ethValue.bigintValue || 0n),
              value: transaction.ethValue.value ?? '0',
            },
          })),
        }));

        return mappedProposalTemplates;
      }
    },
    [ipfsClient],
  );

  const fetchVotingTokenAccountData = useCallback(
    async (votingTokenAddress: Address, account: Address) => {
      const tokenContract = getContract({
        abi: abis.VotesERC20,
        address: votingTokenAddress,
        client: publicClient,
      });
      const [balance, delegatee] = await Promise.all([
        tokenContract.read.balanceOf([account]),
        tokenContract.read.delegates([account]),
      ]);

      return { balance, delegatee };
    },
    [publicClient],
  );

  const fetchLockReleaseAccountData = useCallback(
    async (lockReleaseAddress: Address, account: Address) => {
      const lockReleaseContract = getContract({
        abi: LockReleaseAbi,
        address: lockReleaseAddress,
        client: publicClient,
      });

      const [tokenAmountTotal, tokenAmountReleased, lockReleaseDelegatee] = await Promise.all([
        lockReleaseContract.read.getTotal([account]),
        lockReleaseContract.read.getReleased([account]),
        lockReleaseContract.read.delegates([account]),
      ]);

      return { balance: tokenAmountTotal - tokenAmountReleased, delegatee: lockReleaseDelegatee };
    },
    [publicClient],
  );

  const fetchDAOSnapshotProposals = useCallback(
    async ({ daoSnapshotENS }: { daoSnapshotENS: string }) => {
      if (snaphshotGraphQlClient) {
        const result = await snaphshotGraphQlClient
          .query<ProposalsResponse>(ProposalsQuery, { spaceIn: [daoSnapshotENS] })
          .toPromise();

        if (!result.data?.proposals) {
          return;
        }

        const proposals: SnapshotProposal[] = result.data.proposals.map(proposal => ({
          eventDate: new Date(proposal.start * 1000),
          state:
            proposal.state === 'active'
              ? FractalProposalState.ACTIVE
              : proposal.state === 'closed'
                ? FractalProposalState.CLOSED
                : FractalProposalState.PENDING,
          proposalId: proposal.id,
          snapshotProposalId: proposal.id,
          targets: [],
          title: proposal.title,
          description: proposal.body,
          startTime: proposal.start,
          endTime: proposal.end,
          proposer: proposal.author,
          author: proposal.author,
          transactionHash: '', // Required by SnapshotProposal type
        }));

        return proposals;
      }
    },
    [snaphshotGraphQlClient],
  );

  const fetchGaslessVotingDAOData = useCallback(
    async ({
      events,
      safeAddress,
    }: {
      events: GetContractEventsReturnType<typeof abis.KeyValuePairs>;
      safeAddress: Address;
    }) => {
      // get most recent event where `gaslessVotingEnabled` was set
      const gaslessVotingEnabledEvent = events
        .filter(event => event.args.key && event.args.key === 'gaslessVotingEnabled')
        .pop();

      if (!gaslessVotingEnabledEvent || !accountAbstraction || !publicClient.chain) {
        return { gaslessVotingEnabled: false, paymasterAddress: null };
      }

      try {
        const paymasterAddress = getPaymasterAddress({
          safeAddress,
          zodiacModuleProxyFactory,
          paymasterMastercopy: decentPaymasterV1MasterCopy,
          entryPoint: accountAbstraction.entryPointv07,
          lightAccountFactory: accountAbstraction.lightAccountFactory,
          chainId: publicClient.chain.id,
        });

        const paymasterCode = await publicClient.getCode({
          address: paymasterAddress,
        });

        const paymasterExists = !!paymasterCode && paymasterCode !== '0x';

        const gaslessVotingEnabled = gaslessVotingEnabledEvent.args.value === 'true';
        return {
          gaslessVotingEnabled,
          paymasterAddress: paymasterExists ? paymasterAddress : null,
        };
      } catch (e) {
        logError({
          message: 'Error getting gasless voting dao data',
          network: publicClient.chain!.id,
          args: {
            transactionHash: gaslessVotingEnabledEvent.transactionHash,
            logIndex: gaslessVotingEnabledEvent.logIndex,
          },
        });

        return;
      }
    },
    [publicClient, accountAbstraction, zodiacModuleProxyFactory, decentPaymasterV1MasterCopy],
  );

  return {
    fetchDAOGovernance,
    fetchDAOProposalTemplates,
    fetchVotingTokenAccountData,
    fetchLockReleaseAccountData,
    fetchDAOSnapshotProposals,
    fetchGaslessVotingDAOData,
  };
}
