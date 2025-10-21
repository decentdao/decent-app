import { legacy } from '@decentdao/decent-contracts';
import { useCallback, useEffect, useState } from 'react';
import { Address, getContract, isAddress, getAddress } from 'viem';
import { normalize } from 'viem/ens';
import { useAccount } from 'wagmi';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useSafeAPI } from '../../providers/App/hooks/useSafeAPI';
import { GovernanceType } from '../../types';
import { isDemoMode } from '../../utils/demoMode';
import { getChainIdFromPrefix } from '../../utils/url';
import { useCurrentDAOKey } from '../DAO/useCurrentDAOKey';
import { useNetworkEnsAddressAsync } from '../useNetworkEnsAddress';
import useNetworkPublicClient from '../useNetworkPublicClient';
import useVotingStrategiesAddresses from './useVotingStrategiesAddresses';

export function useCanUserCreateProposal() {
  const { daoKey, addressPrefix } = useCurrentDAOKey();
  const {
    governance: { type, isAzorius, votesToken },
    governanceContracts: {
      linearVotingErc20Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress,
    },
    node: { safe },
  } = useDAOStore({ daoKey });
  const user = useAccount();
  const safeAPI = useSafeAPI();
  const [canUserCreateProposal, setCanUserCreateProposal] = useState<boolean>();
  const publicClient = useNetworkPublicClient();
  const { getEnsAddress } = useNetworkEnsAddressAsync();

  const { getVotingStrategies } = useVotingStrategiesAddresses();

  /**
   * Resolves a value that could be an ENS name or address to a checksummed address
   * @param value - ENS name or address string
   * @returns Checksummed address or undefined if resolution fails
   */
  const resolveToAddress = useCallback(
    async (value?: string): Promise<Address | undefined> => {
      if (!value) {
        return undefined;
      }

      // If it's already a valid address, return checksummed version
      if (isAddress(value)) {
        return getAddress(value);
      }

      // Try to resolve as ENS name
      try {
        const normalizedName = normalize(value);
        const resolvedAddress = await getEnsAddress({ name: normalizedName });
        return resolvedAddress || undefined;
      } catch {
        // If normalization or resolution fails, return undefined
        return undefined;
      }
    },
    [getEnsAddress],
  );

  /**
   * Performs a check whether user has access rights to create proposal for DAO
   * @param {string} safeAddress - parameter to verify that user can create proposal for this specific DAO.
   * Otherwise - it is checked for DAO from the global context.
   * @returns {Promise<boolean>} - whether or not user has rights to create proposal either in global scope either for provided `safeAddress`.
   */
  const getCanUserCreateProposal = useCallback(
    async (safeAddressParam?: Address): Promise<boolean | undefined> => {
      if (!user.address || !safeAPI) {
        return;
      }

      // Resolve user address to handle ENS names
      const resolvedUserAddress = await resolveToAddress(user.address);
      if (!resolvedUserAddress) {
        return false;
      }

      const checkIsMultisigOwner = async (owners?: string[]) => {
        if (!owners) {
          return false;
        }
        // Resolve all owner addresses to handle ENS names
        const resolvedOwners = await Promise.all(owners.map(owner => resolveToAddress(owner)));
        // Check if resolved user address matches any resolved owner address
        return resolvedOwners.some(
          owner => owner && owner.toLowerCase() === resolvedUserAddress.toLowerCase(),
        );
      };

      if (safeAddressParam) {
        const votingStrategies = await getVotingStrategies(safeAddressParam);
        if (votingStrategies) {
          let isProposer = false;
          await Promise.all(
            votingStrategies.map(async strategy => {
              if (!isProposer) {
                const votingContract = getContract({
                  abi: legacy.abis.LinearERC20Voting,
                  address: strategy.strategyAddress,
                  client: publicClient,
                });
                isProposer = await votingContract.read.isProposer([resolvedUserAddress]);
              }
            }),
          );
          return isProposer;
        } else {
          const safeInfo = await safeAPI.getSafeInfo(safeAddressParam);
          return checkIsMultisigOwner(safeInfo.owners);
        }
      } else {
        if (isAzorius) {
          const votingStrategies: Address[] = [];
          // Add all voting strategies to the array
          for (const votingStrategyAddress of [
            linearVotingErc20Address,
            linearVotingErc20WithHatsWhitelistingAddress,
            linearVotingErc721Address,
            linearVotingErc721WithHatsWhitelistingAddress,
          ]) {
            if (votingStrategyAddress) {
              votingStrategies.push(votingStrategyAddress);
            }
          }
          // If the votes token is delegated, check if the user is the delegatee
          if (votesToken?.delegatee) {
            const resolvedDelegatee = await resolveToAddress(votesToken.delegatee);
            if (
              resolvedDelegatee &&
              resolvedDelegatee.toLowerCase() !== resolvedUserAddress.toLowerCase()
            ) {
              return false;
            }
          }
          const isProposerPerStrategy = await Promise.all(
            votingStrategies.map(async votingStrategyAddress => {
              if (votingStrategyAddress) {
                const votingContract = getContract({
                  abi: legacy.abis.LinearERC20Voting,
                  address: votingStrategyAddress,
                  client: publicClient,
                });
                return {
                  isProposer: await votingContract.read.isProposer([resolvedUserAddress]),
                  votingStrategyAddress,
                };
              }
            }),
          );
          const isProposer = isProposerPerStrategy.some(strategy => strategy?.isProposer);
          return isProposer;
        } else if (type === GovernanceType.MULTISIG) {
          const { owners } = safe || {};
          return checkIsMultisigOwner(owners);
        } else {
          return;
        }
      }
    },
    [
      user.address,
      safeAPI,
      resolveToAddress,
      getVotingStrategies,
      publicClient,
      isAzorius,
      type,
      linearVotingErc20Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721Address,
      linearVotingErc721WithHatsWhitelistingAddress,
      safe,
      votesToken?.delegatee,
    ],
  );

  useEffect(() => {
    const loadCanUserCreateProposal = async () => {
      // This prevents unnecessary calls to getCanUserCreateProposal when the user refreshes the page on a different chain from mainnet
      if (addressPrefix && getChainIdFromPrefix(addressPrefix) !== publicClient.chain.id) {
        return;
      }

      const newCanCreateProposal = isDemoMode() || (await getCanUserCreateProposal());
      if (newCanCreateProposal !== canUserCreateProposal) {
        setCanUserCreateProposal(newCanCreateProposal);
      }
    };
    loadCanUserCreateProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCanUserCreateProposal, addressPrefix, publicClient.chain.id]);

  return { canUserCreateProposal, getCanUserCreateProposal };
}
