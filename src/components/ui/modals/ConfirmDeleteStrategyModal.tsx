import { Button, Flex, Text } from '@chakra-ui/react';
import { WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import useVotingStrategiesAddresses from '../../../hooks/utils/useVotingStrategiesAddresses';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import { AzoriusGovernance, CreateProposalTransaction, ProposalActionType } from '../../../types';
import { SENTINEL_MODULE } from '../../../utils/address';
import { SafePermissionsStrategyAction } from '../../SafeSettings/SafePermissionsStrategyAction';

export function ConfirmDeleteStrategyModal({
  onClose,
  closeAllModals,
}: {
  onClose: () => void;
  closeAllModals: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('settings');
  const { addressPrefix } = useNetworkConfigStore();
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    governance,
    governanceContracts,
  } = useDAOStore({ daoKey });
  const { addAction, resetActions } = useProposalActionsStore();

  const azoriusGovernance = governance as AzoriusGovernance;
  const { getVotingStrategies } = useVotingStrategiesAddresses();

  const handleDeleteStrategy = async () => {
    if (!safe || !governanceContracts.moduleAzoriusAddress) {
      return;
    }

    if (
      !governanceContracts.linearVotingErc20WithHatsWhitelistingAddress &&
      !governanceContracts.linearVotingErc721WithHatsWhitelistingAddress
    ) {
      toast.error(t('cannotDeleteStrategy'));
      onClose();
      return;
    }

    let transaction: CreateProposalTransaction;
    if (governanceContracts.linearVotingErc20Address) {
      const strategies = await getVotingStrategies();

      if (!strategies) {
        throw new Error('No strategies found');
      }

      // Find the previous strategy for the one you want to disable
      const strategyToDisable = governanceContracts.linearVotingErc20Address;
      let prevStrategy = SENTINEL_MODULE;
      for (let i = 0; i < strategies.length; i++) {
        if (strategies[i].strategyAddress === strategyToDisable) {
          break;
        }
        prevStrategy = strategies[i].strategyAddress;
      }
      transaction = {
        targetAddress: governanceContracts.moduleAzoriusAddress,
        ethValue: {
          bigintValue: 0n,
          value: '0',
        },
        functionName: 'disableStrategy',
        parameters: [
          {
            signature: 'address',
            value: prevStrategy,
          },
          {
            signature: 'address',
            value: strategyToDisable,
          },
        ],
      };
    } else if (governanceContracts.linearVotingErc721Address) {
      const strategies = await getVotingStrategies();

      if (!strategies) {
        throw new Error('No strategies found');
      }

      // Find the previous strategy for the one you want to disable
      const strategyToDisable = governanceContracts.linearVotingErc721Address;
      let prevStrategy = SENTINEL_MODULE;
      for (let i = 0; i < strategies.length; i++) {
        if (strategies[i].strategyAddress === strategyToDisable) {
          break;
        }
        prevStrategy = strategies[i].strategyAddress;
      }
      transaction = {
        targetAddress: governanceContracts.moduleAzoriusAddress,
        ethValue: {
          bigintValue: 0n,
          value: '0',
        },
        functionName: 'disableStrategy',
        parameters: [
          {
            signature: 'address',
            value: prevStrategy,
          },
          {
            signature: 'address',
            value: strategyToDisable,
          },
        ],
      };
    } else {
      throw new Error('No linear voting contract found');
    }
    resetActions();
    addAction({
      actionType: ProposalActionType.DELETE,
      content: (
        <SafePermissionsStrategyAction
          actionType={ProposalActionType.DELETE}
          proposerThreshold={{
            value: azoriusGovernance.votingStrategy?.proposerThreshold?.formatted || '0',
            bigintValue: azoriusGovernance.votingStrategy?.proposerThreshold?.value,
          }}
        />
      ),
      transactions: [transaction],
    });

    closeAllModals();
    navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
  };

  return (
    <Flex
      flexDirection="column"
      gap={6}
    >
      <Flex
        flexDirection="column"
        gap={4}
        justifyContent="center"
        alignItems="center"
      >
        <WarningCircle size={40} />
        <Text textStyle="text-2xl-regular">{t('areYouSure')}</Text>
      </Flex>
      <Flex
        flexDirection="column"
        gap={2}
      >
        <Button
          variant="primary"
          onClick={onClose}
        >
          {t('nevermind')}
        </Button>
        <Button
          variant="secondary"
          color="color-error-400"
          borderColor="color-error-400"
          _hover={{ color: 'color-error-500', borderColor: 'color-error-500' }}
          onClick={handleDeleteStrategy}
        >
          {t('deletePermission')}
        </Button>
      </Flex>
    </Flex>
  );
}
