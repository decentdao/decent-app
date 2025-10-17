import { Alert, Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { Info, Plus } from '@phosphor-icons/react';
import { FieldArray, useFormikContext } from 'formik';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../providers/App/AppProvider';
import {
  paymentSorterByActiveStatus,
  paymentSorterByStartDate,
  paymentSorterByWithdrawAmount,
  canUserCancelPayment,
} from '../../../store/roles/rolesStoreUtils';
import { EditBadgeStatus, RoleFormValues, SablierPaymentFormValues } from '../../../types/roles';
import Divider from '../../ui/utils/Divider';
import { RolePaymentDetails } from '../RolePaymentDetails';
import { RoleFormPaymentStream } from './RoleFormPaymentStream';
import RoleFormPaymentStreamTermed from './RoleFormPaymentStreamTermed';
import { useRoleFormEditedRole } from './useRoleFormEditedRole';

function RoleFormPaymentRenderer() {
  const { values } = useFormikContext<RoleFormValues>();

  if (values.roleEditing?.roleEditingPaymentIndex !== undefined) {
    if (values.roleEditing?.isTermed) {
      return (
        <RoleFormPaymentStreamTermed paymentIndex={values.roleEditing.roleEditingPaymentIndex} />
      );
    } else {
      return <RoleFormPaymentStream formIndex={values.roleEditing.roleEditingPaymentIndex} />;
    }
  }

  return null;
}

export function RoleFormPaymentStreams() {
  const { t } = useTranslation(['roles']);
  const { values, setFieldValue, validateForm } = useFormikContext<RoleFormValues>();
  const payments = values.roleEditing?.payments;

  const { daoKey } = useCurrentDAOKey();
  const {
    roles: { hatsTree },
  } = useDAOStore({ daoKey });

  // TODO: Remove this temporary blocking when contract is updated and feature is fixed
  const { editedRoleData } = useRoleFormEditedRole({ hatsTree });
  const isNewRole = editedRoleData?.status === EditBadgeStatus.New;

  const sortedPayments = useMemo(
    () =>
      payments
        ? [...payments]
            .sort(paymentSorterByWithdrawAmount)
            .sort(paymentSorterByStartDate)
            .sort(paymentSorterByActiveStatus)
        : [],
    [payments],
  );

  const isTermsAvailable = useMemo(() => {
    return values.roleEditing?.roleTerms?.some(term => {
      if (!term.termEndDate) {
        return false;
      }
      return term.termEndDate > new Date();
    });
  }, [values.roleEditing?.roleTerms]);

  const roleTerms = useMemo(() => {
    const terms =
      values.roleEditing?.roleTerms?.map(term => {
        if (!term.termEndDate || !term.nominee) {
          return undefined;
        }
        return {
          termEndDate: term.termEndDate,
          termNumber: term.termNumber,
          nominee: term.nominee,
        };
      }) || [];
    return terms.filter(term => !!term);
  }, [values.roleEditing?.roleTerms]);

  return (
    <FieldArray name="roleEditing.payments">
      {({ push: pushPayment }: { push: (streamFormValue: SablierPaymentFormValues) => void }) => (
        <Box>
          {/* TODO: Remove this Alert when contract is updated and feature is fixed */}
          {isNewRole && (
            <Alert
              variant="warning"
              my="1.5rem"
              gap="1rem"
            >
              <Box
                width="1.5rem"
                height="1.5rem"
              >
                <Icon
                  as={Info}
                  color="color-base-warning"
                  boxSize="1.5rem"
                />
              </Box>
              <Flex
                flexDir="column"
                gap="0.5rem"
              >
                <Text
                  textStyle="body-base-strong"
                  whiteSpace="pre-wrap"
                >
                  {t('newRolePaymentsDisabledTitle')}
                </Text>
                <Text
                  textStyle="body-base-strong"
                  whiteSpace="pre-wrap"
                >
                  {t('newRolePaymentsDisabledSubtitle')}
                </Text>
              </Flex>
            </Alert>
          )}
          {values.roleEditing?.roleEditingPaymentIndex === undefined && (
            <Button
              variant="secondary"
              size="sm"
              isDisabled={isNewRole || (values.roleEditing?.isTermed ? !isTermsAvailable : false)}
              leftIcon={<Plus size="1rem" />}
              iconSpacing={0}
              onClick={async () => {
                pushPayment({
                  isCancelling: false,
                  isValidatedAndSaved: false,
                  cancelable: true, // Newly added payments are cancelable by default
                });
                await validateForm();
                setFieldValue('roleEditing.roleEditingPaymentIndex', (payments ?? []).length);
              }}
            >
              {t('addPayment')}
            </Button>
          )}
          {sortedPayments.length === 0 && (
            <Flex
              bg="color-neutral-950"
              padding="1.5rem"
              border="1px solid"
              borderColor="color-neutral-900"
              borderRadius="0.25rem"
              my="1.5rem"
              justifyContent="space-between"
            >
              <Flex flexDir="column">
                <Text textStyle="label-large">{t('noPaymentsTitle')}</Text>
                <Text
                  textStyle="label-small"
                  color="color-neutral-300"
                >
                  {t('noPaymentsSubTitle')}
                </Text>
              </Flex>
            </Flex>
          )}
          <RoleFormPaymentRenderer />
          {!!sortedPayments.length && <Divider my="1rem" />}
          <Box mt="0.5rem">
            {sortedPayments.map(payment => {
              // @note don't render if form isn't valid
              if (!payment.amount || !payment.asset || !payment.startDate || !payment.endDate)
                return null;

              const thisPaymentIndex = payments?.findIndex(p => p.streamId === payment.streamId);
              return (
                <RolePaymentDetails
                  key={thisPaymentIndex}
                  onClick={
                    canUserCancelPayment(payment)
                      ? () => setFieldValue('roleEditing.roleEditingPaymentIndex', thisPaymentIndex)
                      : undefined
                  }
                  roleTerms={roleTerms}
                  payment={{
                    streamId: payment.streamId,
                    amount: payment.amount,
                    asset: payment.asset,
                    endDate: payment.endDate,
                    startDate: payment.startDate,
                    cliffDate: payment.cliffDate,
                    isCancelled: payment.isCancelled ?? false,
                    isCancelableStream: payment.cancelable ?? true,
                    isCancelling: payment.isCancelling,
                  }}
                />
              );
            })}
          </Box>
        </Box>
      )}
    </FieldArray>
  );
}
