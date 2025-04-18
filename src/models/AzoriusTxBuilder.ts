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
import {
  linearERC20VotingSetupParams,
  linearERC20VotingV1SetupParams,
  linearERC721VotingSetupParams,
  linearERC721VotingV1SetupParams,
} from '../constants/params';
import { buildContractCall, getRandomBytes } from '../helpers';
import {
  AzoriusERC20DAO,
  AzoriusERC721DAO,
  AzoriusGovernanceDAO,
  SafeTransaction,
  TokenLockType,
  VotingStrategyType,
} from '../types';
import { SENTINEL_MODULE } from '../utils/address';
import {
  getPaymasterAddress,
  getPaymasterSaltNonce,
  getVoteSelectorAndValidator,
} from '../utils/gaslessVoting';
import { BaseTxBuilder } from './BaseTxBuilder';
import { generateContractByteCodeLinear, generateSalt } from './helpers/utils';

export class AzoriusTxBuilder extends BaseTxBuilder {
  private readonly safeContractAddress: Address;

  private encodedSetupTokenData: Hex | undefined;
  private encodedStrategySetupData: Hex | undefined;
  private encodedSetupAzoriusData: Hex | undefined;
  private encodedSetupTokenClaimData: Hex | undefined;

  private predictedTokenAddress: Address | undefined;
  private predictedStrategyAddress: Address | undefined;
  private predictedAzoriusAddress: Address | undefined;
  private predictedTokenClaimAddress: Address | undefined;

  public linearERC20VotingAddress: Address | undefined;
  public linearERC721VotingAddress: Address | undefined;
  public votesTokenAddress: Address | undefined;
  private votesErc20MasterCopy: Address;
  private votesErc20LockableMasterCopy?: Address;
  private zodiacModuleProxyFactory: Address;
  private multiSendCallOnly: Address;
  private claimErc20MasterCopy: Address;
  private linearVotingErc20MasterCopy: Address;
  private linearVotingErc721MasterCopy: Address;
  private linearVotingErc20V1MasterCopy: Address;
  private linearVotingErc721V1MasterCopy: Address;
  private moduleAzoriusMasterCopy: Address;
  private paymaster?: {
    decentPaymasterV1MasterCopy: Address;
    linearERC20VotingV1ValidatorV1: Address;
    linearERC721VotingV1ValidatorV1: Address;
  };
  private accountAbstraction?:
    | {
        entryPointv07: Address;
        lightAccountFactory: Address;
      }
    | undefined;
  private tokenNonce: bigint;
  private strategyNonce: bigint;
  private azoriusNonce: bigint;
  private claimNonce: bigint;

  private gaslessVotingEnabled: boolean;

  constructor(
    publicClient: PublicClient,
    daoData: AzoriusERC20DAO | AzoriusERC721DAO,
    safeContractAddress: Address,
    votesErc20MasterCopy: Address,
    zodiacModuleProxyFactory: Address,
    multiSendCallOnly: Address,
    claimErc20MasterCopy: Address,
    linearVotingErc20MasterCopy: Address,
    linearVotingErc721MasterCopy: Address,
    linearVotingErc20V1MasterCopy: Address,
    linearVotingErc721V1MasterCopy: Address,
    moduleAzoriusMasterCopy: Address,
    gaslessVotingEnabled: boolean,
    votesErc20LockableMasterCopy?: Address,
    paymaster?: {
      decentPaymasterV1MasterCopy: Address;
      linearERC20VotingV1ValidatorV1: Address;
      linearERC721VotingV1ValidatorV1: Address;
    },
    accountAbstraction?: {
      entryPointv07: Address;
      lightAccountFactory: Address;
    },

    parentAddress?: Address,
    parentTokenAddress?: Address,
  ) {
    super(publicClient, true, daoData, parentAddress, parentTokenAddress);

    this.safeContractAddress = safeContractAddress;

    this.tokenNonce = getRandomBytes();
    this.claimNonce = getRandomBytes();
    this.strategyNonce = getRandomBytes();
    this.azoriusNonce = getRandomBytes();
    this.votesErc20MasterCopy = votesErc20MasterCopy;
    this.votesErc20LockableMasterCopy = votesErc20LockableMasterCopy;
    this.zodiacModuleProxyFactory = zodiacModuleProxyFactory;
    this.multiSendCallOnly = multiSendCallOnly;
    this.claimErc20MasterCopy = claimErc20MasterCopy;
    this.linearVotingErc20MasterCopy = linearVotingErc20MasterCopy;
    this.linearVotingErc721MasterCopy = linearVotingErc721MasterCopy;
    this.linearVotingErc20V1MasterCopy = linearVotingErc20V1MasterCopy;
    this.linearVotingErc721V1MasterCopy = linearVotingErc721V1MasterCopy;
    this.moduleAzoriusMasterCopy = moduleAzoriusMasterCopy;
    this.paymaster = paymaster;
    this.accountAbstraction = accountAbstraction;
    this.gaslessVotingEnabled = gaslessVotingEnabled;

    if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20) {
      daoData = daoData as AzoriusERC20DAO;
      if (!daoData.isTokenImported) {
        if (daoData.locked === TokenLockType.LOCKED && !votesErc20LockableMasterCopy) {
          throw new Error('Votes Erc20 Lockable Master Copy address not set');
        }
        this.setEncodedSetupTokenData();
        this.setPredictedTokenAddress();
      } else {
        if (daoData.isVotesToken) {
          this.predictedTokenAddress = daoData.tokenImportAddress as Address;
        }
      }
    }
  }

  public get azoriusAddress(): Address {
    if (!this.predictedAzoriusAddress) {
      throw new Error('Azorius address not set');
    }

    return this.predictedAzoriusAddress;
  }

  public async init() {
    await this.setPredictedStrategyAddress();
    this.setPredictedAzoriusAddress();
    this.setContracts();

    if (
      (this.daoData as AzoriusERC20DAO | AzoriusERC721DAO).votingStrategyType ===
      VotingStrategyType.LINEAR_ERC20
    ) {
      const azoriusDAOData = this.daoData as AzoriusERC20DAO;
      if (
        this.parentTokenAddress &&
        azoriusDAOData.parentAllocationAmount &&
        azoriusDAOData.parentAllocationAmount !== 0n
      ) {
        this.setEncodedSetupTokenClaimData();
        this.setPredictedTokenClaimAddress();
      }
    }
  }

  public buildRemoveOwners(owners: Address[]): SafeTransaction[] {
    const removeOwnerTxs = owners.map(owner =>
      buildContractCall({
        target: this.safeContractAddress,
        encodedFunctionData: encodeFunctionData({
          functionName: 'removeOwner',
          args: [this.multiSendCallOnly, owner, 1n],
          abi: GnosisSafeL2Abi,
        }),
        nonce: 0,
      }),
    );
    return removeOwnerTxs;
  }

  public buildVotingContractSetupTx(): SafeTransaction {
    const daoData = this.daoData as AzoriusGovernanceDAO;

    if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20) {
      if (!this.predictedAzoriusAddress || !this.linearERC20VotingAddress) {
        throw new Error('Linear ERC20 addresses not set');
      }

      return buildContractCall({
        target: this.linearERC20VotingAddress,
        encodedFunctionData: encodeFunctionData({
          functionName: 'setAzorius',
          args: [this.predictedAzoriusAddress],
          abi: abis.LinearERC20Voting,
        }),
        nonce: 0,
      });
    } else if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC721) {
      if (!this.predictedAzoriusAddress || !this.linearERC721VotingAddress) {
        throw new Error('Linear ERC721 addresses not set');
      }

      return buildContractCall({
        target: this.linearERC721VotingAddress,
        encodedFunctionData: encodeFunctionData({
          functionName: 'setAzorius',
          args: [this.predictedAzoriusAddress],
          abi: abis.LinearERC721Voting,
        }),
        nonce: 0,
      });
    } else {
      throw new Error('voting strategy type unknown');
    }
  }

  public buildEnableAzoriusModuleTx(): SafeTransaction {
    if (!this.predictedAzoriusAddress) {
      throw new Error('Azorius address not set');
    }

    return buildContractCall({
      target: this.safeContractAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'enableModule',
        args: [this.predictedAzoriusAddress],
        abi: GnosisSafeL2Abi,
      }),
      nonce: 0,
    });
  }

  public buildAddAzoriusContractAsOwnerTx(): SafeTransaction {
    if (!this.predictedAzoriusAddress) {
      throw new Error('Azorius address not set');
    }

    return buildContractCall({
      target: this.safeContractAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'addOwnerWithThreshold',
        args: [this.predictedAzoriusAddress, 1n],
        abi: GnosisSafeL2Abi,
      }),
      nonce: 0,
    });
  }

  public buildRemoveMultiSendOwnerTx(): SafeTransaction {
    if (!this.predictedAzoriusAddress) {
      throw new Error('Azorius address not set');
    }
    if (!this.multiSendCallOnly) {
      throw new Error('multiSendCallOnly address not set');
    }

    return buildContractCall({
      target: this.safeContractAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'removeOwner',
        args: [this.predictedAzoriusAddress, this.multiSendCallOnly, 1n],
        abi: GnosisSafeL2Abi,
      }),
      nonce: 0,
    });
  }

  public buildCreateTokenTx(): SafeTransaction {
    const azoriusErc20DaoData = this.daoData as AzoriusERC20DAO;

    if (
      !this.encodedSetupTokenData ||
      !this.votesErc20MasterCopy ||
      !this.votesErc20LockableMasterCopy
    ) {
      throw new Error('Encoded setup token data or votes erc20 master copy not set');
    }

    const votingStrategyMasterCopy =
      azoriusErc20DaoData.locked === TokenLockType.LOCKED
        ? this.votesErc20LockableMasterCopy
        : this.votesErc20MasterCopy;

    return buildContractCall({
      target: this.zodiacModuleProxyFactory,
      encodedFunctionData: encodeFunctionData({
        functionName: 'deployModule',
        args: [votingStrategyMasterCopy, this.encodedSetupTokenData, this.tokenNonce],
        abi: ZodiacModuleProxyFactoryAbi,
      }),
      nonce: 0,
    });
  }

  public buildDeployStrategyTx(): SafeTransaction {
    const daoData = this.daoData as AzoriusGovernanceDAO;

    let votingStrategyMasterCopy: Address;
    if (this.gaslessVotingEnabled) {
      votingStrategyMasterCopy =
        daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20
          ? this.linearVotingErc20V1MasterCopy
          : this.linearVotingErc721V1MasterCopy;
    } else {
      votingStrategyMasterCopy =
        daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20
          ? this.linearVotingErc20MasterCopy
          : this.linearVotingErc721MasterCopy;
    }

    if (!this.encodedStrategySetupData) {
      throw new Error('Encoded strategy setup data not set');
    }

    return buildContractCall({
      target: this.zodiacModuleProxyFactory,
      encodedFunctionData: encodeFunctionData({
        functionName: 'deployModule',
        args: [votingStrategyMasterCopy, this.encodedStrategySetupData, this.strategyNonce],
        abi: ZodiacModuleProxyFactoryAbi,
      }),
      nonce: 0,
    });
  }

  public buildDeployAzoriusTx(): SafeTransaction {
    if (!this.encodedSetupAzoriusData) {
      throw new Error('Encoded setup azorius data not set');
    }

    return buildContractCall({
      target: this.zodiacModuleProxyFactory,
      encodedFunctionData: encodeFunctionData({
        functionName: 'deployModule',
        args: [this.moduleAzoriusMasterCopy, this.encodedSetupAzoriusData, this.azoriusNonce],
        abi: ZodiacModuleProxyFactoryAbi,
      }),
      nonce: 0,
    });
  }

  public buildDeployTokenClaim() {
    if (!this.encodedSetupTokenClaimData) {
      throw new Error('Encoded setup token claim data not set');
    }

    return buildContractCall({
      target: this.zodiacModuleProxyFactory,
      encodedFunctionData: encodeFunctionData({
        functionName: 'deployModule',
        args: [this.claimErc20MasterCopy, this.encodedSetupTokenClaimData, this.claimNonce],
        abi: ZodiacModuleProxyFactoryAbi,
      }),
      nonce: 0,
    });
  }

  public buildDeployPaymasterTx(): SafeTransaction {
    if (!this.accountAbstraction) {
      throw new Error('Account Abstraction addresses are not set');
    }

    const paymasterInitData = encodeFunctionData({
      abi: abis.DecentPaymasterV1,
      functionName: 'initialize',
      args: [
        encodeAbiParameters(parseAbiParameters('address, address, address'), [
          this.safeContractAddress,
          this.accountAbstraction.entryPointv07,
          this.accountAbstraction.lightAccountFactory,
        ]),
      ],
    });

    if (!this.paymaster) {
      throw new Error('Paymaster addresses are not set');
    }

    return buildContractCall({
      target: this.zodiacModuleProxyFactory,
      encodedFunctionData: encodeFunctionData({
        functionName: 'deployModule',
        args: [
          this.paymaster.decentPaymasterV1MasterCopy,
          paymasterInitData,
          getPaymasterSaltNonce(this.safeContractAddress, this.publicClient.chain!.id),
        ],
        abi: ZodiacModuleProxyFactoryAbi,
      }),
      nonce: 0,
    });
  }

  public buildApproveStrategyOnPaymasterTx(): SafeTransaction {
    if (!this.accountAbstraction) {
      throw new Error('Account Abstraction addresses are not set');
    }
    if (!this.paymaster) {
      throw new Error('Paymaster addresses are not set');
    }
    if (!this.predictedStrategyAddress) {
      throw new Error('Predicted strategy address not set');
    }

    const predictedPaymasterAddress = getPaymasterAddress({
      safeAddress: this.safeContractAddress,
      zodiacModuleProxyFactory: this.zodiacModuleProxyFactory,
      paymasterMastercopy: this.paymaster?.decentPaymasterV1MasterCopy,
      entryPoint: this.accountAbstraction.entryPointv07,
      lightAccountFactory: this.accountAbstraction.lightAccountFactory,
      chainId: this.publicClient.chain!.id,
    });

    const { voteSelector, voteValidator } = getVoteSelectorAndValidator(
      this.daoData.governance,
      this.paymaster,
    );

    return buildContractCall({
      target: predictedPaymasterAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'setFunctionValidator',
        args: [this.predictedStrategyAddress, voteSelector, voteValidator],
        abi: abis.DecentPaymasterV1,
      }),
      nonce: 0,
    });
  }

  public buildApproveClaimAllocation() {
    if (!this.votesTokenAddress) {
      return;
    }
    if (!this.predictedTokenClaimAddress) {
      throw new Error('Predicted token claim address not set');
    }

    const azoriusGovernanceDaoData = this.daoData as AzoriusERC20DAO;
    return buildContractCall({
      target: this.votesTokenAddress,
      encodedFunctionData: encodeFunctionData({
        functionName: 'approve',
        args: [this.predictedTokenClaimAddress, azoriusGovernanceDaoData.parentAllocationAmount],
        abi: abis.VotesERC20,
      }),
      nonce: 0,
    });
  }

  public signatures = (): Hex => {
    return ('0x000000000000000000000000' +
      this.multiSendCallOnly.slice(2) +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '01') as Hex;
  };

  private calculateTokenAllocations(
    azoriusGovernanceDaoData: AzoriusERC20DAO,
  ): [Address[], bigint[]] {
    const tokenAllocationsOwners = azoriusGovernanceDaoData.tokenAllocations.map(tokenAllocation =>
      getAddress(tokenAllocation.address),
    );

    const tokenAllocationsValues = azoriusGovernanceDaoData.tokenAllocations.map(
      tokenAllocation => tokenAllocation.amount,
    );
    const tokenAllocationSum = tokenAllocationsValues.reduce((accumulator, tokenAllocation) => {
      return tokenAllocation + accumulator;
    }, 0n);

    // Send any un-allocated tokens to the Safe Treasury
    if (azoriusGovernanceDaoData.tokenSupply > tokenAllocationSum) {
      // TODO -- verify this doesn't need to be the predicted safe address (that they are the same)
      tokenAllocationsOwners.push(this.safeContractAddress);
      tokenAllocationsValues.push(azoriusGovernanceDaoData.tokenSupply - tokenAllocationSum);
    }

    return [tokenAllocationsOwners, tokenAllocationsValues];
  }

  private setEncodedSetupTokenData() {
    const azoriusGovernanceDaoData = this.daoData as AzoriusERC20DAO;
    const [tokenAllocationsOwners, tokenAllocationsValues] =
      this.calculateTokenAllocations(azoriusGovernanceDaoData);

    if (azoriusGovernanceDaoData.locked === TokenLockType.LOCKED) {
      const encodedInitTokenData = encodeAbiParameters(
        parseAbiParameters('address, bool, string, string, address[], uint256[]'),
        [
          this.safeContractAddress,
          true,
          azoriusGovernanceDaoData.tokenName,
          azoriusGovernanceDaoData.tokenSymbol,
          tokenAllocationsOwners,
          tokenAllocationsValues,
        ],
      );

      this.encodedSetupTokenData = encodeFunctionData({
        abi: abis.VotesERC20LockableV1,
        functionName: 'initialize',
        args: [encodedInitTokenData],
      });
    } else {
      const encodedInitTokenData = encodeAbiParameters(
        parseAbiParameters('string, string, address[], uint256[]'),
        [
          azoriusGovernanceDaoData.tokenName,
          azoriusGovernanceDaoData.tokenSymbol,
          tokenAllocationsOwners,
          tokenAllocationsValues,
        ],
      );

      this.encodedSetupTokenData = encodeFunctionData({
        abi: abis.VotesERC20,
        functionName: 'setUp',
        args: [encodedInitTokenData],
      });
    }
  }

  private setPredictedTokenAddress() {
    const azoriusGovernanceDaoData = this.daoData as AzoriusERC20DAO;
    if (
      azoriusGovernanceDaoData.locked === TokenLockType.LOCKED &&
      !this.votesErc20LockableMasterCopy
    ) {
      throw new Error('Votes Erc20 Lockable Master Copy address not set');
    }
    const tokenByteCodeLinear = generateContractByteCodeLinear(
      azoriusGovernanceDaoData.locked === TokenLockType.LOCKED
        ? this.votesErc20LockableMasterCopy!
        : this.votesErc20MasterCopy,
    );
    const tokenSalt = generateSalt(this.encodedSetupTokenData!, this.tokenNonce);

    this.predictedTokenAddress = getCreate2Address({
      from: this.zodiacModuleProxyFactory,
      salt: tokenSalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [tokenByteCodeLinear])),
    });
  }

  private setEncodedSetupTokenClaimData() {
    const azoriusGovernanceDaoData = this.daoData as AzoriusERC20DAO;
    if (!this.parentTokenAddress || !this.predictedTokenAddress) {
      throw new Error('Parent token address or predicted token address were not provided');
    }
    const encodedInitTokenData = encodeAbiParameters(
      parseAbiParameters('uint32, address, address, address, uint256'),
      [
        0, // `deadlineBlock`, 0 means never expires, currently no UI for setting this in the app.
        this.safeContractAddress,
        this.parentTokenAddress,
        this.predictedTokenAddress,
        azoriusGovernanceDaoData.parentAllocationAmount,
      ],
    );
    const encodedSetupTokenClaimData = encodeFunctionData({
      abi: abis.ERC20Claim,
      functionName: 'setUp',
      args: [encodedInitTokenData],
    });

    this.encodedSetupTokenClaimData = encodedSetupTokenClaimData;
  }

  private setPredictedTokenClaimAddress() {
    const tokenByteCodeLinear = generateContractByteCodeLinear(this.claimErc20MasterCopy);

    const tokenSalt = generateSalt(this.encodedSetupTokenClaimData!, this.claimNonce);

    this.predictedTokenClaimAddress = getCreate2Address({
      from: this.zodiacModuleProxyFactory,
      salt: tokenSalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [tokenByteCodeLinear])),
    });
  }

  private setupLinearERC20VotingStrategy(
    safeContractAddress: Address,
    predictedTokenAddress: Address,
    lightAccountFactory: Address,
    votingPeriod: number,
    quorumPercentage: bigint,
    quorumDenominator: bigint,
  ): {
    encodedStrategySetupData: Hex;
    strategyByteCodeLinear: Hex;
  } {
    if (this.gaslessVotingEnabled) {
      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(linearERC20VotingV1SetupParams),
        [
          safeContractAddress, // owner
          predictedTokenAddress, // governance token
          SENTINEL_MODULE, // Azorius module
          Number(votingPeriod),
          1n, // proposer weight, how much is needed to create a proposal.
          (quorumPercentage * quorumDenominator) / 100n, // quorom numerator, denominator is 1,000,000, so quorum percentage is quorumNumerator * 100 / quorumDenominator
          500000n, // basis numerator, denominator is 1,000,000, so basis percentage is 50% (simple majority)
          lightAccountFactory,
        ],
      );

      const encodedStrategySetupData = encodeFunctionData({
        abi: abis.LinearERC20VotingV1,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });

      const strategyByteCodeLinear = generateContractByteCodeLinear(
        this.linearVotingErc20V1MasterCopy,
      );
      return {
        encodedStrategySetupData,
        strategyByteCodeLinear,
      };
    } else {
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
        this.linearVotingErc20MasterCopy,
      );
      return {
        encodedStrategySetupData,
        strategyByteCodeLinear,
      };
    }
  }

  private setupLinearERC721VotingStrategy(
    safeContractAddress: Address,
    daoData: AzoriusERC721DAO,
    lightAccountFactory: Address,
    votingPeriod: number,
  ): {
    encodedStrategySetupData: Hex;
    strategyByteCodeLinear: Hex;
  } {
    if (this.gaslessVotingEnabled) {
      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(linearERC721VotingV1SetupParams),
        [
          safeContractAddress, // owner
          daoData.nfts.map(nft => nft.tokenAddress!), // governance tokens addresses
          daoData.nfts.map(nft => nft.tokenWeight), // governance tokens weights
          SENTINEL_MODULE, // Azorius module
          votingPeriod,
          daoData.quorumThreshold, // quorom threshold. Since smart contract can't know total of NFTs minted - we need to provide it manually
          1n, // proposer weight, how much is needed to create a proposal.
          500000n, // basis numerator, denominator is 1,000,000, so basis percentage is 50% (simple majority)
          lightAccountFactory,
        ],
      );

      const encodedStrategySetupData = encodeFunctionData({
        abi: abis.LinearERC721VotingV1,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });

      const strategyByteCodeLinear = generateContractByteCodeLinear(
        this.linearVotingErc721V1MasterCopy,
      );
      return {
        encodedStrategySetupData,
        strategyByteCodeLinear,
      };
    } else {
      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(linearERC721VotingSetupParams),
        [
          safeContractAddress, // owner
          daoData.nfts.map(nft => nft.tokenAddress!), // governance tokens addresses
          daoData.nfts.map(nft => nft.tokenWeight), // governance tokens weights
          SENTINEL_MODULE, // Azorius module
          votingPeriod,
          daoData.quorumThreshold, // quorom threshold. Since smart contract can't know total of NFTs minted - we need to provide it manually
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
        this.linearVotingErc721MasterCopy,
      );
      return {
        encodedStrategySetupData,
        strategyByteCodeLinear,
      };
    }
  }

  private async setupVotingStrategy(): Promise<
    | {
        encodedStrategySetupData: Hex;
        strategyByteCodeLinear: Hex;
      }
    | undefined
  > {
    const azoriusGovernanceDaoData = this.daoData as AzoriusGovernanceDAO;
    if (azoriusGovernanceDaoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20) {
      if (!this.predictedTokenAddress) {
        throw new Error(
          'Error predicting strategy address - predicted token address was not provided',
        );
      }

      const linearERC20VotingMasterCopyContract = getContract({
        abi: abis.LinearERC20VotingV1,
        address: this.linearVotingErc20MasterCopy,
        client: this.publicClient,
      });

      const quorumDenominator = await linearERC20VotingMasterCopyContract.read.QUORUM_DENOMINATOR();
      return this.setupLinearERC20VotingStrategy(
        this.safeContractAddress,
        this.predictedTokenAddress,
        this.accountAbstraction?.lightAccountFactory!,
        Number(azoriusGovernanceDaoData.votingPeriod),
        azoriusGovernanceDaoData.quorumPercentage,
        quorumDenominator,
      );
    } else if (azoriusGovernanceDaoData.votingStrategyType === VotingStrategyType.LINEAR_ERC721) {
      const daoData = azoriusGovernanceDaoData as AzoriusERC721DAO;

      return this.setupLinearERC721VotingStrategy(
        this.safeContractAddress,
        daoData,
        this.accountAbstraction?.lightAccountFactory!,
        Number(daoData.votingPeriod),
      );
    } else {
      return undefined;
    }
  }

  private async setPredictedStrategyAddress() {
    const strategySetup = await this.setupVotingStrategy();
    if (!strategySetup) {
      return;
    }
    const { encodedStrategySetupData, strategyByteCodeLinear } = strategySetup;

    const strategySalt = keccak256(
      encodePacked(
        ['bytes32', 'uint256'],
        [keccak256(encodePacked(['bytes'], [encodedStrategySetupData])), this.strategyNonce],
      ),
    );

    this.encodedStrategySetupData = encodedStrategySetupData;

    this.predictedStrategyAddress = getCreate2Address({
      from: this.zodiacModuleProxyFactory,
      salt: strategySalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [strategyByteCodeLinear])),
    });
  }

  private setPredictedAzoriusAddress() {
    const azoriusGovernanceDaoData = this.daoData as AzoriusGovernanceDAO;
    const safeContractAddress = this.safeContractAddress;
    const encodedInitAzoriusData = encodeAbiParameters(
      parseAbiParameters(['address, address, address, address[], uint32, uint32']),
      [
        safeContractAddress,
        safeContractAddress,
        safeContractAddress,
        [this.predictedStrategyAddress!],
        Number(azoriusGovernanceDaoData.timelock), // timelock period in blocks
        Number(azoriusGovernanceDaoData.executionPeriod), // execution period in blocks
      ],
    );

    const encodedSetupAzoriusData = encodeFunctionData({
      abi: abis.Azorius,
      functionName: 'setUp',
      args: [encodedInitAzoriusData],
    });

    const azoriusByteCodeLinear = generateContractByteCodeLinear(this.moduleAzoriusMasterCopy);
    const azoriusSalt = generateSalt(encodedSetupAzoriusData, this.azoriusNonce);

    this.encodedSetupAzoriusData = encodedSetupAzoriusData;
    this.predictedAzoriusAddress = getCreate2Address({
      from: this.zodiacModuleProxyFactory,
      salt: azoriusSalt,
      bytecodeHash: keccak256(encodePacked(['bytes'], [azoriusByteCodeLinear])),
    });
  }

  private setContracts() {
    if (!this.predictedStrategyAddress) {
      return;
    }

    const daoData = this.daoData as AzoriusGovernanceDAO;
    if (
      !!this.predictedTokenAddress &&
      daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20
    ) {
      this.votesTokenAddress = this.predictedTokenAddress;
      this.linearERC20VotingAddress = this.predictedStrategyAddress;
    } else if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC721) {
      this.linearERC721VotingAddress = this.predictedStrategyAddress;
    }
  }
}
