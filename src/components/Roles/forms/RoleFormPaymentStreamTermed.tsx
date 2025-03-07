import {
  Box,
  Button,
  Flex,
  FormControl,
  Hide,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';
import { Calendar, CaretDown, CheckCircle } from '@phosphor-icons/react';
import { addDays, format } from 'date-fns';
import { Field, FieldProps, FormikErrors, useFormikContext } from 'formik';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CARD_SHADOW, DETAILS_BOX_SHADOW } from '../../../constants/common';
import { RoleFormValues, RoleHatFormValue } from '../../../types/roles';
import { DEFAULT_DATE_TIME_FORMAT_NO_TZ } from '../../../utils';
import DraggableDrawer from '../../ui/containers/DraggableDrawer';
import { DatePicker } from '../../ui/forms/DatePicker';
import LabelWrapper from '../../ui/forms/LabelWrapper';
import Divider from '../../ui/utils/Divider';
import { AssetSelector } from './RoleFormAssetSelector';
import { SectionTitle } from './RoleFormSectionTitle';

function ShadowedBox({
  hasBorderRadius = true,
  children,
}: {
  hasBorderRadius?: boolean;
  children: ReactNode;
}) {
  return (
    <Box
      px={{ base: '1rem', md: 0 }}
      py="1rem"
      boxShadow={{
        base: CARD_SHADOW,
        md: 'unset',
      }}
      borderRadius={hasBorderRadius ? '0.5rem' : undefined}
    >
      {children}
    </Box>
  );
}

function StartDatePicker({ paymentIndex, disabled }: { paymentIndex: number; disabled: boolean }) {
  const { t } = useTranslation(['roles']);
  const { values } = useFormikContext<RoleFormValues>();

  const selectedEndDate = values?.roleEditing?.payments?.[paymentIndex]?.endDate;
  const terms = useMemo(
    () => values?.roleEditing?.roleTerms || [],
    [values?.roleEditing?.roleTerms],
  );
  const minDate = useMemo(() => {
    const [currentTerm, nextTerm] = terms.filter(
      term => !!term.termEndDate && term.termEndDate >= new Date(),
    );
    // if selected term is next term, start date can be next day after beggining of the term
    if (!!nextTerm) {
      if (!currentTerm.termEndDate) {
        throw new Error('Current Term end date is required');
      }
      return addDays(currentTerm.termEndDate, 1);
    }

    // if selected term is current term, start date can be now
    return new Date();
  }, [terms]);

  return (
    <FormControl
      my="1rem"
      display="flex"
      flexDir="column"
      gap="1rem"
    >
      <SectionTitle
        title={t('paymentStart')}
        tooltipContent={t('startSubTitle')}
      />
      <Field name={`roleEditing.payments.[${paymentIndex}].startDate`}>
        {({ field, form: { setFieldValue } }: FieldProps<Date, RoleFormValues>) => (
          <LabelWrapper
            label={t('date')}
            labelColor="neutral-7"
          >
            <DatePicker
              onChange={(date: Date) => setFieldValue(field.name, date)}
              selectedDate={field.value}
              minDate={minDate}
              maxDate={selectedEndDate ? addDays(selectedEndDate, -1) : undefined}
              disabled={disabled}
            />
          </LabelWrapper>
        )}
      </Field>
    </FormControl>
  );
}

function CliffDatePicker({ paymentIndex, disabled }: { paymentIndex: number; disabled: boolean }) {
  const { t } = useTranslation(['roles']);
  const { values } = useFormikContext<RoleFormValues>();

  const selectedStartDate = values?.roleEditing?.payments?.[paymentIndex]?.startDate;
  const selectedEndDate = values?.roleEditing?.payments?.[paymentIndex]?.endDate;

  return (
    <FormControl
      my="1rem"
      display="flex"
      flexDir="column"
      gap="1rem"
    >
      <SectionTitle
        title={t('cliff')}
        tooltipContent={t('cliffSubTitle')}
      />
      <Field name={`roleEditing.payments.[${paymentIndex}].cliffDate"`}>
        {({ field, form: { setFieldValue } }: FieldProps<Date, RoleFormValues>) => (
          <LabelWrapper
            label={t('date')}
            labelColor="neutral-7"
          >
            <DatePicker
              onChange={(date: Date) => setFieldValue(field.name, date)}
              selectedDate={field.value}
              minDate={selectedStartDate ? addDays(selectedStartDate, 1) : undefined}
              maxDate={selectedEndDate}
              disabled={disabled}
            />
          </LabelWrapper>
        )}
      </Field>
    </FormControl>
  );
}

function TermSelection({
  selectedTermNumber,
  selectedTermEndDate,
  defaultDateColor = 'white-0',
}: {
  selectedTermNumber: number;
  selectedTermEndDate: Date;
  defaultDateColor?: string;
}) {
  const { t } = useTranslation(['roles']);

  return (
    <Flex
      alignItems="center"
      w="full"
      justifyContent="space-between"
    >
      <Text
        textStyle="body-small"
        color="white-0"
      >
        {t('termNumber', { number: selectedTermNumber })}
      </Text>
      <Flex
        alignItems="center"
        gap={2}
      >
        <Icon as={Calendar} />
        <Text
          textStyle="labels-small"
          color={defaultDateColor}
        >
          {format(selectedTermEndDate, DEFAULT_DATE_TIME_FORMAT_NO_TZ)}
        </Text>
      </Flex>
    </Flex>
  );
}

function TermSelectorMenu({ paymentIndex }: { paymentIndex: number }) {
  const { t } = useTranslation(['roles']);
  const { values, setFieldValue, validateField } = useFormikContext<RoleFormValues>();
  const [selectedTerm, setSelectedTerm] = useState<{
    termNumber: number;
    termEndDate: Date;
  } | null>(null);
  const roleFormTerms = useMemo(
    () => values.roleEditing?.roleTerms || [],
    [values.roleEditing?.roleTerms],
  );

  const eligibleTerms = useMemo(
    () =>
      roleFormTerms
        .filter(term => term.termEndDate && term.termEndDate >= new Date())
        .map(term => {
          if (!term.termEndDate) {
            throw new Error('Term end date is required');
          }
          return {
            termNumber: term.termNumber,
            termEndDate: term.termEndDate,
          };
        }),
    [roleFormTerms],
  );

  useEffect(() => {
    const [currentTerm] = roleFormTerms.filter(
      term => !!term.termEndDate && term.termEndDate >= new Date(),
    );
    if (!selectedTerm && currentTerm) {
      if (!currentTerm.termEndDate) {
        throw new Error('Term end date is required');
      }
      setSelectedTerm({
        termNumber: currentTerm.termNumber,
        termEndDate: currentTerm.termEndDate,
      });
    }
  }, [selectedTerm, roleFormTerms]);

  useEffect(() => {
    if (selectedTerm) {
      setFieldValue(`roleEditing.payments[${paymentIndex}].endDate`, selectedTerm.termEndDate);
      validateField(`roleEditing.payments`);
    }
  }, [selectedTerm, paymentIndex, setFieldValue, validateField]);
  return (
    <Box my="1rem">
      <Menu
        placement="bottom-end"
        offset={[0, 1]}
        matchWidth
      >
        {({ isOpen, onClose }) => (
          <>
            <MenuButton
              w="full"
              p={4}
              borderRadius={isOpen ? '0.75rem 0.75rem 0 0' : '0.75rem'}
              boxShadow={DETAILS_BOX_SHADOW}
              _hover={{ bg: 'neutral-3' }}
              _active={{ bg: 'neutral-2' }}
              transition="all ease-out 300ms"
              type="button"
            >
              {!!selectedTerm && (
                <Flex
                  alignItems="center"
                  gap={2}
                >
                  <TermSelection
                    selectedTermNumber={selectedTerm.termNumber}
                    selectedTermEndDate={selectedTerm.termEndDate}
                  />
                  <Icon
                    as={CaretDown}
                    boxSize="1.5rem"
                    color="white-0"
                  />
                </Flex>
              )}
            </MenuButton>
            <Hide above="lg">
              <DraggableDrawer
                isOpen={isOpen}
                onClose={onClose}
                onOpen={() => {}}
                headerContent={null}
                initialHeight="50%"
                closeOnOverlayClick={false}
              >
                {eligibleTerms.map((term, index) => (
                  <MenuItem
                    key={index}
                    display="inline-block"
                    onClick={() => {
                      setSelectedTerm(term);
                      onClose();
                    }}
                  >
                    <Box mb="0.5rem">
                      <Text
                        mb="1.5rem"
                        px={8}
                        textStyle="heading-small"
                        color="white-0"
                      >
                        {t('selectTerm')}
                      </Text>
                      <Divider variant="darker" />
                    </Box>
                    <Box
                      py={8}
                      px={6}
                      mx={2}
                      borderRadius="0.75rem"
                      _hover={{ bg: 'neutral-3' }}
                      _active={{ bg: 'neutral-2' }}
                      transition="all ease-out 100ms"
                    >
                      <Flex
                        alignItems="center"
                        gap={4}
                      >
                        <TermSelection
                          selectedTermNumber={term.termNumber}
                          selectedTermEndDate={term.termEndDate}
                          defaultDateColor="neutral-7"
                        />
                        <Icon
                          as={CheckCircle}
                          boxSize="1.5rem"
                          color="lilac-0"
                        />
                      </Flex>
                    </Box>
                  </MenuItem>
                ))}
              </DraggableDrawer>
            </Hide>
            <Hide below="lg">
              <MenuList
                borderBottomRadius="0.75rem"
                boxShadow={DETAILS_BOX_SHADOW}
                _hover={{ bg: 'neutral-3' }}
                _active={{ bg: 'neutral-2' }}
                transition="all ease-out 300ms"
              >
                {eligibleTerms.map((term, index) => (
                  <MenuItem
                    key={index}
                    p="1rem"
                    onClick={() => {
                      setSelectedTerm(term);
                      onClose();
                    }}
                  >
                    <TermSelection
                      selectedTermNumber={term.termNumber}
                      selectedTermEndDate={term.termEndDate}
                      defaultDateColor="neutral-7"
                    />
                  </MenuItem>
                ))}
              </MenuList>
            </Hide>
          </>
        )}
      </Menu>
    </Box>
  );
}

export default function RoleFormPaymentStreamTermed({ paymentIndex }: { paymentIndex: number }) {
  const { t } = useTranslation(['roles']);
  const { values, errors, setFieldValue } = useFormikContext<RoleFormValues>();
  const roleEditingPaymentsErrors = (errors.roleEditing as FormikErrors<RoleHatFormValue>)
    ?.payments;

  const streamId = values.roleEditing?.payments?.[paymentIndex]?.streamId;

  return (
    <>
      <Box
        bg="neutral-2"
        borderRadius="0.5rem"
        p="1.5rem"
        mt={4}
      >
        <ShadowedBox>
          <SectionTitle
            title={t('asset')}
            tooltipContent={t('addPaymentStreamSubTitle')}
            externalLink="https://docs.decentdao.org/app/user-guide/roles-and-streaming/streaming-payroll-and-vesting"
          />
          <AssetSelector
            formIndex={paymentIndex}
            disabled={!!streamId}
          />
        </ShadowedBox>
        <ShadowedBox hasBorderRadius={false}>
          <SectionTitle
            title={t('assignPayment')}
            tooltipContent={t('assignPaymentTooltip')}
          />
          <TermSelectorMenu paymentIndex={paymentIndex} />
        </ShadowedBox>
        <ShadowedBox>
          <StartDatePicker
            paymentIndex={paymentIndex}
            disabled={!!streamId}
          />
          <CliffDatePicker
            paymentIndex={paymentIndex}
            disabled={!!streamId}
          />
        </ShadowedBox>
      </Box>
      <Flex
        justifyContent="flex-end"
        mt={8}
      >
        {!streamId && (
          <Button
            isDisabled={!!roleEditingPaymentsErrors}
            onClick={() => {
              setFieldValue('roleEditing.roleEditingPaymentIndex', undefined);
            }}
          >
            {t('save')}
          </Button>
        )}
      </Flex>
    </>
  );
}
