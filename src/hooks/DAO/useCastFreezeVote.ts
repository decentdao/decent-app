import { legacy } from '@decentdao/decent-contracts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getContract } from 'viem';
import { useDAOStore } from '../../providers/App/AppProvider';
import { FreezeVotingType } from '../../types';
import { useNetworkWalletClient } from '../useNetworkWalletClient';
import { useTransaction } from '../utils/useTransaction';
import useUserERC721VotingTokens from './proposal/useUserERC721VotingTokens';
import { useCurrentDAOKey } from './useCurrentDAOKey';

export const useCastFreezeVote = () => {
  const [contractCall, pending] = useTransaction();
  const { daoKey } = useCurrentDAOKey();
  const {
    guardContracts: { freezeVotingContractAddress, freezeVotingType },
    node: { subgraphInfo },
  } = useDAOStore({ daoKey });
  const { getUserERC721VotingTokens } = useUserERC721VotingTokens(null, null, false);

  const { t } = useTranslation('transaction');
  const { data: walletClient } = useNetworkWalletClient();

  const castFreezeVote = useCallback(() => {
    if (!freezeVotingContractAddress) return;

    if (freezeVotingType === FreezeVotingType.ERC721) {
      if (!walletClient) return;

      contractCall({
        contractFn: () => {
          const freezeERC721VotingContract = getContract({
            abi: legacy.abis.ERC721FreezeVoting,
            address: freezeVotingContractAddress,
            client: walletClient,
          });
          return getUserERC721VotingTokens(subgraphInfo?.parentAddress ?? null, null).then(
            tokensInfo => {
              return freezeERC721VotingContract.write.castFreezeVote([
                tokensInfo.totalVotingTokenAddresses,
                tokensInfo.totalVotingTokenIds.map(i => BigInt(i)),
              ]);
            },
          );
        },
        pendingMessage: t('pendingCastFreezeVote'),
        failedMessage: t('failedCastFreezeVote'),
        successMessage: t('successCastFreezeVote'),
      });
    } else if (freezeVotingType === FreezeVotingType.ERC20) {
      if (!walletClient) return;

      contractCall({
        contractFn: () => {
          const freezeERC20VotingContract = getContract({
            abi: legacy.abis.ERC20FreezeVoting,
            address: freezeVotingContractAddress,
            client: walletClient,
          });
          return freezeERC20VotingContract.write.castFreezeVote();
        },
        pendingMessage: t('pendingCastFreezeVote'),
        failedMessage: t('failedCastFreezeVote'),
        successMessage: t('successCastFreezeVote'),
      });
    } else if (freezeVotingType === FreezeVotingType.MULTISIG) {
      if (!walletClient) return;

      contractCall({
        contractFn: () => {
          const freezeMultisigVotingContract = getContract({
            abi: legacy.abis.MultisigFreezeVoting,
            address: freezeVotingContractAddress,
            client: walletClient,
          });
          return freezeMultisigVotingContract.write.castFreezeVote();
        },
        pendingMessage: t('pendingCastFreezeVote'),
        failedMessage: t('failedCastFreezeVote'),
        successMessage: t('successCastFreezeVote'),
      });
    } else {
      throw new Error('unknown freezeVotingType');
    }
  }, [
    contractCall,
    freezeVotingContractAddress,
    freezeVotingType,
    getUserERC721VotingTokens,
    subgraphInfo?.parentAddress,
    t,
    walletClient,
  ]);
  return { castFreezeVote, pending };
};
