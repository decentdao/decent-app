import * as amplitude from '@amplitude/analytics-browser';
import { Formik } from 'formik';
import { useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { useRolesSchema } from '../../../../hooks/schemas/roles/useRolesSchema';
import useCreateRoles from '../../../../hooks/utils/useCreateRoles';
import { analyticsEvents } from '../../../../insights/analyticsEvents';
import { useDaoInfoStore } from '../../../../store/daoInfo/useDaoInfoStore';
import { useRolesStore } from '../../../../store/roles/useRolesStore';
import { RoleFormValues } from '../../../../types/roles';

export default function SafeRolesEditFormikPageWrapper() {
  useEffect(() => {
    amplitude.track(analyticsEvents.RolesEditPageOpened);
  }, []);

  const { safe } = useDaoInfoStore();

  const { rolesSchema } = useRolesSchema();
  const { hatsTree } = useRolesStore();

  const { createEditRolesProposal } = useCreateRoles();
  const initialValues: RoleFormValues = useMemo(() => {
    const hats = hatsTree?.roleHats || [];
    return {
      proposalMetadata: {
        title: '',
        description: '',
      },
      hats: hats.map(hat => ({
        ...hat,
        resolvedWearer: hat.wearerAddress,
        wearer: hat.wearerAddress,
        roleTerms: hat.roleTerms.allTerms,
        payments: hat.payments.map(payment => ({
          ...payment,
          cancelable: true,
          isCancelling: false,
        })),
      })),
      customNonce: safe?.nextNonce || 0,
      actions: [],
    };
  }, [hatsTree?.roleHats, safe?.nextNonce]);
  return (
    <Formik<RoleFormValues>
      initialValues={initialValues}
      enableReinitialize
      validationSchema={rolesSchema}
      validateOnMount
      onSubmit={createEditRolesProposal}
    >
      {({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <Outlet />
        </form>
      )}
    </Formik>
  );
}
