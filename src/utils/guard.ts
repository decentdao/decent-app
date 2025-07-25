import { legacy } from '@decentdao/decent-contracts';
import { keccak256, encodePacked, isHex, Address, getContract, PublicClient } from 'viem';
import { buildSignatureBytes } from '../helpers/crypto';
import { FractalProposal } from '../types';
import { getTimeStamp } from './contract';

export async function getTxTimelockedTimestamp(
  activity: FractalProposal,
  freezeGuardAddress: Address,
  publicClient: PublicClient,
) {
  if (!activity.transaction?.confirmations) {
    throw new Error(
      'Error getting transaction timelocked timestamp - invalid format of multisig transaction',
    );
  }
  const signatures = buildSignatureBytes(
    activity.transaction.confirmations.map(confirmation => {
      if (!isHex(confirmation.signature)) {
        throw new Error('Confirmation signature is malfunctioned');
      }
      return {
        signer: confirmation.owner,
        data: confirmation.signature,
      };
    }),
  );
  const signaturesHash = keccak256(encodePacked(['bytes'], [signatures]));

  const freezeGuard = getContract({
    address: freezeGuardAddress,
    abi: legacy.abis.MultisigFreezeGuard,
    client: publicClient,
  });

  const timelockedTimestamp = await getTimeStamp(
    await freezeGuard.read.getTransactionTimelockedBlock([signaturesHash]),
    publicClient,
  );
  return timelockedTimestamp;
}
