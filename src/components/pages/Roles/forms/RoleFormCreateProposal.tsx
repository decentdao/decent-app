import { Box, Button, Flex, FormControl } from '@chakra-ui/react';
import { Field, FieldProps, useFormikContext } from 'formik';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CARD_SHADOW } from '../../../../constants/common';
import { InputComponent, TextareaComponent } from '../../../ui/forms/InputComponent';
import LabelWrapper from '../../../ui/forms/LabelWrapper';
import { RoleCardEdit } from '../RoleCard';
import { RoleFormValues } from '../types';

export default function RoleFormCreateProposal({ close }: { close: () => void }) {
  const { t } = useTranslation(['modals', 'common', 'proposal']);
  const { values, handleSubmit } = useFormikContext<RoleFormValues>();
  const editedRoles = useMemo(() => {
    return values.hats.filter(hat => !!hat.editedRole);
  }, [values.hats]);
  return (
    <Box>
      <Flex
        flexDir="column"
        gap="1rem"
        p="1rem"
        bg="neutral-2"
        boxShadow={CARD_SHADOW}
        borderRadius="0.5rem"
      >
        <FormControl>
          <Field name="proposalMetadata.title">
            {({
              field,
              form: { setFieldValue, setFieldTouched },
            }: FieldProps<string, RoleFormValues>) => (
              <LabelWrapper label={t('proposalTitle', { ns: 'proposal' })}>
                <InputComponent
                  value={field.value}
                  onChange={e => {
                    setFieldValue(field.name, e.target.value);
                    setFieldTouched(field.name, true);
                  }}
                  testId={field.name}
                  placeholder="Proposal Title"
                  isRequired={false}
                />
              </LabelWrapper>
            )}
          </Field>
        </FormControl>
        <FormControl>
          <Field name="proposalMetadata.description">
            {({
              field,
              form: { setFieldValue, setFieldTouched },
            }: FieldProps<string, RoleFormValues>) => (
              <LabelWrapper label={t('proposalDescription', { ns: 'proposal' })}>
                <TextareaComponent
                  value={field.value}
                  onChange={e => {
                    setFieldValue(field.name, e.target.value);
                    setFieldTouched(field.name, true);
                  }}
                  isRequired={false}
                  placeholder="Description"
                />
              </LabelWrapper>
            )}
          </Field>
        </FormControl>
      </Flex>
      <Box
        p="1rem"
        bg="neutral-2"
        boxShadow={CARD_SHADOW}
        borderRadius="0.5rem"
      >
        {editedRoles.map((role, index) => (
          <RoleCardEdit
            key={index}
            wearerAddress={role.wearer}
            name={role.name}
            handleRoleClick={() => {
              // @todo open role details drawer
            }}
            editStatus={role.editedRole?.status}
          />
        ))}
      </Box>
      <Flex
        gap="1rem"
        mt="1rem"
        justifyContent="flex-end"
      >
        <Button
          variant="tertiary"
          onClick={close}
        >
          {t('cancel', { ns: 'common' })}
        </Button>
        <Button onClick={() => handleSubmit()}>{t('sendAssetsSubmit')}</Button>
      </Flex>
    </Box>
  );
}
