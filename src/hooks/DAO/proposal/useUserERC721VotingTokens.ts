import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback, useEffect, useState } from 'react';
import { Address, erc721Abi, getContract } from 'viem';
import { useAccount } from 'wagmi';
import { useFractal } from '../../../providers/App/AppProvider';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { AzoriusGovernance, ERC721TokenData } from '../../../types';
import useNetworkPublicClient from '../../useNetworkPublicClient';
import useVotingStrategiesAddresses from '../../utils/useVotingStrategiesAddresses';

const DEFAULT_RETURN = {
  totalVotingTokenAddresses: [],
  totalVotingTokenIds: [],
  remainingTokenAddresses: [],
  remainingTokenIds: [],
};

type ERC721VotingType = 'erc721' | 'erc721WithHats';

/**
 * Retrieves list of ERC-721 voting tokens for the supplied `address`(aka `user.address`) param
 * @param {string|null} [proposalId] - Proposal ID. When it's provided - calculates `remainingTokenIds` and `remainingTokenAddresses` that user can use for voting on specific proposal.
 * @param {Address|null} [safeAddress] - address of Safe{Wallet}, for which voting tokens should be retrieved. If not provided - these are used from global context.
 * @param {boolean} [loadOnMount] - whether to fetch voting tokens on component mount or not. Leaves the space to fetch those tokens via getUserERC721VotingTokens
 * @returns {string[]} `totalVotingTokenIds` - list of all ERC-721 tokens that are held by `address`.
 * @returns {string[]} `totalVotingTokenAddresses` - list of contract addresses that corresponds to token `totalVotingTokenIds` array. Aka if user holds 3 tokens of from 1 NFT contract - the address of contract will be repeated 3 times.
 * @returns {string[]} `remainingTokenIds - list of tokens that `address` can use for proposal under `proposalId` param. This covers the case when user already voted for proposal but received more tokens, that weren't used in this proposal.
 * @returns {string[]} `remainingTokenAddresses` - same as `totalVotingTokenAddresses` - repeats contract address of NFT for each token ID in `remainingTokenIds` array.
 */

export default function useUserERC721VotingTokens(
  safeAddress: Address | null,
  proposalId: string | null,
  loadOnMount: boolean = true,
) {
  const [totalVotingTokenIds, setTotalVotingTokenIds] = useState<string[]>([]);
  const [totalVotingTokenAddresses, setTotalVotingTokenAddresses] = useState<Address[]>([]);
  const [remainingTokenIds, setRemainingTokenIds] = useState<string[]>([]);
  const [remainingTokenAddresses, setRemainingTokenAddresses] = useState<Address[]>([]);

  const {
    governanceContracts: {
      linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress,
    },
    governance,
  } = useFractal();
  const user = useAccount();
  const { safe } = useDaoInfoStore();
  const publicClient = useNetworkPublicClient();

  const { getVotingStrategies } = useVotingStrategiesAddresses();

  const getLinearVotingContract = useCallback(
    (_address: Address, _voting: ERC721VotingType) => {
      return getContract({
        abi:
          _voting === 'erc721'
            ? abis.LinearERC721Voting
            : abis.LinearERC721VotingWithHatsProposalCreation,
        address: _address,
        client: publicClient,
      });
    },
    [publicClient],
  );

  // Means getting these for any safe, primary use case - calculating user voting weight for freeze voting
  const getUserVotingTokenData = useCallback(
    async (_safeAddress: Address) => {
      const votingStrategies = await getVotingStrategies(_safeAddress);
      if (votingStrategies) {
        const votingStrategy = votingStrategies.find(
          strategy =>
            strategy.isLinearVotingErc721 || strategy.isLinearVotingErc721WithHatsProposalCreation,
        );
        if (votingStrategy) {
          const linear721VotingAddress = votingStrategy.strategyAddress;
          const votingContract = votingStrategy.isLinearVotingErc721
            ? getLinearVotingContract(linear721VotingAddress, 'erc721')
            : getLinearVotingContract(linear721VotingAddress, 'erc721WithHats');

          const addresses = await votingContract.read.getAllTokenAddresses();
          const governanceTokens = await Promise.all(
            addresses.map(async tokenAddress => {
              if (!votingContract) {
                throw new Error('Voting contract is undefined');
              }

              const tokenContract = getContract({
                abi: erc721Abi,
                address: tokenAddress,
                client: publicClient,
              });

              const [votingWeight, name, symbol] = await Promise.all([
                votingContract.read.getTokenWeight([tokenAddress]),
                tokenContract.read.name(),
                tokenContract.read.symbol(),
              ]);

              return { name, symbol, address: tokenAddress, votingWeight };
            }),
          );
          return {
            votingType: votingStrategy.isLinearVotingErc721
              ? 'erc721'
              : ('erc721WithHats' as ERC721VotingType),
            governanceTokens,
            linear721VotingAddress,
          };
        }
      }
      return undefined;
    },
    [getLinearVotingContract, getVotingStrategies, publicClient],
  );

  const getUserERC721Tokens = useCallback(
    async (userAddress: Address, governanceTokens: ERC721TokenData[] | undefined) => {
      const userERC721Tokens = new Map<Address, Set<string>>();
      if (!governanceTokens || !userAddress) {
        return userERC721Tokens;
      }
      await Promise.all(
        // Using `map` instead of `forEach` to simplify usage of `Promise.all`
        // and guarantee syncronous contractFn assignment
        governanceTokens.map(async token => {
          const tokenContract = getContract({
            abi: erc721Abi,
            address: token.address,
            client: publicClient,
          });
          if ((await tokenContract.read.balanceOf([userAddress])) > 0n) {
            const tokenSentEvents = await tokenContract.getEvents.Transfer(
              { from: userAddress },
              { fromBlock: 0n },
            );
            const tokenReceivedEvents = await tokenContract.getEvents.Transfer(
              { to: userAddress },
              { fromBlock: 0n },
            );

            const allTokenTransferEvents = tokenSentEvents
              .concat(tokenReceivedEvents)
              .sort(
                (a, b) =>
                  Number(a.blockNumber - b.blockNumber) || a.transactionIndex - b.transactionIndex,
              );

            const ownedTokenIds = new Set<string>();
            allTokenTransferEvents.forEach(({ args: { to, from, tokenId } }) => {
              if (!to || !from || tokenId === undefined) {
                throw new Error('An ERC721 event has undefined data');
              }
              if (to.toLowerCase() === userAddress.toLowerCase()) {
                ownedTokenIds.add(tokenId.toString());
              } else if (from.toLowerCase() === userAddress.toLowerCase()) {
                ownedTokenIds.delete(tokenId.toString());
              }
            });
            if (ownedTokenIds.size > 0) {
              userERC721Tokens.set(token.address, ownedTokenIds);
            }
          }
        }),
      );
      return userERC721Tokens;
    },
    [publicClient],
  );

  const azoriusGovernance = governance as AzoriusGovernance;
  const { erc721Tokens } = azoriusGovernance;

  const globalContextSafeAddress = safe?.address;

  const getUserERC721VotingTokens = useCallback(
    async (_safeAddress: Address | null, _proposalId: number | null) => {
      let governanceTokens = erc721Tokens;

      // @dev global is set as defaults
      let votingType: ERC721VotingType | undefined = linearVotingErc721Address
        ? 'erc721'
        : linearVotingErc721WithHatsWhitelistingAddress
          ? 'erc721WithHats'
          : undefined;

      let linearVotingAddress =
        linearVotingErc721Address ?? linearVotingErc721WithHatsWhitelistingAddress;

      if (!globalContextSafeAddress || !user.address) {
        return DEFAULT_RETURN;
      }

      if (_safeAddress && globalContextSafeAddress !== _safeAddress) {
        const userVotingTokenData = await getUserVotingTokenData(_safeAddress);
        if (userVotingTokenData) {
          governanceTokens = userVotingTokenData.governanceTokens;
          votingType = userVotingTokenData.votingType;
          linearVotingAddress = userVotingTokenData.linear721VotingAddress;
        }
      }

      if (!governanceTokens || !votingType || !linearVotingAddress) {
        return DEFAULT_RETURN;
      }

      const userAddress = user.address;
      const userERC721Tokens = await getUserERC721Tokens(userAddress, governanceTokens);

      const votingContract =
        votingType === 'erc721'
          ? getLinearVotingContract(linearVotingAddress, 'erc721')
          : getLinearVotingContract(linearVotingAddress, 'erc721WithHats');

      const tokenDataPromises = Array.from(userERC721Tokens.entries()).flatMap(
        ([tokenAddress, tokenIdsSet]) => {
          return Array.from(tokenIdsSet).map(async tokenId => {
            let hasVoted = false;
            if (_proposalId !== null) {
              hasVoted = await votingContract.read.hasVoted([
                _proposalId,
                tokenAddress,
                BigInt(tokenId),
              ]);
            }
            return { tokenAddress, tokenId, hasVoted };
          });
        },
      );

      const tokenData = await Promise.all(tokenDataPromises);

      return {
        totalVotingTokenAddresses: tokenData.map(data => data.tokenAddress),
        totalVotingTokenIds: tokenData.map(data => data.tokenId),
        remainingTokenAddresses:
          _proposalId !== null
            ? tokenData.filter(data => !data.hasVoted).map(data => data.tokenAddress)
            : [],
        remainingTokenIds:
          _proposalId !== null
            ? tokenData.filter(data => !data.hasVoted).map(data => data.tokenId)
            : [],
      };
    },
    [
      erc721Tokens,
      linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress,
      globalContextSafeAddress,
      user.address,
      getUserERC721Tokens,
      getLinearVotingContract,
      getUserVotingTokenData,
    ],
  );

  const loadUserERC721VotingTokens = useCallback(async () => {
    const proposalIdNum = proposalId === null ? null : Number(proposalId);
    const tokensInfo = await getUserERC721VotingTokens(safeAddress, proposalIdNum);
    if (tokensInfo) {
      setTotalVotingTokenAddresses(tokensInfo.totalVotingTokenAddresses);
      setTotalVotingTokenIds(tokensInfo.totalVotingTokenIds);
      setRemainingTokenAddresses(tokensInfo.remainingTokenAddresses);
      setRemainingTokenIds(tokensInfo.remainingTokenIds);
    }
  }, [getUserERC721VotingTokens, proposalId, safeAddress]);

  useEffect(() => {
    if (loadOnMount) {
      loadUserERC721VotingTokens();
    }
  }, [loadUserERC721VotingTokens, loadOnMount]);

  return {
    totalVotingTokenIds,
    totalVotingTokenAddresses,
    remainingTokenAddresses,
    remainingTokenIds,
    getUserERC721VotingTokens,
    loadUserERC721VotingTokens,
  };
}
