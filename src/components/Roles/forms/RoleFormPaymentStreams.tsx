import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { Plus } from '@phosphor-icons/react';
import { FieldArray, useFormikContext } from 'formik';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  paymentSorterByActiveStatus,
  paymentSorterByStartDate,
  paymentSorterByWithdrawAmount,
} from '../../../store/roles/rolesStoreUtils';
import { RoleFormValues, SablierPaymentFormValues } from '../../../types/roles';
import Divider from '../../ui/utils/Divider';
import { RolePaymentDetails } from '../RolePaymentDetails';
import { RoleFormPaymentStream } from './RoleFormPaymentStream';
import RoleFormPaymentStreamTermed from './RoleFormPaymentStreamTermed';

export function RoleFormPaymentRenderer() {
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
          {values.roleEditing?.roleEditingPaymentIndex === undefined && (
            <Button
              variant="secondary"
              size="sm"
              isDisabled={values.roleEditing?.isTermed ? !isTermsAvailable : false}
              leftIcon={<Plus size="1rem" />}
              iconSpacing={0}
              onClick={async () => {
                pushPayment({
                  isStreaming: () => false,
                  canUserCancel: () => false,
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
              bg="neutral-2"
              padding="1.5rem"
              border="1px solid"
              borderColor="neutral-3"
              borderRadius="0.25rem"
              my="1.5rem"
              justifyContent="space-between"
            >
              <Flex flexDir="column">
                <Text textStyle="label-large">{t('noPaymentsTitle')}</Text>
                <Text
                  textStyle="label-small"
                  color="neutral-7"
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
                    payment.canUserCancel()
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
                    isStreaming: payment.isStreaming,
                    isCancelableStream: payment.cancelable,
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
