import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Show,
  Switch,
  Text,
  Image,
} from '@chakra-ui/react';
import { ClockClockwise, TrashSimple } from '@phosphor-icons/react';
import { Field, FieldArray, FieldAttributes, useFormikContext } from 'formik';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatUnits, zeroAddress } from 'viem';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { BigIntInput } from '../../../../components/ui/forms/BigIntInput';
import { AddressInput } from '../../../../components/ui/forms/EthAddressInput';
import { DisplayAddress } from '../../../../components/ui/links/DisplayAddress';
import { ModalContext } from '../../../../components/ui/modals/ModalProvider';
import {
  SafeSettingsEdits,
  SafeSettingsFormikErrors,
} from '../../../../components/ui/modals/SafeSettingsModal';
import NestedPageHeader from '../../../../components/ui/page/Header/NestedPageHeader';
import Divider from '../../../../components/ui/utils/Divider';
import { DAO_ROUTES } from '../../../../constants/routes';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import useLockedToken from '../../../../hooks/DAO/useLockedToken';
import { useCanUserCreateProposal } from '../../../../hooks/utils/useCanUserSubmitProposal';
import { useFormHelpers } from '../../../../hooks/utils/useFormHelpers';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { BigIntValuePair } from '../../../../types';
import { formatCoin } from '../../../../utils';

function WhitelistedAddress({
  address,
  disabled = false,
}: {
  address: string;
  disabled?: boolean;
}) {
  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();

  const addressesToUnwhitelist = values.token?.addressesToUnwhitelist || [];
  const willBeRemoved = addressesToUnwhitelist.includes(address);

  return (
    <Grid
      templateColumns="repeat(2, 1fr)"
      gap={4}
    >
      <GridItem p={3}>
        <AddressInput
          value={address}
          isDisabled={true}
          textDecoration={willBeRemoved ? 'line-through' : 'none'}
          marginTop="-0.25rem"
        />
      </GridItem>
      <GridItem
        justifyItems="flex-end"
        p={3}
      >
        {willBeRemoved ? (
          <IconButton
            aria-label="addBack"
            icon={
              <ClockClockwise
                width={16}
                height={16}
              />
            }
            variant="ghost"
            size="sm"
            color="color-base-success"
            onClick={() => {
              const updatedAddresses = [...addressesToUnwhitelist];
              updatedAddresses.splice(updatedAddresses.indexOf(address), 1);
              if (updatedAddresses.length === 0) {
                setFieldValue('token.addressesToUnwhitelist', undefined);
              } else {
                setFieldValue('token.addressesToUnwhitelist', updatedAddresses);
              }
            }}
          />
        ) : (
          <IconButton
            aria-label="delete"
            icon={
              <TrashSimple
                width={16}
                height={16}
              />
            }
            variant="ghost"
            size="sm"
            color="color-base-error"
            isDisabled={disabled}
            onClick={() => {
              setFieldValue('token.addressesToUnwhitelist', [...addressesToUnwhitelist, address]);
            }}
          />
        )}
      </GridItem>
    </Grid>
  );
}

function NewWhitelistAddress({
  name,
  onRemove,
  disabled = false,
}: {
  name: string;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const { errors } = useFormikContext<SafeSettingsEdits>();
  const tokenErrors = (errors as SafeSettingsFormikErrors | undefined)?.token;

  return (
    <Grid
      templateColumns="repeat(2, 1fr)"
      gap={4}
    >
      <GridItem p={3}>
        <Field name={name}>
          {({ field }: FieldAttributes<any>) => (
            <AddressInput
              {...field}
              isInvalid={
                !!field.value &&
                tokenErrors?.addressesToWhitelist !== undefined &&
                tokenErrors?.addressesToWhitelist.findIndex(a => `token.${a.key}` === name) !== -1
              }
              marginTop="-0.25rem"
            />
          )}
        </Field>
      </GridItem>
      <GridItem
        justifyItems="flex-end"
        p={3}
      >
        <IconButton
          aria-label="delete"
          icon={
            <TrashSimple
              width={16}
              height={16}
            />
          }
          variant="ghost"
          size="sm"
          color="color-base-error"
          isDisabled={disabled}
          onClick={() => onRemove()}
        />
      </GridItem>
    </Grid>
  );
}

export function SafeTokenSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('settings');
  const { addressPrefix } = useNetworkConfigStore();
  const { restrictChars } = useFormHelpers();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const notProposer = canUserCreateProposal === undefined || !canUserCreateProposal;
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    governance: { erc20Token },
  } = useDAOStore({ daoKey });
  const { tokenState } = useLockedToken(
    erc20Token?.address !== undefined && safe?.address !== undefined
      ? { token: erc20Token?.address, account: safe?.address }
      : undefined,
  );

  const { closeAllModals } = useContext(ModalContext);
  const { values, setFieldValue, errors } = useFormikContext<SafeSettingsEdits>();
  const formErrors = errors as SafeSettingsFormikErrors;

  const isTransferableInValues = values.token?.transferable;
  const isTransferable =
    isTransferableInValues === undefined ? !tokenState.locked : isTransferableInValues;

  const whitelistedAddresses = erc20Token?.whitelistedAddresses || [];

  const currentMaxTotalSupply: BigIntValuePair = {
    bigintValue: erc20Token?.maxTotalSupply,
    value: formatUnits(erc20Token?.maxTotalSupply || 0n, erc20Token?.decimals || 0),
  };

  return (
    <>
      <Show below="md">
        <NestedPageHeader
          title={t('tokenTitle')}
          backButton={{
            text: t('settings'),
            href: DAO_ROUTES.settings.relative(addressPrefix, safe?.address || zeroAddress),
          }}
        />
      </Show>
      <SettingsContentBox>
        <Flex
          gap={6}
          direction="column"
          width="100%"
        >
          <Text
            color="color-white"
            textStyle="text-lg-regular"
          >
            {t('governanceTokenInfoTitle')}
          </Text>
          {erc20Token ? (
            <Flex
              justifyContent="space-between"
              flexWrap={{ base: 'wrap', md: 'nowrap' }}
              borderWidth="0.06rem"
              borderColor="color-neutral-900"
              borderRadius="0.75rem"
              flexDirection="column"
            >
              {/* TOKEN NAME */}
              <Flex
                alignItems="center"
                justifyContent="space-between"
                px={6}
                py={2}
              >
                <Text textStyle="text-base-regular">{t('governanceTokenNameTitle')}</Text>
                <DisplayAddress
                  mb={-2}
                  mr={-4}
                  address={erc20Token.address}
                >
                  {erc20Token.name}
                </DisplayAddress>
              </Flex>

              <Divider />

              {/* TOKEN SYMBOL */}
              <Flex
                alignItems="center"
                justifyContent="space-between"
                px={6}
                py={2}
              >
                <Text textStyle="text-base-regular">{t('governanceTokenSymbolLabel')}</Text>
                <Text
                  color="color-neutral-300"
                  textStyle="text-base-regular"
                >
                  ${erc20Token.symbol}
                </Text>
              </Flex>

              <Divider />

              {/* TOTAL SUPPLY */}
              <Flex
                alignItems="center"
                justifyContent="space-between"
                px={6}
                py={2}
              >
                <Text textStyle="text-base-regular">{t('tokenTabTokenSupplyLabel')}</Text>
                <Text
                  color="color-neutral-300"
                  textStyle="text-base-regular"
                >
                  {formatCoin(
                    erc20Token.totalSupply,
                    false,
                    erc20Token.decimals,
                    erc20Token.symbol,
                    false,
                  )}
                </Text>
              </Flex>
            </Flex>
          ) : (
            <Flex
              flexDirection="column"
              alignItems="flex-start"
              alignSelf="stretch"
            >
              <Flex
                flexDirection="column"
                mt="0.5rem"
                mb="1rem"
              >
                <Text
                  whiteSpace="pre-wrap"
                  textStyle="text-sm-regular"
                >
                  {t('tokenPageNotDeployedDescription')}
                </Text>
              </Flex>

              <Button
                onClick={() => {
                  if (!safe) return;
                  closeAllModals();
                  navigate(DAO_ROUTES.deployToken.relative(addressPrefix, safe.address));
                }}
              >
                {t('tokenPageDeployTokenButton')}
              </Button>
            </Flex>
          )}

          {erc20Token && !tokenState.isImportedToken && (
            <>
              <Flex
                gap={4}
                direction="column"
              >
                <Text
                  color="color-content-popover-foreground"
                  textStyle="text-lg-regular"
                >
                  {t('governanceTokenManagementTitle')}
                </Text>

                <Flex
                  gap={2}
                  align="center"
                >
                  <Switch
                    variant="secondary"
                    size="md"
                    isChecked={isTransferable}
                    disabled={notProposer || !tokenState.locked}
                    onChange={e => {
                      const newCheckedState = e.target.checked;
                      if (newCheckedState !== tokenState.locked) {
                        setFieldValue('token.transferable', undefined);
                      } else {
                        setFieldValue('token.transferable', newCheckedState);
                      }
                    }}
                  />
                  <Flex direction="column">
                    <Text
                      color="color-layout-foreground"
                      textStyle="text-sm-leading-none-medium"
                    >
                      {t('governanceTokenTransferableLabel')}
                    </Text>
                    <Text
                      color="color-secondary-300"
                      textStyle="text-sm-regular"
                    >
                      {isTransferable
                        ? t('governanceTokenTransferableOnSubLabel')
                        : t('governanceTokenTransferableOffSubLabel')}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>

              {!isTransferable && (
                <FieldArray name="token.addressesToWhitelist">
                  {({ remove, push }) => {
                    return (
                      <Flex
                        gap={2}
                        direction="column"
                      >
                        <Flex justify="space-between">
                          <Text
                            color="color-content-popover-foreground"
                            textStyle="text-sm-regular"
                          >
                            {t('governanceTokenWhitelistTitle')}
                          </Text>

                          <Flex>
                            <Button
                              variant="secondary"
                              size="md"
                              px={4}
                              isDisabled={notProposer}
                              onClick={() => push('')}
                            >
                              {t('governanceTokenWhitelistAddWallet')}
                            </Button>
                          </Flex>
                        </Flex>

                        <Box>
                          {whitelistedAddresses.map(address => (
                            <WhitelistedAddress
                              key={address}
                              address={address}
                              disabled={notProposer}
                            />
                          ))}

                          {values.token?.addressesToWhitelist?.map((address, index) => (
                            <NewWhitelistAddress
                              key={`token.addressesToWhitelist.${index}`}
                              name={`token.addressesToWhitelist.${index}`}
                              onRemove={() => {
                                if (values.token?.addressesToWhitelist?.length === 1) {
                                  setFieldValue('token.addressesToWhitelist', undefined);
                                } else {
                                  remove(index);
                                }
                              }}
                              disabled={notProposer}
                            />
                          ))}
                        </Box>
                      </Flex>
                    );
                  }}
                </FieldArray>
              )}

              <Flex
                gap={2}
                direction="column"
              >
                <Text
                  color="color-content-popover-foreground"
                  textStyle="text-lg-regular"
                >
                  {t('governanceTokenMaximumTotalSupplyTitle')}
                </Text>

                <Text
                  color="color-content-popover-foreground0"
                  textStyle="text-sm-regular"
                >
                  {t('governanceTokenMaximumTotalSupplySubTitle')}
                </Text>

                <Flex
                  padding={3}
                  paddingLeft={0}
                  width={300}
                  direction="column"
                >
                  <BigIntInput
                    parentFormikValue={values.token?.maximumTotalSupply || currentMaxTotalSupply}
                    onChange={valuePair => {
                      if (valuePair.bigintValue !== currentMaxTotalSupply.bigintValue) {
                        setFieldValue('token.maximumTotalSupply', valuePair);
                      } else {
                        setFieldValue('token.maximumTotalSupply', undefined);
                      }
                    }}
                    isDisabled={notProposer || tokenState.isImportedToken}
                    decimalPlaces={erc20Token.decimals}
                    onKeyDown={restrictChars}
                  />
                  {formErrors.token?.maximumTotalSupply && (
                    <Flex gap="0.25rem">
                      <Image src="/images/input-error.svg" />
                      <Text
                        color="color-error-500"
                        mt="0.2rem"
                        mb="0.25rem"
                      >
                        {formErrors.token.maximumTotalSupply}
                      </Text>
                    </Flex>
                  )}
                </Flex>
              </Flex>
            </>
          )}
        </Flex>
      </SettingsContentBox>
    </>
  );
}
