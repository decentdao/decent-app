import { Box, Button, Flex, FormControl, Icon, Show, Text } from '@chakra-ui/react';
import { SquaresFour } from '@phosphor-icons/react';
import { Field, FieldInputProps, FormikProps, useFormikContext } from 'formik';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getAddress, Hex, zeroAddress } from 'viem';
import { CARD_SHADOW } from '../../../constants/common';
import { DAO_ROUTES } from '../../../constants/routes';
import { useNetworkConfig } from '../../../providers/NetworkConfig/NetworkConfigProvider';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import {
  EditedRole,
  RoleDetailsDrawerEditingRoleHatProp,
  RoleFormValues,
} from '../../../types/roles';
import { SendAssetsAction } from '../../ProposalBuilder/ProposalActionCard';
import { CustomNonceInput } from '../../ui/forms/CustomNonceInput';
import { InputComponent, TextareaComponent } from '../../ui/forms/InputComponent';
import LabelWrapper from '../../ui/forms/LabelWrapper';
import { AddActions } from '../../ui/modals/AddActions';
import { SendAssetsData } from '../../ui/modals/SendAssetsModal';
import { RoleCardShort } from '../RoleCard';
import RolesDetailsDrawer from '../RolesDetailsDrawer';
import RolesDetailsDrawerMobile from '../RolesDetailsDrawerMobile';

export function RoleFormCreateProposal({ close }: { close: () => void }) {
  const [drawerViewingRole, setDrawerViewingRole] = useState<RoleDetailsDrawerEditingRoleHatProp>();
  const { t } = useTranslation(['modals', 'common', 'proposal']);

  const {
    values,
    setFieldValue: setFieldValueTopLevel,
    isSubmitting,
    submitForm,
  } = useFormikContext<RoleFormValues>();

  const editedRoles = useMemo<
    (RoleDetailsDrawerEditingRoleHatProp & {
      editedRole: EditedRole;
    })[]
  >(() => {
    return values.hats
      .filter(hat => !!hat.editedRole)
      .map(roleHat => {
        if (!roleHat.name || !roleHat.description || !roleHat.editedRole) {
          throw new Error('Role missing data', {
            cause: roleHat,
          });
        }
        const allRoleTerms =
          roleHat.roleTerms?.map(term => {
            if (!term.termEndDate || term.nominee === undefined || term.termNumber === undefined) {
              throw new Error('Role term missing data', {
                cause: term,
              });
            }
            return {
              termEndDate: term.termEndDate,
              nominee: getAddress(term.nominee),
              termNumber: term.termNumber,
            };
          }) || [];
        const roleTerms = {
          allTerms: allRoleTerms,
          currentTerm: drawerViewingRole?.roleTerms.currentTerm,
          nextTerm: drawerViewingRole?.roleTerms.nextTerm,
          expiredTerms: allRoleTerms.filter(term => term.termEndDate <= new Date()),
        };
        const termedNominee = drawerViewingRole?.roleTerms.currentTerm?.nominee;
        const wearer =
          roleHat.isTermed && !!termedNominee
            ? termedNominee
            : !!roleHat?.wearer
              ? getAddress(roleHat.wearer)
              : zeroAddress;

        return {
          ...roleHat,
          editedRole: roleHat.editedRole,
          prettyId: roleHat.id,
          name: roleHat.name,
          description: roleHat.description,
          wearer,
          roleTerms,
          isTermed: roleHat.isTermed ?? false,
          payments: roleHat.payments
            ? roleHat.payments.map(payment => {
                if (!payment.startDate || !payment.endDate || !payment.amount || !payment.asset) {
                  throw new Error('Payment missing data', {
                    cause: payment,
                  });
                }
                return {
                  ...payment,
                  recipient: wearer,
                  startDate: payment.startDate,
                  endDate: payment.endDate,
                  amount: payment.amount,
                  asset: payment.asset,
                  cliffDate: payment.cliffDate,
                  withdrawableAmount: 0n,
                  isCancelled: false,
                };
              })
            : [],
        };
      });
  }, [
    drawerViewingRole?.roleTerms.currentTerm,
    drawerViewingRole?.roleTerms.nextTerm,
    values.hats,
  ]);

  const { safe } = useDaoInfoStore();
  const navigate = useNavigate();
  const { addressPrefix } = useNetworkConfig();

  const safeAddress = safe?.address;

  const handleEditRoleClick = useCallback(
    (hatId: Hex) => {
      if (!!safeAddress) {
        navigate(DAO_ROUTES.rolesEditDetails.relative(addressPrefix, safeAddress, hatId));
      }
    },
    [navigate, addressPrefix, safeAddress],
  );

  const handleCloseDrawer = () => setDrawerViewingRole(undefined);

  const addSendAssetsAction = (sendAssetsAction: SendAssetsData) => {
    setFieldValueTopLevel('actions', [...values.actions, sendAssetsAction]);
  };

  return (
    <Box maxW="736px">
      <Flex
        flexDir="column"
        gap="1rem"
        p="1rem"
        bg="neutral-2"
        maxW="736px"
        boxShadow={CARD_SHADOW}
        borderRadius="0.5rem"
      >
        <FormControl>
          <Field name="proposalMetadata.title">
            {({
              field,
              form: { setFieldValue, setFieldTouched },
            }: {
              field: FieldInputProps<string>;
              form: FormikProps<RoleFormValues>;
            }) => (
              <LabelWrapper label={t('proposalTitle', { ns: 'proposal' })}>
                <InputComponent
                  value={field.value}
                  onChange={e => {
                    setFieldValue('proposalMetadata.title', e.target.value);
                    setFieldTouched('proposalMetadata.title', true);
                  }}
                  testId={field.name}
                  placeholder="Proposal Title"
                  isRequired={false}
                  gridContainerProps={{
                    gridTemplateColumns: { base: '1fr', md: '1fr' },
                  }}
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
            }: {
              field: FieldInputProps<string>;
              form: FormikProps<RoleFormValues>;
            }) => (
              <LabelWrapper label={t('proposalDescription', { ns: 'proposal' })}>
                <TextareaComponent
                  value={field.value}
                  onChange={e => {
                    setFieldValue('proposalMetadata.description', e.target.value);
                    setFieldTouched('proposalMetadata.description', true);
                  }}
                  isRequired={false}
                  placeholder={t('proposalDescriptionPlaceholder', { ns: 'proposal' })}
                  gridContainerProps={{
                    gridTemplateColumns: { base: '1fr', md: '1fr' },
                  }}
                />
              </LabelWrapper>
            )}
          </Field>
        </FormControl>

        <FormControl>
          <Field name="customNonce">
            {({ form: { setFieldValue } }: { form: FormikProps<RoleFormValues> }) => (
              <Flex
                w="100%"
                justifyContent="flex-end"
              >
                <CustomNonceInput
                  nonce={values.customNonce}
                  onChange={newNonce => {
                    if (newNonce === undefined) return;
                    setFieldValue('customNonce', Number(newNonce));
                  }}
                />
              </Flex>
            )}
          </Field>
        </FormControl>
      </Flex>

      <Flex
        mt={4}
        mb={2}
        alignItems="center"
      >
        <Icon
          as={SquaresFour}
          w="1.5rem"
          h="1.5rem"
        />
        <Text
          textStyle="display-lg"
          ml={2}
        >
          {t('actions', { ns: 'actions' })}
        </Text>
      </Flex>
      {editedRoles.map((role, index) => {
        return (
          <RoleCardShort
            key={index}
            name={role.name}
            handleRoleClick={() => {
              setDrawerViewingRole(role);
            }}
            editStatus={role.editedRole?.status}
          />
        );
      })}
      {values.actions.map((action, index) => (
        <SendAssetsAction
          action={action}
          key={index}
          index={index}
          onRemove={idx => {
            setFieldValueTopLevel(
              'actions',
              values.actions.filter((_, i) => i !== idx),
            );
          }}
        />
      ))}

      <AddActions addSendAssetsAction={addSendAssetsAction} />

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
        <Button
          onClick={submitForm}
          isDisabled={
            isSubmitting ||
            !values.proposalMetadata.title.trim() ||
            !values.proposalMetadata.description.trim()
          }
        >
          {t('submitProposal')}
        </Button>
      </Flex>
      {drawerViewingRole !== undefined && (
        <>
          <Show below="md">
            <RolesDetailsDrawerMobile
              roleHat={drawerViewingRole}
              isOpen={drawerViewingRole !== undefined}
              onClose={handleCloseDrawer}
              onEdit={handleEditRoleClick}
            />
          </Show>
          <Show above="md">
            <RolesDetailsDrawer
              roleHat={drawerViewingRole}
              isOpen={drawerViewingRole !== undefined}
              onClose={handleCloseDrawer}
              onEdit={handleEditRoleClick}
            />
          </Show>
        </>
      )}
    </Box>
  );
}
