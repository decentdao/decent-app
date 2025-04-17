import { Flex, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ProposalActionCard } from '../../../../../components/ProposalBuilder/ProposalActionCard';
import { AddActions } from '../../../../../components/ui/modals/AddActions';
import { useProposalActionsStore } from '../../../../../store/actions/useProposalActionsStore';

export function ActionsExperience({ onRemove }: { onRemove?: (index: number) => void }) {
  const { t } = useTranslation('actions');
  const { actions } = useProposalActionsStore();
  const { removeAction } = useProposalActionsStore();

  return (
    <Flex
      flexDirection="column"
      gap="1.5rem"
    >
      <Flex
        flexDirection="column"
        gap="0.5rem"
      >
        <Flex
          mt={6}
          mb={2}
          alignItems="center"
        >
          <Text ml={2}>{t('actions', { ns: 'actions' })}</Text>
        </Flex>
        {actions.map((action, index) => {
          return (
            <ProposalActionCard
              key={index}
              action={action}
              removeAction={() => {
                removeAction(index);
                onRemove?.(index);
              }}
              index={index}
            />
          );
        })}
      </Flex>
      <Flex>
        <AddActions />
      </Flex>
    </Flex>
  );
}
