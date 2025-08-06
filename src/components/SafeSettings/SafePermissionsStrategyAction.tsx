import { Box, Icon, Text } from '@chakra-ui/react';
import { Coins } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../providers/App/AppProvider';
import { AzoriusGovernance, BigIntValuePair, ProposalActionType } from '../../types';

export function SafePermissionsStrategyAction({
  actionType,
  proposerThreshold,
}: {
  actionType: ProposalActionType;
  proposerThreshold: BigIntValuePair;
}) {
  const { daoKey } = useCurrentDAOKey();
  const { governance } = useDAOStore({ daoKey });
  const azoriusGovernance = governance as AzoriusGovernance;

  const { t } = useTranslation('settings');
  const title =
    actionType === ProposalActionType.ADD
      ? t('addPermission')
      : actionType === ProposalActionType.EDIT
        ? t('editPermission')
        : t('deletePermission');

  return (
    <Box
      width="100%"
      whiteSpace="balance"
      data-testid="permissions-strategy-action"
    >
      <Text
        as="span"
        data-testid="permissions-action-title"
      >
        {title}
      </Text>
      <Text
        color="color-lilac-100"
        as="span"
        data-testid="permissions-create-proposals-text"
      >
        {` ${t('createProposals')} `}
      </Text>
      <Text
        as="span"
        data-testid="permissions-action-description"
      >
        {` ${t('editPermissionActionDescription')} `}
      </Text>
      <Icon
        as={Coins}
        color="color-lilac-100"
        data-testid="permissions-threshold-icon"
      />
      <Text
        as="span"
        color="color-lilac-100"
        data-testid="permissions-threshold-value"
      >
        {` ${proposerThreshold.value} ${azoriusGovernance.votesToken?.symbol || t('votingWeightThreshold')} `}
      </Text>
      <Text
        as="span"
        data-testid="permissions-action-description-2"
      >
        {` ${t('editPermissionActionDescription2')} `}
      </Text>
    </Box>
  );
}
