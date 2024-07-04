import { Box, Tab, TabList, TabPanels, TabPanel, Tabs, Button, Flex } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { zeroAddress } from 'viem';
import { CARD_SHADOW, TAB_SHADOW } from '../../../../constants/common';
import { useRolesState } from '../../../../state/useRolesState';
import { EditBadgeStatus, EditedRole, RoleFormValues, RoleValue } from '../types';
import RoleFormInfo from './RoleFormInfo';

enum EditRoleTabs {
  RoleInfo,
  Payroll,
  Vesting,
}

const addRemoveField = (fieldNames: string[], fieldName: string, isRemoved: boolean) => {
  if (fieldNames.includes(fieldName) && isRemoved) {
    return fieldNames.filter(field => field !== fieldName);
  }
  return [...fieldNames, fieldName];
};

export default function RoleFormTabs({ hatIndex, save }: { hatIndex: number; save: () => void }) {
  const [tab, setTab] = useState<EditRoleTabs>(EditRoleTabs.RoleInfo);
  const { hatsTree } = useRolesState();

  const { t } = useTranslation(['roles']);
  const { values, errors, setFieldValue } = useFormikContext<RoleFormValues>();

  const existingRoleHat = useMemo(
    () =>
      hatsTree?.roleHats.find(
        (role: RoleValue) =>
          !!values.roleEditing && role.id === values.roleEditing.id && role.id !== zeroAddress,
      ),
    [values.roleEditing, hatsTree],
  );
  const isRoleNameUpdated = useMemo<boolean>(
    () => !!existingRoleHat && values.roleEditing?.name !== existingRoleHat.name,
    [values.roleEditing, existingRoleHat],
  );

  const isRoleDescriptionUpdated = useMemo<boolean>(
    () => !!existingRoleHat && values.roleEditing?.description !== existingRoleHat.description,
    [values.roleEditing, existingRoleHat],
  );

  const isMemberUpdated = useMemo<boolean>(
    () => !!existingRoleHat && values.roleEditing?.wearer !== existingRoleHat.wearer,
    [values.roleEditing, existingRoleHat],
  );

  const editedRole = useMemo<EditedRole>(() => {
    if (!existingRoleHat) {
      return {
        fieldNames: [],
        status: EditBadgeStatus.New,
      };
    }
    let fieldNames: string[] = [];
    fieldNames = addRemoveField(fieldNames, 'roleName', isRoleNameUpdated);
    fieldNames = addRemoveField(fieldNames, 'roleDescription', isRoleDescriptionUpdated);
    fieldNames = addRemoveField(fieldNames, 'member', isMemberUpdated);

    return {
      fieldNames,
      status: EditBadgeStatus.Updated,
    };
  }, [existingRoleHat, isRoleNameUpdated, isRoleDescriptionUpdated, isMemberUpdated]);

  return (
    <Box>
      <Tabs
        index={tab}
        onChange={index => setTab(index)}
        variant="unstyled"
      >
        <TabList
          boxShadow={TAB_SHADOW}
          p="0.25rem"
          borderRadius="0.5rem"
          gap="0.25rem"
        >
          <Tab
            w="full"
            borderRadius="0.25rem"
            color="neutral-6"
            _selected={{
              bg: 'neutral-2',
              color: 'lilac-0',
              boxShadow: CARD_SHADOW,
            }}
          >
            Role Info
          </Tab>
          <Tab
            w="full"
            color="neutral-6"
            borderRadius="0.25rem"
            isDisabled
            _selected={{
              bg: 'neutral-2',
              color: 'lilac-0',
              boxShadow: CARD_SHADOW,
            }}
          >
            Payroll
          </Tab>
          <Tab
            w="full"
            color="neutral-6"
            borderRadius="0.25rem"
            isDisabled
            _selected={{
              bg: 'neutral-2',
              color: 'lilac-0',
              boxShadow: CARD_SHADOW,
            }}
          >
            Vesting
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel
            padding="0"
            my="1.75rem"
          >
            {tab === EditRoleTabs.RoleInfo && <RoleFormInfo />}
          </TabPanel>
          <TabPanel>{tab === EditRoleTabs.Payroll && <Box>Payroll</Box>}</TabPanel>
          <TabPanel>{tab === EditRoleTabs.Vesting && <Box>Vesting</Box>}</TabPanel>
        </TabPanels>
      </Tabs>
      <Flex
        justifyContent="flex-end"
        my="1rem"
      >
        <Button
          isDisabled={!!errors.roleEditing?.[hatIndex]}
          onClick={() => {
            setFieldValue(`hats.${hatIndex}`, { ...values.roleEditing, editedRole });
            setFieldValue('roleEditing', undefined);
            save();
          }}
        >
          {t('save')}
        </Button>
      </Flex>
    </Box>
  );
}
