// These are strict Typescript functions to create viewmodels from modal.
// Viewmodels are used to provide UI data to render reusable components.

import { TFunction } from 'i18next/typescript/t';
import { ChangeEvent } from 'react';
import { isFeatureEnabled } from '../../../helpers/featureFlags';
import {
  BigIntValuePair,
  GovernanceType,
  TokenCreationType,
  VotingStrategyType,
} from '../../../types';
import { NetworkConfig } from '../../../types/network';
import { getNetworkIcon } from '../../../utils/url';
import {
  ILabeledTextInput,
  ISelectionInput,
  ILabeledBigIntTextInput,
  IInputSection,
  IStepperInput,
  IInput,
  IInputRequirements,
  ITextInput,
  IRemoval,
  IToggleInput,
} from '../../input/Interfaces';

export const CreateDAOPresenter = {
  essential(
    t: TFunction<[string, string], undefined>,
    daonameDisabled: boolean,
    networks: NetworkConfig[],
    selectedNetwork: Number,
    selectedGovernance: GovernanceType,
    snapshotDisabled: boolean,
    snapshotError: string | undefined,
    onDaoNameChange: (value: string) => void,
    onChainOptionChange: (value: Number) => void,
    onGovernanceChange: (value: GovernanceType) => void,
    onSnapshotChange: (value: string) => void,
  ): {
    daoname: ILabeledTextInput;
    chainOptions: ISelectionInput;
    governanceOptions: ISelectionInput;
    snapshot: ILabeledTextInput;
  } {
    return {
      daoname: this._daoname(t, daonameDisabled, onDaoNameChange),
      chainOptions: this._chainOptions(t, networks, selectedNetwork, onChainOptionChange),
      governanceOptions: this._governanceOptions(t, selectedGovernance, onGovernanceChange),
      snapshot: this._snapshot(t, snapshotDisabled, snapshotError, onSnapshotChange),
    };
  },

  _daoname(
    t: TFunction<[string, string], undefined>,
    isDisabled: boolean,
    onValueChange: (value: string) => void,
  ): ILabeledTextInput {
    return {
      id: 'essentials-daoName',
      label: t('labelDAOName'),
      description: t('helperDAOName'),
      placeholder: t('daoNamePlaceholder'),
      fieldName: 'essentials.daoName',
      isDisabled: isDisabled,
      isRequired: true,
      testId: 'essentials-daoName',
      onValueChange: onValueChange,
    };
  },

  _chainOptions(
    t: TFunction<[string, string], undefined>,
    networks: NetworkConfig[],
    selected: Number,
    onValueChange: (value: Number) => void,
  ): ISelectionInput {
    const options = networks.map(network => ({
      value: network.chain.id.toString(),
      label: network.chain.name,
      icon: getNetworkIcon(network.addressPrefix),
      selected: selected === network.chain.id,
    }));

    return {
      id: 'chain',
      label: t('networks'),
      description: t('networkDescription'),
      selected: selected.toString(),
      isRequired: true,
      options: options,
      onValueChange: value => {
        onValueChange(Number(value));
      },
    };
  },

  _governanceOptions(
    t: TFunction<[string, string], undefined>,
    selected: GovernanceType,
    onValueChange: (value: GovernanceType) => void,
  ): ISelectionInput {
    return {
      id: 'governance',
      label: t('labelChooseGovernance'),
      description: t('helperChooseGovernance'),
      selected: selected,
      isRequired: true,
      options: [
        {
          label: t('labelAzoriusErc20Gov'),
          description: t('descAzoriusErc20Gov'),
          testId: 'choose-azorius',
          value: GovernanceType.AZORIUS_ERC20,
        },
        {
          label: t('labelAzoriusErc721Gov'),
          description: t('descAzoriusErc721Gov'),
          testId: 'choose-azorius-erc721',
          value: GovernanceType.AZORIUS_ERC721,
        },
        {
          label: t('labelMultisigGov'),
          description: t('descMultisigGov'),
          testId: 'choose-multisig',
          value: GovernanceType.MULTISIG,
        },
      ],
      onValueChange: value => {
        const governanceType = value as GovernanceType;
        onValueChange(governanceType);
      },
    };
  },

  _snapshot(
    t: TFunction<[string, string], undefined>,
    isDisabled: boolean,
    error: string | undefined,
    onValueChange: (value: string) => void,
  ): ILabeledTextInput {
    return {
      id: 'snapshot',
      label: t('snapshot'),
      description: t('snapshotHelper'),
      placeholder: 'example.eth',
      error: error,
      fieldName: 'essentials.snapshotENS',
      isDisabled: isDisabled,
      isRequired: false,
      testId: 'essentials-snapshotENS',
      onValueChange: onValueChange,
    };
  },

  token(
    t: TFunction<[string, string], undefined>,
    selectedTokenOptions: TokenCreationType,
    importAddressPlaceHolder: string,
    importAddressError: string | undefined,
    supply: bigint | undefined,
    onTokenOptionsChange: (value: TokenCreationType) => void,
    onImportAddressChange: (event: ChangeEvent<HTMLInputElement>) => void,
    onNameChange: (value: string) => void,
    onSymbolChange: (event: ChangeEvent<HTMLInputElement>) => void,
    onSupplyChange: (value: BigIntValuePair) => void,
  ): {
    options: ISelectionInput;
    importAddress: ILabeledTextInput | undefined;
    tokenName: ILabeledTextInput;
    tokenSymbol: ILabeledTextInput;
    tokenSupply: ILabeledBigIntTextInput;
  } {
    const { tokenName, tokenSymbol, tokenSupply } = this.tokenConfig(
      t,
      selectedTokenOptions,
      supply,
      onNameChange,
      onSymbolChange,
      onSupplyChange,
    );

    return {
      options: this._tokenOptions(t, selectedTokenOptions, onTokenOptionsChange),
      importAddress:
        selectedTokenOptions == TokenCreationType.IMPORTED
          ? this._tokenImportAddress(
              t,
              importAddressPlaceHolder,
              importAddressError,
              onImportAddressChange,
            )
          : undefined,
      tokenName: tokenName,
      tokenSymbol: tokenSymbol,
      tokenSupply: tokenSupply,
    };
  },

  tokenConfig(
    t: TFunction<[string, string], undefined>,
    selectedTokenOptions: TokenCreationType,
    supply: bigint | undefined,
    onNameChange: (value: string) => void,
    onSymbolChange: (event: ChangeEvent<HTMLInputElement>) => void,
    onSupplyChange: (value: BigIntValuePair) => void,
  ): {
    tokenName: ILabeledTextInput;
    tokenSymbol: ILabeledTextInput;
    tokenSupply: ILabeledBigIntTextInput;
  } {
    return {
      tokenName: this._tokenName(
        t,
        selectedTokenOptions == TokenCreationType.IMPORTED,
        onNameChange,
      ),
      tokenSymbol: this._tokenSymbol(
        t,
        selectedTokenOptions == TokenCreationType.IMPORTED,
        onSymbolChange,
      ),
      tokenSupply: this._tokenSupply(
        t,
        supply,
        selectedTokenOptions == TokenCreationType.IMPORTED,
        onSupplyChange,
      ),
    };
  },

  _tokenOptions(
    t: TFunction<[string, string], undefined>,
    selected: TokenCreationType,
    onValueChange: (value: TokenCreationType) => void,
  ): ISelectionInput {
    return {
      id: 'tokenContract',
      label: '',
      selected: selected,
      isRequired: true,
      options: [
        {
          label: t('radioLabelExistingToken'),
          description: t('helperExistingToken'),
          testId: 'choose-existingToken',
          value: TokenCreationType.IMPORTED,
        },
        {
          label: t('radioLabelNewToken'),
          description: t('helperNewToken'),
          testId: 'choose-newToken',
          value: TokenCreationType.NEW,
        },
      ],
      onValueChange: value => {
        const tokenCreationType = value as TokenCreationType;
        onValueChange(tokenCreationType);
      },
    };
  },

  _tokenImportAddress(
    t: TFunction<[string, string], undefined>,
    placeholder: string,
    error: string | undefined,
    onChange: (event: ChangeEvent<HTMLInputElement>) => void,
  ): ILabeledTextInput {
    return {
      id: 'erc20Token.tokenImportAddress',
      label: '',
      placeholder: placeholder,
      error: error,
      fieldName: 'erc20Token.tokenImportAddress',
      isRequired: true,
      onChange: onChange,
    };
  },

  _tokenName(
    t: TFunction<[string, string], undefined>,
    isDisabled: boolean,
    onValueChange: (value: string) => void,
  ): ILabeledTextInput {
    return {
      id: 'erc20Token.tokenName',
      label: t('labelTokenName'),
      description: t('helperTokenName'),
      placeholder: 'Name',
      fieldName: 'erc20Token.tokenName',
      isDisabled: isDisabled,
      isRequired: true,
      testId: 'tokenVoting-tokenNameInput',
      onValueChange: onValueChange,
    };
  },

  _tokenSymbol(
    t: TFunction<[string, string], undefined>,
    isDisabled: boolean,
    onChange: (event: ChangeEvent<HTMLInputElement>) => void,
  ): ILabeledTextInput {
    return {
      id: 'erc20Token.tokenSymbol',
      label: t('labelTokenSymbol'),
      description: t('helperTokenSymbol'),
      placeholder: 'TKN',
      fieldName: 'erc20Token.tokenSymbol',
      isDisabled: isDisabled,
      isRequired: true,
      testId: 'tokenVoting-tokenSymbolInput',
      onChange: onChange,
    };
  },

  _tokenSupply(
    t: TFunction<[string, string], undefined>,
    value: bigint | undefined,
    isDisabled: boolean,
    onValueChange: (value: BigIntValuePair) => void,
  ): ILabeledBigIntTextInput {
    return {
      id: 'erc20Token.tokenSupply',
      label: t('labelTokenSupply'),
      description: t('helperTokenSupply'),
      placeholder: '100,000,000',
      value: value,
      isDisabled: isDisabled,
      isRequired: true,
      testId: 'tokenVoting-tokenSupplyInput',
      onValueChange: onValueChange,
    };
  },

  section(label?: string): IInputSection {
    return {
      label: label,
    };
  },

  governance(
    t: TFunction<[string, string], undefined>,
    votingStrategyType: VotingStrategyType,
    quorum: bigint | undefined,
    votingPeriod: number,
    timelockPeriod: number,
    executionPeriod: number,
    onQuorumChanged: (value: BigIntValuePair) => void,
    onVotingPeriodChange: (value: number) => void,
    onTimelockPeriodChange: (value: number) => void,
    onExecutionPeriodChange: (value: number) => void,
  ): {
    quorum: ILabeledBigIntTextInput;
    votingPeriod: IStepperInput;
    timelockPeriod: IStepperInput;
    executionPeriod: IStepperInput;
  } {
    return {
      quorum:
        votingStrategyType === VotingStrategyType.LINEAR_ERC20
          ? this._erc20Quorum(t, quorum, onQuorumChanged)
          : this._erc721Quorum(t, quorum, onQuorumChanged),
      votingPeriod: this._votingPeriod(t, votingPeriod, onVotingPeriodChange),
      timelockPeriod: this._timelockPeriod(t, timelockPeriod, onTimelockPeriodChange),
      executionPeriod: this._executionPeriod(t, executionPeriod, onExecutionPeriodChange),
    };
  },

  _erc20Quorum(
    t: TFunction<[string, string], undefined>,
    value: bigint | undefined,
    onValueChange: (value: BigIntValuePair) => void,
  ): ILabeledBigIntTextInput {
    return {
      id: 'erc20Token.quorum',
      label: t('quorum', { ns: 'common' }),
      description: t('helperQuorumERC20'),
      placeholder: '',
      value: value,
      max: '100',
      decimalPlaces: 0,
      suffix: '%',
      isDisabled: false,
      isRequired: true,
      testId: 'govConfig-quorumPercentage',
      onValueChange: onValueChange,
    };
  },

  _erc721Quorum(
    t: TFunction<[string, string], undefined>,
    value: bigint | undefined,
    onValueChange: (value: BigIntValuePair) => void,
  ): ILabeledBigIntTextInput {
    return {
      id: 'erc721Token.quorum',
      label: t('quorum', { ns: 'common' }),
      description: t('helperQuorumERC721'),
      placeholder: '',
      value: value,
      min: '1',
      decimalPlaces: 0,
      isDisabled: false,
      isRequired: true,
      testId: 'govConfig-quorumThreshold',
      onValueChange: onValueChange,
    };
  },

  _votingPeriod(
    t: TFunction<[string, string], undefined>,
    value: number,
    onValueChange: (value: number) => void,
  ): IStepperInput {
    return {
      id: 'votingPeriod',
      label: t('labelVotingPeriod'),
      description: t('helperVotingPeriod'),
      unit: t('days', { ns: 'common' }),
      value: value,
      onValueChange: onValueChange,
    };
  },

  _timelockPeriod(
    t: TFunction<[string, string], undefined>,
    value: number,
    onValueChange: (value: number) => void,
  ): IStepperInput {
    return {
      id: 'timelockPeriod',
      label: t('labelTimelockPeriod'),
      description: t('helperTimelockPeriod'),
      unit: t('days', { ns: 'common' }),
      value: value,
      onValueChange: onValueChange,
    };
  },

  _executionPeriod(
    t: TFunction<[string, string], undefined>,
    value: number,
    onValueChange: (value: number) => void,
  ): IStepperInput {
    return {
      id: 'votingPeriod',
      label: t('labelExecutionPeriod'),
      description: t('helperExecutionPeriod'),
      unit: t('days', { ns: 'common' }),
      value: value,
      onValueChange: onValueChange,
    };
  },

  multiSignOwners(t: TFunction<[string, string], undefined>): IInput & IInputRequirements {
    return {
      label: t('titleSignerAddresses'),
      description: t('subTitleSignerAddresses'),
      isRequired: true,
    };
  },

  multiSign(
    t: TFunction<[string, string], undefined>,
    index: number,
    error: string | undefined,
    onValueChange: (value: string) => void,
    onRemoval: (index: number) => void,
  ): ITextInput & IInputRequirements & IRemoval {
    return {
      id: `multiSigOwner${index}`,
      fieldName: `multisig.trustedAddresses.${index}`,
      testId: `safeConfig-signer-${index}`,
      error: error,
      isRequired: true,
      removalIndex: index,
      removalLabel: t('removeSigner'),
      onValueChange: onValueChange,
      onRemoval: onRemoval,
    };
  },

  gaslessVoting(
    t: TFunction<[string, string], undefined>,
    gaslessVotingSupported: boolean,
    onValueChange: (value: boolean) => void,
  ): IToggleInput | undefined {
    if (!isFeatureEnabled('flag_gasless_voting')) return undefined;
    if (!gaslessVotingSupported) return undefined;

    return undefined;
    // return {
    //   id: `multiSigOwner${index}`,
    //   fieldName: `multisig.trustedAddresses.${index}`,
    //   testId: `safeConfig-signer-${index}`,
    //   error: error,
    //   isRequired: true,
    //   removalIndex: index,
    //   removalLabel: t('removeSigner'),
    //   onValueChange: onValueChange,
    //   onRemoval: onRemoval,
    // };

    // const { t } = useTranslation('daoCreate');
    // const { chain, gaslessVotingSupported } = useNetworkConfigStore();
  },
};
