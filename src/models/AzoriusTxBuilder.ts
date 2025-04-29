import { abis } from '@fractal-framework/fractal-contracts';

import {
  Address,
  Hex,
  PublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAddress,
  getContract,
  getCreate2Address,
  keccak256,
  parseAbiParameters,
} from 'viem';
import GnosisSafeL2Abi from '../assets/abi/GnosisSafeL2';
import { ZodiacModuleProxyFactoryAbi } from '../assets/abi/ZodiacModuleProxyFactoryAbi';
import { linearERC20VotingSetupParams, linearERC721VotingSetupParams } from '../constants/params';
import { buildContractCall, buildSignatures } from '../helpers';
import {
  AzoriusERC20DAO,
  AzoriusERC721DAO,
  AzoriusGovernanceDAO,
  ERC721TokenConfig,
  SafeTransaction,
  TokenLockType,
  VotingStrategyType,
} from '../types';
import { NetworkConfig } from '../types/network';
import { SENTINEL_MODULE } from '../utils/address';
import { BaseTxBuilder, ContractCallTarget } from './BaseTxBuilder';
import { generateContractByteCodeLinear, generateSalt } from './helpers/utils';

export type PredictedAddressAndInitialization = {
  address: Address;
  encodedSetupData: Hex;
};

export class AzoriusTxBuilder extends BaseTxBuilder {
  // private readonly safeContract: ContractCallTarget;

  // private encodedSetupTokenData: Hex | undefined;
  // private encodedStrategySetupData: Hex | undefined;
  // private encodedSetupAzoriusData: Hex | undefined;
  // private encodedSetupTokenClaimData: Hex | undefined;

  // private predictedTokenAddress: Address | undefined;
  // private predictedStrategyAddress: Address | undefined;
  // private predictedAzoriusAddress: Address | undefined;
  // private predictedTokenClaimAddress: Address | undefined;

  // public linearERC20VotingAddress: Address | undefined;
  // public linearERC721VotingAddress: Address | undefined;
  // public votesTokenAddress: Address | undefined;
  // private votesErc20MasterCopy: Address;
  // private votesErc20LockableMasterCopy?: Address;
  // private zodiacModuleProxyFactory: ContractCallTarget;
  // private multiSendCallOnly: Address;
  // private claimErc20MasterCopy: Address;
  // private linearVotingErc20MasterCopy: Address;
  // private linearVotingErc721MasterCopy: Address;
  // private moduleAzoriusMasterCopy: Address;
  // private tokenNonce: bigint;
  // private strategyNonce: bigint;
  // private azoriusNonce: bigint;
  // private claimNonce: bigint;

  // constructor(
  //   publicClient: PublicClient,
  //   daoData: AzoriusERC20DAO | AzoriusERC721DAO,
  //   safeContractAddress: Address,
  //   votesErc20MasterCopy: Address,
  //   zodiacModuleProxyFactory: Address,
  //   multiSendCallOnly: Address,
  //   claimErc20MasterCopy: Address,
  //   linearVotingErc20MasterCopy: Address,
  //   linearVotingErc721MasterCopy: Address,
  //   moduleAzoriusMasterCopy: Address,
  //   votesErc20LockableMasterCopy?: Address,
  //   parentAddress?: Address,
  //   parentTokenAddress?: Address,
  // ) {
  //   super(publicClient, true, daoData, parentAddress, parentTokenAddress);

  //   this.safeContract = {
  //     address: safeContractAddress,
  //     abi: GnosisSafeL2Abi,
  //     description: 'Safe Contract',
  //   };

  //   // this.tokenNonce = getRandomBytes();
  //   // this.claimNonce = getRandomBytes();
  //   // this.strategyNonce = getRandomBytes();
  //   // this.azoriusNonce = getRandomBytes();
  //   this.votesErc20MasterCopy = votesErc20MasterCopy;
  //   this.votesErc20LockableMasterCopy = votesErc20LockableMasterCopy;
  //   this.zodiacModuleProxyFactory = {
  //     address: zodiacModuleProxyFactory,
  //     abi: ZodiacModuleProxyFactoryAbi,
  //     description: 'Zodiac Module Proxy Factory',
  //   };
  //   this.multiSendCallOnly = multiSendCallOnly;
  //   this.claimErc20MasterCopy = claimErc20MasterCopy;
  //   this.linearVotingErc20MasterCopy = linearVotingErc20MasterCopy;
  //   this.linearVotingErc721MasterCopy = linearVotingErc721MasterCopy;
  //   this.moduleAzoriusMasterCopy = moduleAzoriusMasterCopy;

  //   // if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20) {
  //   //   daoData = daoData as AzoriusERC20DAO;
  //   //   if (!daoData.isTokenImported) {
  //   //     if (daoData.locked === TokenLockType.LOCKED && !votesErc20LockableMasterCopy) {
  //   //       throw new Error('Votes Erc20 Lockable Master Copy address not set');
  //   //     }
  //   //     this.setEncodedSetupTokenData();
  //   //     this.setPredictedTokenAddress();
  //   //   } else {
  //   //     // if (daoData.isVotesToken) {
  //   //     //   this.predictedTokenAddress = daoData.tokenImportAddress as Address;
  //   //     // }
  //   //   }
  //   // }
  // }

  // public get azoriusAddress(): Address {
  //   if (!this.predictedAzoriusAddress) {
  //     throw new Error('Azorius address not set');
  //   }

  //   return this.predictedAzoriusAddress;
  // }

  // public async init() {
  //   const strategyNonce = getRandomBytes();
  //   const azoriusNonce = getRandomBytes();
  //   const claimNonce = getRandomBytes();
  //   const tokenNonce = getRandomBytes();

  //   const encodedSetupTokenData = this.encodeSetupTokenData();
  //   const predictedTokenAddress = this.predictTokenAddress(encodedSetupTokenData, tokenNonce);
  //   const predictedStrategyAddress = await this.predictStrategyAddress(
  //     predictedTokenAddress,
  //     strategyNonce,
  //   );
  //   const predictedAzoriusAddress = this.predictAzoriusAddress(
  //     this.ensure({ data: predictedStrategyAddress, description: 'Predicted Strategy Address' }),
  //     azoriusNonce,
  //   );

  //   if (
  //     (this.daoData as AzoriusERC20DAO | AzoriusERC721DAO).votingStrategyType ===
  //     VotingStrategyType.LINEAR_ERC20
  //   ) {
  //     const azoriusDAOData = this.daoData as AzoriusERC20DAO;
  //     if (
  //       this.parentTokenAddress &&
  //       azoriusDAOData.parentAllocationAmount &&
  //       azoriusDAOData.parentAllocationAmount !== 0n
  //     ) {
  //       const encodedSetupTokenClaimData = this.encodeSetupTokenClaimData(
  //         this.parentTokenAddress,
  //         predictedTokenAddress,
  //       );
  //       const predictedTokenClaimAddress = this.predictTokenClaimAddress(
  //         encodedSetupTokenClaimData,
  //         claimNonce,
  //       );
  //     }
  //   }
  // }

  public async predict(params: {
    publicClient: PublicClient;
    networkConfig: NetworkConfig;
    safeContractAddress: Address;
    nonces: {
      strategyNonce: bigint;
      azoriusNonce: bigint;
      claimNonce: bigint;
      tokenNonce: bigint;
    };
    tokenData: {
      lockType: TokenLockType;
      name: string;
      symbol: string;
      supply: bigint;
      allocations: { amount: bigint; address: string }[];
    };
    strategyData: {
      votingStrategyType: VotingStrategyType;
      votingPeriod: number;
      erc20Data?: {
        quorumPercentage?: bigint;
      };
      erc721Data?: {
        nfts: ERC721TokenConfig<bigint>[];
        quorumThreshold: bigint;
      };
    };
    goveranceData: {
      timelock: number;
      executionPeriod: number;
    };
    parentAllocation?: {
      tokenAddress: Address;
      amount: bigint;
    };
  }): Promise<{
    token: PredictedAddressAndInitialization;
    strategy: PredictedAddressAndInitialization;
    azorius: PredictedAddressAndInitialization;
    tokenClaim?: PredictedAddressAndInitialization;
  }> {
    const {
      publicClient,
      networkConfig,
      safeContractAddress,
      nonces,
      tokenData,
      strategyData,
      goveranceData,
      parentAllocation,
    } = params;
    const encodedSetupTokenData = this.encodeSetupTokenData({ safeContractAddress, tokenData });
    const predictedTokenAddress = this.predictTokenAddress({
      networkConfig,
      encodedSetupTokenData,
      lockType: tokenData.lockType,
      tokenNonce: nonces.tokenNonce,
    });
    const predictedStrategy = await this.predictStrategyAddress({
      publicClient,
      networkConfig,
      safeContractAddress,
      predictedTokenAddress,
      strategyNonce: nonces.strategyNonce,
      strategyData,
    });
    const predictedAzorius = this.predictAzorius({
      networkConfig,
      safeContractAddress,
      predictedStrategyAddress: predictedStrategy.address,
      azoriusNonce: nonces.azoriusNonce,
      goveranceData,
    });
    let predictedTokenClaim = undefined;
    if (strategyData.votingStrategyType === VotingStrategyType.LINEAR_ERC20) {
      if (parentAllocation && parentAllocation.amount !== 0n) {
        const encodedSetupTokenClaimData = this.encodeSetupTokenClaimData({
          safeContractAddress,
          parentTokenAddress: parentAllocation.tokenAddress,
          predictedTokenAddress,
          parentAllocationAmount: parentAllocation.amount,
        });
        predictedTokenClaim = {
          address: this.predictTokenClaimAddress({
            networkConfig,
            encodedSetupTokenClaimData,
            claimNonce: nonces.claimNonce,
          }),
          encodedSetupData: encodedSetupTokenClaimData,
        };
      }
    }
    return {
      token: {
        address: predictedTokenAddress,
        encodedSetupData: encodedSetupTokenData,
      },
      strategy: predictedStrategy,
      azorius: predictedAzorius,
      tokenClaim: predictedTokenClaim,
    };
  }

  private safeContract(safeContractAddress: Address): ContractCallTarget {
    return {
      address: safeContractAddress,
      abi: GnosisSafeL2Abi,
      description: 'Safe Contract',
    };
  }

  private zodiacModuleProxyFactory(zodiacModuleProxyFactoryAddress: Address): ContractCallTarget {
    return {
      address: zodiacModuleProxyFactoryAddress,
      abi: ZodiacModuleProxyFactoryAbi,
      description: 'Zodiac Module Proxy Factory',
    };
  }

  public buildRemoveOwners(params: {
    safeContractAddress: Address;
    multiSendCallOnly: Address;
    owners: Address[];
  }): SafeTransaction[] {
    const { safeContractAddress, multiSendCallOnly, owners } = params;
    const safeContract = this.safeContract(safeContractAddress);
    return owners.map(owner =>
      this.call({
        target: safeContract,
        functionName: 'removeOwner',
        args: [multiSendCallOnly, owner, 1n],
      }),
    );
  }

  public buildVotingContractSetupTx(params: {
    networkConfig: NetworkConfig;
    predictedAzoriusAddress: Address;
    votingStrategyType: VotingStrategyType;
  }): SafeTransaction {
    const { networkConfig, predictedAzoriusAddress, votingStrategyType } = params;
    return this.call({
      target: this._contractSetupTarget(networkConfig, votingStrategyType),
      functionName: 'setAzorius',
      args: [predictedAzoriusAddress],
    });
  }

  private _contractSetupTarget(
    networkConfig: NetworkConfig,
    votingStrategyType: VotingStrategyType,
  ): ContractCallTarget {
    if (votingStrategyType === VotingStrategyType.LINEAR_ERC20) {
      return {
        address: networkConfig.contracts.linearVotingErc20V1MasterCopy,
        abi: abis.LinearERC20VotingV1,
        description: 'Linear ERC20 Voting Address',
      };
    } else if (votingStrategyType === VotingStrategyType.LINEAR_ERC721) {
      return {
        address: networkConfig.contracts.linearVotingErc721V1MasterCopy,
        abi: abis.LinearERC721VotingV1,
        description: 'Linear ERC721 Voting Address',
      };
    } else {
      throw new Error('voting strategy type unknown');
    }
  }

  public buildEnableAzoriusModuleTx(params: {
    safeContractAddress: Address;
    predictedAzoriusAddress: Address;
  }): SafeTransaction {
    const { safeContractAddress, predictedAzoriusAddress } = params;
    const safeContract = this.safeContract(safeContractAddress);
    return this.call({
      target: safeContract,
      functionName: 'enableModule',
      args: [predictedAzoriusAddress],
    });
  }

  public buildAddAzoriusContractAsOwnerTx(params: {
    safeContractAddress: Address;
    predictedAzoriusAddress: Address;
  }): SafeTransaction {
    const { safeContractAddress, predictedAzoriusAddress } = params;
    const safeContract = this.safeContract(safeContractAddress);
    return this.call({
      target: safeContract,
      functionName: 'addOwnerWithThreshold',
      args: [predictedAzoriusAddress, 1n],
    });
  }

  public buildRemoveMultiSendOwnerTx(params: {
    safeContractAddress: Address;
    multiSendCallOnly: Address;
    predictedAzoriusAddress: Address;
  }): SafeTransaction {
    const { safeContractAddress, multiSendCallOnly, predictedAzoriusAddress } = params;
    const safeContract = this.safeContract(safeContractAddress);
    return this.call({
      target: safeContract,
      functionName: 'removeOwner',
      args: [predictedAzoriusAddress, multiSendCallOnly, 1n],
    });
  }

  public buildCreateTokenTx(params: {
    networkConfig: NetworkConfig;
    lockType: TokenLockType;
    encodedSetupTokenData: `0x${string}`;
    tokenNonce: bigint;
  }): SafeTransaction {
    const { networkConfig, lockType, encodedSetupTokenData, tokenNonce } = params;
    return this.call({
      target: this.zodiacModuleProxyFactory(networkConfig.contracts.zodiacModuleProxyFactory),
      functionName: 'deployModule',
      args: [this._votesErc20Master(networkConfig, lockType), encodedSetupTokenData, tokenNonce],
    });
  }

  private _votesErc20Master(networkConfig: NetworkConfig, lockType: TokenLockType): Address {
    switch (lockType) {
      case TokenLockType.LOCKED:
        return this.ensure({
          data: networkConfig.contracts.votesErc20LockableMasterCopy,
          description: 'Locked ERC20 Token Master Contract',
        });

      case TokenLockType.UNLOCKED:
        return networkConfig.contracts.votesErc20MasterCopy;
    }
  }

  public buildDeployStrategyTx(params: {
    networkConfig: NetworkConfig;
    encodedStrategySetupData: `0x${string}`;
    votingStrategyType: VotingStrategyType;
    strategyNonce: bigint;
  }): SafeTransaction {
    const { networkConfig, encodedStrategySetupData, votingStrategyType, strategyNonce } = params;
    return this.call({
      target: this.zodiacModuleProxyFactory(networkConfig.contracts.zodiacModuleProxyFactory),
      functionName: 'deployModule',
      args: [
        this._votingStrategyMaster(networkConfig, votingStrategyType),
        encodedStrategySetupData,
        strategyNonce,
      ],
    });
  }

  private _votingStrategyMaster(
    networkConfig: NetworkConfig,
    votingStrategy: VotingStrategyType,
  ): Address {
    switch (votingStrategy) {
      case VotingStrategyType.LINEAR_ERC20:
        return networkConfig.contracts.linearVotingErc20MasterCopy;

      case VotingStrategyType.LINEAR_ERC721:
        return networkConfig.contracts.linearVotingErc721MasterCopy;

      default:
        throw Error('Voting Strategy is neither ERC20 nor ERC721');
    }
  }

  public buildDeployAzoriusTx(params: {
    networkConfig: NetworkConfig;
    encodedSetupAzoriusData: `0x${string}`;
    azoriusNonce: bigint;
  }): SafeTransaction {
    const { networkConfig, encodedSetupAzoriusData, azoriusNonce } = params;
    return this.call({
      target: this.zodiacModuleProxyFactory(networkConfig.contracts.zodiacModuleProxyFactory),
      functionName: 'deployModule',
      args: [
        networkConfig.contracts.moduleAzoriusMasterCopy,
        encodedSetupAzoriusData,
        azoriusNonce,
      ],
    });
  }

  public buildDeployTokenClaim(params: {
    networConfig: NetworkConfig;
    encodedSetupTokenClaimData: `0x${string}`;
    claimNonce: bigint;
  }) {
    const { networConfig, encodedSetupTokenClaimData, claimNonce } = params;
    return this.call({
      target: this.zodiacModuleProxyFactory(networConfig.contracts.zodiacModuleProxyFactory),
      functionName: 'deployModule',
      args: [networConfig.contracts.claimErc20MasterCopy, encodedSetupTokenClaimData, claimNonce],
    });
  }

  public buildApproveClaimAllocation(params: {
    votesTokenAddress: Address;
    predictedTokenClaimAddress: Address;
    amount: bigint;
  }) {
    const { votesTokenAddress, predictedTokenClaimAddress, amount } = params;
    return buildContractCall({
      target: votesTokenAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'approve',
        args: [predictedTokenClaimAddress, amount],
        abi: abis.VotesERC20,
      }),
    });
  }

  public signatures(params: { multiSendCallOnlyAddress: Address }): Hex {
    const { multiSendCallOnlyAddress } = params;
    return buildSignatures(multiSendCallOnlyAddress);
  }

  private calculateTokenAllocations(
    safeContractAddress: Address,
    tokenSupply: bigint,
    tokenAllocations: { amount: bigint; address: string }[],
  ): [Address[], bigint[]] {
    const tokenAllocationsOwners = tokenAllocations.map(tokenAllocation =>
      getAddress(tokenAllocation.address),
    );

    const tokenAllocationsValues = tokenAllocations.map(tokenAllocation => tokenAllocation.amount);
    const tokenAllocationSum = tokenAllocationsValues.reduce((accumulator, tokenAllocation) => {
      return tokenAllocation + accumulator;
    }, 0n);

    // Send any un-allocated tokens to the Safe Treasury
    if (tokenSupply > tokenAllocationSum) {
      // TODO -- verify this doesn't need to be the predicted safe address (that they are the same)
      tokenAllocationsOwners.push(safeContractAddress);
      tokenAllocationsValues.push(tokenSupply - tokenAllocationSum);
    }

    return [tokenAllocationsOwners, tokenAllocationsValues];
  }

  private encodeSetupTokenData({
    safeContractAddress,
    tokenData,
  }: {
    safeContractAddress: Address;
    tokenData: {
      lockType: TokenLockType;
      name: string;
      symbol: string;
      supply: bigint;
      allocations: { amount: bigint; address: string }[];
    };
  }): Hex {
    const [tokenAllocationsOwners, tokenAllocationsValues] = this.calculateTokenAllocations(
      safeContractAddress,
      tokenData.supply,
      tokenData.allocations,
    );

    switch (tokenData.lockType) {
      case TokenLockType.LOCKED: {
        const encodedInitTokenData = encodeAbiParameters(
          parseAbiParameters('address, bool, string, string, address[], uint256[]'),
          [
            safeContractAddress,
            true,
            tokenData.name,
            tokenData.symbol,
            tokenAllocationsOwners,
            tokenAllocationsValues,
          ],
        );

        return encodeFunctionData({
          abi: abis.VotesERC20LockableV1,
          functionName: 'initialize',
          args: [encodedInitTokenData],
        });
      }

      case TokenLockType.UNLOCKED: {
        const encodedInitTokenData = encodeAbiParameters(
          parseAbiParameters('string, string, address[], uint256[]'),
          [tokenData.name, tokenData.symbol, tokenAllocationsOwners, tokenAllocationsValues],
        );

        return encodeFunctionData({
          abi: abis.VotesERC20,
          functionName: 'setUp',
          args: [encodedInitTokenData],
        });
      }
    }
  }

  private predictTokenAddress({
    networkConfig,
    encodedSetupTokenData,
    lockType,
    tokenNonce,
  }: {
    networkConfig: NetworkConfig;
    encodedSetupTokenData: Hex;
    lockType: TokenLockType;
    tokenNonce: bigint;
  }): Address {
    const erc20TokenMaster = this._votesErc20Master(networkConfig, lockType);
    const tokenByteCodeLinear = generateContractByteCodeLinear(erc20TokenMaster);
    const tokenSalt = generateSalt(encodedSetupTokenData, tokenNonce);

    return getCreate2Address({
      from: networkConfig.contracts.zodiacModuleProxyFactory,
      salt: tokenSalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [tokenByteCodeLinear])),
    });
  }

  private encodeSetupTokenClaimData({
    safeContractAddress,
    parentTokenAddress,
    predictedTokenAddress,
    parentAllocationAmount,
  }: {
    safeContractAddress: Address;
    parentTokenAddress: Address;
    predictedTokenAddress: Address;
    parentAllocationAmount: bigint;
  }): Hex {
    const encodedInitTokenData = encodeAbiParameters(
      parseAbiParameters('uint32, address, address, address, uint256'),
      [
        0, // `deadlineBlock`, 0 means never expires, currently no UI for setting this in the app.
        safeContractAddress,
        parentTokenAddress,
        predictedTokenAddress,
        parentAllocationAmount,
      ],
    );
    return encodeFunctionData({
      abi: abis.ERC20Claim,
      functionName: 'setUp',
      args: [encodedInitTokenData],
    });
  }

  private predictTokenClaimAddress({
    networkConfig,
    encodedSetupTokenClaimData,
    claimNonce,
  }: {
    networkConfig: NetworkConfig;
    encodedSetupTokenClaimData: Hex;
    claimNonce: bigint;
  }) {
    const tokenByteCodeLinear = generateContractByteCodeLinear(
      networkConfig.contracts.claimErc20MasterCopy,
    );
    const tokenSalt = generateSalt(encodedSetupTokenClaimData, claimNonce);

    return getCreate2Address({
      from: networkConfig.contracts.zodiacModuleProxyFactory,
      salt: tokenSalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [tokenByteCodeLinear])),
    });
  }

  private setupLinearERC20VotingStrategy({
    networkConfig,
    safeContractAddress,
    predictedTokenAddress,
    votingPeriod,
    quorumPercentage,
    quorumDenominator,
  }: {
    networkConfig: NetworkConfig;
    safeContractAddress: Address;
    predictedTokenAddress: Address;
    votingPeriod: number;
    quorumPercentage: bigint;
    quorumDenominator: bigint;
  }): {
    encodedStrategySetupData: Hex;
    strategyByteCodeLinear: Hex;
  } {
    const encodedStrategyInitParams = encodeAbiParameters(
      parseAbiParameters(linearERC20VotingSetupParams),
      [
        safeContractAddress, // owner
        predictedTokenAddress, // governance token
        SENTINEL_MODULE, // Azorius module
        Number(votingPeriod),
        1n, // proposer weight, how much is needed to create a proposal.
        (quorumPercentage * quorumDenominator) / 100n, // quorom numerator, denominator is 1,000,000, so quorum percentage is quorumNumerator * 100 / quorumDenominator
        500000n, // basis numerator, denominator is 1,000,000, so basis percentage is 50% (simple majority)
      ],
    );

    const encodedStrategySetupData = encodeFunctionData({
      abi: abis.LinearERC20Voting,
      functionName: 'setUp',
      args: [encodedStrategyInitParams],
    });

    const strategyByteCodeLinear = generateContractByteCodeLinear(
      networkConfig.contracts.linearVotingErc20MasterCopy,
    );
    return {
      encodedStrategySetupData,
      strategyByteCodeLinear,
    };
  }

  private setupLinearERC721VotingStrategy({
    networkConfig,
    safeContractAddress,
    votingPeriod,
    nfts,
    quorumThreshold,
  }: {
    networkConfig: NetworkConfig;
    safeContractAddress: Address;
    votingPeriod: number;
    nfts: ERC721TokenConfig<bigint>[];
    quorumThreshold: bigint;
  }): {
    encodedStrategySetupData: Hex;
    strategyByteCodeLinear: Hex;
  } {
    const encodedStrategyInitParams = encodeAbiParameters(
      parseAbiParameters(linearERC721VotingSetupParams),
      [
        safeContractAddress, // owner
        nfts.map(nft => nft.tokenAddress!), // governance tokens addresses
        nfts.map(nft => nft.tokenWeight), // governance tokens weights
        SENTINEL_MODULE, // Azorius module
        votingPeriod,
        quorumThreshold, // quorom threshold. Since smart contract can't know total of NFTs minted - we need to provide it manually
        1n, // proposer weight, how much is needed to create a proposal.
        500000n, // basis numerator, denominator is 1,000,000, so basis percentage is 50% (simple majority)
      ],
    );

    const encodedStrategySetupData = encodeFunctionData({
      abi: abis.LinearERC721Voting,
      functionName: 'setUp',
      args: [encodedStrategyInitParams],
    });

    const strategyByteCodeLinear = generateContractByteCodeLinear(
      networkConfig.contracts.linearVotingErc721MasterCopy,
    );
    return {
      encodedStrategySetupData,
      strategyByteCodeLinear,
    };
  }

  private async setupVotingStrategy({
    publicClient,
    networkConfig,
    safeContractAddress,
    predictedTokenAddress,
    strategyData,
  }: {
    publicClient: PublicClient;
    networkConfig: NetworkConfig;
    safeContractAddress: Address;
    predictedTokenAddress: Address;
    strategyData: {
      votingStrategyType: VotingStrategyType;
      votingPeriod: number;
      erc20Data?: {
        quorumPercentage?: bigint;
      };
      erc721Data?: {
        nfts: ERC721TokenConfig<bigint>[];
        quorumThreshold: bigint;
      };
    };
  }): Promise<{
    encodedStrategySetupData: Hex;
    strategyByteCodeLinear: Hex;
  }> {
    switch (strategyData.votingStrategyType) {
      case VotingStrategyType.LINEAR_ERC20: {
        const linearERC20VotingMasterCopyContract = getContract({
          abi: abis.LinearERC20VotingV1,
          address: networkConfig.contracts.linearVotingErc20MasterCopy,
          client: publicClient,
        });

        const quorumDenominator =
          await linearERC20VotingMasterCopyContract.read.QUORUM_DENOMINATOR();
        return this.setupLinearERC20VotingStrategy({
          networkConfig,
          safeContractAddress,
          predictedTokenAddress,
          votingPeriod: strategyData.votingPeriod,
          quorumPercentage: this.ensure({
            data: strategyData.erc20Data?.quorumPercentage,
            description: 'Quorum Percentage',
          }),
          quorumDenominator,
        });
      }

      case VotingStrategyType.LINEAR_ERC721: {
        return this.setupLinearERC721VotingStrategy({
          networkConfig,
          safeContractAddress,
          votingPeriod: strategyData.votingPeriod,
          nfts: this.ensure({
            data: strategyData.erc721Data?.nfts,
            description: 'ERC721 NFT Data',
          }),
          quorumThreshold: this.ensure({
            data: strategyData.erc721Data?.quorumThreshold,
            description: 'Quorum Threshold',
          }),
        });
      }

      default:
        throw Error('Voting Strategy is neither ERC20 nor ERC721');
    }
  }

  private async predictStrategyAddress({
    publicClient,
    networkConfig,
    safeContractAddress,
    predictedTokenAddress,
    strategyNonce,
    strategyData,
  }: {
    publicClient: PublicClient;
    networkConfig: NetworkConfig;
    safeContractAddress: Address;
    predictedTokenAddress: Address;
    strategyNonce: bigint;
    strategyData: {
      votingStrategyType: VotingStrategyType;
      votingPeriod: number;
      erc20Data?: {
        quorumPercentage?: bigint;
      };
      erc721Data?: {
        nfts: ERC721TokenConfig<bigint>[];
        quorumThreshold: bigint;
      };
    };
  }): Promise<PredictedAddressAndInitialization> {
    const strategySetup = await this.setupVotingStrategy({
      publicClient,
      networkConfig,
      safeContractAddress,
      predictedTokenAddress,
      strategyData,
    });
    const { encodedStrategySetupData, strategyByteCodeLinear } = strategySetup;

    const strategySalt = keccak256(
      encodePacked(
        ['bytes32', 'uint256'],
        [keccak256(encodePacked(['bytes'], [encodedStrategySetupData])), strategyNonce],
      ),
    );

    return {
      address: getCreate2Address({
        from: this.ensure({
          data: networkConfig.contracts.zodiacModuleProxyFactory,
          description: 'Zodiac Module Proxy Factory Address',
        }),
        salt: strategySalt,
        bytecodeHash: keccak256(encodePacked(['bytes'], [strategyByteCodeLinear])),
      }),
      encodedSetupData: encodedStrategySetupData,
    };
  }

  private predictAzorius({
    networkConfig,
    safeContractAddress,
    predictedStrategyAddress,
    azoriusNonce,
    goveranceData,
  }: {
    networkConfig: NetworkConfig;
    safeContractAddress: Address;
    predictedStrategyAddress: Address;
    azoriusNonce: bigint;
    goveranceData: {
      timelock: number;
      executionPeriod: number;
    };
  }): {
    address: Address;
    encodedSetupData: Hex;
  } {
    // const azoriusGovernanceDaoData = this.daoData as AzoriusGovernanceDAO;
    const encodedInitAzoriusData = encodeAbiParameters(
      parseAbiParameters(['address, address, address, address[], uint32, uint32']),
      [
        safeContractAddress,
        safeContractAddress,
        safeContractAddress,
        [predictedStrategyAddress],
        goveranceData.timelock, // timelock period in blocks
        goveranceData.executionPeriod, // execution period in blocks
      ],
    );

    const encodedSetupAzoriusData = encodeFunctionData({
      abi: abis.Azorius,
      functionName: 'setUp',
      args: [encodedInitAzoriusData],
    });

    const azoriusByteCodeLinear = generateContractByteCodeLinear(
      networkConfig.contracts.moduleAzoriusMasterCopy,
    );
    const azoriusSalt = generateSalt(encodedSetupAzoriusData, azoriusNonce);

    return {
      address: getCreate2Address({
        from: networkConfig.contracts.zodiacModuleProxyFactory,
        salt: azoriusSalt,
        bytecodeHash: keccak256(encodePacked(['bytes'], [azoriusByteCodeLinear])),
      }),
      encodedSetupData: encodedSetupAzoriusData,
    };
  }

  // private setContracts() {
  //   if (!this.predictedStrategyAddress) {
  //     return;
  //   }

  //   const daoData = this.daoData as AzoriusGovernanceDAO;
  //   if (
  //     !!this.predictedTokenAddress &&
  //     daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20
  //   ) {
  //     this.votesTokenAddress = this.predictedTokenAddress;
  //     this.linearERC20VotingAddress = this.predictedStrategyAddress;
  //   } else if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC721) {
  //     this.linearERC721VotingAddress = this.predictedStrategyAddress;
  //   }
  // }
}
