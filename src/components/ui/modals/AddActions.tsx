import { Button, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { ArrowsDownUp, Plus, SquaresFour } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { DETAILS_BOX_SHADOW } from '../../../constants/common';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useStore } from '../../../providers/App/AppProvider';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import { ProposalActionType } from '../../../types';
import { prepareSendAssetsActionData } from '../../../utils/dao/prepareSendAssetsActionData';
import { ModalBase } from './ModalBase';
import { ModalType } from './ModalProvider';
import { useDecentModal } from './useDecentModal';

function ActionCard({
  title,
  subtitle,
  icon,
  onClick,
  isDisabled,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  onClick: () => void;
  isDisabled: boolean;
}) {
  return (
    <Button
      variant="unstyled"
      height="auto"
      onClick={onClick}
      isDisabled={isDisabled}
      padding={0}
      w="full"
    >
      <Flex
        boxShadow={DETAILS_BOX_SHADOW}
        _hover={!isDisabled ? { bg: 'neutral-3' } : undefined}
        _active={!isDisabled ? { bg: 'neutral-2' } : undefined}
        transition="all ease-out 300ms"
        p="1.5rem"
        borderRadius="0.5rem"
        flexDirection="column"
        alignItems="flex-start"
      >
        <Icon
          as={icon}
          w="2rem"
          h="2rem"
          mb="1rem"
          color={isDisabled ? 'neutral-6' : 'lilac-0'}
        />
        <Text
          textStyle="heading-small"
          mb="0.25rem"
          color={isDisabled ? 'neutral-6' : 'neutral-0'}
        >
          {title}
        </Text>
        <Text color={isDisabled ? 'neutral-6' : 'neutral-7'}>{subtitle}</Text>
      </Flex>
    </Button>
  );
}

export function AddActions() {
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { assetsFungible },
  } = useStore({ daoKey });

  const { t } = useTranslation(['actions', 'modals']);
  const { addAction } = useProposalActionsStore();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const openSendAssetsModal = useDecentModal(ModalType.SEND_ASSETS, {
    onSubmit: sendAssetsData => {
      const { action } = prepareSendAssetsActionData(sendAssetsData);
      addAction({ ...action, content: <></> });
    },
    submitButtonText: t('Add Action', { ns: 'modals' }),
  });

  const openTransactionBuilderModal = useDecentModal(ModalType.TRANSACTION_BUILDER, {
    onSubmit: transactionBuilderData => {
      addAction({
        actionType: ProposalActionType.TRANSACTION_BUILDER,
        content: <></>,
        transactions: transactionBuilderData,
      });
    },
  });

  const hasAnyBalanceOfAnyFungibleTokens =
    assetsFungible.reduce((p, c) => p + BigInt(c.balance), 0n) > 0n;

  const isDevMode = useFeatureFlag('flag_dev');

  return (
    <>
      <Button
        variant="secondary"
        mt="1rem"
        size="sm"
        onClick={onOpen}
      >
        <Icon as={Plus} />
        {t('addAction')}
      </Button>

      <ModalBase
        size="xl"
        isOpen={isOpen}
        onClose={onClose}
        title={t('actions')}
      >
        <Flex
          gap="2"
          justifyContent="space-between"
          flexWrap="wrap"
        >
          <ActionCard
            title={t('transferAssets')}
            subtitle={t('transferAssetsSub')}
            icon={ArrowsDownUp}
            onClick={() => {
              onClose();
              openSendAssetsModal();
            }}
            isDisabled={!hasAnyBalanceOfAnyFungibleTokens}
          />
          {isDevMode && (
            <ActionCard
              title={t('transcationBuilderActionCardTitle', { ns: 'modals' })}
              subtitle={t('transactionBuilderActionCardSub', { ns: 'modals' })}
              icon={ArrowsDownUp}
              onClick={() => {
                onClose();
                openTransactionBuilderModal();
              }}
              isDisabled={false}
            />
          )}

          <ActionCard
            title={t('comingSoon')}
            subtitle={t('comingSoonSub')}
            icon={SquaresFour}
            onClick={() => {}}
            isDisabled
          />
        </Flex>
      </ModalBase>
    </>
  );
}
