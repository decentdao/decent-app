import {
  CreatorFormState,
  GovernanceType,
  TokenCreationType,
  VotingStrategyType,
} from '../../types';

export const DEFAULT_TOKEN_DECIMALS = 18;

// @todo make the time lengths dynamic for whatever real-life values we're targeting here

export const initialState: CreatorFormState = {
  essentials: {
    daoName: '',
    governance: GovernanceType.AZORIUS_ERC20,
    snapshotENS: '',
    gaslessVoting: false,
  },
  erc20Token: {
    tokenCreationType: TokenCreationType.IMPORTED,
    tokenName: '',
    tokenSupply: {
      value: '',
    },
    tokenSymbol: '',
    tokenAllocations: [
      {
        address: '',
        amount: {
          value: '',
        },
      },
    ],
    tokenImportAddress: undefined,
    parentAllocationAmount: {
      value: '',
    },
  },
  erc721Token: {
    nfts: [
      {
        tokenAddress: undefined,
        tokenWeight: {
          value: '',
        },
      },
    ],
    quorumThreshold: {
      value: '10',
      bigintValue: 10n,
    },
  },
  /**
   * Time periods in CreatorState are denoted in MINUTES in the UI,
   * however they will be converted to BLOCKS before submitting to
   * the DAO creation transaction.
   *
   * See {@link useBuildDAOTx} for more info.
   */
  azorius: {
    quorumPercentage: {
      value: '4',
      bigintValue: 4n,
    },
    timelock: {
      value: '1440',
      bigintValue: 1440n,
    },
    votingPeriod: {
      value: '10080',
      bigintValue: 10080n,
    },
    executionPeriod: {
      value: '2880',
      bigintValue: 2880n,
    },
    votingStrategyType: VotingStrategyType.LINEAR_ERC20,
  },
  freeze: {
    executionPeriod: {
      value: '2880',
      bigintValue: 2880n,
    },
    timelockPeriod: {
      value: '1440',
      bigintValue: 1440n,
    },
    freezeVotesThreshold: {
      value: '1',
      bigintValue: 1n,
    },
    freezeProposalPeriod: {
      value: '10080',
      bigintValue: 10080n,
    },
    freezePeriod: {
      value: '10080',
      bigintValue: 10080n,
    },
    attachFractalModule: true,
  },
  multisig: {
    trustedAddresses: [''],
    signatureThreshold: 1,
    numOfSigners: 1,
    customNonce: 0,
  },
};
