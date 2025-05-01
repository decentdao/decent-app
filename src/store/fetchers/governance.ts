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
import LockReleaseAbi from '../../assets/abi/LockRelease';
import { createSnapshotSubgraphClient } from '../../graphql';
import { ProposalsQuery, ProposalsResponse } from '../../graphql/SnapshotQueries';
import { logError } from '../../helpers/errorLogging';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { CacheExpiry, CacheKeys } from '../../hooks/utils/cache/cacheDefaults';
import { getValue, setValue } from '../../hooks/utils/cache/useLocalStorage';
import {
  ContractTypeWithVersion,
  useAddressContractType,
} from '../../hooks/utils/useAddressContractType';
import { useSafeDecoder } from '../../hooks/utils/useSafeDecoder';
import { useSafeTransactions } from '../../hooks/utils/useSafeTransactions';
import { useTimeHelpers } from '../../hooks/utils/useTimeHelpers';
import useVotingStrategiesAddresses from '../../hooks/utils/useVotingStrategiesAddresses';
import useIPFSClient from '../../providers/App/hooks/useIPFSClient';
import { useSafeAPI } from '../../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import {
  AzoriusProposal,
  CreateProposalMetadata,
  DecentGovernance,
  DecentModule,
  ERC721TokenData,
  FractalGovernanceContracts,
  FractalProposal,
  FractalProposalState,
  FractalTokenType,
  FractalVotingStrategy,
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
  const { getVotingStrategies } = useVotingStrategiesAddresses();
  const { t } = useTranslation(['dashboard']);
  const publicClient = useNetworkPublicClient();
  const safeApi = useSafeAPI();
  const { getAddressContractType } = useAddressContractType();
  const snaphshotGraphQlClient = useMemo(() => createSnapshotSubgraphClient(), []);

  const {
    contracts: {
      zodiacModuleProxyFactory,
      accountAbstraction,
      paymaster: { decentPaymasterV1MasterCopy },
    },
  } = useNetworkConfigStore();

  const fetchDAOGovernance = useCallback(
    async ({
      daoAddress,
      daoModules,
      onMultisigGovernanceLoaded,
      onAzoriusGovernanceLoaded,
      onProposalsLoaded,
      onProposalLoaded,
      onTokenClaimContractAddressLoaded,
      onLoadingFirstProposalStateChanged,
    }: {
      daoAddress: Address;
      daoModules: DecentModule[];
      onMultisigGovernanceLoaded: () => void;
      onAzoriusGovernanceLoaded: (
        governance: Omit<
          DecentGovernance & FractalGovernanceContracts,
          'gaslessVotingEnabled' | 'paymasterAddress'
        >,
      ) => void;
      onProposalsLoaded: (proposals: FractalProposal[]) => void;
      onProposalLoaded: (proposal: AzoriusProposal) => void;
      onTokenClaimContractAddressLoaded: (tokenClaimContractAddress: Address) => void;
      onLoadingFirstProposalStateChanged: (loading: boolean) => void;
    }) => {
      const azoriusModule = getAzoriusModuleFromModules(daoModules);

      if (!azoriusModule) {
        onMultisigGovernanceLoaded();
        const multisigTransactions = await safeApi.getMultisigTransactions(daoAddress);
        const activities = await parseTransactions(multisigTransactions);
        onProposalsLoaded(activities);
      } else {
        const azoriusContract = getContract({
          abi: abis.Azorius,
          address: azoriusModule.moduleAddress,
          client: publicClient,
        });
        const votingStrategies = await getVotingStrategies(daoAddress);
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

            // TODO: Transform to multiCall
            const [name, symbol, decimals, totalSupply] = await Promise.all([
              tokenContract.read.name(),
              tokenContract.read.symbol(),
              tokenContract.read.decimals(),
              tokenContract.read.totalSupply(),
            ]);
            const tokenData = {
              name,
              symbol,
              decimals,
              address: tokenContract.address,
              totalSupply,
              balance: 0n,
              delegatee: zeroAddress as Address,
            };

            let lockedVotesTokenData: VotesTokenData | undefined;
            if (lockReleaseAddress) {
              lockedVotesTokenData = {
                balance: 0n,
                delegatee: zeroAddress,
                name,
                symbol,
                decimals,
                totalSupply,
                address: lockReleaseAddress,
              };
            }

            // TODO: Transform to multiCall

            const [
              votingPeriodBlocks,
              quorumNumerator,
              quorumDenominator,
              timeLockPeriod,
              proposerThreshold,
            ] = await Promise.all([
              erc20VotingContract.read.votingPeriod(),
              erc20VotingContract.read.quorumNumerator(),
              erc20VotingContract.read.QUORUM_DENOMINATOR(),
              azoriusContract.read.timelockPeriod(),
              erc20VotingContract.read.requiredProposerWeight(),
            ]);

            const quorumPercentage = (quorumNumerator * 100n) / quorumDenominator;
            const votingPeriodValue = await blocksToSeconds(votingPeriodBlocks, publicClient);
            const timeLockPeriodValue = await blocksToSeconds(timeLockPeriod, publicClient);
            const votingData = {
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
                formatted: `${quorumPercentage}%`,
              },
              timeLockPeriod: {
                value: BigInt(timeLockPeriodValue),
                formatted: getTimeDuration(timeLockPeriodValue),
              },
              strategyType: VotingStrategyType.LINEAR_ERC20,
            };

            onAzoriusGovernanceLoaded({
              votesToken: tokenData,
              linearVotingErc20Address,
              linearVotingErc20WithHatsWhitelistingAddress,
              linearVotingErc721Address,
              linearVotingErc721WithHatsWhitelistingAddress,
              isLoaded: true,
              strategies,
              votingStrategy: votingData,
              loadingProposals: false,
              allProposalsLoaded: false,
              proposals: null,
              pendingProposals: null,
              isAzorius: true,
              lockedVotesToken: lockedVotesTokenData,
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

            // Now - fetch proposals

            onLoadingFirstProposalStateChanged(true);

            const erc20VotedEvents = await erc20VotingContract.getEvents.Voted({ fromBlock: 0n });
            const executedEvents = await azoriusContract.getEvents.ProposalExecuted({
              fromBlock: 0n,
            });
            const proposalCreatedEvents = (
              await azoriusContract.getEvents.ProposalCreated({ fromBlock: 0n })
            ).reverse();

            if (!proposalCreatedEvents.length) {
              onLoadingFirstProposalStateChanged(false);
              return;
            }

            for (const proposalCreatedEvent of proposalCreatedEvents) {
              if (proposalCreatedEvent.args.proposalId === undefined) {
                continue;
              }

              const cachedProposal = getValue({
                cacheName: CacheKeys.PROPOSAL_CACHE,
                proposalId: proposalCreatedEvent.args.proposalId.toString(),
                contractAddress: azoriusContract.address,
              });

              if (cachedProposal) {
                onProposalLoaded(cachedProposal);
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

              onProposalLoaded(proposal);

              const isProposalFossilized =
                proposal.state === FractalProposalState.CLOSED ||
                proposal.state === FractalProposalState.EXECUTED ||
                proposal.state === FractalProposalState.FAILED ||
                proposal.state === FractalProposalState.EXPIRED ||
                proposal.state === FractalProposalState.REJECTED;

              if (isProposalFossilized) {
                setValue(
                  {
                    cacheName: CacheKeys.PROPOSAL_CACHE,
                    proposalId: proposalCreatedEvent.args.proposalId.toString(),
                    contractAddress: azoriusContract.address,
                  },
                  proposal,
                  CacheExpiry.NEVER,
                );
              }
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

            const [votingPeriodBlocks, quorumThreshold, proposerThreshold, timeLockPeriod] =
              await Promise.all([
                erc721LinearVotingContract.read.votingPeriod(),
                erc721LinearVotingContract.read.quorumThreshold(),
                erc721LinearVotingContract.read.proposerThreshold(),
                azoriusContract.read.timelockPeriod(),
              ]);

            const votingPeriodValue = await blocksToSeconds(votingPeriodBlocks, publicClient);
            const timeLockPeriodValue = await blocksToSeconds(timeLockPeriod, publicClient);
            const votingData = {
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
              strategyType: VotingStrategyType.LINEAR_ERC721,
            };

            onAzoriusGovernanceLoaded({
              votesToken: undefined,
              erc721Tokens,
              linearVotingErc20Address,
              linearVotingErc20WithHatsWhitelistingAddress,
              linearVotingErc721Address,
              linearVotingErc721WithHatsWhitelistingAddress,
              isLoaded: true,
              strategies,
              votingStrategy: votingData,
              loadingProposals: false,
              allProposalsLoaded: false,
              proposals: null,
              pendingProposals: null,
              isAzorius: true,
            });

            // Now - fetch proposals

            onLoadingFirstProposalStateChanged(true);

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
              onLoadingFirstProposalStateChanged(false);
              return;
            }

            for (const proposalCreatedEvent of proposalCreatedEvents) {
              if (proposalCreatedEvent.args.proposalId === undefined) {
                continue;
              }

              const cachedProposal = getValue({
                cacheName: CacheKeys.PROPOSAL_CACHE,
                proposalId: proposalCreatedEvent.args.proposalId.toString(),
                contractAddress: azoriusContract.address,
              });

              if (cachedProposal) {
                onProposalLoaded(cachedProposal);
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

              onProposalLoaded(proposal);

              const isProposalFossilized =
                proposal.state === FractalProposalState.CLOSED ||
                proposal.state === FractalProposalState.EXECUTED ||
                proposal.state === FractalProposalState.FAILED ||
                proposal.state === FractalProposalState.EXPIRED ||
                proposal.state === FractalProposalState.REJECTED;

              if (isProposalFossilized) {
                setValue(
                  {
                    cacheName: CacheKeys.PROPOSAL_CACHE,
                    proposalId: proposalCreatedEvent.args.proposalId.toString(),
                    contractAddress: azoriusContract.address,
                  },
                  proposal,
                  CacheExpiry.NEVER,
                );
              }
            }
          }
        }
      }
    },
    [
      getAddressContractType,
      publicClient,
      getVotingStrategies,
      getTimeDuration,
      parseTransactions,
      safeApi,
      t,
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
