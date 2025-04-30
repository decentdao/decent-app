import { abis } from '@fractal-framework/fractal-contracts';
import { TokenInfoResponse } from '@safe-global/api-kit';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Address,
  getAddress,
  getContract,
  GetContractReturnType,
  PublicClient,
  zeroAddress,
} from 'viem';
import { useAccount } from 'wagmi';
import GnosisSafeL2Abi from '../assets/abi/GnosisSafeL2';
import useFeatureFlag from '../helpers/environmentFeatureFlags';
import { isWithinFreezePeriod, isWithinFreezeProposalPeriod } from '../helpers/freezePeriodHelpers';
import { useDecentModules } from '../hooks/DAO/loaders/useDecentModules';
import useUserERC721VotingTokens from '../hooks/DAO/proposal/useUserERC721VotingTokens';
import useNetworkPublicClient from '../hooks/useNetworkPublicClient';
import { CacheExpiry, CacheKeys } from '../hooks/utils/cache/cacheDefaults';
import { setValue } from '../hooks/utils/cache/useLocalStorage';
import { useAddressContractType } from '../hooks/utils/useAddressContractType';
import useBalancesAPI from '../providers/App/hooks/useBalancesAPI';
import { useSafeAPI } from '../providers/App/hooks/useSafeAPI';
import { useNetworkConfigStore } from '../providers/NetworkConfig/useNetworkConfigStore';
import {
  AzoriusProposal,
  DAOKey,
  DecentModule,
  FractalGovernance,
  FractalGovernanceContracts,
  FractalModuleType,
  FractalProposal,
  FreezeGuardType,
  FreezeVotingType,
  GovernanceType,
  TokenEventType,
  TransferDisplayData,
  TransferType,
  TransferWithTokenInfo,
} from '../types';
import { formatCoin } from '../utils';
import { blocksToSeconds, getTimeStamp } from '../utils/contract';
import { useGovernanceFetcher } from './fetchers/governance';
import { useNodeFetcher } from './fetchers/node';
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
    getGovernance,
    setGovernanceAccountData,
    setGovernanceLockReleaseAccountData,
  } = useGlobalStore();
  const { chain, getConfigByChainId, nativeTokenIcon } = useNetworkConfigStore();
  const storeFeatureEnabled = useFeatureFlag('flag_store_v2');
  const { getAddressContractType } = useAddressContractType();
  const publicClient = useNetworkPublicClient();
  const { address: account } = useAccount();
  const { getUserERC721VotingTokens } = useUserERC721VotingTokens(null, null, false);

  const { fetchDAONode } = useNodeFetcher();
  const {
    fetchDAOGovernance,
    fetchDAOProposalTemplates,
    fetchVotingTokenAccountData,
    fetchLockReleaseAccountData,
  } = useGovernanceFetcher();

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
    async function loadDAOData() {
      if (!daoKey || !safeAddress || invalidQuery || wrongNetwork || !storeFeatureEnabled) return;
      const { safe, daoInfo, modules } = await fetchDAONode({
        safeAddress,
        chainId: chain.id,
      });

      setDaoNode(daoKey, {
        safe,
        daoInfo,
        modules,
      });

      if (daoInfo.proposalTemplatesHash) {
        const proposalTemplates = await fetchDAOProposalTemplates({
          proposalTemplatesHash: daoInfo.proposalTemplatesHash,
        });
        if (proposalTemplates) {
          setProposalTemplates(daoKey, proposalTemplates);
        }
      }

      fetchDAOGuard({
        guardAddress: getAddress(safe.guard),
        _daoKey: daoKey,
        _azoriusModule: modules.find(module => module.moduleType === FractalModuleType.AZORIUS),
        _parentSafeAddress: parentAddress,
      });

      const onLoadingFirstProposalStateChanged = (loading: boolean) =>
        setLoadingFirstProposal(daoKey, loading);
      const onMultisigGovernanceLoaded = () => setMultisigGovernance(daoKey);
      const onAzoriusGovernanceLoaded = (
        governance: FractalGovernance & FractalGovernanceContracts,
      ) => setAzoriusGovernance(daoKey, governance);
      const onProposalsLoaded = (proposals: FractalProposal[]) => setProposals(daoKey, proposals);
      const onProposalLoaded = (proposal: AzoriusProposal) => setProposal(daoKey, proposal);
      const onTokenClaimContractAddressLoaded = (tokenClaimContractAddress: Address) =>
        setTokenClaimContractAddress(daoKey, tokenClaimContractAddress);

      fetchDAOGovernance({
        daoAddress: safeAddress,
        daoModules: modules,
        onLoadingFirstProposalStateChanged,
        onMultisigGovernanceLoaded,
        onAzoriusGovernanceLoaded,
        onProposalsLoaded,
        onProposalLoaded,
        onTokenClaimContractAddressLoaded,
      });
    }

    loadDAOData();
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
    fetchDAONode,
    setProposalTemplates,
    setMultisigGovernance,
    setAzoriusGovernance,
    setProposals,
    setProposal,
    setTokenClaimContractAddress,
    setLoadingFirstProposal,
  ]);

  useEffect(() => {
    async function fetchAccountData() {
      if (
        !daoKey ||
        !safeAddress ||
        invalidQuery ||
        wrongNetwork ||
        !storeFeatureEnabled ||
        !account
      )
        return;

      const governance = getGovernance(daoKey);
      if (governance.type === GovernanceType.AZORIUS_ERC20) {
        if (governance.votesTokenAddress) {
          const { balance, delegatee } = await fetchVotingTokenAccountData(
            governance.votesTokenAddress,
            account,
          );
          setGovernanceAccountData(daoKey, {
            balance,
            delegatee,
          });
        }

        if (governance.lockReleaseAddress) {
          const { balance, delegatee } = await fetchLockReleaseAccountData(
            governance.lockReleaseAddress,
            account,
          );
          setGovernanceLockReleaseAccountData(daoKey, {
            balance,
            delegatee,
          });
        }
      }
    }

    fetchAccountData();
  }, [
    daoKey,
    safeAddress,
    invalidQuery,
    wrongNetwork,
    storeFeatureEnabled,
    account,
    getGovernance,
    fetchVotingTokenAccountData,
    fetchLockReleaseAccountData,
    setGovernanceAccountData,
    setGovernanceLockReleaseAccountData,
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
