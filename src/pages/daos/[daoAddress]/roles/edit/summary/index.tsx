import { Box, Flex, Icon, Portal, Show, Text } from '@chakra-ui/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { useFormikContext } from 'formik';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import RoleFormCreateProposal from '../../../../../../components/pages/Roles/forms/RoleFormCreateProposal';
import { EditedRole } from '../../../../../../components/pages/Roles/types';
import PageHeader from '../../../../../../components/ui/page/Header/PageHeader';
import { SIDEBAR_WIDTH, useHeaderHeight } from '../../../../../../constants/common';
import { DAO_ROUTES } from '../../../../../../constants/routes';
import { useFractal } from '../../../../../../providers/App/AppProvider';
import { useNetworkConfig } from '../../../../../../providers/NetworkConfig/NetworkConfigProvider';

export default function EditProposalSummary() {
  const headerHeight = useHeaderHeight();
  const navigate = useNavigate();
  const {
    node: { daoAddress },
  } = useFractal();
  const { t } = useTranslation(['roles', 'breadcrumbs']);
  const { addressPrefix } = useNetworkConfig();
  const { values } = useFormikContext<{
    hats: {
      editedRole?: EditedRole;
    }[];
  }>();

  // @dev redirects back to roles edit page if no roles are edited (user refresh)
  useEffect(() => {
    const editedRoles = values.hats.filter(hat => !!hat.editedRole);
    if (!editedRoles.length && daoAddress) {
      navigate(DAO_ROUTES.rolesEdit.relative(addressPrefix, daoAddress));
    }
  }, [values.hats, daoAddress, navigate, addressPrefix]);

  if (!daoAddress) return null;
  return (
    <Box>
      <Show below="md">
        <Portal>
          <Box
            position="fixed"
            top={0}
            h="100vh"
            w="full"
            bg="neutral-1"
            px="1rem"
            pt={headerHeight}
            overflow="scroll"
          >
            <Flex
              justifyContent="space-between"
              alignItems="center"
              my="1.75rem"
            >
              <Flex
                gap="0.5rem"
                alignItems="center"
                aria-label={t('proposalNew', { ns: 'breadcrumbs' })}
                onClick={() => {
                  navigate(DAO_ROUTES.rolesEdit.relative(addressPrefix, daoAddress));
                }}
              >
                <Icon
                  as={ArrowLeft}
                  boxSize="1.5rem"
                />
                <Text textStyle="display-lg">{t('proposalNew', { ns: 'breadcrumbs' })}</Text>
              </Flex>
            </Flex>
            <RoleFormCreateProposal
              close={() => navigate(DAO_ROUTES.rolesEdit.relative(addressPrefix, daoAddress))}
            />
          </Box>
        </Portal>
      </Show>
      <Show above="md">
        <Portal>
          <Box
            position="absolute"
            top={`calc(1rem + ${headerHeight})`}
            left={{ base: SIDEBAR_WIDTH, '3xl': `calc(${SIDEBAR_WIDTH} + 9rem)` }}
            bg="neutral-1"
            px="1rem"
            width={{
              base: `calc(100% - ${SIDEBAR_WIDTH})`,
              '3xl': `calc(100% - 9rem - ${SIDEBAR_WIDTH})`,
            }}
            h={`calc(100vh - ${headerHeight})`}
          >
            <PageHeader
              title={t('proposalNew', { ns: 'breadcrumbs' })}
              breadcrumbs={[
                {
                  terminus: t('roles'),
                  path: '',
                },
              ]}
            />
            <RoleFormCreateProposal
              close={() => navigate(DAO_ROUTES.rolesEdit.relative(addressPrefix, daoAddress))}
            />
          </Box>
        </Portal>
      </Show>
    </Box>
  );
}
