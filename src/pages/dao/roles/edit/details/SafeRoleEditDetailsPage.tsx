import { Box } from '@chakra-ui/react';
import { Trash } from '@phosphor-icons/react';
import { FieldArray, useFormikContext } from 'formik';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isHex } from 'viem';
import { RoleFormTabs } from '../../../../../components/Roles/forms/RoleFormTabs';
import PageHeader from '../../../../../components/ui/page/Header/PageHeader';
import { DAO_ROUTES } from '../../../../../constants/routes';
import { useNavigationBlocker } from '../../../../../hooks/utils/useNavigationBlocker';
import { useNetworkConfigStore } from '../../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../../../../store/daoInfo/useDaoInfoStore';
import {
  EditBadgeStatus,
  EditedRole,
  RoleFormValues,
  RoleHatFormValue,
} from '../../../../../types/roles';

export function SafeRoleEditDetailsPage() {
  const { t } = useTranslation(['roles']);
  const { safe } = useDaoInfoStore();
  const { addressPrefix } = useNetworkConfigStore();
  const navigate = useNavigate();

  const editRolesFormikContext = useFormikContext<RoleFormValues>();
  const { values, setFieldValue, touched, setTouched } = editRolesFormikContext;

  const [searchParams] = useSearchParams();
  const hatEditingId = searchParams.get('hatId');

  const [wasRoleActuallyEdited, setWasRoleActuallyEdited] = useState(false);

  const blocker = useNavigationBlocker({
    roleEditDetailsNavigationBlockerParams: { wasRoleActuallyEdited, ...editRolesFormikContext },
  });

  const backupRoleEditing = useRef(values.roleEditing);
  const backupTouched = useRef(touched.roleEditing);
  const backupNewRoleTerm = useRef(values.newRoleTerm);

  if (!isHex(hatEditingId)) return null;
  if (!safe?.address) return null;
  if (hatEditingId === undefined) return null;

  const hatIndex = values.hats.findIndex(h => h.id === hatEditingId);
  if (hatIndex === undefined) return null;

  const role = values.hats[hatIndex];

  const goBackToRolesEdit = () => {
    backupRoleEditing.current = values.roleEditing;
    backupTouched.current = touched.roleEditing;
    backupNewRoleTerm.current = values.newRoleTerm;

    setWasRoleActuallyEdited(values.roleEditing !== undefined);

    setTimeout(() => {
      setTouched({});
      setFieldValue('roleEditing', undefined);
      setFieldValue('newRoleTerm', undefined);
      navigate(DAO_ROUTES.rolesEdit.relative(addressPrefix, safe.address), { replace: true });
    }, 50);
  };

  const handleRemoveRole = () => {
    const editedRole: EditedRole = {
      fieldNames: [],
      status: EditBadgeStatus.Removed,
    };

    if (hatIndex !== -1) {
      if (role?.editedRole?.status === EditBadgeStatus.New) {
        setFieldValue(
          'hats',
          values.hats.filter(h => h.id !== hatEditingId),
        );
      } else {
        setFieldValue(`hats.${hatIndex}`, { ...values.hats[hatIndex], editedRole });
      }
    }

    setFieldValue('roleEditing', undefined);
    setFieldValue('newRoleTerm', undefined);
    setTimeout(() => goBackToRolesEdit(), 50);
  };

  return (
    <>
      <FieldArray name="hats">
        {({ push }: { push: (roleHatFormValue: RoleHatFormValue) => void }) => (
          <>
            <PageHeader
              breadcrumbs={[
                {
                  terminus: t('roles'),
                  path: DAO_ROUTES.roles.relative(addressPrefix, safe.address),
                },
                {
                  terminus: t('editRoles'),
                  path: DAO_ROUTES.rolesEdit.relative(addressPrefix, safe.address),
                },
                {
                  terminus: role?.name ?? t('new'),
                  path: '',
                },
              ]}
              buttonProps={{
                variant: 'danger',
                children: t('deleteRole'),
                size: 'sm',
                gap: 0,
                leftIcon: (
                  <Box mr="-0.25rem">
                    <Trash size="1rem" />
                  </Box>
                ),
                onClick: handleRemoveRole,
              }}
            />

            <RoleFormTabs
              hatId={hatEditingId}
              pushRole={push}
              blocker={blocker}
            />
          </>
        )}
      </FieldArray>
    </>
  );
}
