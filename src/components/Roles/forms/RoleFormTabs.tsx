import { Button, Flex, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { ArrowLeft } from '@phosphor-icons/react';
import { useFormikContext } from 'formik';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Blocker, useNavigate } from 'react-router-dom';
import { Hex } from 'viem';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useRolesStore } from '../../../store/roles/useRolesStore';
import { EditBadgeStatus, RoleFormValues, RoleHatFormValue } from '../../../types/roles';
import RoleFormInfo from './RoleFormInfo';
import { RoleFormMember } from './RoleFormMember';
import { RoleFormPaymentStreams } from './RoleFormPaymentStreams';
import { useRoleFormEditedRole } from './useRoleFormEditedRole';

export function RoleFormTabs({
  hatId,
  pushRole,
  blocker,
}: {
  hatId: Hex;
  pushRole: (roleHatFormValue: RoleHatFormValue) => void;
  blocker: Blocker;
}) {
  const { hatsTree } = useRolesStore();

  const navigate = useNavigate();
  const { addressPrefix } = useNetworkConfigStore();
  const { editedRoleData, isRoleUpdated, existingRoleHat } = useRoleFormEditedRole({ hatsTree });
  const { t } = useTranslation(['roles', 'common']);
  const { values, setFieldValue, errors, setTouched } = useFormikContext<RoleFormValues>();
  const { safeAddress } = useCurrentDAOKey();
  useEffect(() => {
    if (values.hats.length && !values.roleEditing) {
      const role = values.hats.find(hat => hat.id === hatId);
      if (role) {
        setFieldValue('roleEditing', role);
      }
    }
  }, [values.hats, values.roleEditing, hatId, setFieldValue]);

  const isInitialised = useRef(false);

  useEffect(() => {
    const hatIndex = values.hats.findIndex(h => h.id === hatId);
    if (!isInitialised.current && values.hats.length && hatIndex !== -1) {
      isInitialised.current = true;
      const role = values.hats[hatIndex];
      setFieldValue('roleEditing', role);
    } else if (!isInitialised.current && hatIndex === -1) {
      isInitialised.current = true;
    }
  }, [setFieldValue, values.hats, values.roleEditing, hatId]);

  if (!safeAddress) return null;

  return (
    <>
      <Flex justifyContent="flex-end">
        <Button
          variant="tertiary"
          width="min-content"
          color="color-lilac-100"
          pr={2}
          leftIcon={<ArrowLeft />}
          onClick={() => navigate(DAO_ROUTES.rolesEdit.relative(addressPrefix, safeAddress))}
        />
      </Flex>
      <Tabs variant="twoTone">
        <TabList>
          <Tab>{t('roleInfo')}</Tab>
          <Tab>{t('member')}</Tab>
          <Tab>{t('payments')}</Tab>
        </TabList>
        <TabPanels my="1.75rem">
          <TabPanel>
            <RoleFormInfo />
          </TabPanel>
          <TabPanel>
            <RoleFormMember />
          </TabPanel>
          <TabPanel>
            <RoleFormPaymentStreams />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Flex
        justifyContent="flex-end"
        my="1rem"
      >
        <Button
          isDisabled={
            !!errors.roleEditing || values.roleEditing?.roleEditingPaymentIndex !== undefined
          }
          onClick={() => {
            if (!values.roleEditing) return;
            const roleUpdated = { ...values.roleEditing, editedRole: editedRoleData };
            const hatIndex = values.hats.findIndex(h => h.id === hatId);
            if (hatIndex === -1) {
              pushRole({ ...roleUpdated });
            } else {
              if (isRoleUpdated || editedRoleData.status === EditBadgeStatus.New) {
                setFieldValue(`hats.${hatIndex}`, roleUpdated);
              } else if (existingRoleHat !== undefined) {
                setFieldValue(`hats.${hatIndex}`, {
                  ...existingRoleHat,
                  roleTerms: existingRoleHat.roleTerms.allTerms,
                });
              }
            }
            setFieldValue('roleEditing', undefined);
            setTouched({});
            if (blocker.reset) {
              blocker.reset();
            }
            setTimeout(() => {
              navigate(DAO_ROUTES.rolesEdit.relative(addressPrefix, safeAddress));
            }, 50);
          }}
        >
          {t('save', { ns: 'common' })}
        </Button>
      </Flex>
    </>
  );
}
