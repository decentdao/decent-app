import { Address, encodeFunctionData, getAddress, Hex } from 'viem';
import GnosisSafeL2Abi from '../assets/abi/GnosisSafeL2';
import { buildContractCall, buildSignatures } from '../helpers';
import { SafeMultisigDAO, SafeTransaction } from '../types';

export class MultisigTxBuilder {
  private multiSendCallOnlyAddress: Address;
  private readonly daoData: SafeMultisigDAO;
  private readonly safeContractAddress: Address;

  constructor(
    multiSendCallOnlyAddress: Address,
    daoData: SafeMultisigDAO,
    safeContractAddress: Address,
  ) {
    this.multiSendCallOnlyAddress = multiSendCallOnlyAddress;
    this.daoData = daoData;
    this.safeContractAddress = safeContractAddress;
  }

  public signatures(): Hex {
    return buildSignatures(this.multiSendCallOnlyAddress);
  }

  public buildRemoveMultiSendOwnerTx(): SafeTransaction {
    return buildContractCall({
      target: this.safeContractAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'removeOwner',
        args: [
          getAddress(this.daoData.trustedAddresses[this.daoData.trustedAddresses.length - 1]),
          this.multiSendCallOnlyAddress,
          BigInt(this.daoData.signatureThreshold),
        ],
        abi: GnosisSafeL2Abi,
      }),
    });
  }
}
