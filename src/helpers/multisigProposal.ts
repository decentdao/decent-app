import { FractalProposal, MultisigProposal } from '../types';

export function isMultisigRejectionProposal(
  safeAddress: string | undefined,
  nonce: number | undefined,
  p: FractalProposal,
) {
  if (!safeAddress || !nonce) return false;

  const rejectTransaction = p.transaction;
  const sameNonce = rejectTransaction?.nonce === nonce;
  const emptyTransactionToSafe =
    !rejectTransaction?.data &&
    rejectTransaction?.to === safeAddress &&
    BigInt(rejectTransaction?.value || 0) === 0n;

  return sameNonce && emptyTransactionToSafe;
}

export function findMostConfirmedMultisigRejectionProposal(
  safeAddress: string | undefined,
  nonce: number | undefined,
  proposals: FractalProposal[] | null,
): MultisigProposal | undefined {
  const multisigRejectionProposals = proposals?.filter(p =>
    isMultisigRejectionProposal(safeAddress, nonce, p),
  );

  if (!multisigRejectionProposals?.length) return undefined;

  const sortedProposals = multisigRejectionProposals.sort(
    (a, b) =>
      (b.transaction?.confirmations?.length || 0) - (a.transaction?.confirmations?.length || 0),
  );

  return sortedProposals[0];
}
