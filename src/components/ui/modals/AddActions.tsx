import { Button, Flex, Grid, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { ArrowsDownUp, CraneTower, Plus, SquaresFour } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { DETAILS_BOX_SHADOW } from '../../../constants/common';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
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
      boxShadow={DETAILS_BOX_SHADOW}
      _hover={!isDisabled ? { bg: 'neutral-3' } : undefined}
      _active={!isDisabled ? { bg: 'neutral-2' } : undefined}
      transition="all ease-out 300ms"
      justifyContent="flex-start"
    >
      <Flex
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
          color={isDisabled ? 'neutral-6' : 'color-lilac-100'}
        />
        <Text
          textStyle="heading-small"
          mb="0.25rem"
          color={isDisabled ? 'neutral-6' : 'neutral-0'}
        >
          {title}
        </Text>
        <Text
          whiteSpace="pre-wrap"
          textAlign="left"
          color={isDisabled ? 'neutral-6' : 'neutral-7'}
        >
          {subtitle}
        </Text>
      </Flex>
    </Button>
  );
}

export function AddActions() {
  const { daoKey } = useCurrentDAOKey();
  const {
    treasury: { assetsFungible },
  } = useDAOStore({ daoKey });

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
      const actionType = ProposalActionType.TRANSACTION_BUILDER;

      addAction({
        actionType: actionType,
        content: <></>,
        transactions: transactionBuilderData,
      });
    },
  });

  const hasAnyBalanceOfAnyFungibleTokens =
    assetsFungible.reduce((p, c) => p + BigInt(c.balance), 0n) > 0n;

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
        size="2xl"
        isOpen={isOpen}
        onClose={onClose}
        title={t('actions')}
      >
        <Grid
          gap="0.5rem"
          flexWrap="wrap"
          justifyContent="space-evenly"
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
          templateRows="auto"
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
          <ActionCard
            title={t('transcationBuilderActionCardTitle', { ns: 'modals' })}
            subtitle={t('transactionBuilderActionCardSub', { ns: 'modals' })}
            icon={CraneTower}
            onClick={() => {
              onClose();
              openTransactionBuilderModal();
            }}
            isDisabled={false}
          />

          <ActionCard
            title={t('comingSoon')}
            subtitle={t('comingSoonSub')}
            icon={SquaresFour}
            onClick={() => {}}
            isDisabled
          />
        </Grid>
      </ModalBase>
    </>
  );
}
