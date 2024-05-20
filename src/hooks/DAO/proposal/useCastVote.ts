import snapshot from '@snapshot-labs/snapshot.js';
import { ethers } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useVoteContext } from '../../../components/Proposals/ProposalVotes/context/VoteContext';
import { logError } from '../../../helpers/errorLogging';
import { useFractal } from '../../../providers/App/AppProvider';
import { useEthersSigner } from '../../../providers/Ethers/hooks/useEthersSigner';
import {
  AzoriusGovernance,
  GovernanceType,
  FractalProposal,
  ExtendedSnapshotProposal,
} from '../../../types';
import encryptWithShutter from '../../../utils/shutter';
import useSafeContracts from '../../safe/useSafeContracts';
import { useTransaction } from '../../utils/useTransaction';
import useSnapshotSpaceName from '../loaders/snapshot/useSnapshotSpaceName';
import useUserERC721VotingTokens from './useUserERC721VotingTokens';

const useCastVote = ({
  proposal,
  setPending,
  extendedSnapshotProposal,
}: {
  proposal: FractalProposal;
  setPending?: React.Dispatch<React.SetStateAction<boolean>>;
  extendedSnapshotProposal?: ExtendedSnapshotProposal;
}) => {
  const [selectedChoice, setSelectedChoice] = useState<number>();
  const [snapshotWeightedChoice, setSnapshotWeightedChoice] = useState<number[]>([]);

  const {
    governanceContracts: { ozLinearVotingContractAddress, erc721LinearVotingContractAddress },
    governance,
    node: { daoSnapshotENS },
    readOnly: {
      user: { address },
    },
  } = useFractal();
  const baseContracts = useSafeContracts();
  const daoSnapshotSpaceName = useSnapshotSpaceName();
  const signer = useEthersSigner();
  const client = useMemo(() => {
    if (daoSnapshotENS) {
      return new snapshot.Client712('https://hub.snapshot.org');
    }
    return undefined;
  }, [daoSnapshotENS]);

  const azoriusGovernance = useMemo(() => governance as AzoriusGovernance, [governance]);
  const { type } = azoriusGovernance;

  const [contractCallCastVote, contractCallPending] = useTransaction();

  const { remainingTokenIds, remainingTokenAddresses } = useUserERC721VotingTokens(
    proposal.proposalId,
  );
  const { getCanVote, getHasVoted } = useVoteContext();

  useEffect(() => {
    if (setPending) {
      setPending(contractCallPending);
    }
  }, [setPending, contractCallPending]);

  useEffect(() => {
    if (extendedSnapshotProposal) {
      setSnapshotWeightedChoice(extendedSnapshotProposal.choices.map(() => 0));
    }
  }, [extendedSnapshotProposal]);

  const { t } = useTranslation('transaction');

  const handleSelectSnapshotChoice = useCallback((choiceIndex: number) => {
    setSelectedChoice(choiceIndex);
  }, []);

  const handleChangeSnapshotWeightedChoice = useCallback((choiceIndex: number, value: number) => {
    setSnapshotWeightedChoice(prevState =>
      prevState.map((choiceValue, index) => (index === choiceIndex ? value : choiceValue)),
    );
  }, []);

  const castVote = useCallback(
    async (vote: number) => {
      let contractFn;
      if (type === GovernanceType.AZORIUS_ERC20 && ozLinearVotingContractAddress && baseContracts) {
        const ozLinearVotingContract = baseContracts.linearVotingMasterCopyContract.asSigner.attach(
          ozLinearVotingContractAddress,
        );
        contractFn = () => ozLinearVotingContract.vote(proposal.proposalId, vote);
      } else if (
        type === GovernanceType.AZORIUS_ERC721 &&
        erc721LinearVotingContractAddress &&
        baseContracts
      ) {
        const erc721LinearVotingContract =
          baseContracts.linearVotingERC721MasterCopyContract.asSigner.attach(
            erc721LinearVotingContractAddress,
          );

        contractFn = () =>
          erc721LinearVotingContract.vote(
            proposal.proposalId,
            vote,
            remainingTokenAddresses,
            remainingTokenIds,
          );
      }

      if (contractFn) {
        contractCallCastVote({
          contractFn,
          pendingMessage: t('pendingCastVote'),
          failedMessage: t('failedCastVote'),
          successMessage: t('successCastVote'),
          successCallback: () => {
            setTimeout(() => {
              getHasVoted();
              getCanVote(true);
            }, 3000);
          },
        });
      }
    },
    [
      contractCallCastVote,
      t,
      ozLinearVotingContractAddress,
      erc721LinearVotingContractAddress,
      type,
      proposal,
      remainingTokenAddresses,
      remainingTokenIds,
      getCanVote,
      getHasVoted,
      baseContracts,
    ],
  );

  const castSnapshotVote = useCallback(
    async (onSuccess?: () => Promise<void>) => {
      if (
        signer &&
        signer?.provider &&
        address &&
        daoSnapshotSpaceName &&
        extendedSnapshotProposal &&
        client
      ) {
        let toastId;
        const mappedSnapshotWeightedChoice: { [choiceKey: number]: number } = {};
        if (extendedSnapshotProposal.type === 'weighted') {
          snapshotWeightedChoice.forEach((value, choiceIndex) => {
            if (value > 0) {
              mappedSnapshotWeightedChoice[choiceIndex + 1] = value;
            }
          });
        }
        const choice =
          extendedSnapshotProposal.type === 'weighted'
            ? mappedSnapshotWeightedChoice
            : (selectedChoice as number) + 1;
        try {
          toastId = toast(t('pendingCastVote'), {
            autoClose: false,
            closeOnClick: false,
            draggable: false,
            closeButton: false,
            progress: 1,
          });
          if (extendedSnapshotProposal.privacy === 'shutter') {
            const encryptedChoice = await encryptWithShutter(
              JSON.stringify(choice),
              extendedSnapshotProposal.proposalId,
            );
            await client.vote(signer.provider as ethers.providers.Web3Provider, address, {
              space: daoSnapshotSpaceName,
              proposal: extendedSnapshotProposal.proposalId,
              type: extendedSnapshotProposal.type,
              privacy: extendedSnapshotProposal.privacy,
              choice: encryptedChoice!,
              app: 'decent',
            });
          } else {
            await client.vote(signer.provider as ethers.providers.Web3Provider, address, {
              space: daoSnapshotSpaceName,
              proposal: extendedSnapshotProposal.proposalId,
              type: extendedSnapshotProposal.type,
              choice,
              app: 'decent',
            });
          }
          toast.dismiss(toastId);
          toast.success(`${t('successCastVote')}. ${t('snapshotRecastVoteHelper')}`);
          setSelectedChoice(undefined);
          if (onSuccess) {
            // Need to refetch votes after timeout so that Snapshot API has enough time to record the vote
            setTimeout(() => onSuccess(), 3000);
          }
        } catch (e) {
          toast.dismiss(toastId);
          toast.error(t('failedCastVote'));
          logError('Error while casting Snapshot vote', e);
        }
      }
    },
    [
      signer,
      address,
      daoSnapshotSpaceName,
      extendedSnapshotProposal,
      t,
      selectedChoice,
      snapshotWeightedChoice,
      client,
    ],
  );

  return {
    castVote,
    castSnapshotVote,
    selectedChoice,
    snapshotWeightedChoice,
    handleSelectSnapshotChoice,
    handleChangeSnapshotWeightedChoice,
  };
};

export default useCastVote;
