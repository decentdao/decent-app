import { Box, Flex, FormControl, Switch, Text } from '@chakra-ui/react';
import { Field, FieldInputProps, FieldMetaProps, FormikProps, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { DETAILS_BOX_SHADOW } from '../../../constants/common';
import { useFractal } from '../../../providers/App/AppProvider';
import { useRolesStore } from '../../../store/roles/useRolesStore';
import { GovernanceType } from '../../../types';
import { RoleFormValues } from '../../../types/roles';
import { InputComponent, TextareaComponent } from '../../ui/forms/InputComponent';

export default function RoleFormInfo() {
  const { t } = useTranslation('roles');
  const {
    governance: { type },
  } = useFractal();
  const { hatsTree, hatsTreeId } = useRolesStore();

  const { setFieldValue, values } = useFormikContext<RoleFormValues>();

  return (
    <>
      <Box
        px={{ base: '1rem', md: 0 }}
        py="1rem"
        bg="neutral-2"
        boxShadow={{
          base: DETAILS_BOX_SHADOW,
          md: 'unset',
        }}
        borderRadius="0.5rem"
        display="flex"
        flexDirection="column"
        gap="1rem"
      >
        <FormControl>
          <Field name="roleEditing.name">
            {({
              field,
              form: { setFieldTouched },
              meta,
            }: {
              field: FieldInputProps<string>;
              form: FormikProps<RoleFormValues>;
              meta: FieldMetaProps<string>;
            }) => (
              <InputComponent
                value={field.value ?? ''}
                onChange={e => {
                  setFieldValue('roleEditing.name', e.target.value);
                }}
                onBlur={() => {
                  setFieldTouched('roleEditing.name', true);
                }}
                testId="role-name"
                placeholder={t('roleName')}
                isRequired
                gridContainerProps={{
                  gridTemplateColumns: { base: '1fr', md: '1fr' },
                }}
                inputContainerProps={{
                  p: 0,
                }}
                label={t('roleName')}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
              />
            )}
          </Field>
        </FormControl>
        <FormControl>
          <Field name="roleEditing.description">
            {({
              field,
              form: { setFieldTouched },
              meta,
            }: {
              field: FieldInputProps<string>;
              form: FormikProps<RoleFormValues>;
              meta: FieldMetaProps<string>;
            }) => (
              <TextareaComponent
                value={field.value ?? ''}
                onChange={e => {
                  setFieldValue('roleEditing.description', e.target.value);
                }}
                isRequired
                gridContainerProps={{
                  gridTemplateColumns: { base: '1fr', md: '1fr' },
                }}
                inputContainerProps={{
                  p: 0,
                }}
                textAreaProps={{
                  h: '12rem',
                  onBlur: () => {
                    setFieldTouched('roleEditing.description', true);
                  },
                }}
                label={t('roleDescription')}
                errorMessage={meta.touched && meta.error ? meta.error : undefined}
              />
            )}
          </Field>
        </FormControl>
      </Box>
      {/* @dev - deploying whitelisting voting strategy is feasible from UI/UX standpoint only when Safe has Azorius module AND hatsTree been created already */}
      {type !== GovernanceType.MULTISIG &&
        !!hatsTree &&
        !!hatsTreeId &&
        import.meta.env.VITE_APP_FLAG_WHITELISTING === 'ON' && (
          <FormControl>
            <Field name="roleEditing.canCreateProposals">
              {() => (
                <Flex
                  justifyContent="space-between"
                  alignItems="center"
                  padding={4}
                  borderRadius={8}
                  border="1px solid"
                  borderColor="neutral-3"
                >
                  <Text>{t('canCreateProposals')}</Text>
                  <Switch
                    size="md"
                    variant="secondary"
                    onChange={() =>
                      setFieldValue(
                        'roleEditing.canCreateProposals',
                        !values.roleEditing?.canCreateProposals,
                      )
                    }
                    isChecked={values.roleEditing?.canCreateProposals}
                    isDisabled={!values.roleEditing}
                  />
                </Flex>
              )}
            </Field>
          </FormControl>
        )}
    </>
  );
}
