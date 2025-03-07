import { Button, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { ArrowsDownUp, Plus, SquaresFour } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { DETAILS_BOX_SHADOW } from '../../../constants/common';
import { useFractal } from '../../../providers/App/AppProvider';
import { SendAssetsData } from '../../../utils/dao/prepareSendAssetsActionData';
import { ModalBase } from './ModalBase';
import { SendAssetsModal } from './SendAssetsModal';

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

export function AddActions({
  addSendAssetsAction,
}: {
  addSendAssetsAction: (data: SendAssetsData) => void;
}) {
  const {
    treasury: { assetsFungible },
  } = useFractal();

  const { t } = useTranslation('actions');

  const { isOpen: isOpenAction, onOpen: onOpenAction, onClose: onCloseAction } = useDisclosure();
  const { isOpen: isOpenAssets, onOpen: onOpenAssets, onClose: onCloseAssets } = useDisclosure();

  const hasAnyBalanceOfAnyFungibleTokens =
    assetsFungible.reduce((p, c) => p + BigInt(c.balance), 0n) > 0n;

  return (
    <>
      <Button
        variant="secondary"
        mt="1rem"
        size="sm"
        onClick={onOpenAction}
      >
        <Icon as={Plus} />
        {t('addAction')}
      </Button>

      <ModalBase
        size="xl"
        isOpen={isOpenAction}
        onClose={onCloseAction}
        title={t('actions')}
      >
        <Flex
          gap="2"
          justifyContent="space-between"
        >
          <ActionCard
            title={t('transferAssets')}
            subtitle={t('transferAssetsSub')}
            icon={ArrowsDownUp}
            onClick={() => {
              onCloseAction();
              onOpenAssets();
            }}
            isDisabled={!hasAnyBalanceOfAnyFungibleTokens}
          />

          <ActionCard
            title={t('comingSoon')}
            subtitle={t('comingSoonSub')}
            icon={SquaresFour}
            onClick={() => {}}
            isDisabled
          />
        </Flex>
      </ModalBase>

      <ModalBase
        isOpen={isOpenAssets}
        onClose={onCloseAssets}
        title={t('transferAssets')}
      >
        <SendAssetsModal
          submitButtonText={t('add', { ns: 'modals' })}
          showNonceInput={false}
          close={onCloseAssets}
          sendAssetsData={addSendAssetsAction}
        />
      </ModalBase>
    </>
  );
}
