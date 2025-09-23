import { Input, VStack, Grid, Text, Image, Flex } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatUnits, isAddress, parseUnits } from 'viem';
import { ContentBoxTight } from '../../../../components/ui/containers/ContentBox';
import { DatePicker } from '../../../../components/ui/forms/DatePicker';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { NumberInputWithAddon } from '../../../../components/ui/forms/InputWithAddon';
import { SectionHeader } from '../../../../components/ui/forms/SectionHeader';
import { DropdownMenu } from '../../../../components/ui/menus/DropdownMenu';
import { USDC_DECIMALS } from '../../../../constants/common';
import useFeatureFlag from '../../../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { TokenSaleFormValues } from '../../../../types/tokenSale';
import { calculateTokenPrice } from '../../../../utils/tokenSaleCalculations';

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

  // Validation effect for saleTokenSupply against treasury balance
  useEffect(() => {
    if (!selectedToken || !values.saleTokenSupply.bigintValue) {
      return;
    }

    const treasuryBalance = BigInt(selectedToken.balance);
    const reservedAmount = values.saleTokenSupply.bigintValue;

    // Check if reserved amount exceeds treasury balance
    if (reservedAmount > treasuryBalance) {
      const availableFormatted = parseFloat(
        formatUnits(treasuryBalance, tokenDecimals),
      ).toLocaleString();
      const requestedFormatted = parseFloat(
        formatUnits(reservedAmount, tokenDecimals),
      ).toLocaleString();

      console.warn(
        `Reserved amount (${requestedFormatted}) exceeds treasury balance (${availableFormatted})`,
      );
    }
  }, [selectedToken, values.saleTokenSupply.bigintValue, tokenDecimals]);

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
            mb: '2rem',
          }}
        >
          <Input
            placeholder={t('saleNamePlaceholder')}
            value={values.saleName}
            onChange={e => setFieldValue('saleName', e.target.value)}
            isInvalid={touched.saleName && !!errors.saleName}
          />
        </LabelComponent>

        <SectionHeader
          title={t('tokenDetailsTitle')}
          description={t('tokenDetailsDescription')}
          tooltip="Lorem Ipsum"
        />

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
          mb="1.25rem"
        >
          <LabelComponent
            label={t('saleTokenLabel')}
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

          <LabelComponent
            label={t('tokenSymbolLabel')}
            isRequired={true}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <Input
              placeholder={t('tokenSymbolPlaceholder')}
              value={values.tokenSymbol}
              isDisabled={true}
              bg="color-neutral-900"
              opacity={0.5}
            />
          </LabelComponent>
        </Grid>

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
        >
          <LabelComponent
            label={t('availableForSaleLabel')}
            helper={t('availableForSaleHelper')}
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <Input
              value={
                selectedToken
                  ? parseFloat(
                      formatUnits(BigInt(selectedToken.balance), selectedToken.decimals),
                    ).toLocaleString()
                  : ''
              }
              isDisabled={true}
              bg="color-neutral-900"
              opacity={0.5}
              placeholder={t('selectTokenFirst')}
            />
          </LabelComponent>

          <LabelComponent
            label={t('tokenPriceLabel')}
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInputWithAddon
              value={values.saleTokenPrice.value ? parseFloat(values.saleTokenPrice.value) : ''}
              onChange={() => {}} // No-op since it's calculated automatically
              min={0}
              placeholder={
                (parseFloat(values.valuation) || 0) > 0 && values.tokenAddress
                  ? t('calculatedFromFdv')
                  : t('enterFdvAndSelectToken')
              }
              leftAddon={<Text color="color-content-muted-foreground">$</Text>}
              isDisabled={true}
              bg="color-neutral-900"
              opacity={0.5}
            />
          </LabelComponent>
        </Grid>

        <LabelComponent
          label={t('reservedForSaleLabel')}
          helper={t('reservedForSaleHelper')}
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
          <Input
            placeholder={t('enterValuationAndFundraisingCap')}
            value={values.saleTokenSupply.value}
            onChange={e =>
              setFieldValue('saleTokenSupply', {
                value: e.target.value,
                bigintValue: e.target.value ? parseUnits(e.target.value, tokenDecimals) : undefined,
              })
            }
            isDisabled={
              !values.tokenAddress || !selectedToken?.balance || selectedToken?.balance === '0'
            }
          />
        </LabelComponent>

        <LabelComponent
          label={t('valuationLabel')}
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
      </ContentBoxTight>

      {/* Sale Pricing & Terms Section */}
      <ContentBoxTight>
        <SectionHeader
          title={t('salePricingTitle')}
          tooltip="Lorem Ipsum"
          description={t('salePricingDescription')}
        />

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
        >
          <LabelComponent
            label={t('minimumFundraiseLabel')}
            isRequired={true}
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

          <LabelComponent
            label={t('fundraisingCapLabel')}
            isRequired={true}
            errorMessage={
              touched.fundraisingCap && errors.fundraisingCap ? errors.fundraisingCap : undefined
            }
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInputWithAddon
              value={values.fundraisingCap}
              onChange={val => setFieldValue('fundraisingCap', val)}
              min={0}
              precision={2}
              step={0.01}
              placeholder={t('fundraisingCapPlaceholder')}
              leftAddon={<Text color="color-content-muted-foreground">$</Text>}
            />
          </LabelComponent>
        </Grid>

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
          mb="1.25rem"
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
              minDate={new Date()}
            />
          </LabelComponent>

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
        </Grid>

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
