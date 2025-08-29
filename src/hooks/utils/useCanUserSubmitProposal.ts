import { legacy } from '@decentdao/decent-contracts';
import { useCallback, useEffect, useState } from 'react';
import { Address, getContract } from 'viem';
import { useAccount } from 'wagmi';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useSafeAPI } from '../../providers/App/hooks/useSafeAPI';
import { GovernanceType } from '../../types';
import { isDemoMode } from '../../utils/demoMode';
import { getChainIdFromPrefix } from '../../utils/url';
import { useCurrentDAOKey } from '../DAO/useCurrentDAOKey';
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

  const { getVotingStrategies } = useVotingStrategiesAddresses();

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

      const checkIsMultisigOwner = (owners?: string[]) => {
        return !!owners?.includes(user.address || '');
      };

      if (safeAddressParam) {
        const votingStrategies = await getVotingStrategies(safeAddressParam);
        if (votingStrategies) {
          let isProposer = false;
          await Promise.all(
            votingStrategies.map(async strategy => {
              if (!isProposer && user.address) {
                const votingContract = getContract({
                  abi: legacy.abis.LinearERC20Voting,
                  address: strategy.strategyAddress,
                  client: publicClient,
                });
                isProposer = await votingContract.read.isProposer([user.address]);
              }
            }),
          );
          return isProposer;
        } else {
          const safeInfo = await safeAPI.getSafeInfo(safeAddressParam);
          return checkIsMultisigOwner(safeInfo.owners);
        }
      } else {
        if (isAzorius && votesToken?.delegatee === user.address) {
          const isProposerPerStrategy = await Promise.all(
            [
              linearVotingErc20Address,
              linearVotingErc20WithHatsWhitelistingAddress,
              linearVotingErc721Address,
              linearVotingErc721WithHatsWhitelistingAddress,
            ].map(async votingStrategyAddress => {
              if (votingStrategyAddress) {
                const votingContract = getContract({
                  abi: legacy.abis.LinearERC20Voting,
                  address: votingStrategyAddress,
                  client: publicClient,
                });
                if (user.address) {
                  return {
                    isProposer: await votingContract.read.isProposer([user.address]),
                    votingStrategyAddress,
                  };
                }
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
      console.log('🚀 ~ newCanCreateProposal:', newCanCreateProposal);
      if (newCanCreateProposal !== canUserCreateProposal) {
        setCanUserCreateProposal(newCanCreateProposal);
      }
    };
    loadCanUserCreateProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCanUserCreateProposal, addressPrefix, publicClient.chain.id]);

  return { canUserCreateProposal, getCanUserCreateProposal };
}
