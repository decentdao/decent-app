import { Address } from 'viem';
import {
  CreateProposalActionData,
  CreateProposalTransaction,
  ProposalActionType,
} from '../../../types';
import { SENTINEL_MODULE } from '../../../utils/address';
import { SafeSettingsEdits } from '../types';

interface MultisigHandlerDependencies {
  t: (key: string, options?: { ns: string }) => string;
  safe: { address: Address; threshold: number; owners: Address[] } | null;
  ethValue: { bigintValue: bigint; value: string };
  getEnsAddress: ({ name }: { name?: string }) => Promise<Address | null>;
}

export const handleEditMultisigGovernance = async (
  updatedValues: SafeSettingsEdits,
  deps: MultisigHandlerDependencies,
): Promise<{ action: CreateProposalActionData; title: string }> => {
  const { t, safe, ethValue, getEnsAddress } = deps;

  if (!updatedValues.multisig) {
    throw new Error('Multisig settings are not set');
  }

  if (!safe?.address) {
    throw new Error('Safe address is not set');
  }

  const changeTitles: string[] = [];
  const { newSigners, signersToRemove, signerThreshold } = updatedValues.multisig;
  const threshold = signerThreshold ?? safe.threshold;
  const transactions: CreateProposalTransaction[] = [];

  if ((newSigners?.length ?? 0) > 0) {
    newSigners?.forEach(async s => {
      const maybeEnsAddress = await getEnsAddress({ name: s.inputValue });
      const signerAddress: Address | undefined = maybeEnsAddress ?? s.address;

      if (!signerAddress) {
        throw new Error('Invalid ENS name or address');
      }

      transactions.push({
        targetAddress: safe.address,
        ethValue,
        functionName: 'addOwnerWithThreshold',
        parameters: [
          {
            signature: 'address',
            value: signerAddress,
          },
          {
            signature: 'uint256',
            value: threshold.toString(),
          },
        ],
      });
    });

    changeTitles.push(t('addSigners', { ns: 'proposalMetadata' }));
  }

  if ((signersToRemove?.length ?? 0) > 0) {
    const signerIndicesThatWillBeRemoved = new Set<number>();

    signersToRemove?.forEach(s => {
      const signerToRemoveIndex = safe.owners.findIndex(a => a === s);
      let previousIndex = signerToRemoveIndex - 1;
      while (signerIndicesThatWillBeRemoved.has(previousIndex)) {
        previousIndex--;
      }

      const prevSigner = previousIndex < 0 ? SENTINEL_MODULE : safe.owners[previousIndex];

      transactions.push({
        targetAddress: safe.address,
        ethValue,
        functionName: 'removeOwner',
        parameters: [
          {
            signature: 'address',
            value: prevSigner,
          },
          {
            signature: 'address',
            value: s,
          },
          {
            signature: 'uint256',
            value: threshold.toString(),
          },
        ],
      });

      signerIndicesThatWillBeRemoved.add(signerToRemoveIndex);
    });

    changeTitles.push(t('removeSigners', { ns: 'proposalMetadata' }));
  }

  if (newSigners === undefined && signersToRemove === undefined && signerThreshold !== undefined) {
    transactions.push({
      targetAddress: safe.address,
      ethValue,
      functionName: 'changeThreshold',
      parameters: [
        {
          signature: 'uint256',
          value: signerThreshold.toString(),
        },
      ],
    });

    changeTitles.push(t('changeThreshold', { ns: 'proposalMetadata' }));
  }

  const action: CreateProposalActionData = {
    actionType: ProposalActionType.EDIT,
    transactions,
  };

  return { action, title: changeTitles.join(`; `) };
};
