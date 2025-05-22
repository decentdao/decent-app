import { Box, Flex } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { RoleFormCreateProposal } from '../../../../../components/Roles/forms/RoleFormCreateProposal';
import PageHeader from '../../../../../components/ui/page/Header/PageHeader';
import { CONTENT_MAXW } from '../../../../../constants/common';
import { DAO_ROUTES } from '../../../../../constants/routes';
import { useCurrentDAOKey } from '../../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../../providers/NetworkConfig/useNetworkConfigStore';
import { RoleFormValues } from '../../../../../types/roles';

export function SafeRolesEditProposalSummaryPage() {
  const navigate = useNavigate();
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });
  const { t } = useTranslation(['roles', 'breadcrumbs']);
  const { addressPrefix } = useNetworkConfigStore();
  const { values } = useFormikContext<RoleFormValues>();

  const safeAddress = safe?.address;

  // @dev redirects back to roles edit page if no roles are edited (user refresh)
  useEffect(() => {
    const editedRoles = values.hats.filter(hat => !!hat.editedRole);
    if (!editedRoles.length && safeAddress) {
      navigate(DAO_ROUTES.rolesEdit.relative(addressPrefix, safeAddress));
    }
  }, [values.hats, safeAddress, navigate, addressPrefix]);

  if (!safeAddress) return null;

  return (
    <Box maxW={CONTENT_MAXW}>
      <PageHeader
        title={t('proposalNew', { ns: 'breadcrumbs' })}
        breadcrumbs={[
          {
            terminus: t('createProposal', { ns: 'proposal' }),
            path: '',
          },
        ]}
      />
      <Flex
        flexDir="column"
        alignItems="center"
      >
        <RoleFormCreateProposal
          close={() => navigate(DAO_ROUTES.rolesEdit.relative(addressPrefix, safeAddress))}
        />
      </Flex>
    </Box>
  );
}
