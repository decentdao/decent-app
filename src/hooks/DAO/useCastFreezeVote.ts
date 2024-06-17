import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getContract, getAddress } from 'viem';
import { useWalletClient } from 'wagmi';
import ERC20FreezeVotingAbi from '../../assets/abi/ERC20FreezeVoting';
import ERC721FreezeVotingAbi from '../../assets/abi/ERC721FreezeVoting';
import MultisigFreezeVotingAbi from '../../assets/abi/MultisigFreezeVoting';
import { useFractal } from '../../providers/App/AppProvider';
import { FreezeVotingType } from '../../types';
import { useTransaction } from '../utils/useTransaction';
import useUserERC721VotingTokens from './proposal/useUserERC721VotingTokens';

const useCastFreezeVote = ({
  setPending,
}: {
  setPending: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [contractCall, pending] = useTransaction();
  const {
    guardContracts: { freezeVotingContractAddress, freezeVotingType },
    node: {
      nodeHierarchy: { parentAddress },
    },
  } = useFractal();
  const { getUserERC721VotingTokens } = useUserERC721VotingTokens(null, undefined, false);

  setPending(pending);

  const { t } = useTranslation('transaction');
  const { data: walletClient } = useWalletClient();

  const castFreezeVote = useCallback(() => {
    if (!freezeVotingContractAddress) return;

    if (freezeVotingType === FreezeVotingType.ERC721) {
      if (!walletClient) return;

      contractCall({
        contractFn: () => {
          const freezeERC721VotingContract = getContract({
            abi: ERC721FreezeVotingAbi,
            address: getAddress(freezeVotingContractAddress),
            client: walletClient,
          });
          return getUserERC721VotingTokens(parentAddress, undefined).then(tokensInfo => {
            return freezeERC721VotingContract.write.castFreezeVote([
              tokensInfo.totalVotingTokenAddresses.map(a => getAddress(a)),
              tokensInfo.totalVotingTokenIds.map(i => BigInt(i)),
            ]);
          });
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
            abi: ERC20FreezeVotingAbi,
            address: getAddress(freezeVotingContractAddress),
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
            abi: MultisigFreezeVotingAbi,
            address: getAddress(freezeVotingContractAddress),
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
    parentAddress,
    t,
    walletClient,
  ]);
  return castFreezeVote;
};

export default useCastFreezeVote;
