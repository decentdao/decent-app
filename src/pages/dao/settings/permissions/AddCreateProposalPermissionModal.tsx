import { Button, Flex, IconButton, Show, Text } from '@chakra-ui/react';
import { ArrowLeft, Trash, X } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Address, zeroAddress } from 'viem';
import { SettingsProposalPermissionForm } from '../../../../components/SafeSettings/SettingsProposalPermissionForm';
import { Card } from '../../../../components/ui/cards/Card';
import { ModalType } from '../../../../components/ui/modals/ModalProvider';
import { useDecentModal } from '../../../../components/ui/modals/useDecentModal';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import Divider from '../../../../components/ui/utils/Divider';
import { DAO_ROUTES } from '../../../../constants/routes';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';

// @todo Near-duplicate of SafePermissionsCreateProposal.tsx. Pending refactor and/or cleanup.
// https://linear.app/decent-labs/issue/ENG-842/fix-permissions-settings-ux-flows
export function AddCreateProposalPermissionModal({
  closeModal,
  votingStrategyAddress,
}: {
  closeModal: () => void;
  votingStrategyAddress: Address | null;
}) {
  const { t } = useTranslation(['settings', 'common', 'modals']);
  const { addressPrefix } = useNetworkConfigStore();

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  const { open: openConfirmDeleteStrategyModal } = useDecentModal(
    ModalType.CONFIRM_DELETE_STRATEGY,
  );

  if (!safe) return null;

  const settingsPermissionsPath = DAO_ROUTES.settingsPermissions.relative(
    addressPrefix,
    safe.address,
  );

  function FormContent() {
    return <SettingsProposalPermissionForm />;
  }

  function SubmitButton({ fullWidth = false }: { fullWidth?: boolean }) {
    return (
      <Button
        variant="primary"
        onClick={closeModal}
        width={fullWidth ? 'full' : 'auto'}
        mt={6}
      >
        {t('save', { ns: 'common' })}
      </Button>
    );
  }

  return (
    <>
      <Show below="md">
        <NestedPageHeader
          title={t('permissionCreateProposalsTitle')}
          backButton={{
            text: t('back', { ns: 'common' }),
            ...(votingStrategyAddress
              ? { href: settingsPermissionsPath }
              : { onClick: closeModal }),
          }}
        >
          {votingStrategyAddress && votingStrategyAddress !== zeroAddress && (
            <Flex
              width="25%"
              justifyContent="flex-end"
            >
              <Button
                variant="ghost"
                rightIcon={<Trash size={24} />}
                padding={0}
                onClick={openConfirmDeleteStrategyModal}
                color="color-error-400"
              >
                {t('delete', { ns: 'common' })}
              </Button>
            </Flex>
          )}
        </NestedPageHeader>

        <Card>
          <FormContent />
        </Card>

        <Flex justifyContent="flex-end">
          <SubmitButton />
        </Flex>
      </Show>

      <Show above="md">
        <Flex
          height="376px" // @dev - fixed height from design
          flexDirection="column"
          justifyContent="space-between"
        >
          <Flex justifyContent="space-between">
            {!votingStrategyAddress ||
              (votingStrategyAddress === zeroAddress && (
                <IconButton
                  size="button-md"
                  variant="ghost"
                  color="color-lilac-100"
                  aria-label={t('back', { ns: 'common' })}
                  onClick={closeModal}
                  icon={<ArrowLeft size={24} />}
                />
              ))}
            <Text>{t('permissionCreateProposalsTitle')}</Text>
            {votingStrategyAddress && votingStrategyAddress !== zeroAddress ? (
              <IconButton
                size="button-md"
                variant="ghost"
                color="color-error-400"
                icon={<Trash size={24} />}
                aria-label={t('delete', { ns: 'common' })}
                onClick={openConfirmDeleteStrategyModal}
              />
            ) : (
              <IconButton
                size="button-md"
                variant="ghost"
                color="color-lilac-100"
                aria-label={t('close', { ns: 'common' })}
                onClick={closeModal}
                icon={<X size={24} />}
              />
            )}
          </Flex>

          <Divider
            variant="darker"
            mx="-1.5rem"
            width="calc(100% + 3rem)"
          />

          <FormContent />
          <SubmitButton fullWidth />
        </Flex>
      </Show>
    </>
  );
}
