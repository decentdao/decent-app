import { legacy, abis } from '@decentdao/decent-contracts';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Address,
  erc721Abi,
  formatUnits,
  getAddress,
  getContract,
  GetContractEventsReturnType,
  zeroAddress,
} from 'viem';
import { useAccount } from 'wagmi';
import LockReleaseAbi from '../../assets/abi/LockRelease';
import { ROLES } from '../../constants/accessControlRoles';
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
import useBalancesAPI from '../../providers/App/hooks/useBalancesAPI';
import useIPFSClient from '../../providers/App/hooks/useIPFSClient';
import { useSafeAPI } from '../../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import {
  AzoriusProposal,
  CreateProposalMetadata,
  DecentModule,
  ERC20LockedTokenData,
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
import { getStakingContractAddress } from '../../utils/stakingContractUtils';
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
  const { getTokenBalances } = useBalancesAPI();
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
      votesERC20StakedV1MasterCopy,
    },
  } = useNetworkConfigStore();
  const { safeAddress: currentUrlSafeAddress, wrongNetwork } = useCurrentDAOKey();

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
          abi: legacy.abis.Azorius,
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
            abi: legacy.abis.LinearERC20Voting,
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
              abi: legacy.abis.LinearERC20Voting,
              address: erc20VotingStrategyAddress,
              client: publicClient,
            });

            const tokenContract = getContract({
              abi: legacy.abis.VotesERC20,
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
              {
                ...tokenContract,
                functionName: 'balanceOf',
                args: [user.address],
              },
              {
                ...tokenContract,
                functionName: 'delegates',
                args: [user.address],
              },
            ];

            // Execute multicall
            const [
              nameData,
              symbolData,
              decimalsData,
              totalSupplyData,
              balanceData,
              delegateeData,
            ] = await publicClient.multicall({
              contracts: multicallCalls,
              allowFailure: true,
            });

            const [name, symbol, decimals, totalSupply, balance, delegatee] = [
              nameData.result?.toString() ?? '',
              symbolData.result?.toString() ?? '',
              decimalsData.result !== undefined ? Number(decimalsData.result) : 18,
              totalSupplyData.result !== undefined ? BigInt(totalSupplyData.result) : 0n,
              balanceData.result !== undefined ? BigInt(balanceData.result) : 0n,
              delegateeData.result !== undefined
                ? getAddress(delegateeData.result.toString())
                : zeroAddress,
            ];

            const tokenData = {
              name,
              symbol,
              decimals,
              totalSupply,
              balance,
              delegatee,
            };

            const votesToken = {
              ...tokenData,
              address: tokenContract.address,
            };

            let lockedVotesToken: VotesTokenData | undefined;
            if (lockReleaseAddress) {
              lockedVotesToken = {
                ...tokenData,
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
              votesToken,
              erc721Tokens: undefined,
              linearVotingErc20Address,
              linearVotingErc20WithHatsWhitelistingAddress,
              linearVotingErc721Address,
              linearVotingErc721WithHatsWhitelistingAddress,
              isLoaded: true,
              strategies,
              votingStrategy,
              isAzorius: true,
              lockedVotesToken,
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
              abi: legacy.abis.LinearERC721Voting,
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
      if (wrongNetwork) {
        return { balance: 0n, delegatee: zeroAddress };
      }

      const [balance, delegatee] = await publicClient.multicall({
        contracts: [
          {
            abi: legacy.abis.VotesERC20,
            address: votingTokenAddress,
            functionName: 'balanceOf',
            args: [account],
          },
          {
            abi: legacy.abis.VotesERC20,
            address: votingTokenAddress,
            functionName: 'delegates',
            args: [account],
          },
        ],
        allowFailure: false,
      });

      return { balance, delegatee };
    },
    [publicClient, wrongNetwork],
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
      events: GetContractEventsReturnType<typeof legacy.abis.KeyValuePairs>;
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

  const fetchMultisigERC20Token = useCallback(
    async ({
      events,
    }: {
      events: GetContractEventsReturnType<typeof legacy.abis.KeyValuePairs>;
    }) => {
      // get most recent event where `erc20Address` was set
      const erc20AddressEvent = events
        .filter(event => event.args.key && event.args.key === 'erc20Address')
        .pop();
      const erc20AddressInEvent = erc20AddressEvent?.args.value as Address | undefined;

      if (!erc20AddressEvent || !erc20AddressInEvent) {
        return undefined;
      }

      let whitelistedAddresses: Address[] = [];
      try {
        // Gather whitelisted addresses from event Whitelisted(address indexed account, bool isWhitelisted)
        const lockedTokenContract = getContract({
          abi: abis.deployables.VotesERC20V1,
          address: erc20AddressInEvent,
          client: publicClient,
        });

        const grantEvents = (
          await lockedTokenContract.getEvents.RoleGranted(
            { role: ROLES.TRANSFER_FROM_ROLE },
            {
              fromBlock: 0n,
            },
          )
        ).map(e => ({
          args: {
            account: e.args.account,
            role: e.args.role,
            sender: e.args.sender,
            isWhitelisted: true,
          },
          blockNumber: e.blockNumber,
          logIndex: e.logIndex,
        }));
        const revokeEvents = (
          await lockedTokenContract.getEvents.RoleRevoked(
            { role: ROLES.TRANSFER_FROM_ROLE },
            {
              fromBlock: 0n,
            },
          )
        ).map(e => ({
          args: {
            account: e.args.account,
            role: e.args.role,
            sender: e.args.sender,
            isWhitelisted: false,
          },
          blockNumber: e.blockNumber,
          logIndex: e.logIndex,
        }));

        // Order events by block number and log index
        const orderedEvents = [...grantEvents, ...revokeEvents].sort((a, b) => {
          if (a.blockNumber > b.blockNumber) {
            return 1;
          } else if (a.blockNumber < b.blockNumber) {
            return -1;
          } else {
            return a.logIndex - b.logIndex;
          }
        });

        const whitelistMap: { [address: Address]: boolean } = {};
        orderedEvents.forEach(event => {
          const { account, isWhitelisted } = event.args;
          if (account !== undefined) {
            whitelistMap[account] = isWhitelisted;
          }
        });
        Object.entries(whitelistMap).forEach(([address, isWhitelisted]) => {
          if (isWhitelisted) {
            whitelistedAddresses.push(address as Address);
          }
        });
      } catch (error) {}

      try {
        const tokenContract = getContract({
          abi: abis.deployables.VotesERC20V1,
          address: erc20AddressInEvent,
          client: publicClient,
        });

        // Execute multicall
        const [nameData, symbolData, decimalsData, totalSupplyData, maxTotalSupplyData] =
          await publicClient.multicall({
            contracts: [
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
              {
                ...tokenContract,
                functionName: 'maxTotalSupply',
              },
            ],
            allowFailure: true,
          });

        const tokenData: ERC20LockedTokenData = {
          name: nameData.result || '',
          symbol: symbolData.result || '',
          decimals: decimalsData.result !== undefined ? decimalsData.result : 18,
          address: tokenContract.address,
          totalSupply: totalSupplyData.result !== undefined ? totalSupplyData.result : 0n,
          maxTotalSupply: maxTotalSupplyData.result !== undefined ? maxTotalSupplyData.result : 0n,
          whitelistedAddresses,
        };

        return tokenData;
      } catch (e) {
        logError({
          message: 'Error getting erc20Token data',
          network: publicClient.chain!.id,
          args: {
            transactionHash: erc20AddressEvent.transactionHash,
            logIndex: erc20AddressEvent.logIndex,
          },
          error: e,
        });

        return;
      }
    },
    [publicClient],
  );

  const fetchStakingDAOData = useCallback(
    async (safeAddress: Address) => {
      if (!publicClient.chain || !votesERC20StakedV1MasterCopy || !governance) {
        return;
      }

      let daoErc20Token;
      if (governance.type === GovernanceType.AZORIUS_ERC20) {
        daoErc20Token = governance.votesToken;
      } else if (governance.type === GovernanceType.MULTISIG) {
        daoErc20Token = governance.erc20Token;
      }
      if (daoErc20Token === undefined) {
        return;
      }

      const stakingAddress = getStakingContractAddress({
        safeAddress,
        stakedTokenAddress: daoErc20Token.address,
        zodiacModuleProxyFactory,
        stakingContractMastercopy: votesERC20StakedV1MasterCopy,
        chainId: publicClient.chain.id,
      });
      const stakingCode = await publicClient.getCode({
        address: stakingAddress,
      });
      const stakingExists = !!stakingCode && stakingCode !== '0x';

      if (stakingExists) {
        try {
          const tokenContract = getContract({
            abi: abis.deployables.VotesERC20StakedV1,
            address: stakingAddress,
            client: publicClient,
          });

          // Execute multicall
          const [name, symbol, decimals, totalSupply, minimumStakingPeriod, rewardsTokens] =
            await publicClient.multicall({
              contracts: [
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
                {
                  ...tokenContract,
                  functionName: 'minimumStakingPeriod',
                },
                {
                  ...tokenContract,
                  functionName: 'rewardsTokens',
                },
              ],
              allowFailure: false,
            });

          const { data: tokenBalances } = await getTokenBalances(stakingAddress);

          return {
            address: stakingAddress,
            name,
            symbol,
            decimals,
            totalSupply,
            minimumStakingPeriod,
            rewardsTokens: [...rewardsTokens],
            assetsFungible: tokenBalances || [],
          };
        } catch (e) {
          logError({
            message: 'Error getting staking data',
            network: publicClient.chain!.id,
          });
        }
      } else {
        return undefined;
      }
    },
    [
      getTokenBalances,
      governance,
      publicClient,
      votesERC20StakedV1MasterCopy,
      zodiacModuleProxyFactory,
    ],
  );

  return {
    fetchDAOGovernance,
    fetchDAOProposalTemplates,
    fetchVotingTokenAccountData,
    fetchLockReleaseAccountData,
    fetchDAOSnapshotProposals,
    fetchGaslessVotingDAOData,
    fetchMultisigERC20Token,
    fetchStakingDAOData,
  };
}
