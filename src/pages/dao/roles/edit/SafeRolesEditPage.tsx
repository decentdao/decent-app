import * as amplitude from '@amplitude/analytics-browser';
import { Box, Button, Flex, Hide, Show } from '@chakra-ui/react';
import { Plus } from '@phosphor-icons/react';
import { useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Hex, toHex } from 'viem';
import { RoleCardEdit } from '../../../../components/Roles/RoleCard';
import { RoleCardLoading } from '../../../../components/Roles/RolePageCard';
import { RolesEditTable } from '../../../../components/Roles/RolesTable';
import DraggableDrawer from '../../../../components/ui/containers/DraggableDrawer';
import NoDataCard from '../../../../components/ui/containers/NoDataCard';
import { ModalBase } from '../../../../components/ui/modals/ModalBase';
import { UnsavedChangesWarningContent } from '../../../../components/ui/modals/UnsavedChangesWarningContent';
import PageHeader from '../../../../components/ui/page/Header/PageHeader';
import { DAO_ROUTES } from '../../../../constants/routes';
import { getRandomBytes } from '../../../../helpers';
import { useNavigationBlocker } from '../../../../hooks/utils/useNavigationBlocker';
import { analyticsEvents } from '../../../../insights/analyticsEvents';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../../store/daoInfo/useDaoInfoStore';
import { useRolesStore } from '../../../../store/roles/useRolesStore';
import { RoleFormValues } from '../../../../types/roles';

export function SafeRolesEditPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.RolesEditPageOpened);
  }, []);

  const { t } = useTranslation(['roles', 'navigation', 'modals', 'common']);
  const { safe } = useDaoInfoStore();
  const { addressPrefix } = useNetworkConfigStore();

  const { values, setFieldValue } = useFormikContext<RoleFormValues>();

  const { hatsTree, getHat } = useRolesStore();

  const navigate = useNavigate();

  const [hasEditedRoles, setHasEditedRoles] = useState(false);

  const blocker = useNavigationBlocker({ roleEditPageNavigationBlockerParams: { hasEditedRoles } });

  const safeAddress = safe?.address;
  if (!safeAddress) return null;

  const showRoleEditDetails = (roleId: Hex) => {
    navigate(DAO_ROUTES.rolesEditDetails.relative(addressPrefix, safeAddress, roleId));
  };

  const hatsTreeLoading = hatsTree === undefined;
  const showNoRolesCard = !hatsTreeLoading && (hatsTree === null || hatsTree.roleHats.length === 0);

  return (
    <>
      {blocker.state === 'blocked' && (
        <>
          <Hide above="md">
            <DraggableDrawer
              isOpen
              onClose={() => {}}
              onOpen={() => {}}
              headerContent={null}
              initialHeight="23rem"
              closeOnOverlayClick={false}
            >
              <UnsavedChangesWarningContent
                onDiscard={blocker.proceed}
                onKeepEditing={blocker.reset}
              />
            </DraggableDrawer>
          </Hide>
          <Hide below="md">
            <ModalBase
              isOpen
              onClose={() => {}}
            >
              <UnsavedChangesWarningContent
                onDiscard={blocker.proceed}
                onKeepEditing={blocker.reset}
              />
            </ModalBase>
          </Hide>
        </>
      )}
      <Box>
        <PageHeader
          title={t('roles')}
          breadcrumbs={[
            {
              terminus: t('roles'),
              path: DAO_ROUTES.roles.relative(addressPrefix, safeAddress),
            },
            {
              terminus: t('editRoles'),
              path: '',
            },
          ]}
          buttonProps={{
            variant: 'secondary',
            children: t('addRole'),
            size: 'sm',
            gap: 0,
            leftIcon: (
              <Box mr="-0.25rem">
                <Plus size="1rem" />
              </Box>
            ),
            onClick: async () => {
              const newId = toHex(getRandomBytes(), { size: 32 });
              setFieldValue('roleEditing', { id: newId, canCreateProposals: false });
              showRoleEditDetails(newId);
            },
          }}
        />

        <Show above="md">
          <RolesEditTable handleRoleClick={showRoleEditDetails} />
        </Show>
        <Show below="md">
          {hatsTree === undefined && <RoleCardLoading />}
          {showNoRolesCard && values.hats.length === 0 && (
            <NoDataCard
              translationNameSpace="roles"
              emptyText="noRoles"
              emptyTextNotProposer="noRolesNotProposer"
            />
          )}
          {values.hats.map(hat => {
            const existingRole = getHat(hat.id);
            const isCurrentTermActive = existingRole?.roleTerms.currentTerm?.isActive;
            const isMemberTermPending =
              !isCurrentTermActive && existingRole?.wearerAddress !== hat.roleTerms?.[0]?.nominee;
            return (
              <RoleCardEdit
                key={hat.id}
                name={hat.name}
                wearerAddress={hat.resolvedWearer}
                editStatus={hat.editedRole?.status}
                handleRoleClick={() => {
                  setFieldValue('roleEditing', hat);
                  showRoleEditDetails(hat.id);
                }}
                payments={hat.payments}
                isCurrentTermActive={isCurrentTermActive}
                isMemberTermPending={isMemberTermPending}
              />
            );
          })}
        </Show>
      </Box>
      <Flex
        mt="1rem"
        gap="1rem"
        justifyContent="flex-end"
      >
        <Button
          variant="tertiary"
          onClick={() => {
            setHasEditedRoles(values.hats.some(hat => !!hat.editedRole));
            setTimeout(
              () =>
                navigate(DAO_ROUTES.roles.relative(addressPrefix, safeAddress), {
                  replace: true,
                }),
              50,
            );
          }}
        >
          {t('cancel', { ns: 'common' })}
        </Button>
        <Button
          onClick={() => {
            if (blocker.reset) {
              blocker.reset();
            }
            navigate(
              DAO_ROUTES.rolesEditCreateProposalSummary.relative(addressPrefix, safeAddress),
            );
          }}
          isDisabled={!values.hats.some(hat => hat.editedRole)}
        >
          {t('createProposal', { ns: 'modals' })}
        </Button>
      </Flex>
    </>
  );
}
