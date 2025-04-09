import { abis } from '@fractal-framework/fractal-contracts';
import { Address, encodeFunctionData, PublicClient, zeroAddress } from 'viem';
import GnosisSafeL2Abi from '../assets/abi/GnosisSafeL2';
import MultiSendCallOnlyAbi from '../assets/abi/MultiSendCallOnly';
import { buildContractCall, encodeMultiSend } from '../helpers';
import { FeatureFlags } from '../helpers/featureFlags';
import {
  AzoriusERC20DAO,
  AzoriusERC721DAO,
  SafeMultisigDAO,
  SafeTransaction,
  VotingStrategyType,
} from '../types';
import { BaseTxBuilder } from './BaseTxBuilder';
import { TxBuilderFactory } from './TxBuilderFactory';
import { fractalModuleData, DecentModule } from './helpers/fractalModuleData';

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
    enableGaslessVoting: boolean;
    existingSafeOwners?: string[];
    rundlerMinimumStake?: bigint;
  }): Promise<string> {
    const {
      shouldSetName,
      shouldSetSnapshot,
      existingSafeOwners,
      enableGaslessVoting,
      rundlerMinimumStake,
    } = params;
    const azoriusTxBuilder = await this.txBuilderFactory.createAzoriusTxBuilder();

    // Can't use hook here, so only read from local env without Firebase remote config
    const enableGaslessStaking =
      enableGaslessVoting && !!FeatureFlags.instance?.isFeatureEnabled('flag_gasless_staking');

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
        freezeGuardTxBuilder.buildSetGuardTx(abis.Azorius, azoriusTxBuilder.azoriusAddress!),
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

    txs.push(azoriusTxBuilder.buildDeployStrategyTx(enableGaslessVoting));
    txs.push(azoriusTxBuilder.buildDeployAzoriusTx());

    // Deploy paymaster and set gasless voting enabled
    if (enableGaslessVoting) {
      this.internalTxs.push(azoriusTxBuilder.buildDeployPaymasterTx());
      this.internalTxs.push(this.buildSetGaslessVotingEnabledTx());
      this.internalTxs.push(await azoriusTxBuilder.buildApproveStrategyOnPaymasterTx());
    }

    // Add stake with paymaster
    if (enableGaslessStaking && rundlerMinimumStake !== undefined) {
      this.internalTxs.push(await azoriusTxBuilder.buildAddStakeOnPaymasterTx(rundlerMinimumStake));
    }

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
    return buildContractCall(
      abis.KeyValuePairs,
      this.keyValuePairs,
      'updateValues',
      [['daoName'], [this.daoData.daoName]],
      0,
      false,
    );
  }

  private buildUpdateDAOSnapshotENSTx(): SafeTransaction {
    return buildContractCall(
      abis.KeyValuePairs,
      this.keyValuePairs,
      'updateValues',
      [['snapshotENS'], [this.daoData.snapshotENS]],
      0,
      false,
    );
  }

  private buildSetGaslessVotingEnabledTx(): SafeTransaction {
    return buildContractCall(
      abis.KeyValuePairs,
      this.keyValuePairs,
      'updateValues',
      [['gaslessVotingEnabled'], ['true']],
      0,
      false,
    );
  }

  private buildExecInternalSafeTx(signatures: string): SafeTransaction {
    const safeInternalTx = encodeMultiSend(this.internalTxs);
    return buildContractCall(
      GnosisSafeL2Abi,
      this.safeContractAddress,
      'execTransaction',
      [
        this.multiSendCallOnly, // to
        '0', // value
        encodeFunctionData({
          abi: MultiSendCallOnlyAbi,
          functionName: 'multiSend',
          args: [safeInternalTx],
        }), // calldata
        '1', // operation
        '0', // tx gas
        '0', // base gas
        '0', // gas price
        zeroAddress, // gas token
        zeroAddress, // receiver
        signatures, // sigs
      ],
      0,
      false,
    );
  }
}
