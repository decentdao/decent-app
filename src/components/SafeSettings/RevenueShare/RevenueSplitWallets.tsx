import { Button, Flex, Grid, GridItem, Icon, IconButton, Text } from '@chakra-ui/react';
import { Plus, Trash } from '@phosphor-icons/react';
import { Field, FieldProps, useFormikContext } from 'formik';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, isAddress } from 'viem';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../../providers/App/AppProvider';
import {
  RevenueSharingSplitFormError,
  RevenueSharingWalletFormType,
  RevenueSharingWalletFormValues,
} from '../../../types/revShare';
import { AccordionDropdown } from '../../ui/containers/AccordionDropdown';
import { AddressInputInfo } from '../../ui/forms/AddressInputInfo';
import { EditableInput } from '../../ui/forms/EditableInput';
import { NumberInputPercentage } from '../../ui/forms/NumberInputPercentage';
import AddressCopier from '../../ui/links/AddressCopier';
import { SafeSettingsEdits, SafeSettingsFormikErrors } from '../../ui/modals/SafeSettingsModal';
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

function WalletName({
  index,
  wallet,
  walletFormType,
}: {
  index: number;
  wallet: RevenueSharingWalletFormValues;
  walletFormType: RevenueSharingWalletFormType;
}) {
  return (
    <Grid
      templateColumns="auto 1fr"
      alignItems="center"
      w="full"
      gap="0.5rem"
    >
      <Field name={`revenueSharing.${walletFormType}.${index}.name`}>
        {({ field, form }: FieldProps<string, any>) => (
          <EditableInput
            value={field.value || wallet.name}
            onClick={e => {
              e.stopPropagation();
            }}
            onChange={value => {
              form.setFieldValue(field.name, value.target.value);
            }}
            onEditCancel={() => {
              const lastEditName =
                form.values.revenueSharing[walletFormType][index].lastEdit?.name || wallet.name;
              form.setFieldValue(field.name, lastEditName);
            }}
            onEditSave={() => {
              const lastValue = form.values.revenueSharing[walletFormType][index].lastEdit?.name;
              const currentName = field.value || lastValue || wallet.name;
              form.setFieldValue(
                `revenueSharing.${walletFormType}.${index}.lastEdit.name`,
                currentName,
              );
              form.setFieldValue(field.name, currentName);
            }}
          />
        )}
      </Field>
      {wallet.address && isAddress(wallet.address) && (
        <AddressCopier
          address={wallet.address}
          color="color-content-content1-foreground"
          textStyle="text-sm-underlined-regular"
          textDecor="underline"
          variant="secondary"
        >
          {createAccountSubstring(wallet.address)}
        </AddressCopier>
      )}
    </Grid>
  );
}

export function RevSplitRow({
  existingWalletSplitAddress,
  existingWalletSplitPercentage,
  formPath,
  splitFormError,
  isLastRow,
  isReadOnlyAddress,
  onRemoveSplit,
}: {
  existingWalletSplitAddress: string | undefined;
  existingWalletSplitPercentage: string | undefined;
  formPath: string;
  splitFormError: RevenueSharingSplitFormError | undefined;
  isLastRow?: boolean;
  isReadOnlyAddress?: boolean;
  onRemoveSplit?: () => void;
}) {
  const { t } = useTranslation('revenueSharing');

  return (
    <>
      <RevenueSharingTableRowItem
        rowContent={
          <Field name={`${formPath}.address`}>
            {({ field, form }: FieldProps<string, any>) => {
              const fieldValue = field.value ?? existingWalletSplitAddress;
              return (
                <AddressInputInfo
                  isInvalid={!!splitFormError?.address}
                  isReadOnly={isReadOnlyAddress}
                  variant="tableStyle"
                  value={fieldValue}
                  onChange={value => {
                    if (value.target.value === existingWalletSplitAddress) {
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
          <Field name={`${formPath}.percentage`}>
            {({ field, form }: FieldProps<string, any>) => {
              const fieldValue = field.value ?? existingWalletSplitPercentage;

              return (
                <NumberInputPercentage
                  variant="tableStyle"
                  isInvalid={!!splitFormError?.percentage}
                  value={fieldValue}
                  min={0}
                  onChange={value => {
                    if (value === existingWalletSplitPercentage) {
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
          <Flex
            alignItems="center"
            justifyContent="flex-end"
            px="1rem"
            w="full"
          >
            <IconButton
              aria-label={t('removeSplitButtonLabel')}
              hidden={!onRemoveSplit}
              icon={<Trash />}
              color="color-error-400"
              borderColor="color-error-400"
              _hover={{
                color: 'color-error-500',
                borderColor: 'color-error-500',
              }}
              variant="ghost"
              onClick={onRemoveSplit}
            />
          </Flex>
        }
        rightDivider
        isEdgeItem
        hasBottomRadius={isLastRow ? 'right' : undefined}
      />
    </>
  );
}

export function RevSplitTable({
  wallet,
  walletIndex,
  walletFormType,
}: {
  wallet: RevenueSharingWalletFormValues;
  walletIndex: number;
  walletFormType: RevenueSharingWalletFormType;
}) {
  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();
  const { t } = useTranslation('revenueSharing');
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe, subgraphInfo },
    governance: { stakedToken },
  } = useDAOStore({ daoKey });

  const isCurrentDAOAddress = useCallback(
    (address: Address | string | undefined) => {
      if (!safe?.address) return false;
      if (!address) return false;
      return address === safe?.address;
    },
    [safe],
  );

  const isParentDAOAddress = useCallback(
    (address: Address | string | undefined) => {
      if (!subgraphInfo?.parentAddress) return false;
      if (!address) return false;
      return address === subgraphInfo?.parentAddress;
    },
    [subgraphInfo],
  );

  const isStakingContractAddress = useCallback(
    (address: Address | string | undefined) => {
      if (!stakedToken?.address) return false;
      if (!address) return false;
      return address === stakedToken.address;
    },
    [stakedToken?.address],
  );

  const daoSplitInfo = wallet.splits?.find(({ address }) => isCurrentDAOAddress(address));
  const parentDAOSplitInfo = wallet.splits?.find(({ address }) => isParentDAOAddress(address));

  const stakingContractSplitInfo = wallet.splits?.find(({ address }) =>
    isStakingContractAddress(address),
  );

  const customSplitsWithIndices = wallet.splits
    ?.map((split, originalIndex) => ({ split, originalIndex }))
    .filter(
      ({ split }) =>
        !isCurrentDAOAddress(split.address) &&
        !isParentDAOAddress(split.address) &&
        !isStakingContractAddress(split.address),
    );

  const totalPercentage = useMemo(() => {
    let total = 0;
    const formWallet = values.revenueSharing?.[walletFormType]?.[walletIndex];

    // DAO (always shown)
    const daoFormPercentage = formWallet?.specialSplits?.dao?.percentage;
    const daoOriginalPercentage = daoSplitInfo?.percentage;
    total += Number(daoFormPercentage ?? daoOriginalPercentage ?? '0');

    // Parent DAO (conditional)
    if (subgraphInfo?.parentAddress) {
      const parentFormPercentage = formWallet?.specialSplits?.parentDao?.percentage;
      const parentOriginalPercentage = parentDAOSplitInfo?.percentage;
      total += Number(parentFormPercentage ?? parentOriginalPercentage ?? '0');
    }

    // Staking (conditional)
    const stakingFormPercentage = formWallet?.specialSplits?.stakingContract?.percentage;
    const stakingOriginalPercentage = stakingContractSplitInfo?.percentage;
    total += Number(stakingFormPercentage ?? stakingOriginalPercentage ?? '0');

    customSplitsWithIndices?.forEach(({ split, originalIndex }) => {
      const formPercentage = formWallet?.splits?.[originalIndex]?.percentage;
      total += Number(formPercentage ?? split.percentage ?? '0');
    });

    const originalLength = wallet.splits?.length || 0;
    const formSplits = formWallet?.splits || [];

    for (let i = originalLength; i < formSplits.length; i++) {
      if (formSplits[i]?.percentage !== undefined) {
        total += Number(formSplits[i].percentage);
      }
    }

    return total;
  }, [
    wallet.splits,
    values,
    walletFormType,
    walletIndex,
    daoSplitInfo,
    parentDAOSplitInfo,
    customSplitsWithIndices,
    subgraphInfo?.parentAddress,
    stakingContractSplitInfo,
  ]);

  const { errors: formErrors } = useFormikContext<SafeSettingsEdits>();
  const revenueSharingEditFormikErrors = (formErrors as SafeSettingsFormikErrors | undefined)
    ?.revenueSharing;

  const daoSplit = (
    <RevSplitRow
      formPath={`revenueSharing.${walletFormType}.${walletIndex}.specialSplits.dao`}
      splitFormError={
        revenueSharingEditFormikErrors?.[walletFormType]?.[walletIndex]?.specialSplits?.dao
      }
      existingWalletSplitAddress={daoSplitInfo?.address ?? safe?.address}
      existingWalletSplitPercentage={daoSplitInfo?.percentage}
      isLastRow={
        !subgraphInfo?.parentAddress && !stakedToken?.address && !customSplitsWithIndices?.length
      }
      isReadOnlyAddress={true}
    />
  );

  const parentDAOSplit = (
    <RevSplitRow
      formPath={`revenueSharing.${walletFormType}.${walletIndex}.specialSplits.parentDao`}
      splitFormError={
        revenueSharingEditFormikErrors?.[walletFormType]?.[walletIndex]?.specialSplits?.parentDao
      }
      existingWalletSplitAddress={
        parentDAOSplitInfo?.address ?? subgraphInfo?.parentAddress ?? undefined
      }
      existingWalletSplitPercentage={parentDAOSplitInfo?.percentage}
      isLastRow={!stakedToken?.address && !customSplitsWithIndices?.length}
      isReadOnlyAddress={true}
    />
  );

  const stakeTokenHolderSplit = (
    <RevSplitRow
      formPath={`revenueSharing.${walletFormType}.${walletIndex}.specialSplits.stakingContract`}
      splitFormError={
        revenueSharingEditFormikErrors?.[walletFormType]?.[walletIndex]?.specialSplits
          ?.stakingContract
      }
      existingWalletSplitAddress={stakingContractSplitInfo?.address ?? stakedToken?.address}
      existingWalletSplitPercentage={stakingContractSplitInfo?.percentage}
      isLastRow={!customSplitsWithIndices?.length}
      isReadOnlyAddress={true}
    />
  );

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
        {daoSplit}
        {subgraphInfo?.parentAddress && parentDAOSplit}
        {stakedToken?.address && stakeTokenHolderSplit}
        {customSplitsWithIndices?.map(({ split, originalIndex }, i, arr) => {
          const isLastRow = i === arr.length - 1;
          const splitError =
            revenueSharingEditFormikErrors?.[walletFormType]?.[walletIndex]?.splits?.[
              originalIndex
            ];
          return (
            <RevSplitRow
              key={i}
              formPath={`revenueSharing.${walletFormType}.${walletIndex}.splits.${originalIndex}`}
              splitFormError={splitError}
              existingWalletSplitAddress={split.address}
              existingWalletSplitPercentage={split.percentage}
              isLastRow={isLastRow}
              onRemoveSplit={
                !wallet.address
                  ? () => {
                      // remove new wallets and/or any edits
                      setFieldValue(
                        `revenueSharing.${walletFormType}.${walletIndex}.splits`,
                        values?.revenueSharing?.[walletFormType][walletIndex]?.splits?.filter(
                          (__: any, j: any) => j !== originalIndex,
                        ),
                      );
                    }
                  : undefined
              }
            />
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
          const formWalletSplits = [...(wallet.splits || [])];

          const formWalletSplitsLength = formWalletSplits.length;
          const walletsLength = wallet.splits?.length || 0;
          const newWalletIndex =
            formWalletSplitsLength >= walletsLength ? formWalletSplitsLength : walletsLength;

          formWalletSplits[newWalletIndex] = {
            address: undefined,
            percentage: undefined,
          };
          setFieldValue(`revenueSharing.${walletFormType}.${walletIndex}.splits`, formWalletSplits);
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
  walletFormType,
}: {
  wallet: RevenueSharingWalletFormValues;
  index: number;
  walletFormType: RevenueSharingWalletFormType;
}) {
  return (
    <AccordionDropdown
      defaultExpandedIndices={index === 0 ? [0] : []}
      sectionTitle={
        <WalletName
          index={index}
          wallet={wallet}
          walletFormType={walletFormType}
        />
      }
      content={
        <RevSplitTable
          wallet={wallet}
          walletIndex={index}
          walletFormType={walletFormType}
        />
      }
    />
  );
}
