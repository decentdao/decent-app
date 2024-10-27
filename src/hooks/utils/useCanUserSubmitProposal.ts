import { abis } from '@fractal-framework/fractal-contracts';
import { useCallback, useEffect, useState } from 'react';
import { Address, getContract } from 'viem';
import { usePublicClient } from 'wagmi';
import { useFractal } from '../../providers/App/AppProvider';
import { useSafeAPI } from '../../providers/App/hooks/useSafeAPI';
import { GovernanceType } from '../../types';
import useVotingStrategiesAddresses from './useVotingStrategiesAddresses';

export function useCanUserCreateProposal() {
  const {
    node: { safe },
    governance: { type },
    governanceContracts: { linearVotingErc20Address, linearVotingErc721Address },
    readOnly: { user },
  } = useFractal();
  const safeAPI = useSafeAPI();
  const [canUserCreateProposal, setCanUserCreateProposal] = useState<boolean>();
  const publicClient = usePublicClient();

  const { getVotingStrategies } = useVotingStrategiesAddresses();

  /**
   * Performs a check whether user has access rights to create proposal for DAO
   * @param {string} safeAddress - parameter to verify that user can create proposal for this specific DAO.
   * Otherwise - it is checked for DAO from the global context.
   * @returns {Promise<boolean>} - whether or not user has rights to create proposal either in global scope either for provided `safeAddress`.
   */
  const getCanUserCreateProposal = useCallback(
    async (safeAddress?: Address): Promise<boolean | undefined> => {
      if (!user.address || !safeAPI || !publicClient) {
        return;
      }

      const checkIsMultisigOwner = (owners?: string[]) => {
        return !!owners?.includes(user.address || '');
      };

      if (safeAddress) {
        const votingStrategies = await getVotingStrategies(safeAddress);
        if (votingStrategies) {
          let isProposer = false;
          await Promise.all(
            votingStrategies.map(async strategy => {
              if (!isProposer && user.address) {
                const votingContract = getContract({
                  abi: abis.LinearERC20Voting,
                  address: strategy.address,
                  client: publicClient,
                });
                isProposer = await votingContract.read.isProposer([user.address]);
              }
            }),
          );
          return isProposer;
        } else {
          const safeInfo = await safeAPI.getSafeInfo(safeAddress);
          return checkIsMultisigOwner(safeInfo.owners);
        }
      } else {
        if (type === GovernanceType.MULTISIG) {
          const { owners } = safe || {};
          return checkIsMultisigOwner(owners);
        } else if (type === GovernanceType.AZORIUS_ERC20) {
          if (linearVotingErc20Address) {
            const ozLinearVotingContract = getContract({
              abi: abis.LinearERC20Voting,
              address: linearVotingErc20Address,
              client: publicClient,
            });

            const isProposer = await ozLinearVotingContract.read.isProposer([user.address]);
            return isProposer;
          }
        } else if (type === GovernanceType.AZORIUS_ERC721 && linearVotingErc721Address) {
          const erc721LinearVotingContract = getContract({
            abi: abis.LinearERC721Voting,
            address: linearVotingErc721Address,
            client: publicClient,
          });

          const isProposer = await erc721LinearVotingContract.read.isProposer([user.address]);
          return isProposer;
        } else {
          return;
        }
      }
      return;
    },
    [
      linearVotingErc721Address,
      getVotingStrategies,
      linearVotingErc20Address,
      publicClient,
      safe,
      safeAPI,
      type,
      user.address,
    ],
  );

  useEffect(() => {
    const loadCanUserCreateProposal = async () => {
      const newCanCreateProposal = await getCanUserCreateProposal();
      if (newCanCreateProposal !== canUserCreateProposal) {
        setCanUserCreateProposal(newCanCreateProposal);
      }
    };
    loadCanUserCreateProposal();
  }, [getCanUserCreateProposal, canUserCreateProposal]);

  return { canUserCreateProposal, getCanUserCreateProposal };
}
