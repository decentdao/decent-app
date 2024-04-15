import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { encodeFunctionData, Address } from 'viem';
import useSubmitProposal from '../../../../../../hooks/DAO/proposal/useSubmitProposal';
import { useFractal } from '../../../../../../providers/App/AppProvider';
import { ProposalExecuteData } from '../../../../../../types';

const useRemoveSigner = ({
  prevSigner,
  signerToRemove,
  threshold,
  nonce,
  daoAddress,
}: {
  prevSigner: string;
  signerToRemove: string;
  threshold: number;
  nonce: number | undefined;
  daoAddress: string | null;
}) => {
  const { submitProposal } = useSubmitProposal();
  const { t } = useTranslation(['modals']);
  const { baseContracts } = useFractal();

  const removeSigner = useCallback(async () => {
    if (!baseContracts) {
      return;
    }
    const { safeSingletonContract } = baseContracts;
    const description = 'Remove Signers';

    const calldatas = [
      encodeFunctionData({
        abi: safeSingletonContract.asPublic.abi,
        functionName: 'removeOwner',
        args: [prevSigner, signerToRemove, BigInt(threshold)],
      }),
    ];

    const proposalData: ProposalExecuteData = {
      targets: [daoAddress! as Address],
      values: [0n],
      calldatas: calldatas,
      metaData: {
        title: 'Remove Signers',
        description: description,
        documentationUrl: '',
      },
    };

    await submitProposal({
      proposalData,
      nonce,
      pendingToastMessage: t('removeSignerPendingToastMessage'),
      successToastMessage: t('removeSignerSuccessToastMessage'),
      failedToastMessage: t('removeSignerFailureToastMessage'),
    });
  }, [baseContracts, prevSigner, signerToRemove, threshold, daoAddress, submitProposal, nonce, t]);

  return removeSigner;
};

export default useRemoveSigner;
