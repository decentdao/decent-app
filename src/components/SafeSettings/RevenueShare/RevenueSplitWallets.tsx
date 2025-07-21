import { Button, Flex, Grid, GridItem, Icon, IconButton, Text } from '@chakra-ui/react';
import { Plus, Trash } from '@phosphor-icons/react';
import { Field, FieldProps, useFormikContext } from 'formik';
import { Fragment, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { zeroAddress } from 'viem';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { RevenueSharingWalletFormValues } from '../../../types/revShare';
import { AccordionDropdown } from '../../ui/containers/AccordionDropdown';
import { AddressInputInfo } from '../../ui/forms/AddressInputInfo';
import { EditableInput } from '../../ui/forms/EditableInput';
import { NumberInputPercentage } from '../../ui/forms/NumberInputPercentage';
import AddressCopier from '../../ui/links/AddressCopier';
import { SafeSettingsEdits } from '../../ui/modals/SafeSettingsModal';
import Divider from '../../ui/utils/Divider';
import { SplitPercentageDisplay } from './SplitPercentageDisplay';

function RevenueSharingTableRowItem({
  colSpan,
  rowContent,
  isEdgeItem,
  rightDivider,
  isFirstColumn,
  hasBottomRadius,
  removeBottomBorder,
}: {
  colSpan?: number;
  rightDivider?: boolean;
  rowContent?: React.ReactNode;
  isEdgeItem?: boolean;
  isFirstColumn?: boolean;
  hasBottomRadius?: 'left' | 'right' | 'full';
  removeBottomBorder?: boolean;
}) {
  const topDividerBorder = isEdgeItem ? { borderTop: '1px solid' } : {};
  const rightDividerBorder = rightDivider ? { borderRight: '1px solid' } : {};
  const borderBottomRadius = hasBottomRadius === 'full' ? { borderBottomRadius: '0.75rem' } : {};
  const borderBottomLeftRadius =
    hasBottomRadius === 'left' ? { borderBottomLeftRadius: '0.75rem' } : {};
  const borderBottomRightRadius =
    hasBottomRadius === 'right' ? { borderBottomRightRadius: '0.75rem' } : {};
  return (
    <GridItem
      display="flex"
      alignItems="center"
      position="relative"
      _focus={{
        outline: 'none',
      }}
      overflow="hidden"
      h="3rem"
      borderBottom={removeBottomBorder ? undefined : '1px solid'}
      {...borderBottomLeftRadius}
      {...borderBottomRightRadius}
      {...borderBottomRadius}
      {...topDividerBorder}
      {...rightDividerBorder}
      colSpan={colSpan}
      borderLeft={isFirstColumn ? '1px solid' : undefined}
      borderColor="color-layout-border"
      textStyle="text-sm-medium"
      color="color-layout-foreground"
    >
      {rowContent}
    </GridItem>
  );
}

function SplitName({ index, wallet }: { index: number; wallet: RevenueSharingWalletFormValues }) {
  return (
    <Grid
      templateColumns="auto 1fr"
      alignItems="center"
      w="full"
      gap="0.5rem"
    >
      <Field name={`revenueSharing.wallets.${index}.name`}>
        {({ field, form }: FieldProps<string, any>) => (
          <EditableInput
            value={field.value || wallet.name}
            onChange={value => {
              form.setFieldValue(field.name, value.target.value);
            }}
            onEditCancel={() => {
              const lastEditName =
                form.values.revenueSharing.wallets[index].lastEdit?.name || wallet.name;
              form.setFieldValue(field.name, lastEditName);
            }}
            onEditSave={() => {
              const lastValue = form.values.revenueSharing.wallets[index].lastEdit?.name;
              const currentName =
                form.values.revenueSharing.wallets[index]?.name || lastValue || wallet.name;
              form.setFieldValue(`revenueSharing.wallets.${index}.lastEdit.name`, currentName);
            }}
          />
        )}
      </Field>
      <AddressCopier
        address={zeroAddress}
        color="color-content-content1-foreground"
        textStyle="text-sm-underlined-regular"
        textDecor="underline"
        variant="secondary"
      >
        {createAccountSubstring(zeroAddress)}
      </AddressCopier>
    </Grid>
  );
}

export function RevSplitTable({
  wallet,
  index,
}: {
  wallet: RevenueSharingWalletFormValues & {
    isCurrentDAOAddress: boolean;
    isParentDAOAddress: boolean;
  };
  index: number;
}) {
  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();
  const { t } = useTranslation('revenueSharing');

  const totalPercentage = useMemo(() => {
    return wallet.splits?.reduce((acc: number, split: any) => acc + Number(split.percentage), 0);
  }, [wallet.splits]);
  return (
    <Flex
      mx={'-1rem'}
      direction="column"
    >
      <Divider my={4} />

      <Text
        mb={4}
        color="color-neutral-50"
      >
        {t('recipients')}
      </Text>

      <Grid
        templateColumns="1fr 0.5fr 0.2fr"
        borderTopRadius="0.75rem"
        whiteSpace="nowrap"
        borderTop="1px solid"
        borderColor="color-layout-border"
        className="scroll-dark"
        overflow={{ base: 'auto', md: 'hidden' }}
      >
        {/* Wallet Share Rows */}
        {wallet.splits?.map((_: any, i: number, arr: any[]) => {
          const isLastRow = i === arr.length - 1;

          return (
            <Fragment key={i}>
              <RevenueSharingTableRowItem
                rowContent={
                  <Field name={`revenueSharing.wallets.${index}.splits.${i}.address`}>
                    {({ field, form }: FieldProps<string, any>) => {
                      const fieldValue = field.value ?? wallet.splits?.[i].address;
                      return (
                        <AddressInputInfo
                          variant="tableStyle"
                          value={fieldValue}
                          onChange={value => {
                            if (value.target.value === wallet.splits?.[i].address) {
                              form.setFieldValue(field.name, undefined);
                            } else {
                              form.setFieldValue(field.name, value.target.value);
                            }
                          }}
                        />
                      );
                    }}
                  </Field>
                }
                isFirstColumn
                rightDivider
                isEdgeItem
                hasBottomRadius={isLastRow ? 'left' : undefined}
              />
              <RevenueSharingTableRowItem
                rowContent={
                  <Field name={`revenueSharing.wallets.${index}.splits.${i}.percentage`}>
                    {({ field, form }: FieldProps<string, any>) => {
                      const fieldValue = field.value ?? wallet.splits?.[i].percentage;
                      return (
                        <NumberInputPercentage
                          variant="tableStyle"
                          value={fieldValue}
                          min={0}
                          onChange={value => {
                            if (value === wallet.splits?.[i].percentage) {
                              form.setFieldValue(field.name, undefined);
                            } else {
                              form.setFieldValue(field.name, value);
                            }
                          }}
                        />
                      );
                    }}
                  </Field>
                }
                rightDivider
              />
              <RevenueSharingTableRowItem
                rowContent={
                  <Field>
                    {({ form }: FieldProps<string, any>) => {
                      const isDAOAddress = wallet.isCurrentDAOAddress;
                      const isParentDAOAddress = wallet.isParentDAOAddress;

                      const hideRemoveButton = isDAOAddress || isParentDAOAddress;
                      return (
                        <Flex
                          alignItems="center"
                          justifyContent="flex-end"
                          px="1rem"
                          w="full"
                        >
                          <IconButton
                            aria-label={t('removeSplitButtonLabel')}
                            hidden={hideRemoveButton}
                            icon={<Trash />}
                            color="color-error-400"
                            borderColor="color-error-400"
                            _hover={{
                              color: 'color-error-500',
                              borderColor: 'color-error-500',
                            }}
                            variant="ghost"
                            onClick={() => {
                              // remove new wallets and/or any edits
                              form.setFieldValue(
                                `revenueSharing.wallets.${index}.splits`,
                                form.values?.revenueSharing?.wallets?.[index]?.splits?.filter(
                                  (__: any, j: any) => j !== i,
                                ),
                              );
                            }}
                          />
                        </Flex>
                      );
                    }}
                  </Field>
                }
                rightDivider
                isEdgeItem
                hasBottomRadius={isLastRow ? 'right' : undefined}
              />
            </Fragment>
          );
        })}
      </Grid>
      <Flex
        mt="1rem"
        px="1rem"
      >
        <SplitPercentageDisplay percentage={totalPercentage} />
      </Flex>

      <Button
        variant="secondaryV1"
        size="sm"
        ml="auto"
        leftIcon={<Icon as={Plus} />}
        onClick={() => {
          const formWalletSplits = [...(values.revenueSharing?.wallets?.[index]?.splits || [])];
          const formWalletSplitsLength = formWalletSplits.length;
          const walletsLength = wallet.splits?.length || 0;
          const newWalletIndex =
            formWalletSplitsLength >= walletsLength ? formWalletSplitsLength : walletsLength;

          formWalletSplits[newWalletIndex] = {
            address: zeroAddress,
            percentage: '0',
          };
          setFieldValue(`revenueSharing.wallets.${index}.splits`, formWalletSplits);
        }}
      >
        {t('addRecipientButton')}
      </Button>
    </Flex>
  );
}

export function RevSplitWalletAccordion({
  wallet,
  index,
}: {
  wallet: RevenueSharingWalletFormValues & {
    isCurrentDAOAddress: boolean;
    isParentDAOAddress: boolean;
  };
  index: number;
}) {
  return (
    <AccordionDropdown
      defaultExpandedIndices={index === 0 ? [0] : []}
      sectionTitle={
        <SplitName
          index={index}
          wallet={wallet}
        />
      }
      content={
        <RevSplitTable
          wallet={wallet}
          index={index}
        />
      }
    />
  );
}
