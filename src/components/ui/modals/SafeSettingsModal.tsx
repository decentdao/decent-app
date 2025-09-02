import { Button, Flex, Text } from '@chakra-ui/react';
import { Formik, Form, useFormikContext } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Address } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { DAO_ROUTES } from '../../../constants/routes';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { usePaymasterDepositInfo } from '../../../hooks/DAO/accountAbstraction/usePaymasterDepositInfo';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useValidationAddress } from '../../../hooks/schemas/common/useValidationAddress';
import useNetworkPublicClient from '../../../hooks/useNetworkPublicClient';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { useInstallVersionedVotingStrategy } from '../../../hooks/utils/useInstallVersionedVotingStrategy';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import { BigIntValuePair } from '../../../types';
import { RevenueSharingWalletForm, RevenueSharingWalletFormErrors } from '../../../types/revShare';
import { handleEditRevenueShare } from '../../SafeSettings/RevenueShare/revenueShareFormHandlers';
import { SettingsNavigation } from '../../SafeSettings/SettingsNavigation';
import { NewSignerItem } from '../../SafeSettings/Signers/SignersContainer';
import { SafeGeneralSettingTab } from '../../SafeSettings/TabContents/general/SafeGeneralSettingTab';
import {
  handleEditPaymaster,
  handleEditGeneral,
  handleEditMultisigGovernance,
  handleEditAzoriusGovernance,
  handleEditPermissions,
  handleEditStaking,
  validateSafeSettingsForm,
  validateFormHasEdits,
  validateFormHasErrors,
} from '../../SafeSettings/handlers';
import Divider from '../utils/Divider';
import { FormReadOnlyController } from './FormReadOnlyController';
import { ModalProvider } from './ModalProvider';

export type SafeSettingsEdits = {
  multisig?: {
    newSigners?: NewSignerItem[];
    signersToRemove?: string[];
    signerThreshold?: number;
  };
  azorius?: {
    quorumPercentage?: bigint;
    quorumThreshold?: bigint;
    votingPeriod?: bigint;
    timelockPeriod?: bigint;
    executionPeriod?: bigint;
  };
  general?: {
    name?: string;
    snapshot?: string;
    sponsoredVoting?: boolean;
  };
  paymasterGasTank?: {
    withdraw?: { recipientAddress?: Address; amount?: BigIntValuePair };
    deposit?: { amount?: BigIntValuePair; isDirectDeposit?: boolean };
  };
  permissions?: {
    proposerThreshold?: BigIntValuePair;
  };
  revenueSharing?: RevenueSharingWalletForm;
  staking?: {
    deploying?: boolean;
    newRewardTokens?: Address[];
    minimumStakingPeriod?: BigIntValuePair;
  };
};

type MultisigEditGovernanceFormikErrors = {
  newSigners?: { key: string; error: string }[];
  threshold?: string;
};

type GeneralEditFormikErrors = {
  name?: string;
  snapshot?: string;
};

type PaymasterGasTankEditFormikErrors = {
  withdraw?: { amount?: string; recipientAddress?: string };
  deposit?: { amount?: string };
};

type StakingEditFormikErrors = {
  newRewardTokens?: { key: string; error: string }[];
  minimumStakingPeriod?: string;
};

export type SafeSettingsFormikErrors = {
  multisig?: MultisigEditGovernanceFormikErrors;
  general?: GeneralEditFormikErrors;
  paymasterGasTank?: PaymasterGasTankEditFormikErrors;
  revenueSharing?: {
    existing: RevenueSharingWalletFormErrors;
    new: RevenueSharingWalletFormErrors;
  };
  staking?: StakingEditFormikErrors;
};

export function SafeSettingsModal({
  closeModal,
  closeAllModals,
}: {
  closeModal: () => void;
  closeAllModals: () => void;
}) {
  const { daoKey } = useCurrentDAOKey();

  const {
    node: { safe, subgraphInfo },
    governance,
    governanceContracts: {
      strategies,
      moduleAzoriusAddress,
      linearVotingErc20Address,
      linearVotingErc721Address,
      linearVotingErc20WithHatsWhitelistingAddress,
      linearVotingErc721WithHatsWhitelistingAddress,
    },
    revShareWallets,
  } = useDAOStore({ daoKey });

  const stakingContractAddress = governance?.stakedToken?.address;

  const [settingsContent, setSettingsContent] = useState(<SafeGeneralSettingTab />);

  const handleSettingsNavigationClick = (content: JSX.Element) => {
    setSettingsContent(content);
  };

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const { t } = useTranslation(['modals', 'common', 'proposalMetadata']);

  const { validateAddress } = useValidationAddress();

  const {
    chain: { id: chainId },
    contracts: {
      keyValuePairs,
      accountAbstraction,
      paymaster,
      zodiacModuleProxyFactory,
      linearVotingErc20HatsWhitelistingMasterCopy,
      linearVotingErc721HatsWhitelistingMasterCopy,
      linearVotingErc20HatsWhitelistingV1MasterCopy,
      linearVotingErc721HatsWhitelistingV1MasterCopy,
      hatsProtocol,
      votesERC20StakedV1MasterCopy,
    },
    bundlerMinimumStake,
  } = useNetworkConfigStore();

  function ActionButtons() {
    const { values } = useFormikContext<SafeSettingsEdits>();
    const { errors } = useFormikContext<SafeSettingsFormikErrors>();

    const hasEdits = validateFormHasEdits(values);
    const hasErrors = validateFormHasErrors(errors);
    return (
      <Flex
        flexDirection="row"
        justifyContent="flex-end"
        my="1rem"
        mr={4}
        alignItems="center"
        alignSelf="flex-end"
        alignContent="center"
        gap="0.5rem"
      >
        <Button
          variant="tertiary"
          size="sm"
          px="2rem"
          onClick={closeModal}
        >
          {t(canUserCreateProposal ? 'discardChanges' : 'close', { ns: 'common' })}
        </Button>
        {canUserCreateProposal && (
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isDisabled={!hasEdits || hasErrors}
          >
            {t('createProposal')}
          </Button>
        )}
      </Flex>
    );
  }

  const { addAction, resetActions } = useProposalActionsStore();

  const { addressPrefix } = useNetworkConfigStore();

  const { buildInstallVersionedVotingStrategies } = useInstallVersionedVotingStrategy();
  const { depositInfo: paymasterDepositInfo } = usePaymasterDepositInfo();
  const { address } = useAccount();
  const { data: userBalance } = useBalance({
    address,
    chainId,
  });
  const { data: safeBalance } = useBalance({
    address: safe?.address,
    chainId,
  });
  const navigate = useNavigate();

  const publicClient = useNetworkPublicClient();

  const gaslessVotingFeatureEnabled = useFeatureFlag('flag_gasless_voting');

  const ethValue = {
    bigintValue: 0n,
    value: '0',
  };

  const submitAllSettingsEditsProposal = async (values: SafeSettingsEdits) => {
    if (!safe?.address) {
      throw new Error('Safe address is not set');
    }

    resetActions();
    const { general, multisig, azorius, permissions, paymasterGasTank, staking, revenueSharing } =
      values;
    if (general) {
      const { action, title } = await handleEditGeneral(values, {
        t,
        safe,
        governance,
        accountAbstraction,
        keyValuePairs,
        ethValue,
        zodiacModuleProxyFactory,
        paymaster,
        chainId,
        bundlerMinimumStake,
        paymasterDepositInfo,
        buildInstallVersionedVotingStrategies,
        strategies,
      });

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
      });
    }

    if (paymasterGasTank) {
      const actions = await handleEditPaymaster(
        values,
        governance,
        accountAbstraction,
        publicClient,
      );

      if (actions && actions.length > 0) {
        actions.forEach(action => {
          addAction(action);
        });
      }
    }

    if (multisig) {
      const { action, title } = await handleEditMultisigGovernance(values, {
        t,
        safe,
        ethValue,
        getEnsAddress: async ({ name }) => {
          return publicClient.getEnsAddress({ name: name || '' });
        },
      });

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
      });
    }

    if (azorius) {
      const { action, title } = await handleEditAzoriusGovernance(values, {
        t,
        moduleAzoriusAddress,
        strategies,
        ethValue,
        publicClient,
      });

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
      });
    }

    if (permissions) {
      const action = await handleEditPermissions(values, {
        safe,
        governance,
        moduleAzoriusAddress,
        linearVotingErc20Address,
        linearVotingErc721Address,
        linearVotingErc20WithHatsWhitelistingAddress,
        linearVotingErc721WithHatsWhitelistingAddress,
        linearVotingErc20HatsWhitelistingMasterCopy,
        linearVotingErc721HatsWhitelistingMasterCopy,
        linearVotingErc20HatsWhitelistingV1MasterCopy,
        linearVotingErc721HatsWhitelistingV1MasterCopy,
        zodiacModuleProxyFactory,
        hatsProtocol,
        accountAbstraction,
        gaslessVotingFeatureEnabled,
        publicClient,
      });

      addAction(action);
    }

    if (revenueSharing) {
      const action = await handleEditRevenueShare({
        daoAddress: safe.address,
        parentDaoAddress: subgraphInfo?.parentAddress,
        stakingContractAddress,
        keyValuePairsAddress: keyValuePairs,
        updatedValues: values.revenueSharing,
        existingWallets: revShareWallets ?? [],
        publicClient,
      });
      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{action.title}</Text>,
      });
    }
    if (staking) {
      if (!zodiacModuleProxyFactory) {
        throw new Error('Zodiac module proxy factory is not available');
      }
      if (!votesERC20StakedV1MasterCopy) {
        throw new Error('VotesERC20StakedV1MasterCopy is not available');
      }

      const { action, title } = await handleEditStaking(values, {
        safe,
        governance,
        votesERC20StakedV1MasterCopy,
        zodiacModuleProxyFactory,
        ethValue,
        chainId,
        t,
      });

      addAction({
        actionType: action.actionType,
        transactions: action.transactions,
        content: <Text>{title}</Text>,
      });
    }

    navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
  };

  return (
    <Formik<SafeSettingsEdits>
      initialValues={{}}
      initialStatus={{ readOnly: !canUserCreateProposal }}
      validate={values => {
        return validateSafeSettingsForm(values, {
          validateAddress,
          paymasterDepositInfo,
          userBalance,
          safeBalance,
          safe,
          revShareWallets,
          subgraphInfo: subgraphInfo
            ? { parentAddress: subgraphInfo.parentAddress || undefined }
            : undefined,
          stakingContractAddress,
          t,
        });
      }}
      onSubmit={values => {
        submitAllSettingsEditsProposal(values);
        closeAllModals();
      }}
    >
      <Form>
        <FormReadOnlyController isReadOnly={!canUserCreateProposal} />
        <ModalProvider
          baseZIndex={2000}
          closeBaseModal={closeModal}
        >
          <Flex
            flexDirection="column"
            height="90vh"
            textColor="color-neutral-100"
            pl="1"
            overflowY="auto"
          >
            <Flex
              flex="1"
              height="100%"
              pl="1"
            >
              <SettingsNavigation onSettingsNavigationClick={handleSettingsNavigationClick} />
              <Divider vertical />
              {settingsContent}
            </Flex>

            <Divider />
            <ActionButtons />
          </Flex>
        </ModalProvider>
      </Form>
    </Formik>
  );
}
