import { useMemo } from 'react';
import * as Yup from 'yup';
import { EditedRole } from '../../../components/pages/Roles/types';
import { useValidationAddress } from '../common/useValidationAddress';

export const useRolesSchema = () => {
  const { addressValidationTest } = useValidationAddress();
  const rolesSchema = useMemo(
    () =>
      Yup.object().shape({
        roleEditing: Yup.object()
          .shape({
            name: Yup.string(),
            description: Yup.string(),
            wearer: Yup.string(),
          })
          .when({
            is: (roleEditing: EditedRole) => {
              return !!roleEditing;
            },
            then: _schema =>
              _schema.shape({
                name: Yup.string().required('Role name is required'),
                description: Yup.string().required('Role description is required'),
                wearer: Yup.string().required('Member is required').test(addressValidationTest),
              }),
          }),
      }),
    [addressValidationTest],
  );
  return { rolesSchema };
};
