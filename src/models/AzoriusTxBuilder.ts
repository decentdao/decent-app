import { abis } from '@fractal-framework/fractal-contracts';
import {
  AbiItem,
  Address,
  Hex,
  PublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getAbiItem,
  getAddress,
  getContract,
  getCreate2Address,
  keccak256,
  parseAbiParameters,
  toFunctionSelector,
} from 'viem';
import GnosisSafeL2Abi from '../assets/abi/GnosisSafeL2';
import { ZodiacModuleProxyFactoryAbi } from '../assets/abi/ZodiacModuleProxyFactoryAbi';
import { buildContractCall, getRandomBytes } from '../helpers';
import {
  AzoriusERC20DAO,
  AzoriusERC721DAO,
  AzoriusGovernanceDAO,
  GovernanceType,
  SafeTransaction,
  VotingStrategyType,
} from '../types';
import { SENTINEL_MODULE } from '../utils/address';
import { getPaymasterAddress, getPaymasterSaltNonce } from '../utils/gaslessVoting';
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
  private zodiacModuleProxyFactory: Address;
  private multiSendCallOnly: Address;
  private claimErc20MasterCopy: Address;
  private linearVotingErc20MasterCopy: Address;
  private linearVotingErc721MasterCopy: Address;
  private linearVotingErc20V1MasterCopy: Address;
  private linearVotingErc721V1MasterCopy: Address;
  private moduleAzoriusMasterCopy: Address;
  private paymasterMasterCopy: Address;
  private entryPointAddress: Address | undefined;
  private tokenNonce: bigint;
  private strategyNonce: bigint;
  private azoriusNonce: bigint;
  private claimNonce: bigint;

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
    paymasterMasterCopy: Address,
    entryPointAddress?: Address,

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
    this.zodiacModuleProxyFactory = zodiacModuleProxyFactory;
    this.multiSendCallOnly = multiSendCallOnly;
    this.claimErc20MasterCopy = claimErc20MasterCopy;
    this.linearVotingErc20MasterCopy = linearVotingErc20MasterCopy;
    this.linearVotingErc721MasterCopy = linearVotingErc721MasterCopy;
    this.linearVotingErc20V1MasterCopy = linearVotingErc20V1MasterCopy;
    this.linearVotingErc721V1MasterCopy = linearVotingErc721V1MasterCopy;
    this.moduleAzoriusMasterCopy = moduleAzoriusMasterCopy;
    this.paymasterMasterCopy = paymasterMasterCopy;
    this.entryPointAddress = entryPointAddress;

    if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20) {
      daoData = daoData as AzoriusERC20DAO;
      if (!daoData.isTokenImported) {
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

  public buildRemoveOwners(owners: string[]): SafeTransaction[] {
    const removeOwnerTxs = owners.map(owner =>
      buildContractCall(
        GnosisSafeL2Abi,
        this.safeContractAddress,
        'removeOwner',
        [this.multiSendCallOnly, owner, 1],
        0,
        false,
      ),
    );
    return removeOwnerTxs;
  }

  public buildVotingContractSetupTx(): SafeTransaction {
    const daoData = this.daoData as AzoriusGovernanceDAO;

    if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC20) {
      return buildContractCall(
        abis.LinearERC20Voting,
        this.linearERC20VotingAddress!,
        'setAzorius', // contract function name
        [this.predictedAzoriusAddress],
        0,
        false,
      );
    } else if (daoData.votingStrategyType === VotingStrategyType.LINEAR_ERC721) {
      return buildContractCall(
        abis.LinearERC721Voting,
        this.linearERC721VotingAddress!,
        'setAzorius', // contract function name
        [this.predictedAzoriusAddress],
        0,
        false,
      );
    } else {
      throw new Error('voting strategy type unknown');
    }
  }

  public buildEnableAzoriusModuleTx(): SafeTransaction {
    return buildContractCall(
      GnosisSafeL2Abi,
      this.safeContractAddress,
      'enableModule',
      [this.predictedAzoriusAddress],
      0,
      false,
    );
  }

  public buildAddAzoriusContractAsOwnerTx(): SafeTransaction {
    return buildContractCall(
      GnosisSafeL2Abi,
      this.safeContractAddress,
      'addOwnerWithThreshold',
      [this.predictedAzoriusAddress, 1],
      0,
      false,
    );
  }

  public buildRemoveMultiSendOwnerTx(): SafeTransaction {
    return buildContractCall(
      GnosisSafeL2Abi,
      this.safeContractAddress,
      'removeOwner',
      [this.predictedAzoriusAddress, this.multiSendCallOnly, 1],
      0,
      false,
    );
  }

  public buildCreateTokenTx(): SafeTransaction {
    return buildContractCall(
      ZodiacModuleProxyFactoryAbi,
      this.zodiacModuleProxyFactory,
      'deployModule',
      [this.votesErc20MasterCopy, this.encodedSetupTokenData, this.tokenNonce],
      0,
      false,
    );
  }

  public buildDeployStrategyTx(enableGaslessVoting: boolean): SafeTransaction {
    const daoData = this.daoData as AzoriusGovernanceDAO;

    let votingStrategyMasterCopy: Address;
    if (enableGaslessVoting) {
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

    return buildContractCall(
      ZodiacModuleProxyFactoryAbi,
      this.zodiacModuleProxyFactory,
      'deployModule',
      [votingStrategyMasterCopy, this.encodedStrategySetupData, this.strategyNonce],
      0,
      false,
    );
  }

  public buildDeployAzoriusTx(): SafeTransaction {
    return buildContractCall(
      ZodiacModuleProxyFactoryAbi,
      this.zodiacModuleProxyFactory,
      'deployModule',
      [this.moduleAzoriusMasterCopy, this.encodedSetupAzoriusData, this.azoriusNonce],
      0,
      false,
    );
  }

  public buildDeployTokenClaim() {
    return buildContractCall(
      ZodiacModuleProxyFactoryAbi,
      this.zodiacModuleProxyFactory,
      'deployModule',
      [this.claimErc20MasterCopy, this.encodedSetupTokenClaimData, this.claimNonce],
      0,
      false,
    );
  }

  public buildDeployPaymasterTx(): SafeTransaction {
    if (!this.entryPointAddress) {
      throw new Error('Entry point address is not set');
    }

    const paymasterInitData = encodeFunctionData({
      abi: abis.DecentPaymasterV1,
      functionName: 'initialize',
      args: [
        encodeAbiParameters(parseAbiParameters('address, address'), [
          this.safeContractAddress,
          this.entryPointAddress,
        ]),
      ],
    });

    return buildContractCall(
      ZodiacModuleProxyFactoryAbi,
      this.zodiacModuleProxyFactory,
      'deployModule',
      [
        this.paymasterMasterCopy,
        paymasterInitData,
        getPaymasterSaltNonce(this.safeContractAddress, this.publicClient.chain!.id),
      ],
      0,
      false,
    );
  }

  public async buildApproveStrategyOnPaymasterTx(): Promise<SafeTransaction> {
    if (!this.entryPointAddress) {
      throw new Error('Entry point address is not set');
    }

    const predictedPaymasterAddress = await getPaymasterAddress({
      safeAddress: this.safeContractAddress,
      zodiacModuleProxyFactory: this.zodiacModuleProxyFactory,
      paymasterMastercopy: this.paymasterMasterCopy,
      entryPoint: this.entryPointAddress,
      chainId: this.publicClient.chain!.id,
    });

    let voteAbiItem: AbiItem;

    if (this.daoData.governance === GovernanceType.AZORIUS_ERC20) {
      voteAbiItem = getAbiItem({
        name: 'vote',
        abi: abis.LinearERC20Voting,
      });
    } else if (this.daoData.governance === GovernanceType.AZORIUS_ERC721) {
      voteAbiItem = getAbiItem({
        name: 'vote',
        abi: abis.LinearERC721Voting,
      });
    } else {
      throw new Error('Invalid voting strategy type');
    }

    const voteSelector = toFunctionSelector(voteAbiItem);

    return buildContractCall(
      abis.DecentPaymasterV1,
      predictedPaymasterAddress,
      'whitelistFunctions',
      [this.predictedStrategyAddress, [voteSelector], [true]],
      0,
      false,
    );
  }

  public buildApproveClaimAllocation() {
    if (!this.votesTokenAddress) {
      return;
    }

    const azoriusGovernanceDaoData = this.daoData as AzoriusERC20DAO;
    return buildContractCall(
      abis.VotesERC20,
      this.votesTokenAddress,
      'approve',
      [this.predictedTokenClaimAddress, azoriusGovernanceDaoData.parentAllocationAmount],
      0,
      false,
    );
  }

  public signatures = (): string => {
    return (
      '0x000000000000000000000000' +
      this.multiSendCallOnly.slice(2) +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '01'
    );
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

  private setPredictedTokenAddress() {
    const tokenByteCodeLinear = generateContractByteCodeLinear(this.votesErc20MasterCopy);

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

  private async setPredictedStrategyAddress() {
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
      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters('address, address, address, uint32, uint256, uint256, uint256'),
        [
          this.safeContractAddress, // owner
          this.predictedTokenAddress, // governance token
          SENTINEL_MODULE, // Azorius module
          Number(azoriusGovernanceDaoData.votingPeriod),
          1n, // proposer weight, how much is needed to create a proposal.
          (azoriusGovernanceDaoData.quorumPercentage * quorumDenominator) / 100n, // quorom numerator, denominator is 1,000,000, so quorum percentage is quorumNumerator * 100 / quorumDenominator
          500000n, // basis numerator, denominator is 1,000,000, so basis percentage is 50% (simple majority)
        ],
      );

      const encodedStrategySetupData = encodeFunctionData({
        abi: abis.LinearERC20VotingV1,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });

      const strategyByteCodeLinear = generateContractByteCodeLinear(
        this.linearVotingErc20MasterCopy,
      );

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
    } else if (azoriusGovernanceDaoData.votingStrategyType === VotingStrategyType.LINEAR_ERC721) {
      const daoData = azoriusGovernanceDaoData as AzoriusERC721DAO;

      const encodedStrategyInitParams = encodeAbiParameters(
        parseAbiParameters(
          'address, address[], uint256[], address, uint32, uint256, uint256, uint256',
        ),
        [
          this.safeContractAddress, // owner
          daoData.nfts.map(nft => nft.tokenAddress!), // governance tokens addresses
          daoData.nfts.map(nft => nft.tokenWeight), // governance tokens weights
          SENTINEL_MODULE, // Azorius module
          Number(azoriusGovernanceDaoData.votingPeriod),
          daoData.quorumThreshold, // quorom threshold. Since smart contract can't know total of NFTs minted - we need to provide it manually
          1n, // proposer weight, how much is needed to create a proposal.
          500000n, // basis numerator, denominator is 1,000,000, so basis percentage is 50% (simple majority)
        ],
      );

      const encodedStrategySetupData = encodeFunctionData({
        abi: abis.LinearERC721VotingV1,
        functionName: 'setUp',
        args: [encodedStrategyInitParams],
      });

      const strategyByteCodeLinear = generateContractByteCodeLinear(
        this.linearVotingErc721MasterCopy,
      );

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
