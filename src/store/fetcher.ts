import { abis } from '@fractal-framework/fractal-contracts';
import { TokenInfoResponse } from '@safe-global/api-kit';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Address,
  erc721Abi,
  formatUnits,
  getAddress,
  getContract,
  GetContractReturnType,
  isAddress,
  PublicClient,
  zeroAddress,
} from 'viem';
import { useAccount } from 'wagmi';
import GnosisSafeL2Abi from '../assets/abi/GnosisSafeL2';
import LockReleaseAbi from '../assets/abi/LockRelease';
import { SENTINEL_ADDRESS } from '../constants/common';
import { createDecentSubgraphClient } from '../graphql';
import { DAOQuery, DAOQueryResponse } from '../graphql/DAOQueries';
import useFeatureFlag from '../helpers/environmentFeatureFlags';
import { logError } from '../helpers/errorLogging';
import { isWithinFreezePeriod, isWithinFreezeProposalPeriod } from '../helpers/freezePeriodHelpers';
import { useDecentModules } from '../hooks/DAO/loaders/useDecentModules';
import useUserERC721VotingTokens from '../hooks/DAO/proposal/useUserERC721VotingTokens';
import useNetworkPublicClient from '../hooks/useNetworkPublicClient';
import { CacheExpiry, CacheKeys } from '../hooks/utils/cache/cacheDefaults';
import { getValue, setValue } from '../hooks/utils/cache/useLocalStorage';
import {
  ContractTypeWithVersion,
  useAddressContractType,
} from '../hooks/utils/useAddressContractType';
import { useSafeDecoder } from '../hooks/utils/useSafeDecoder';
import { useSafeTransactions } from '../hooks/utils/useSafeTransactions';
import { useTimeHelpers } from '../hooks/utils/useTimeHelpers';
import useBalancesAPI from '../providers/App/hooks/useBalancesAPI';
import useIPFSClient from '../providers/App/hooks/useIPFSClient';
import { useSafeAPI } from '../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../providers/NetworkConfig/useNetworkConfigStore';
import {
  AzoriusProposal,
  CreateProposalMetadata,
  DAOKey,
  DAOSubgraph,
  DecentModule,
  ERC721TokenData,
  FractalModuleType,
  FractalProposalState,
  FractalTokenType,
  FractalVotingStrategy,
  FreezeGuardType,
  FreezeVotingType,
  GovernanceType,
  ProposalTemplate,
  TokenEventType,
  TransferDisplayData,
  TransferType,
  TransferWithTokenInfo,
  VotesTokenData,
  VotingStrategyType,
} from '../types';
import {
  decodeTransactions,
  formatCoin,
  getAzoriusModuleFromModules,
  mapProposalCreatedEventToProposal,
} from '../utils';
import { blocksToSeconds, getTimeStamp } from '../utils/contract';
import { useGlobalStore } from './store';

function getTransferEventType(transferFrom: string, safeAddress: Address | undefined) {
  if (transferFrom === zeroAddress) {
    return TokenEventType.MINT;
  }
  if (transferFrom === safeAddress) {
    return TokenEventType.WITHDRAW;
  } else {
    return TokenEventType.DEPOSIT;
  }
}

// TODO: This will be split into multiple fetchers and invoking those fetchers, much like SafeController does
export const useGlobalStoreFetcher = ({
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
  const safeApi = useSafeAPI();
  const { getTokenBalances, getNFTBalances, getDeFiBalances } = useBalancesAPI();
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
    setProposal,
    setLoadingFirstProposal,
    setGuard,
    setAllProposalsLoaded,
  } = useGlobalStore();
  const { t } = useTranslation(['dashboard']);
  const { chain, getConfigByChainId, nativeTokenIcon } = useNetworkConfigStore();
  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');
  const { getAddressContractType } = useAddressContractType();
  const publicClient = useNetworkPublicClient();
  const ipfsClient = useIPFSClient();
  const { address: account } = useAccount();
  const { getTimeDuration } = useTimeHelpers();
  const { parseTransactions } = useSafeTransactions();
  const { getUserERC721VotingTokens } = useUserERC721VotingTokens(null, null, false);
  const decode = useSafeDecoder();

  const formatTransfer = useCallback(
    ({ transfer, isLast }: { transfer: TransferWithTokenInfo; isLast: boolean }) => {
      const symbol = transfer.tokenInfo.symbol;
      const decimals = transfer.tokenInfo.decimals;

      const formattedTransfer: TransferDisplayData = {
        eventType: getTransferEventType(transfer.from, safeAddress),
        transferType: transfer.type as TransferType,
        executionDate: transfer.executionDate,
        image: transfer.tokenInfo.logoUri ?? '/images/coin-icon-default.svg',
        assetDisplay:
          transfer.type === TransferType.ERC721_TRANSFER
            ? `${transfer.tokenInfo.name} #${transfer.tokenId}`
            : formatCoin(transfer.value, true, decimals, symbol),
        fullCoinTotal:
          transfer.type === TransferType.ERC721_TRANSFER
            ? undefined
            : formatCoin(transfer.value, false, decimals, symbol),
        transferAddress: safeAddress === transfer.from ? transfer.to : transfer.from,
        transactionHash: transfer.transactionHash,
        tokenId: transfer.tokenId,
        tokenInfo: transfer.tokenInfo,
        isLast,
      };
      return formattedTransfer;
    },
    [safeAddress],
  );

  const fetchDAOProposalTemplates = useCallback(
    async ({
      _daoKey,
      proposalTemplatesHash,
    }: {
      _daoKey: DAOKey;
      proposalTemplatesHash: string;
    }) => {
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

        setProposalTemplates(_daoKey, mappedProposalTemplates);
      }
    },
    [ipfsClient, setProposalTemplates],
  );

  useEffect(() => {}, []);

  const fetchDAOGovernance = useCallback(
    async ({
      daoAddress,
      _daoKey,
      daoModules,
    }: {
      daoAddress: Address;
      _daoKey: DAOKey;
      daoModules: DecentModule[];
    }) => {
      const azoriusModule = getAzoriusModuleFromModules(daoModules);

      if (!azoriusModule) {
        setMultisigGovernance(_daoKey);
        const multisigTransactions = await safeApi.getMultisigTransactions(daoAddress);
        const activities = await parseTransactions(multisigTransactions);
        setLoadingFirstProposal(_daoKey, false);
        setProposals(_daoKey, activities);
        setAllProposalsLoaded(_daoKey, true);
      } else {
        const azoriusContract = getContract({
          abi: abis.Azorius,
          address: azoriusModule.moduleAddress,
          client: publicClient,
        });
        const [strateiges, nextStrategy] = await azoriusContract.read.getStrategies([
          SENTINEL_ADDRESS,
          3n,
        ]);
        const votingStrategies = await Promise.all(
          [...strateiges, nextStrategy]
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

            if (account) {
              // TODO: Changing account will trigger whole damn thing to refetch - need to extract this
              const [tokenBalance, tokenDelegatee] = await Promise.all([
                tokenContract.read.balanceOf([account]),
                tokenContract.read.delegates([account]),
              ]);

              tokenData.balance = tokenBalance;
              tokenData.delegatee = tokenDelegatee;

              if (lockReleaseAddress) {
                const lockReleaseContract = getContract({
                  abi: LockReleaseAbi,
                  address: lockReleaseAddress,
                  client: publicClient,
                });

                const [tokenAmountTotal, tokenAmountReleased, lockReleaseDelegatee] =
                  await Promise.all([
                    lockReleaseContract.read.getTotal([account]),
                    lockReleaseContract.read.getReleased([account]),
                    lockReleaseContract.read.delegates([account]),
                  ]);

                lockedVotesTokenData = {
                  balance: tokenAmountTotal - tokenAmountReleased,
                  delegatee: lockReleaseDelegatee,
                  name,
                  symbol,
                  decimals,
                  totalSupply,
                  address: lockReleaseAddress,
                };
              }
            }

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

            setAzoriusGovernance(_daoKey, {
              votesToken: tokenData,
              erc721Tokens: undefined,
              linearVotingErc20Address,
              linearVotingErc20WithHatsWhitelistingAddress,
              linearVotingErc721Address,
              linearVotingErc721WithHatsWhitelistingAddress,
              isLoaded: true,
              strategies,
              votingStrategy: votingData,
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
                setTokenClaimContractAddress(_daoKey, firstApproval.args.spender);
              }
            }

            // Now - fetch proposals

            setLoadingFirstProposal(_daoKey, true);

            const erc20VotedEvents = await erc20VotingContract.getEvents.Voted({ fromBlock: 0n });
            const executedEvents = await azoriusContract.getEvents.ProposalExecuted({
              fromBlock: 0n,
            });
            const proposalCreatedEvents = (
              await azoriusContract.getEvents.ProposalCreated({ fromBlock: 0n })
            ).reverse();

            const completeOneProposalLoadProcess = (proposal: AzoriusProposal, index: number) => {
              setProposal(_daoKey, proposal);
              setLoadingFirstProposal(_daoKey, false);

              if (index === proposalCreatedEvents.length - 1) {
                setAllProposalsLoaded(_daoKey, true);
              }
            };

            if (!proposalCreatedEvents.length) {
              setLoadingFirstProposal(_daoKey, false);
              setAllProposalsLoaded(_daoKey, true);
              return;
            }

            for (const [index, proposalCreatedEvent] of proposalCreatedEvents.entries()) {
              if (proposalCreatedEvent.args.proposalId === undefined) {
                continue;
              }

              const cachedProposal = getValue({
                cacheName: CacheKeys.PROPOSAL_CACHE,
                proposalId: proposalCreatedEvent.args.proposalId.toString(),
                contractAddress: azoriusContract.address,
              });

              if (cachedProposal) {
                completeOneProposalLoadProcess(cachedProposal, index);
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

              completeOneProposalLoadProcess(proposal, index);

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

            setAzoriusGovernance(_daoKey, {
              votesToken: undefined,
              erc721Tokens,
              linearVotingErc20Address,
              linearVotingErc20WithHatsWhitelistingAddress,
              linearVotingErc721Address,
              linearVotingErc721WithHatsWhitelistingAddress,
              isLoaded: true,
              strategies,
              votingStrategy: votingData,
              isAzorius: true,
              type: GovernanceType.AZORIUS_ERC721,
            });

            // Now - fetch proposals

            setLoadingFirstProposal(_daoKey, true);

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
              setLoadingFirstProposal(_daoKey, false);
              setAllProposalsLoaded(_daoKey, true);
              return;
            }

            const completeOneProposalLoadProcess = (proposal: AzoriusProposal, index: number) => {
              setProposal(_daoKey, proposal);
              setLoadingFirstProposal(_daoKey, false);

              if (index === proposalCreatedEvents.length - 1) {
                setAllProposalsLoaded(_daoKey, true);
              }
            };

            for (const [index, proposalCreatedEvent] of proposalCreatedEvents.entries()) {
              if (proposalCreatedEvent.args.proposalId === undefined) {
                continue;
              }

              const cachedProposal = getValue({
                cacheName: CacheKeys.PROPOSAL_CACHE,
                proposalId: proposalCreatedEvent.args.proposalId.toString(),
                contractAddress: azoriusContract.address,
              });

              if (cachedProposal) {
                completeOneProposalLoadProcess(cachedProposal, index);
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

              completeOneProposalLoadProcess(proposal, index);

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
      account,
      getTimeDuration,
      setMultisigGovernance,
      setAzoriusGovernance,
      setTokenClaimContractAddress,
      parseTransactions,
      safeApi,
      setProposals,
      setProposal,
      t,
      setLoadingFirstProposal,
      setAllProposalsLoaded,
      decode,
    ],
  );

  const fetchDAOGuard = useCallback(
    async ({
      guardAddress,
      _daoKey,
      _azoriusModule,
      _parentSafeAddress,
    }: {
      guardAddress: Address;
      _daoKey: DAOKey;
      _azoriusModule?: DecentModule;
      _parentSafeAddress: Address | null;
    }) => {
      // TODO: Decompose reusable logic into a function
      // Changing account will trigger this function to run again - we only want refetching stuff that is related to account
      if (_azoriusModule) {
        const azoriusContract = getContract({
          abi: abis.Azorius,
          address: _azoriusModule.moduleAddress,
          client: publicClient,
        });

        const azoriusGuardAddress = await azoriusContract.read.getGuard();
        const { isFreezeGuardAzorius } = await getAddressContractType(azoriusGuardAddress);

        if (azoriusGuardAddress === zeroAddress || !isFreezeGuardAzorius) {
          return;
        }

        const freezeGuardContract = getContract({
          abi: abis.AzoriusFreezeGuard,
          address: azoriusGuardAddress,
          client: publicClient,
        });

        const freezeVotingAddress = await freezeGuardContract.read.freezeVoting();
        const freezeVotingPossibilities = await getAddressContractType(freezeVotingAddress);

        let freezeVotingType;
        if (freezeVotingPossibilities.isFreezeVotingMultisig) {
          freezeVotingType = FreezeVotingType.MULTISIG;
        } else if (freezeVotingPossibilities.isFreezeVotingErc721) {
          freezeVotingType = FreezeVotingType.ERC721;
        } else if (freezeVotingPossibilities.isFreezeVotingErc20) {
          freezeVotingType = FreezeVotingType.ERC20;
        } else {
          throw new Error('Invalid freeze voting type');
        }

        let freezeVotingContract:
          | GetContractReturnType<typeof abis.MultisigFreezeVoting, PublicClient>
          | GetContractReturnType<typeof abis.ERC20FreezeVoting, PublicClient>
          | GetContractReturnType<typeof abis.ERC721FreezeVoting, PublicClient>;

        if (freezeVotingType === FreezeVotingType.ERC20) {
          freezeVotingContract = getContract({
            abi: abis.ERC20FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else if (freezeVotingType === FreezeVotingType.ERC721) {
          freezeVotingContract = getContract({
            abi: abis.ERC721FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else if (freezeVotingType === FreezeVotingType.MULTISIG) {
          freezeVotingContract = getContract({
            abi: abis.MultisigFreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else {
          throw new Error('unknown freezeVotingType');
        }

        let userHasVotes: boolean = false;

        const [
          freezeCreatedBlock,
          freezeVotesThreshold,
          freezeProposalCreatedBlock,
          freezeProposalVoteCount,
          freezeProposalBlock,
          freezePeriodBlock,
          isFrozen,
        ] = await Promise.all([
          freezeVotingContract.read.freezeProposalCreatedBlock(),
          freezeVotingContract.read.freezeVotesThreshold(),
          freezeVotingContract.read.freezeProposalCreatedBlock(),
          freezeVotingContract.read.freezeProposalVoteCount(),
          freezeVotingContract.read.freezeProposalPeriod(),
          freezeVotingContract.read.freezePeriod(),
          freezeVotingContract.read.isFrozen(),
        ]);

        // timestamp when proposal was created
        const freezeProposalCreatedTime = await getTimeStamp(
          freezeProposalCreatedBlock,
          publicClient,
        );

        // length of time to vote on freeze
        const freezeProposalPeriod = await blocksToSeconds(freezeProposalBlock, publicClient);

        // length of time frozen for in seconds
        const freezePeriod = await blocksToSeconds(freezePeriodBlock, publicClient);

        const userHasFreezeVoted = await freezeVotingContract.read.userHasFreezeVoted([
          account || zeroAddress,
          BigInt(freezeCreatedBlock),
        ]);

        const freezeGuard = {
          freezeVotesThreshold,
          freezeProposalCreatedTime: BigInt(freezeProposalCreatedTime),
          freezeProposalVoteCount,
          freezeProposalPeriod: BigInt(freezeProposalPeriod),
          freezePeriod: BigInt(freezePeriod),
          userHasFreezeVoted,
          isFrozen,
        };

        if (freezeVotingType === FreezeVotingType.MULTISIG) {
          const safeFreezeVotingContract = getContract({
            abi: abis.MultisigFreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });

          // TODO: We can attempt reading from Zustand store here and fallback to reading on-chain.
          const safeContract = getContract({
            abi: GnosisSafeL2Abi,
            address: await safeFreezeVotingContract.read.parentGnosisSafe(),
            client: publicClient,
          });
          const owners = await safeContract.read.getOwners();
          userHasVotes = owners.find(owner => owner === account) !== undefined;
        } else if (freezeVotingType === FreezeVotingType.ERC20) {
          const freezeERC20VotingContract = getContract({
            abi: abis.ERC20FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
          const votesERC20Address = await freezeERC20VotingContract.read.votesERC20();
          const { isVotesErc20 } = await getAddressContractType(votesERC20Address);
          if (!isVotesErc20) {
            throw new Error('votesERC20Address is not a valid VotesERC20 contract');
          }
          const votesTokenContract = getContract({
            abi: abis.VotesERC20,
            address: votesERC20Address,
            client: publicClient,
          });
          const currentTimestamp = await getTimeStamp('latest', publicClient);
          const isFreezeActive =
            isWithinFreezeProposalPeriod(
              freezeGuard.freezeProposalCreatedTime,
              freezeGuard.freezeProposalPeriod,
              BigInt(currentTimestamp),
            ) ||
            isWithinFreezePeriod(
              freezeGuard.freezeProposalCreatedTime,
              freezeGuard.freezePeriod,
              BigInt(currentTimestamp),
            );
          userHasVotes =
            (!isFreezeActive
              ? // freeze not active
                await votesTokenContract.read.getVotes([account || zeroAddress])
              : // freeze is active
                await votesTokenContract.read.getPastVotes([
                  account || zeroAddress,
                  BigInt(freezeCreatedBlock),
                ])) > 0n;
        } else if (freezeVotingType === FreezeVotingType.ERC721) {
          const { totalVotingTokenAddresses } = await getUserERC721VotingTokens(
            _parentSafeAddress,
            null,
          );
          userHasVotes = totalVotingTokenAddresses.length > 0;
        }

        setGuard(_daoKey, {
          freezeGuardContractAddress: azoriusGuardAddress,
          freezeVotingContractAddress: freezeVotingAddress,
          freezeVotingType,
          freezeGuardType: FreezeGuardType.AZORIUS,
          userHasVotes,
          ...freezeGuard,
        });
      } else if (guardAddress) {
        const multisigFreezeGuardContract = getContract({
          abi: abis.MultisigFreezeGuard,
          address: guardAddress,
          client: publicClient,
        });

        const freezeVotingAddress = await multisigFreezeGuardContract.read.freezeVoting();
        const freezeVotingMasterCopyData = await getAddressContractType(freezeVotingAddress);
        const freezeVotingType = freezeVotingMasterCopyData.isFreezeVotingMultisig
          ? FreezeVotingType.MULTISIG
          : freezeVotingMasterCopyData.isFreezeVotingErc721
            ? FreezeVotingType.ERC721
            : FreezeVotingType.ERC20;

        let freezeVotingContract:
          | GetContractReturnType<typeof abis.MultisigFreezeVoting, PublicClient>
          | GetContractReturnType<typeof abis.ERC20FreezeVoting, PublicClient>
          | GetContractReturnType<typeof abis.ERC721FreezeVoting, PublicClient>;

        if (freezeVotingType === FreezeVotingType.ERC20) {
          freezeVotingContract = getContract({
            abi: abis.ERC20FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else if (freezeVotingType === FreezeVotingType.ERC721) {
          freezeVotingContract = getContract({
            abi: abis.ERC721FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else if (freezeVotingType === FreezeVotingType.MULTISIG) {
          freezeVotingContract = getContract({
            abi: abis.MultisigFreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
        } else {
          throw new Error('unknown freezeVotingType');
        }

        let userHasVotes: boolean = false;

        const [
          freezeCreatedBlock,
          freezeVotesThreshold,
          freezeProposalCreatedBlock,
          freezeProposalVoteCount,
          freezeProposalBlock,
          freezePeriodBlock,
          isFrozen,
        ] = await Promise.all([
          freezeVotingContract.read.freezeProposalCreatedBlock(),
          freezeVotingContract.read.freezeVotesThreshold(),
          freezeVotingContract.read.freezeProposalCreatedBlock(),
          freezeVotingContract.read.freezeProposalVoteCount(),
          freezeVotingContract.read.freezeProposalPeriod(),
          freezeVotingContract.read.freezePeriod(),
          freezeVotingContract.read.isFrozen(),
        ]);

        // timestamp when proposal was created
        const freezeProposalCreatedTime = await getTimeStamp(
          freezeProposalCreatedBlock,
          publicClient,
        );

        // length of time to vote on freeze
        const freezeProposalPeriod = await blocksToSeconds(freezeProposalBlock, publicClient);

        // length of time frozen for in seconds
        const freezePeriod = await blocksToSeconds(freezePeriodBlock, publicClient);

        const userHasFreezeVoted = await freezeVotingContract.read.userHasFreezeVoted([
          account || zeroAddress,
          BigInt(freezeCreatedBlock),
        ]);

        const freezeGuard = {
          freezeVotesThreshold,
          freezeProposalCreatedTime: BigInt(freezeProposalCreatedTime),
          freezeProposalVoteCount,
          freezeProposalPeriod: BigInt(freezeProposalPeriod),
          freezePeriod: BigInt(freezePeriod),
          userHasFreezeVoted,
          isFrozen,
        };

        if (freezeVotingType === FreezeVotingType.MULTISIG) {
          const safeFreezeVotingContract = getContract({
            abi: abis.MultisigFreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });

          // TODO: We can attempt reading from Zustand store here and fallback to reading on-chain.
          const safeContract = getContract({
            abi: GnosisSafeL2Abi,
            address: await safeFreezeVotingContract.read.parentGnosisSafe(),
            client: publicClient,
          });
          const owners = await safeContract.read.getOwners();
          userHasVotes = owners.find(owner => owner === account) !== undefined;
        } else if (freezeVotingType === FreezeVotingType.ERC20) {
          const freezeERC20VotingContract = getContract({
            abi: abis.ERC20FreezeVoting,
            address: freezeVotingAddress,
            client: publicClient,
          });
          const votesERC20Address = await freezeERC20VotingContract.read.votesERC20();
          const { isVotesErc20 } = await getAddressContractType(votesERC20Address);
          if (!isVotesErc20) {
            throw new Error('votesERC20Address is not a valid VotesERC20 contract');
          }
          const votesTokenContract = getContract({
            abi: abis.VotesERC20,
            address: votesERC20Address,
            client: publicClient,
          });
          const currentTimestamp = await getTimeStamp('latest', publicClient);
          const isFreezeActive =
            isWithinFreezeProposalPeriod(
              freezeGuard.freezeProposalCreatedTime,
              freezeGuard.freezeProposalPeriod,
              BigInt(currentTimestamp),
            ) ||
            isWithinFreezePeriod(
              freezeGuard.freezeProposalCreatedTime,
              freezeGuard.freezePeriod,
              BigInt(currentTimestamp),
            );
          userHasVotes =
            (!isFreezeActive
              ? // freeze not active
                await votesTokenContract.read.getVotes([account || zeroAddress])
              : // freeze is active
                await votesTokenContract.read.getPastVotes([
                  account || zeroAddress,
                  BigInt(freezeCreatedBlock),
                ])) > 0n;
        } else if (freezeVotingType === FreezeVotingType.ERC721) {
          const { totalVotingTokenAddresses } = await getUserERC721VotingTokens(
            _parentSafeAddress,
            null,
          );
          userHasVotes = totalVotingTokenAddresses.length > 0;
        }

        setGuard(_daoKey, {
          freezeGuardContractAddress: guardAddress,
          freezeVotingContractAddress: freezeVotingAddress,
          freezeVotingType,
          freezeGuardType: FreezeGuardType.MULTISIG,
          userHasVotes,
          ...freezeGuard,
        });
      }
    },
    [setGuard, publicClient, getAddressContractType, account, getUserERC721VotingTokens],
  );

  useEffect(() => {
    async function fetchDaoNode() {
      if (!daoKey || !safeAddress || invalidQuery || wrongNetwork || !storeFeatureEnabled) return;

      const safe = await safeApi.getSafeData(safeAddress);
      const modules = await lookupModules(safe.modules);

      const client = createDecentSubgraphClient(getConfigByChainId(chain.id));
      const graphRawNodeData = await client.query<DAOQueryResponse>(DAOQuery, { safeAddress });

      if (graphRawNodeData.error) {
        console.error('Failed to fetch DAO data', graphRawNodeData.error);
      }

      const graphDAOData = graphRawNodeData.data?.daos[0];

      if (!graphDAOData) {
        console.warn('No graph data found');
      }

      const parentAddress =
        graphDAOData?.parentAddress && isAddress(graphDAOData.parentAddress)
          ? getAddress(graphDAOData.parentAddress)
          : null;

      const daoInfo: DAOSubgraph = {
        parentAddress,
        childAddresses:
          graphDAOData?.hierarchy?.map((child: { address: string }) => getAddress(child.address)) ??
          [],
        daoName: graphDAOData?.name ?? null,
        daoSnapshotENS: graphDAOData?.snapshotENS ?? null,
        proposalTemplatesHash: graphDAOData?.proposalTemplatesHash ?? null,
      };

      setDaoNode(daoKey, {
        safe,
        daoInfo,
        modules,
      });

      if (daoInfo.proposalTemplatesHash) {
        fetchDAOProposalTemplates({
          _daoKey: daoKey,
          proposalTemplatesHash: daoInfo.proposalTemplatesHash,
        });
      }

      fetchDAOGuard({
        guardAddress: getAddress(safe.guard),
        _daoKey: daoKey,
        _azoriusModule: modules.find(module => module.moduleType === FractalModuleType.AZORIUS),
        _parentSafeAddress: parentAddress,
      });

      fetchDAOGovernance({ daoAddress: safeAddress, _daoKey: daoKey, daoModules: modules });
    }

    fetchDaoNode();
  }, [
    safeAddress,
    daoKey,
    safeApi,
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
  ]);

  useEffect(() => {
    async function fetchDaoTreasury() {
      if (
        !daoKey ||
        !safeAddress ||
        invalidQuery ||
        wrongNetwork ||
        !storeFeatureEnabled ||
        !safeApi
      )
        return;

      const [
        transfers,
        { data: tokenBalances, error: tokenBalancesError },
        { data: nftBalances, error: nftBalancesError },
        { data: defiBalances, error: defiBalancesError },
      ] = await Promise.all([
        safeApi.getTransfers(safeAddress),
        getTokenBalances(safeAddress),
        getNFTBalances(safeAddress),
        getDeFiBalances(safeAddress),
      ]);

      if (tokenBalancesError) {
        toast.warning(tokenBalancesError, { duration: 2000 });
      }
      if (nftBalancesError) {
        toast.warning(nftBalancesError, { duration: 2000 });
      }
      if (defiBalancesError) {
        toast.warning(defiBalancesError, { duration: 2000 });
      }
      const assetsFungible = tokenBalances || [];
      const assetsNonFungible = nftBalances || [];
      const assetsDeFi = defiBalances || [];

      const totalAssetsFungibleUsd = assetsFungible.reduce(
        (prev, curr) => prev + (curr.usdValue || 0),
        0,
      );
      const totalAssetsDeFiUsd = assetsDeFi.reduce(
        (prev, curr) => prev + (curr.position?.balanceUsd || 0),
        0,
      );

      const totalUsdValue = totalAssetsFungibleUsd + totalAssetsDeFiUsd;

      const treasuryData = {
        assetsFungible,
        assetsDeFi,
        assetsNonFungible,
        totalUsdValue,
        transfers: null, // transfers not yet loaded. these are setup below
      };

      setTreasury(daoKey, treasuryData);

      if (transfers.length === 0) {
        setTransfers(daoKey, []);
        return;
      }

      const tokenAddressesOfTransfers = transfers
        // map down to just the addresses, with a type of `string | undefined`
        .map(transfer => transfer.tokenAddress)
        // no undefined or null addresses
        .filter(address => address !== undefined && address !== null)
        // make unique
        .filter((value, index, self) => self.indexOf(value) === index)
        // turn them into Address type
        .map(address => getAddress(address));

      const transfersTokenInfo = await Promise.all(
        tokenAddressesOfTransfers.map(async address => {
          const fallbackTokenBalance = tokenBalances?.find(
            tokenBalanceData => getAddress(tokenBalanceData.tokenAddress) === address,
          );

          if (fallbackTokenBalance) {
            const fallbackTokenInfo = {
              address,
              name: fallbackTokenBalance.name,
              symbol: fallbackTokenBalance.symbol,
              decimals: fallbackTokenBalance.decimals,
              logoUri: fallbackTokenBalance.logo,
            };
            setValue(
              { cacheName: CacheKeys.TOKEN_INFO, tokenAddress: address },
              fallbackTokenInfo,
              CacheExpiry.NEVER,
            );
            return fallbackTokenInfo;
          }

          const tokenInfo = await safeApi.getToken(address);
          setValue(
            { cacheName: CacheKeys.TOKEN_INFO, tokenAddress: address },
            tokenInfo,
            CacheExpiry.NEVER,
          );
          return tokenInfo;
        }),
      );

      transfers
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .forEach(async (transfer, index, _transfers) => {
          // @note assume native token if no token address
          let tokenInfo: TokenInfoResponse = {
            address: '',
            name: chain.nativeCurrency.name,
            symbol: chain.nativeCurrency.symbol,
            decimals: chain.nativeCurrency.decimals,
            logoUri: nativeTokenIcon,
          };
          const transferTokenAddress = transfer.tokenAddress;
          if (transferTokenAddress) {
            const tokenData = transfersTokenInfo.find(
              _token => _token && getAddress(_token.address) === getAddress(transferTokenAddress),
            );
            if (tokenData) {
              tokenInfo = tokenData;
            }
          }

          const formattedTransfer: TransferDisplayData = formatTransfer({
            transfer: { ...transfer, tokenInfo },
            isLast: _transfers.length - 1 === index,
          });

          setTransfer(daoKey, formattedTransfer);
        });
    }

    fetchDaoTreasury();
  }, [
    daoKey,
    safeAddress,
    invalidQuery,
    wrongNetwork,
    storeFeatureEnabled,
    safeApi,
    getTokenBalances,
    getNFTBalances,
    getDeFiBalances,
    setTreasury,
    setTransfers,
    setTransfer,
    chain.nativeCurrency.decimals,
    chain.nativeCurrency.name,
    chain.nativeCurrency.symbol,
    nativeTokenIcon,
    formatTransfer,
  ]);
};
