import { legacy } from '@decentdao/decent-contracts';
import { Address, encodeFunctionData, Hex, PublicClient, zeroAddress } from 'viem';
import GnosisSafeL2Abi from '../assets/abi/GnosisSafeL2';
import MultiSendCallOnlyAbi from '../assets/abi/MultiSendCallOnly';
import { buildContractCall, encodeMultiSend } from '../helpers';
import {
  AzoriusERC20DAO,
  AzoriusERC721DAO,
  SafeMultisigDAO,
  SafeTransaction,
  VotingStrategyType,
} from '../types';
import { BaseTxBuilder } from './BaseTxBuilder';
import { TxBuilderFactory } from './TxBuilderFactory';
import { DecentModule, fractalModuleData } from './helpers/fractalModuleData';

export class DaoTxBuilder extends BaseTxBuilder {
  private readonly saltNum;

  private txBuilderFactory: TxBuilderFactory;

  // Safe Data
  private readonly createSafeTx: SafeTransaction;
  private readonly safeContractAddress: Address;
  private readonly parentStrategyType?: VotingStrategyType;
  private readonly parentStrategyAddress?: Address;

  // Fractal Module Txs
  private enableFractalModuleTx: SafeTransaction | undefined;
  private deployFractalModuleTx: SafeTransaction | undefined;

  private internalTxs: SafeTransaction[] = [];

  private readonly keyValuePairs: Address;
  private readonly zodiacModuleProxyFactory: Address;
  private readonly multiSendCallOnly: Address;
  private readonly moduleFractalMasterCopy: Address;

  constructor(
    publicClient: PublicClient,
    isAzorius: boolean,
    daoData: SafeMultisigDAO | AzoriusERC20DAO | AzoriusERC721DAO,
    saltNum: bigint,

    createSafeTx: SafeTransaction,
    safeContractAddress: Address,
    txBuilderFactory: TxBuilderFactory,

    keyValuePairs: Address,
    zodiacModuleProxyFactory: Address,
    multiSendCallOnly: Address,
    moduleFractalMasterCopy: Address,

    attachFractalModule?: boolean,

    parentAddress?: Address,
    parentTokenAddress?: Address,

    parentStrategyType?: VotingStrategyType,
    parentStrategyAddress?: Address,
  ) {
    super(publicClient, isAzorius, daoData, parentAddress, parentTokenAddress);
    this.saltNum = saltNum;

    this.createSafeTx = createSafeTx;
    this.safeContractAddress = safeContractAddress;
    this.txBuilderFactory = txBuilderFactory;

    this.keyValuePairs = keyValuePairs;
    this.zodiacModuleProxyFactory = zodiacModuleProxyFactory;
    this.multiSendCallOnly = multiSendCallOnly;
    this.moduleFractalMasterCopy = moduleFractalMasterCopy;

    this.parentStrategyType = parentStrategyType;
    this.parentStrategyAddress = parentStrategyAddress;

    if (attachFractalModule) {
      // Prep fractal module txs for setting up subDAOs
      this.setFractalModuleTxs();
    }
  }

  public async buildAzoriusTx(params: {
    shouldSetName: boolean;
    shouldSetSnapshot: boolean;
    existingSafeOwners?: Address[];
  }): Promise<string> {
    const { shouldSetName, shouldSetSnapshot, existingSafeOwners } = params;
    const azoriusTxBuilder = await this.txBuilderFactory.createAzoriusTxBuilder();

    // transactions that must be called by safe
    this.internalTxs = [];
    const txs: SafeTransaction[] = !!existingSafeOwners ? [] : [this.createSafeTx];

    if (shouldSetName) {
      this.internalTxs = this.internalTxs.concat(this.buildUpdateDAONameTx());
    }

    if (shouldSetSnapshot) {
      this.internalTxs = this.internalTxs.concat(this.buildUpdateDAOSnapshotENSTx());
    }

    this.internalTxs = this.internalTxs.concat(
      azoriusTxBuilder.buildVotingContractSetupTx(),
      azoriusTxBuilder.buildEnableAzoriusModuleTx(),
    );

    if (this.parentAddress) {
      const freezeGuardTxBuilder = this.txBuilderFactory.createFreezeGuardTxBuilder(
        azoriusTxBuilder.azoriusAddress,
        azoriusTxBuilder.linearERC20VotingAddress ?? azoriusTxBuilder.linearERC721VotingAddress,
        this.parentStrategyType,
        this.parentStrategyAddress,
      );

      if (this.enableFractalModuleTx) {
        this.internalTxs = this.internalTxs.concat(
          // Enable Fractal Module b/c this a subDAO
          this.enableFractalModuleTx,
        );
      }

      this.internalTxs = this.internalTxs.concat(
        freezeGuardTxBuilder.buildDeployZodiacModuleTx(),
        freezeGuardTxBuilder.buildFreezeVotingSetupTx(),
        freezeGuardTxBuilder.buildDeployFreezeGuardTx(),
        freezeGuardTxBuilder.buildSetGuardTx(azoriusTxBuilder.azoriusAddress!),
      );
    }
    const data = this.daoData as AzoriusERC20DAO;

    this.internalTxs = this.internalTxs.concat([
      azoriusTxBuilder.buildAddAzoriusContractAsOwnerTx(),
      ...(!!existingSafeOwners ? azoriusTxBuilder.buildRemoveOwners(existingSafeOwners) : []),
      azoriusTxBuilder.buildRemoveMultiSendOwnerTx(),
    ]);

    // build token if token is not imported
    if (!data.isTokenImported && data.votingStrategyType === VotingStrategyType.LINEAR_ERC20) {
      txs.push(azoriusTxBuilder.buildCreateTokenTx());
    }

    txs.push(azoriusTxBuilder.buildDeployStrategyTx());
    txs.push(azoriusTxBuilder.buildDeployAzoriusTx());

    // If subDAO and parentAllocation, deploy claim module
    let tokenClaimTx: SafeTransaction | undefined;
    const parentAllocation = (this.daoData as AzoriusERC20DAO).parentAllocationAmount;

    if (this.parentTokenAddress && parentAllocation && parentAllocation !== 0n) {
      const tokenApprovalTx = azoriusTxBuilder.buildApproveClaimAllocation();
      if (!tokenApprovalTx) {
        throw new Error('buildApproveClaimAllocation returned undefined');
      }
      tokenClaimTx = azoriusTxBuilder.buildDeployTokenClaim();
      this.internalTxs.push(tokenApprovalTx);
    }

    if (this.parentAddress && this.deployFractalModuleTx) {
      // If subDAO, and `deployFractalModuleTx` created (which might not be the case depending on user input) - deploy Fractal Module.
      txs.push(this.deployFractalModuleTx);
    }

    txs.push(this.buildExecInternalSafeTx(azoriusTxBuilder.signatures()));

    // token claim deployment tx is pushed at the end to ensure approval is executed first
    if (tokenClaimTx) {
      txs.push(tokenClaimTx);
    }

    return encodeMultiSend(txs);
  }

  public async buildMultisigTx(params: {
    shouldSetName: boolean;
    shouldSetSnapshot: boolean;
  }): Promise<string> {
    const { shouldSetName, shouldSetSnapshot } = params;
    const multisigTxBuilder = this.txBuilderFactory.createMultiSigTxBuilder();

    if (shouldSetName) {
      this.internalTxs.push(this.buildUpdateDAONameTx());
    }

    if (shouldSetSnapshot) {
      this.internalTxs.push(this.buildUpdateDAOSnapshotENSTx());
    }

    // subDAO case, add freeze guard
    if (this.parentAddress) {
      const freezeGuardTxBuilder = this.txBuilderFactory.createFreezeGuardTxBuilder(
        undefined,
        undefined,
        this.parentStrategyType,
        this.parentStrategyAddress,
      );

      if (this.enableFractalModuleTx) {
        this.internalTxs = this.internalTxs.concat(
          // Enable Fractal Module b/c this a subDAO
          this.enableFractalModuleTx,
        );
      }

      this.internalTxs = this.internalTxs.concat(
        freezeGuardTxBuilder.buildDeployZodiacModuleTx(),
        freezeGuardTxBuilder.buildFreezeVotingSetupTx(),
        freezeGuardTxBuilder.buildDeployFreezeGuardTx(),
        freezeGuardTxBuilder.buildSetGuardTxSafe(this.safeContractAddress),
      );
    }

    this.internalTxs.push(multisigTxBuilder.buildRemoveMultiSendOwnerTx());

    const txs: SafeTransaction[] = [
      this.createSafeTx,
      this.buildExecInternalSafeTx(multisigTxBuilder.signatures()),
    ];

    if (this.parentAddress && this.deployFractalModuleTx) {
      // If subDAO, and `deployFractalModuleTx` created (which might not be the case depending on user input) - deploy Fractal Module.
      txs.splice(1, 0, this.deployFractalModuleTx);
    }

    return encodeMultiSend(txs);
  }

  //
  // Setup Fractal Txs for use by
  // both Multisig + Azorius subDAOs
  //

  private setFractalModuleTxs(): void {
    const { enableFractalModuleTx, deployFractalModuleTx }: DecentModule = fractalModuleData(
      this.moduleFractalMasterCopy,
      this.zodiacModuleProxyFactory,
      this.safeContractAddress,
      this.saltNum,
      this.parentAddress,
    );

    this.enableFractalModuleTx = enableFractalModuleTx;
    this.deployFractalModuleTx = deployFractalModuleTx;
  }

  //
  // Txs shared by all DAO types
  //

  private buildUpdateDAONameTx(): SafeTransaction {
    return buildContractCall({
      target: this.keyValuePairs,
      encodedFunctionData: encodeFunctionData({
        functionName: 'updateValues',
        args: [['daoName'], [this.daoData.daoName]],
        abi: legacy.abis.KeyValuePairs,
      }),
    });
  }

  private buildUpdateDAOSnapshotENSTx(): SafeTransaction {
    return buildContractCall({
      target: this.keyValuePairs,
      encodedFunctionData: encodeFunctionData({
        functionName: 'updateValues',
        args: [['snapshotENS'], [this.daoData.snapshotENS]],
        abi: legacy.abis.KeyValuePairs,
      }),
    });
  }

  private buildExecInternalSafeTx(signatures: Hex): SafeTransaction {
    const encodedInternalTxs = encodeMultiSend(this.internalTxs);

    const internalTxTarget = this.multiSendCallOnly;
    const internalTxCalldata = encodeFunctionData({
      abi: MultiSendCallOnlyAbi,
      functionName: 'multiSend',
      args: [encodedInternalTxs],
    });
    return buildContractCall({
      target: this.safeContractAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'execTransaction',
        args: [
          internalTxTarget,
          0n, // value
          internalTxCalldata,
          1, // operation
          0n, // tx gas
          0n, // base gas
          0n, // gas price
          zeroAddress, // gas token
          zeroAddress, // receiver
          signatures,
        ],
        abi: GnosisSafeL2Abi,
      }),
    });
  }
}
