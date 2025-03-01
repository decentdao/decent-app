import * as amplitude from '@amplitude/analytics-browser';
import { Box, Show } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate } from 'react-router-dom';
import { Hex } from 'viem';
import PencilWithLineIcon from '../../../assets/theme/custom/icons/PencilWithLineIcon';
import { RoleCard } from '../../../components/Roles/RoleCard';
import { RoleCardLoading } from '../../../components/Roles/RolePageCard';
import { RolesTable } from '../../../components/Roles/RolesTable';
import NoDataCard from '../../../components/ui/containers/NoDataCard';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { analyticsEvents } from '../../../insights/analyticsEvents';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { useRolesStore } from '../../../store/roles/useRolesStore';

export function SafeRolesPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.RolesPageOpened);
  }, []);

  const { hatsTree } = useRolesStore();
  const { addressPrefix } = useNetworkConfigStore();
  const { t } = useTranslation(['roles']);
  const { safe } = useDaoInfoStore();
  const navigate = useNavigate();

  const { canUserCreateProposal } = useCanUserCreateProposal();
  const safeAddress = safe?.address;

  if (!safeAddress) return null;

  const handleNavigateToRole = (hatId: Hex) =>
    navigate(DAO_ROUTES.rolesDetails.relative(addressPrefix, safeAddress, hatId));

  const hatsTreeLoading = hatsTree === undefined;
  const showNoRolesCard = !hatsTreeLoading && (hatsTree === null || hatsTree.roleHats.length === 0);
  const showRolesTable = !hatsTreeLoading && hatsTree !== null && hatsTree.roleHats.length > 0;

  return (
    <Box>
      <PageHeader
        title={t('roles')}
        breadcrumbs={[
          {
            terminus: t('roles'),
            path: '',
          },
        ]}
        buttonProps={
          canUserCreateProposal
            ? {
                variant: 'secondary',
                size: 'sm',
                leftIcon: (
                  <Box mr="-0.25rem">
                    <PencilWithLineIcon
                      w="1rem"
                      h="1rem"
                    />
                  </Box>
                ),
                gap: 0,
                children: t('editRoles'),
                onClick: () => navigate(DAO_ROUTES.rolesEdit.relative(addressPrefix, safeAddress)),
              }
            : undefined
        }
      />
      {hatsTreeLoading && <RoleCardLoading />}
      {showNoRolesCard && (
        <NoDataCard
          translationNameSpace="roles"
          emptyText="noRoles"
          emptyTextNotProposer="noRolesNotProposer"
        />
      )}

      {showRolesTable && (
        <>
          <Show above="md">
            <RolesTable
              handleRoleClick={handleNavigateToRole}
              hatsTree={hatsTree}
            />
          </Show>

          <Show below="md">
            {hatsTree.roleHats.map(roleHat => {
              return (
                <RoleCard
                  key={roleHat.id}
                  name={roleHat.name}
                  wearerAddress={
                    roleHat.roleTerms.currentTerm?.isActive
                      ? roleHat.roleTerms.currentTerm?.nominee
                      : roleHat.wearerAddress
                  }
                  handleRoleClick={() => handleNavigateToRole(roleHat.id)}
                  paymentsCount={roleHat.payments.filter(p => p.isStreaming()).length || undefined}
                  isCurrentTermActive={roleHat.roleTerms.currentTerm?.isActive}
                />
              );
            })}
          </Show>
        </>
      )}
      <Outlet />
    </Box>
  );
}
