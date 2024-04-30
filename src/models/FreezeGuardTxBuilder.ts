import {
  Azorius,
  AzoriusFreezeGuard__factory,
  ERC20FreezeVoting__factory,
  MultisigFreezeGuard__factory,
  MultisigFreezeVoting__factory,
  ERC721FreezeVoting__factory,
  MultisigFreezeVoting,
  ERC20FreezeVoting,
  ERC721FreezeVoting,
} from '@fractal-framework/fractal-contracts';
import { ethers } from 'ethers';
import { getCreate2Address, solidityKeccak256 } from 'ethers/lib/utils';
import { GnosisSafeL2 } from '../assets/typechain-types/usul/@gnosis.pm/safe-contracts/contracts';
import { buildContractCall } from '../helpers';
import {
  BaseContracts,
  SafeTransaction,
  SubDAO,
  AzoriusContracts,
  VotingStrategyType,
} from '../types';
import { BaseTxBuilder } from './BaseTxBuilder';
import {
  buildDeployZodiacModuleTx,
  generateContractByteCodeLinear,
  generatePredictedModuleAddress,
  generateSalt,
} from './helpers/utils';

export class FreezeGuardTxBuilder extends BaseTxBuilder {
  // Salt used to generate transactions
  private readonly saltNum;

  // Safe Data
  private readonly safeContract: GnosisSafeL2;

  // Freeze Voting Data
  private freezeVotingType: any;
  private freezeVotingCallData: string | undefined;
  private freezeVotingAddress: string | undefined;

  // Freeze Guard Data
  private freezeGuardCallData: string | undefined;
  private freezeGuardAddress: string | undefined;

  // Azorius Data
  private azoriusAddress: string | undefined;
  private strategyAddress: string | undefined;

  private parentStrategyType: VotingStrategyType | undefined;
  private parentStrategyAddress: string | undefined;

  constructor(
    signerOrProvider: any,
    baseContracts: BaseContracts,
    daoData: SubDAO,
    safeContract: GnosisSafeL2,
    saltNum: string,
    parentAddress: string,
    parentTokenAddress?: string,
    azoriusContracts?: AzoriusContracts,
    azoriusAddress?: string,
    strategyAddress?: string,
    parentStrategyType?: VotingStrategyType,
    parentStrategyAddress?: string,
  ) {
    super(
      signerOrProvider,
      baseContracts,
      azoriusContracts,
      daoData,
      parentAddress,
      parentTokenAddress,
    );

    this.safeContract = safeContract;
    this.saltNum = saltNum;
    this.azoriusAddress = azoriusAddress;
    this.strategyAddress = strategyAddress;
    this.parentStrategyType = parentStrategyType;
    this.parentStrategyAddress = parentStrategyAddress;

    this.initFreezeVotesData();
  }

  initFreezeVotesData() {
    this.setFreezeVotingTypeAndCallData();
    this.setFreezeVotingAddress();
    this.setFreezeGuardData();
    this.setFreezeGuardAddress();
  }

  public buildDeployZodiacModuleTx(): SafeTransaction {
    return buildContractCall(
      this.baseContracts.zodiacModuleProxyFactoryContract,
      'deployModule',
      [
        this.freezeVotingType === ERC20FreezeVoting__factory
          ? this.baseContracts.freezeERC20VotingMasterCopyContract.address
          : this.freezeVotingType === ERC721FreezeVoting__factory
            ? this.baseContracts.freezeERC721VotingMasterCopyContract.address
            : this.baseContracts.freezeMultisigVotingMasterCopyContract.address,
        this.freezeVotingCallData,
        this.saltNum,
      ],
      0,
      false,
    );
  }

  public buildFreezeVotingSetupTx(): SafeTransaction {
    const subDaoData = this.daoData as SubDAO;

    return buildContractCall(
      this.freezeVotingType.connect(this.freezeVotingAddress, this.signerOrProvider),
      'setUp',
      [
        ethers.utils.defaultAbiCoder.encode(
          ['address', 'uint256', 'uint32', 'uint32', 'address'],
          [
            this.parentAddress, // Owner -- Parent DAO
            subDaoData.freezeVotesThreshold, // FreezeVotesThreshold
            subDaoData.freezeProposalPeriod, // FreezeProposalPeriod
            subDaoData.freezePeriod, // FreezePeriod
            this.parentStrategyType === VotingStrategyType.LINEAR_ERC721
              ? this.parentStrategyAddress
              : this.parentTokenAddress ?? this.parentAddress, // Parent Votes Token or Parent Safe Address
          ],
        ),
      ],
      0,
      false,
    );
  }

  public buildSetGuardTx(contract: GnosisSafeL2 | Azorius): SafeTransaction {
    return buildContractCall(contract, 'setGuard', [this.freezeGuardAddress], 0, false);
  }

  public buildDeployFreezeGuardTx() {
    return buildDeployZodiacModuleTx(this.baseContracts.zodiacModuleProxyFactoryContract, [
      this.getGuardMasterCopyAddress(),
      this.freezeGuardCallData!,
      this.saltNum,
    ]);
  }

  /**
   * Methods to generate freeze voting and guard addresses
   * As well as calldata needed to create deploy Txs
   */

  private setFreezeVotingTypeAndCallData() {
    if (this.parentStrategyType) {
      if (this.parentStrategyType === VotingStrategyType.LINEAR_ERC20) {
        this.freezeVotingType = ERC20FreezeVoting__factory;
      } else if (this.parentStrategyType === VotingStrategyType.LINEAR_ERC721) {
        this.freezeVotingType = ERC721FreezeVoting__factory;
      }
    } else {
      this.freezeVotingType = MultisigFreezeVoting__factory;
    }

    this.freezeVotingCallData = this.freezeVotingType.createInterface().encodeFunctionData('owner');
  }

  private setFreezeVotingAddress() {
    let freezeVotesMasterCopyContract:
      | MultisigFreezeVoting
      | ERC20FreezeVoting
      | ERC721FreezeVoting = this.baseContracts.freezeMultisigVotingMasterCopyContract;
    if (this.parentStrategyType) {
      if (this.parentStrategyType === VotingStrategyType.LINEAR_ERC20) {
        freezeVotesMasterCopyContract = this.baseContracts.freezeERC20VotingMasterCopyContract;
      } else if (this.parentStrategyType === VotingStrategyType.LINEAR_ERC721) {
        freezeVotesMasterCopyContract = this.baseContracts.freezeERC721VotingMasterCopyContract;
      }
    }

    const freezeVotingByteCodeLinear = generateContractByteCodeLinear(
      freezeVotesMasterCopyContract.address.slice(2),
    );

    this.freezeVotingAddress = getCreate2Address(
      this.baseContracts.zodiacModuleProxyFactoryContract.address,
      generateSalt(this.freezeVotingCallData!, this.saltNum),
      solidityKeccak256(['bytes'], [freezeVotingByteCodeLinear]),
    );
  }

  private setFreezeGuardAddress() {
    const freezeGuardByteCodeLinear = generateContractByteCodeLinear(
      this.getGuardMasterCopyAddress().slice(2),
    );
    const freezeGuardSalt = generateSalt(this.freezeGuardCallData!, this.saltNum);

    this.freezeGuardAddress = generatePredictedModuleAddress(
      this.baseContracts.zodiacModuleProxyFactoryContract.address,
      freezeGuardSalt,
      freezeGuardByteCodeLinear,
    );
  }

  private setFreezeGuardData() {
    if (this.azoriusAddress) {
      this.setFreezeGuardCallDataAzorius();
    } else {
      this.setFreezeGuardCallDataMultisig();
    }
  }

  private setFreezeGuardCallDataMultisig() {
    const subDaoData = this.daoData as SubDAO;

    this.freezeGuardCallData = MultisigFreezeGuard__factory.createInterface().encodeFunctionData(
      'setUp',
      [
        ethers.utils.defaultAbiCoder.encode(
          ['uint32', 'uint32', 'address', 'address', 'address'],
          [
            subDaoData.timelockPeriod, // Timelock Period
            subDaoData.executionPeriod, // Execution Period
            this.parentAddress, // Owner -- Parent DAO
            this.freezeVotingAddress, // Freeze Voting
            this.safeContract.address, // Safe
          ],
        ),
      ],
    );
  }

  private setFreezeGuardCallDataAzorius() {
    this.freezeGuardCallData = AzoriusFreezeGuard__factory.createInterface().encodeFunctionData(
      'setUp',
      [
        ethers.utils.defaultAbiCoder.encode(
          ['address', 'address'],
          [
            this.parentAddress, // Owner -- Parent DAO
            this.freezeVotingAddress, // Freeze Voting
          ],
        ),
      ],
    );
  }

  private getGuardMasterCopyAddress(): string {
    return this.azoriusContracts
      ? this.azoriusContracts.azoriusFreezeGuardMasterCopyContract.address
      : this.baseContracts.multisigFreezeGuardMasterCopyContract.address;
  }
}
