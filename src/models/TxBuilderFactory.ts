import { Address, PublicClient, getContract } from 'viem';
import GnosisSafeL2Abi from '../assets/abi/GnosisSafeL2';
import GnosisSafeProxyFactoryAbi from '../assets/abi/GnosisSafeProxyFactory';
import { getRandomBytes } from '../helpers';
import {
  AzoriusERC20DAO,
  AzoriusERC721DAO,
  SafeMultisigDAO,
  SafeTransaction,
  SubDAO,
  VotingStrategyType,
} from '../types';
import { AzoriusTxBuilder } from './AzoriusTxBuilder';
import { BaseTxBuilder } from './BaseTxBuilder';
import { DaoTxBuilder } from './DaoTxBuilder';
import { FreezeGuardTxBuilder } from './FreezeGuardTxBuilder';
import { MultisigTxBuilder } from './MultisigTxBuilder';
import { safeData } from './helpers/safeData';

export class TxBuilderFactory extends BaseTxBuilder {
  private readonly saltNum: bigint;

  // Safe Data
  public predictedSafeAddress: Address | undefined;
  public createSafeTx: SafeTransaction | undefined;
  private safeContractAddress: Address | undefined;
  private compatibilityFallbackHandler: Address;
  private votesErc20MasterCopy: Address;
  private keyValuePairs: Address;
  private gnosisSafeProxyFactory: Address;
  private gnosisSafeProxy: Address;
  private zodiacModuleProxyFactory: Address;
  private freezeGuardAzoriusMasterCopy: Address;
  private freezeGuardMultisigMasterCopy: Address;
  private freezeVotingErc20MasterCopy: Address;
  private freezeVotingErc721MasterCopy: Address;
  private freezeVotingMultisigMasterCopy: Address;
  private multiSendCallOnly: Address;
  private claimErc20MasterCopy: Address;
  private moduleFractalMasterCopy: Address;
  private linearVotingErc20MasterCopy: Address;
  private linearVotingErc721MasterCopy: Address;
  private moduleAzoriusMasterCopy: Address;

  constructor(
    publicClient: PublicClient,
    isAzorius: boolean,
    daoData: SafeMultisigDAO | AzoriusERC20DAO | AzoriusERC721DAO | SubDAO,
    compatibilityFallbackHandler: Address,
    votesErc20MasterCopy: Address,
    keyValuePairs: Address,
    gnosisSafeProxyFactory: Address,
    gnosisSafeProxy: Address,
    zodiacModuleProxyFactory: Address,
    freezeGuardAzoriusMasterCopy: Address,
    freezeGuardMultisigMasterCopy: Address,
    freezeVotingErc20MasterCopy: Address,
    freezeVotingErc721MasterCopy: Address,
    freezeVotingMultisigMasterCopy: Address,
    multiSendCallOnly: Address,
    claimErc20MasterCopy: Address,
    moduleFractalMasterCopy: Address,
    linearVotingErc20MasterCopy: Address,
    linearVotingErc721MasterCopy: Address,
    moduleAzoriusMasterCopy: Address,
    parentAddress?: Address,
    parentTokenAddress?: Address,
  ) {
    super(publicClient, isAzorius, daoData, parentAddress, parentTokenAddress);
    this.saltNum = getRandomBytes();

    this.compatibilityFallbackHandler = compatibilityFallbackHandler;
    this.votesErc20MasterCopy = votesErc20MasterCopy;
    this.keyValuePairs = keyValuePairs;
    this.gnosisSafeProxyFactory = gnosisSafeProxyFactory;
    this.gnosisSafeProxy = gnosisSafeProxy;
    this.zodiacModuleProxyFactory = zodiacModuleProxyFactory;
    this.freezeGuardAzoriusMasterCopy = freezeGuardAzoriusMasterCopy;
    this.freezeGuardMultisigMasterCopy = freezeGuardMultisigMasterCopy;
    this.freezeVotingErc20MasterCopy = freezeVotingErc20MasterCopy;
    this.freezeVotingErc721MasterCopy = freezeVotingErc721MasterCopy;
    this.freezeVotingMultisigMasterCopy = freezeVotingMultisigMasterCopy;
    this.multiSendCallOnly = multiSendCallOnly;
    this.claimErc20MasterCopy = claimErc20MasterCopy;
    this.moduleFractalMasterCopy = moduleFractalMasterCopy;
    this.linearVotingErc20MasterCopy = linearVotingErc20MasterCopy;
    this.linearVotingErc721MasterCopy = linearVotingErc721MasterCopy;
    this.moduleAzoriusMasterCopy = moduleAzoriusMasterCopy;
  }

  public setSafeContract(safeAddress: Address) {
    this.safeContractAddress = safeAddress;
  }

  public async setupSafeData() {
    const safeProxyFactoryContract = getContract({
      abi: GnosisSafeProxyFactoryAbi,
      address: this.gnosisSafeProxyFactory,
      client: this.publicClient,
    });
    const safeSingletonContract = getContract({
      abi: GnosisSafeL2Abi,
      address: this.gnosisSafeProxy,
      client: this.publicClient,
    });
    const { predictedSafeAddress, createSafeTx } = await safeData(
      this.multiSendCallOnly,
      safeProxyFactoryContract,
      safeSingletonContract,
      this.daoData as SafeMultisigDAO,
      this.saltNum,
      this.compatibilityFallbackHandler,
      this.isAzorius,
    );

    this.predictedSafeAddress = predictedSafeAddress;
    this.createSafeTx = createSafeTx;

    this.setSafeContract(predictedSafeAddress);
  }

  public createDaoTxBuilder({
    attachFractalModule,
    parentStrategyType,
    parentStrategyAddress,
  }: {
    attachFractalModule?: boolean;
    parentStrategyType?: VotingStrategyType;
    parentStrategyAddress?: Address;
  }) {
    return new DaoTxBuilder(
      this.publicClient,
      this.isAzorius,
      this.daoData,
      this.saltNum,
      this.createSafeTx!,
      this.safeContractAddress!,
      this,
      this.keyValuePairs,
      this.zodiacModuleProxyFactory,
      this.multiSendCallOnly,
      this.moduleFractalMasterCopy,
      attachFractalModule,
      this.parentAddress,
      this.parentTokenAddress,
      parentStrategyType,
      parentStrategyAddress,
    );
  }

  public createFreezeGuardTxBuilder(
    azoriusAddress?: Address,
    strategyAddress?: Address,
    parentStrategyType?: VotingStrategyType,
    parentStrategyAddress?: Address, // User only with ERC-721 parent
  ) {
    return new FreezeGuardTxBuilder(
      this.publicClient,
      this.daoData as SubDAO,
      this.safeContractAddress!,
      this.saltNum,
      this.parentAddress!,
      this.zodiacModuleProxyFactory,
      this.freezeGuardAzoriusMasterCopy,
      this.freezeGuardMultisigMasterCopy,
      this.freezeVotingErc20MasterCopy,
      this.freezeVotingErc721MasterCopy,
      this.freezeVotingMultisigMasterCopy,
      this.isAzorius,
      this.parentTokenAddress,
      azoriusAddress,
      strategyAddress,
      parentStrategyType,
      parentStrategyAddress,
    );
  }

  public createMultiSigTxBuilder() {
    return new MultisigTxBuilder(
      this.multiSendCallOnly,
      this.daoData as SafeMultisigDAO,
      this.safeContractAddress!,
    );
  }

  public async createAzoriusTxBuilder() {
    const azoriusTxBuilder = new AzoriusTxBuilder(
      this.publicClient,
      this.daoData as AzoriusERC20DAO,
      this.safeContractAddress!,
      this.votesErc20MasterCopy,
      this.zodiacModuleProxyFactory,
      this.multiSendCallOnly,
      this.claimErc20MasterCopy,
      this.linearVotingErc20MasterCopy,
      this.linearVotingErc721MasterCopy,
      this.moduleAzoriusMasterCopy,
      this.parentAddress,
      this.parentTokenAddress,
    );

    await azoriusTxBuilder.init();
    return azoriusTxBuilder;
  }
}
