import { abis } from '@fractal-framework/fractal-contracts';
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import {
  Address,
  GetContractEventsReturnType,
  GetContractReturnType,
  Hex,
  PublicClient,
  getAddress,
  getContract,
} from 'viem';
import { strategyFractalProposalStates } from '../constants/strategy';

import {
  AzoriusProposal,
  DataDecoded,
  DecodedTransaction,
  ERC721ProposalVote,
  DecentModule,
  FractalModuleType,
  FractalProposalState,
  MetaTransaction,
  Parameter,
  ProposalData,
  ProposalVote,
  ProposalVotesSummary,
  VotingStrategyType,
  getVoteChoice,
} from '../types';
import { getTimeStamp } from './contract';

export const getAzoriusProposalState = async (
  azoriusContract: GetContractReturnType<typeof abis.Azorius, PublicClient>,
  proposalId: number,
): Promise<FractalProposalState> => {
  const state = await azoriusContract.read.proposalState([proposalId]);
  return strategyFractalProposalStates[state];
};

const getQuorum = async ({
  strategyContract,
  strategyType,
  proposalId,
}: {
  strategyContract:
    | GetContractReturnType<typeof abis.LinearERC20Voting, PublicClient>
    | GetContractReturnType<typeof abis.LinearERC20VotingWithHatsProposalCreation, PublicClient>
    | GetContractReturnType<typeof abis.LinearERC721Voting, PublicClient>
    | GetContractReturnType<typeof abis.LinearERC721VotingWithHatsProposalCreation, PublicClient>;
  strategyType: VotingStrategyType;
  proposalId: number;
}) => {
  let quorum;

  if (
    strategyType === VotingStrategyType.LINEAR_ERC20 ||
    strategyType === VotingStrategyType.LINEAR_ERC20_HATS_WHITELISTING
  ) {
    quorum = await (
      strategyContract as GetContractReturnType<typeof abis.LinearERC20Voting, PublicClient>
    ).read.quorumVotes([proposalId]);
  } else if (
    strategyType === VotingStrategyType.LINEAR_ERC721 ||
    strategyType === VotingStrategyType.LINEAR_ERC721_HATS_WHITELISTING
  ) {
    quorum = await (
      strategyContract as GetContractReturnType<typeof abis.LinearERC721Voting, PublicClient>
    ).read.quorumThreshold();
  } else {
    quorum = 0n;
  }

  return quorum;
};

export const getProposalVotesSummary = async ({
  strategyContract,
  strategyType,
  proposalId,
}: {
  strategyContract:
    | GetContractReturnType<typeof abis.LinearERC20Voting, PublicClient>
    | GetContractReturnType<typeof abis.LinearERC20VotingWithHatsProposalCreation, PublicClient>
    | GetContractReturnType<typeof abis.LinearERC721Voting, PublicClient>
    | GetContractReturnType<typeof abis.LinearERC721VotingWithHatsProposalCreation, PublicClient>;
  strategyType: VotingStrategyType;
  proposalId: number;
}): Promise<ProposalVotesSummary> => {
  try {
    const [no, yes, abstain] = await strategyContract.read.getProposalVotes([proposalId]);
    return {
      yes,
      no,
      abstain,
      quorum: await getQuorum({
        strategyContract,
        strategyType,
        proposalId,
      }),
    };
  } catch (e) {
    // Sometimes loading DAO proposals called in the moment when proposal was **just** created
    // Thus, calling `getProposalVotes` for such a proposal reverts with error
    // This helps to prevent such case, while event listeners still should get proper data
    return {
      yes: 0n,
      no: 0n,
      abstain: 0n,
      quorum: 0n,
    };
  }
};

const getProposalVotes = (
  erc20VotedEvents: GetContractEventsReturnType<typeof abis.LinearERC20Voting, 'Voted'> | undefined,
  erc721VotedEvents:
    | GetContractEventsReturnType<typeof abis.LinearERC721Voting, 'Voted'>
    | undefined,
  proposalId: number,
): (ProposalVote | ERC721ProposalVote)[] => {
  if (erc20VotedEvents !== undefined && erc721VotedEvents !== undefined) {
    throw new Error("two voting contracts? we don't support that.");
  }

  if (erc20VotedEvents !== undefined) {
    const erc20ProposalVoteEvents = erc20VotedEvents.filter(voteEvent => {
      if (!voteEvent.args.proposalId) return false;
      return proposalId === voteEvent.args.proposalId;
    });

    const events = [];
    for (const event of erc20ProposalVoteEvents) {
      if (
        event.args.voteType === undefined ||
        event.args.weight === undefined ||
        event.args.voter === undefined
      ) {
        continue;
      }
      events.push({
        weight: event.args.weight,
        voter: event.args.voter,
        choice: getVoteChoice(event.args.voteType),
      });
    }
    return events;
  } else if (erc721VotedEvents !== undefined) {
    const erc721ProposalVoteEvents = erc721VotedEvents.filter(voteEvent => {
      if (!voteEvent.args.proposalId) return false;
      return proposalId === voteEvent.args.proposalId;
    });

    const events = [];
    for (const event of erc721ProposalVoteEvents) {
      if (
        event.args.voteType === undefined ||
        event.args.voter === undefined ||
        event.args.tokenIds === undefined ||
        event.args.tokenAddresses === undefined
      ) {
        continue;
      }

      events.push({
        voter: event.args.voter,
        choice: getVoteChoice(event.args.voteType),
        weight: 1n,
        tokenIds: event.args.tokenIds.map(id => id.toString()),
        tokenAddresses: event.args.tokenAddresses,
      });
    }
    return events;
  }

  return [];
};

export const mapProposalCreatedEventToProposal = async (
  createdEventTransactionHash: Hex,
  strategyAddress: Address,
  strategyType: VotingStrategyType,
  proposalId: number,
  proposer: Address,
  azoriusContract: GetContractReturnType<typeof abis.Azorius, PublicClient>,
  publicClient: PublicClient,
  erc20VotedEvents:
    | GetContractEventsReturnType<typeof abis.LinearERC20Voting, 'Voted'>
    | GetContractEventsReturnType<typeof abis.LinearERC20VotingWithHatsProposalCreation, 'Voted'>
    | undefined,
  erc721VotedEvents:
    | GetContractEventsReturnType<typeof abis.LinearERC721Voting, 'Voted'>
    | GetContractEventsReturnType<typeof abis.LinearERC721VotingWithHatsProposalCreation, 'Voted'>
    | undefined,
  executedEvents: GetContractEventsReturnType<typeof abis.Azorius, 'ProposalExecuted'> | undefined,
  data?: ProposalData,
) => {
  let proposalVotes = {
    startBlock: 0,
    endBlock: 0,
    noVotes: 0n,
    yesVotes: 0n,
    abstainVotes: 0n,
  };

  const strategyContract =
    strategyType === VotingStrategyType.LINEAR_ERC20 ||
    strategyType === VotingStrategyType.LINEAR_ERC20_HATS_WHITELISTING
      ? getContract({
          address: strategyAddress,
          abi: abis.LinearERC20Voting,
          client: publicClient,
        })
      : getContract({
          address: strategyAddress,
          abi: abis.LinearERC721Voting,
          client: publicClient,
        });

  const stratProposalVotes = await strategyContract.read.getProposalVotes([proposalId]);
  proposalVotes.noVotes = stratProposalVotes[0];
  proposalVotes.yesVotes = stratProposalVotes[1];
  proposalVotes.abstainVotes = stratProposalVotes[2];
  proposalVotes.startBlock = stratProposalVotes[3];
  proposalVotes.endBlock = stratProposalVotes[4];

  const quorum = await getQuorum({
    strategyContract,
    strategyType,
    proposalId,
  });

  const deadlineSeconds = await getTimeStamp(proposalVotes.endBlock, publicClient);
  const block = await publicClient.getBlock({ blockNumber: BigInt(proposalVotes.startBlock) });

  const state = await getAzoriusProposalState(azoriusContract, proposalId);
  const votes = getProposalVotes(erc20VotedEvents, erc721VotedEvents, proposalId);

  const votesSummary = {
    yes: proposalVotes.yesVotes,
    no: proposalVotes.noVotes,
    abstain: proposalVotes.abstainVotes,
    quorum,
  };

  const targets = data ? data.decodedTransactions.map(tx => tx.target) : [];

  let transactionHash: string | undefined;
  if (state === FractalProposalState.EXECUTED) {
    const executedEvent = executedEvents?.find(event => event.args.proposalId === proposalId);
    if (executedEvent) {
      transactionHash = executedEvent?.transactionHash;
    } else {
      // @dev Proposal with 0 transactions goes straight into EXECUTED state, but since executeProposal event wasn't fired - it can't be found
      throw new Error('Proposal state is EXECUTED, but no execution event found');
    }
  } else {
    transactionHash = createdEventTransactionHash;
  }

  const proposal: AzoriusProposal = {
    eventDate: new Date(Number(block.timestamp) * 1000),
    proposalId: proposalId.toString(),
    targets,
    proposer,
    startBlock: BigInt(proposalVotes.startBlock),
    transactionHash,
    deadlineMs: deadlineSeconds * 1000,
    state,
    votes,
    votesSummary,
    data,
    votingStrategy: strategyContract.address,
  };

  return proposal;
};

export const parseMultiSendTransactions = (
  eventTransactionMap: Map<number, any>,
  parameters?: Parameter[],
) => {
  if (!parameters || !parameters.length) {
    return;
  }
  parameters.forEach((param: Parameter) => {
    const valueDecoded = param.valueDecoded;
    if (Array.isArray(valueDecoded)) {
      valueDecoded.forEach(value => {
        const decodedTransaction = {
          target: value.to,
          value: value.value, // This is the ETH value
          function: value.dataDecoded?.method,
          parameterTypes:
            !!value.dataDecoded && value.dataDecoded.parameters
              ? value.dataDecoded.parameters.map(p => p.type)
              : [],
          parameterValues:
            !!value.dataDecoded && value.dataDecoded.parameters
              ? value.dataDecoded.parameters.map(p => p.value)
              : [],
        };
        eventTransactionMap.set(eventTransactionMap.size, {
          ...decodedTransaction,
        });
        if (value.dataDecoded?.parameters && value.dataDecoded?.parameters?.length) {
          return parseMultiSendTransactions(eventTransactionMap, value.dataDecoded.parameters);
        }
      });
    }
  });
};

export const parseDecodedData = (
  multiSigTransaction: SafeMultisigTransactionResponse,
  isMultiSigTransaction: boolean,
): DecodedTransaction[] => {
  const eventTransactionMap = new Map<number, any>();
  const dataDecoded = multiSigTransaction.dataDecoded as any as DataDecoded;
  if (dataDecoded && isMultiSigTransaction) {
    const decodedTransaction: DecodedTransaction = {
      target: getAddress(multiSigTransaction.to),
      value: multiSigTransaction.value,
      function: dataDecoded.method,
      parameterTypes: dataDecoded.parameters ? dataDecoded.parameters.map(p => p.type) : [],
      parameterValues: dataDecoded.parameters
        ? dataDecoded.parameters.map(p => p.value.toString())
        : [],
    };
    eventTransactionMap.set(eventTransactionMap.size, {
      ...decodedTransaction,
    });
    parseMultiSendTransactions(eventTransactionMap, dataDecoded.parameters);
  }
  return Array.from(eventTransactionMap.values());
};

export function getAzoriusModuleFromModules(modules: DecentModule[]) {
  return modules.find(module => module.moduleType === FractalModuleType.AZORIUS);
}

export const decodeTransactions = async (
  _decode: (value: string, to: Address, data?: string | undefined) => Promise<DecodedTransaction[]>,
  _transactions: MetaTransaction[],
) => {
  const decodedTransactions = await Promise.all(
    _transactions.map(async tx => _decode(tx.value.toString(), tx.to, tx.data)),
  );
  return decodedTransactions.flat();
};
