import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import { MultisigProposal, Proposal } from '../types';

export function isMultisigRejectionProposal(
  safeAddress: string | undefined,
  nonce: number | undefined,
  tx: SafeMultisigTransactionResponse | undefined,
) {
  if (!safeAddress || !nonce) return false;

  const sameNonce = tx?.nonce === nonce;
  const emptyTransactionToSafe =
    !tx?.data && tx?.to === safeAddress && BigInt(tx?.value || 0) === 0n;

  return sameNonce && emptyTransactionToSafe;
}

export function findMostConfirmedMultisigRejectionProposal(
  safeAddress: string | undefined,
  nonce: number | undefined,
  proposals: Proposal[] | null,
): MultisigProposal | undefined {
  const multisigRejectionProposals = proposals?.filter(p =>
    isMultisigRejectionProposal(safeAddress, nonce, p.transaction),
  );

  if (!multisigRejectionProposals?.length) return undefined;

  const sortedProposals = multisigRejectionProposals.sort(
    (a, b) =>
      (b.transaction?.confirmations?.length || 0) - (a.transaction?.confirmations?.length || 0),
  );

  return sortedProposals[0];
}
