import { BigNumber } from 'ethers';
import { GovernanceTypes } from '../../providers/Fractal/types';
import { CreatorFormState, CreatorSteps } from './types';

export const CREATOR_STEP_TITLE_KEYS = {
  [CreatorSteps.ESSENTIALS]: 'titleEssentials',
  [CreatorSteps.GNOSIS_WITH_USUL]: 'titleUsulConfig',
  [CreatorSteps.GNOSIS_GOVERNANCE]: 'titleGnosis',
  [CreatorSteps.GOV_CONFIG]: 'titleGovConfig',
  [CreatorSteps.GUARD_CONFIG]: 'titleGuardConfig',
};

export const DEFAULT_TOKEN_DECIMALS = 18;

export const initialState: CreatorFormState = {
  essentials: {
    daoName: '',
    governance: GovernanceTypes.GNOSIS_SAFE,
  },
  govToken: {
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
    parentAllocationAmount: undefined,
  },
  /**
   * Time periods in CreatorState are denoted in MINUTES in the UI,
   * however they will be converted to SECONDS before submitting to
   * the DAO creation transaction.
   *
   * See {@link useBuildDAOTx} for more info.
   */
  govModule: {
    quorumPercentage: {
      value: '4',
      bigNumberValue: BigNumber.from(4),
    },
    timelock: {
      value: '1440',
      bigNumberValue: BigNumber.from(1440),
    },
    votingPeriod: {
      value: '10080',
      bigNumberValue: BigNumber.from(10080),
    },
  },
  vetoGuard: {
    executionPeriod: {
      value: '2800',
      bigNumberValue: BigNumber.from(2800),
    },
    timelockPeriod: {
      value: '1400',
      bigNumberValue: BigNumber.from(1400),
    },
    vetoVotesThreshold: {
      value: '1',
      bigNumberValue: BigNumber.from(1),
    },
    freezeVotesThreshold: {
      value: '1',
      bigNumberValue: BigNumber.from(1),
    },
    freezeProposalPeriod: {
      value: '10080',
      bigNumberValue: BigNumber.from(10080),
    },
    freezePeriod: {
      value: '10080',
      bigNumberValue: BigNumber.from(10080),
    },
  },
  gnosis: {
    trustedAddresses: [''],
    signatureThreshold: 1,
    numOfSigners: 1,
  },
};
