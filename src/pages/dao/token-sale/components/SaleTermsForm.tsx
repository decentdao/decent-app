import { Input, VStack, Grid, Text, Image, Flex } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatUnits, isAddress } from 'viem';
import { ContentBoxTight } from '../../../../components/ui/containers/ContentBox';
import { BigIntInput } from '../../../../components/ui/forms/BigIntInput';
import { DatePicker } from '../../../../components/ui/forms/DatePicker';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { NumberInputWithAddon } from '../../../../components/ui/forms/InputWithAddon';
import { TimeInput } from '../../../../components/ui/forms/TimeInput';
import { DropdownMenu } from '../../../../components/ui/menus/DropdownMenu';
import { USDC_DECIMALS } from '../../../../constants/common';
import useFeatureFlag from '../../../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { TokenSaleFormValues } from '../../../../types/tokenSale';
import {
  calculateTokenPrice,
  calculateMaxNetTokensForSale,
} from '../../../../utils/tokenSaleCalculations';

interface SaleTermsFormProps {
  values: TokenSaleFormValues;
  setFieldValue: (field: string, value: any) => void;
}

export function SaleTermsForm({ values, setFieldValue }: SaleTermsFormProps) {
  const { t } = useTranslation('tokenSale');
  const { errors, touched } = useFormikContext<TokenSaleFormValues>();
  const devFeatureEnabled = useFeatureFlag('flag_dev');
  const daoKeyResult = useCurrentDAOKey();
  const daoKey =
    daoKeyResult.invalidQuery || daoKeyResult.wrongNetwork ? undefined : daoKeyResult.daoKey;
  const { treasury } = useDAOStore({ daoKey });

  // Filter fungible assets with balance > 0
  const availableTokens = useMemo(() => {
    return treasury.assetsFungible.filter(
      token => parseFloat(token.balance) > 0 && !token.possibleSpam,
    );
  }, [treasury.assetsFungible]);

  // Convert tokens to dropdown items
  const tokenDropdownItems = useMemo(() => {
    return availableTokens.map(token => ({
      value: token.tokenAddress,
      label: `${token.name} (${token.symbol})`,
      icon: token.logo || '/images/coin-icon-default.svg',
      selected: values?.tokenAddress === token.tokenAddress,
      ...token, // Include all token properties
    }));
  }, [availableTokens, values.tokenAddress]);

  // Calculate token price using the corrected utility function
  const calculateTokenPriceLocal = (
    fdv: number,
    totalSupplyRaw: string,
    tokenDecimals: number = 18,
  ) => {
    if (!fdv || !totalSupplyRaw || fdv <= 0 || parseFloat(totalSupplyRaw) <= 0) {
      return { priceInUSD: 0, priceBigInt: 0n };
    }

    try {
      const totalSupplyBigInt = BigInt(totalSupplyRaw);
      const priceBigInt = calculateTokenPrice(fdv, totalSupplyBigInt, tokenDecimals);

      // Convert back to human-readable format for display
      const priceInUSD = parseFloat(formatUnits(priceBigInt, USDC_DECIMALS));

      return { priceInUSD, priceBigInt };
    } catch (error) {
      console.error('Error calculating token price:', error);
      return { priceInUSD: 0, priceBigInt: 0n };
    }
  };

  // Get selected token details for decimals
  const selectedToken = useMemo(() => {
    return availableTokens.find(token => token.tokenAddress === values.tokenAddress);
  }, [availableTokens, values.tokenAddress]);

  const tokenDecimals = selectedToken?.decimals || 18;

  // Validation is now handled by the schema validation in useTokenSaleSchema.ts

  // Removed calculation logic - saleTokenSupply is now user input

  // Reactive price calculation when FDV or total supply changes
  useEffect(() => {
    const totalSupplyRaw = values.maxTokenSupply.bigintValue;
    const fdv = parseFloat(values.valuation) || 0;

    // Only calculate if we have both FDV and actual token total supply (no defaults)
    if (fdv > 0 && totalSupplyRaw && values.tokenAddress) {
      const { priceInUSD, priceBigInt } = calculateTokenPriceLocal(
        fdv,
        totalSupplyRaw.toString(),
        tokenDecimals,
      );

      // Only update if we got a valid price calculation
      if (priceInUSD > 0 && priceBigInt > 0n) {
        setFieldValue('saleTokenPrice', {
          value: priceInUSD.toFixed(8),
          bigintValue: priceBigInt,
        });
      } else {
        // Clear the price if calculation resulted in zero
        setFieldValue('saleTokenPrice', {
          value: '',
          bigintValue: undefined,
        });
      }
    } else {
      // Clear the price if conditions aren't met
      setFieldValue('saleTokenPrice', {
        value: '',
        bigintValue: undefined,
      });
    }
  }, [
    values.valuation,
    values.maxTokenSupply.bigintValue,
    values.tokenAddress,
    tokenDecimals,
    setFieldValue,
  ]);

  // Handle token selection
  const handleTokenSelect = (item: any) => {
    const tokenToSelect = availableTokens.find(token => token.tokenAddress === item.value);
    if (tokenToSelect) {
      setFieldValue('tokenAddress', tokenToSelect.tokenAddress);
      setFieldValue('tokenName', tokenToSelect.name);
      setFieldValue('tokenSymbol', tokenToSelect.symbol);

      // Clear sale token supply - user will input this manually
      setFieldValue('saleTokenSupply', { value: '', bigintValue: undefined });

      // Store the total supply for price calculation (but don't display it)
      if (tokenToSelect.totalSupply) {
        const selectedTokenDecimals = tokenToSelect.decimals || 18;
        const rawSupply = BigInt(tokenToSelect.totalSupply);
        const humanReadableSupply = formatUnits(rawSupply, selectedTokenDecimals);

        setFieldValue('maxTokenSupply', {
          value: humanReadableSupply,
          bigintValue: rawSupply,
        });

        // Recalculate price with the selected token's actual total supply (using raw units for calculation)
        const fdvValue = parseFloat(values.valuation) || 0;
        if (fdvValue > 0) {
          const { priceInUSD, priceBigInt } = calculateTokenPriceLocal(
            fdvValue,
            tokenToSelect.totalSupply, // Still use raw units for price calculation
            selectedTokenDecimals,
          );

          // Only update if we got a valid price calculation
          if (priceInUSD > 0 && priceBigInt > 0n) {
            setFieldValue('saleTokenPrice', {
              value: priceInUSD.toFixed(8),
              bigintValue: priceBigInt,
            });
          }
        }
      } else {
        // Clear the total supply if token doesn't have it
        setFieldValue('maxTokenSupply', {
          value: '',
          bigintValue: undefined,
        });
        // Clear the calculated price as well
        setFieldValue('saleTokenPrice', {
          value: '',
          bigintValue: undefined,
        });
        // Clear sale token supply as well
        setFieldValue('saleTokenSupply', {
          value: '',
          bigintValue: undefined,
        });
      }
    }
  };

  return (
    <VStack align="stretch">
      {/* Token Details Section */}
      <ContentBoxTight>
        <LabelComponent
          label={t('saleNameLabel')}
          isRequired={true}
          errorMessage={touched.saleName && errors.saleName ? errors.saleName : undefined}
          gridContainerProps={{
            templateColumns: '1fr',
            mb: '1rem',
          }}
        >
          <Input
            placeholder={t('saleNamePlaceholder')}
            value={values.saleName}
            onChange={e => setFieldValue('saleName', e.target.value)}
            isInvalid={touched.saleName && !!errors.saleName}
          />
        </LabelComponent>

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
        >
          <LabelComponent
            label={t('saleTokenLabel')}
            helper={t('saleTokenHelperText')}
            isRequired={true}
            errorMessage={
              touched.tokenAddress && errors.tokenAddress ? errors.tokenAddress : undefined
            }
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <DropdownMenu
              items={tokenDropdownItems}
              selectedItem={tokenDropdownItems.find(item => item.selected)}
              onSelect={handleTokenSelect}
              selectPlaceholder={t('selectTokenPlaceholder')}
              emptyMessage={t('noTokensAvailable')}
              variant="bordered"
              renderItem={item => (
                <Flex
                  alignItems="center"
                  gap="1rem"
                  w="full"
                >
                  {item.icon && (
                    <Image
                      src={item.icon}
                      fallbackSrc="/images/coin-icon-default.svg"
                      boxSize="2rem"
                    />
                  )}
                  <Flex
                    flexDirection="column"
                    alignItems="flex-start"
                    flex="1"
                  >
                    <Text
                      textStyle="text-sm-medium"
                      color="color-white"
                    >
                      {item.name}
                    </Text>
                    <Text
                      textStyle="text-xs-regular"
                      color="color-neutral-300"
                    >
                      {item.symbol} • {t('balanceLabel')}{' '}
                      {parseFloat(item.balanceFormatted).toFixed(4)}
                    </Text>
                  </Flex>
                </Flex>
              )}
            />
          </LabelComponent>
        </Grid>

        <LabelComponent
          label={t('reservedForSaleLabel')}
          helper={t('reservedForSaleHelperText')}
          isRequired={true}
          errorMessage={
            touched.saleTokenSupply && errors.saleTokenSupply
              ? (errors.saleTokenSupply as string)
              : undefined
          }
          gridContainerProps={{
            templateColumns: '1fr',
          }}
        >
          <BigIntInput
            placeholder={t('enterTokenAmount')}
            value={values.saleTokenSupply}
            onChange={value => setFieldValue('saleTokenSupply', value)}
            decimals={tokenDecimals}
            maxValue={
              selectedToken
                ? calculateMaxNetTokensForSale(BigInt(selectedToken.balance))
                : undefined
            }
            isDisabled={
              !values.tokenAddress || !selectedToken?.balance || selectedToken?.balance === '0'
            }
            isInvalid={touched.saleTokenSupply && !!errors.saleTokenSupply}
          />
        </LabelComponent>

        <LabelComponent
          label={t('valuationLabel')}
          helper={t('valuationHelperText')}
          isRequired={true}
          errorMessage={touched.valuation && errors.valuation ? errors.valuation : undefined}
          gridContainerProps={{
            templateColumns: '1fr',
          }}
        >
          <NumberInputWithAddon
            value={values.valuation}
            onChange={val => {
              setFieldValue('valuation', val);
              // Price calculation will be handled by useEffect
            }}
            min={0}
            precision={2}
            step={0.01}
            placeholder={t('valuationPlaceholder')}
            leftAddon={<Text color="color-content-muted-foreground">$</Text>}
          />
        </LabelComponent>

        <LabelComponent
          label={t('minimumFundraiseLabel')}
          helper={t('minimumFundraiseHelperText')}
          isRequired={false}
          errorMessage={
            touched.minimumFundraise && errors.minimumFundraise
              ? errors.minimumFundraise
              : undefined
          }
          gridContainerProps={{
            templateColumns: '1fr',
          }}
        >
          <NumberInputWithAddon
            value={values.minimumFundraise}
            onChange={val => setFieldValue('minimumFundraise', val)}
            min={0}
            precision={2}
            step={0.01}
            placeholder={t('minimumFundraisePlaceholder')}
            leftAddon={<Text color="color-content-muted-foreground">$</Text>}
          />
        </LabelComponent>

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
          mb="1rem"
        >
          <VStack
            align="stretch"
            spacing={4}
          >
            <LabelComponent
              label={t('saleStartDateLabel')}
              isRequired={true}
              errorMessage={touched.startDate && errors.startDate ? errors.startDate : undefined}
              gridContainerProps={{
                templateColumns: '1fr',
              }}
            >
              <DatePicker
                selectedDate={values.startDate ? new Date(values.startDate) : undefined}
                onChange={date => setFieldValue('startDate', date ? date.toISOString() : '')}
                minDate={(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return tomorrow;
                })()}
              />
            </LabelComponent>
            <LabelComponent
              label={t('startTimeLabel')}
              isRequired={true}
              errorMessage={touched.startTime && errors.startTime ? errors.startTime : undefined}
              gridContainerProps={{
                templateColumns: '1fr',
              }}
            >
              <TimeInput
                value={values.startTime}
                onChange={time => setFieldValue('startTime', time)}
              />
            </LabelComponent>
          </VStack>

          <VStack
            align="stretch"
            spacing={4}
          >
            <LabelComponent
              label={t('saleEndDateLabel')}
              isRequired={true}
              errorMessage={touched.endDate && errors.endDate ? errors.endDate : undefined}
              gridContainerProps={{
                templateColumns: '1fr',
              }}
            >
              <DatePicker
                selectedDate={values.endDate ? new Date(values.endDate) : undefined}
                onChange={date => setFieldValue('endDate', date ? date.toISOString() : '')}
                minDate={values.startDate ? new Date(values.startDate) : new Date()}
              />
            </LabelComponent>
            <LabelComponent
              label={t('endTimeLabel')}
              isRequired={true}
              errorMessage={touched.endTime && errors.endTime ? errors.endTime : undefined}
              gridContainerProps={{
                templateColumns: '1fr',
              }}
            >
              <TimeInput
                value={values.endTime}
                onChange={time => setFieldValue('endTime', time)}
              />
            </LabelComponent>
          </VStack>
        </Grid>

        {/* Timezone Note */}
        <Text
          textStyle="text-xs-regular"
          color="color-neutral-400"
          mb="1rem"
        >
          {t('timezoneNote', { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
        </Text>

        <LabelComponent
          label={t('acceptedPaymentTokenLabel')}
          isRequired={true}
          gridContainerProps={{
            templateColumns: '1fr',
          }}
        >
          <Flex
            alignItems="center"
            gap={2}
            px={1}
            py={1}
            border="1px solid"
            borderColor="color-neutral-600"
            borderRadius="md"
            bg="color-neutral-800"
            w="fit-content"
          >
            <Image
              src="/images/coin-icon-usdc.svg"
              alt="USDC"
              boxSize="1rem"
            />
            <Text
              textStyle="text-xs-medium"
              color="color-white"
            >
              USDC
            </Text>
          </Flex>
        </LabelComponent>

        {/* Dev Mode: Commitment Token Address Override */}
        {devFeatureEnabled && (
          <LabelComponent
            label="Commitment Token Address (Dev)"
            helper="Override the default USDC commitment token address"
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <Input
              placeholder="0x..."
              value={values.commitmentToken || ''}
              onChange={e => {
                const address = e.target.value.trim();
                setFieldValue('commitmentToken', address || null);
              }}
              isInvalid={!!(values.commitmentToken && !isAddress(values.commitmentToken))}
              bg="color-neutral-900"
              borderColor="color-warning-400"
              _focus={{ borderColor: 'color-warning-400' }}
            />
          </LabelComponent>
        )}

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
        >
          <LabelComponent
            label={t('minimumPurchaseLabel')}
            subLabel={t('minimumPurchaseSubLabel')}
            isRequired={false}
            errorMessage={
              touched.minPurchase && errors.minPurchase ? errors.minPurchase : undefined
            }
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInputWithAddon
              value={values.minPurchase}
              onChange={val => setFieldValue('minPurchase', val)}
              min={0}
              precision={2}
              step={0.01}
              placeholder={t('minimumPurchasePlaceholder')}
              leftAddon={<Text color="color-content-muted-foreground">$</Text>}
              rightAddon={<Text>{t('minimumPurchaseSuffix')}</Text>}
            />
          </LabelComponent>

          <LabelComponent
            isRequired={false}
            label={t('maximumPurchaseLabel')}
            errorMessage={
              touched.maxPurchase && errors.maxPurchase ? errors.maxPurchase : undefined
            }
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInputWithAddon
              value={values.maxPurchase}
              onChange={val => setFieldValue('maxPurchase', val)}
              min={0}
              precision={2}
              step={0.01}
              placeholder={t('maximumPurchasePlaceholder')}
              leftAddon={<Text color="color-content-muted-foreground">$</Text>}
              rightAddon={<Text>{t('maximumPurchaseSuffix')}</Text>}
            />
          </LabelComponent>
        </Grid>
      </ContentBoxTight>
    </VStack>
  );
}
