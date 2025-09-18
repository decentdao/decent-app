import { Input, VStack, Grid, Text, Image, Flex } from '@chakra-ui/react';
import { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatUnits, parseUnits } from 'viem';
import { ContentBoxTight } from '../../../../components/ui/containers/ContentBox';
import { DatePicker } from '../../../../components/ui/forms/DatePicker';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { NumberInputWithAddon } from '../../../../components/ui/forms/InputWithAddon';
import { SectionHeader } from '../../../../components/ui/forms/SectionHeader';
import { DropdownMenu } from '../../../../components/ui/menus/DropdownMenu';
import { AssetSelector } from '../../../../components/ui/utils/AssetSelector';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { TokenSaleFormValues } from '../../../../types/tokenSale';

interface SaleTermsFormProps {
  values: TokenSaleFormValues;
  setFieldValue: (field: string, value: any) => void;
}

export function SaleTermsForm({ values, setFieldValue }: SaleTermsFormProps) {
  const { t } = useTranslation('tokenSale');
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

  // Default total supply constant (1 billion tokens)
  const DEFAULT_TOTAL_SUPPLY = '1000000000';

  // Calculate token price based on FDV and total supply
  const calculateTokenPrice = (fdv: number, totalSupply: string, tokenDecimals: number = 18) => {
    if (!fdv || !totalSupply || fdv <= 0 || parseFloat(totalSupply) <= 0) {
      return 0;
    }
    
    try {
      // Convert total supply to proper decimal format
      const totalSupplyBigInt = parseUnits(totalSupply, tokenDecimals);
      const fdvBigInt = parseUnits(fdv.toString(), 6); // Assuming USD has 6 decimals (like USDC)
      
      // Price = FDV / Total Supply
      const priceBigInt = (fdvBigInt * BigInt(10 ** tokenDecimals)) / totalSupplyBigInt;
      
      // Convert back to human readable format
      return parseFloat(formatUnits(priceBigInt, 6)); // Price in USD with 6 decimals
    } catch (error) {
      console.error('Error calculating token price:', error);
      return 0;
    }
  };

  // Get selected token details for decimals
  const selectedToken = useMemo(() => {
    return availableTokens.find(token => token.tokenAddress === values.tokenAddress);
  }, [availableTokens, values.tokenAddress]);

  const tokenDecimals = selectedToken?.decimals || 18;

  // Reactive price calculation when FDV or total supply changes
  useEffect(() => {
    const totalSupply = values.maxTokenSupply.value || DEFAULT_TOTAL_SUPPLY;
    const fdv = values.valuation;
    
    if (fdv > 0 && totalSupply) {
      const calculatedPrice = calculateTokenPrice(fdv, totalSupply, tokenDecimals);
      
      // Update saleTokenPrice BigIntValuePair for contract interaction
      const priceBigInt = parseUnits(calculatedPrice.toString(), 6); // USDC has 6 decimals
      setFieldValue('saleTokenPrice', {
        value: calculatedPrice.toFixed(6),
        bigintValue: priceBigInt,
      });
    }
  }, [values.valuation, values.maxTokenSupply.value, tokenDecimals, setFieldValue]);

  // Handle token selection
  const handleTokenSelect = (item: any) => {
    const tokenToSelect = availableTokens.find(token => token.tokenAddress === item.value);
    if (tokenToSelect) {
      setFieldValue('tokenAddress', tokenToSelect.tokenAddress);
      setFieldValue('tokenName', tokenToSelect.name);
      setFieldValue('tokenSymbol', tokenToSelect.symbol);
      
      // Use actual total supply or default to 1 billion
      const totalSupply = tokenToSelect.totalSupply || DEFAULT_TOTAL_SUPPLY;
      setFieldValue('maxTokenSupply', {
        value: totalSupply,
        bigintValue: BigInt(totalSupply),
      });
      
      // Recalculate price with new token's total supply
      if (values.valuation > 0) {
        const calculatedPrice = calculateTokenPrice(values.valuation, totalSupply, tokenToSelect.decimals || 18);
        
        const priceBigInt = parseUnits(calculatedPrice.toString(), 6);
        setFieldValue('saleTokenPrice', {
          value: calculatedPrice.toFixed(6),
          bigintValue: priceBigInt,
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
          gridContainerProps={{
            templateColumns: '1fr',
            mb: '2rem',
          }}
        >
          <Input
            placeholder={t('saleNamePlaceholder')}
            value={values.saleName}
            onChange={e => setFieldValue('saleName', e.target.value)}
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
        >
          <LabelComponent
            label={t('saleTokenLabel')}
            isRequired={true}
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
                      {item.symbol} • Balance: {parseFloat(item.balanceFormatted).toFixed(4)}
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
            label={t('maxTokenSupplyLabel')}
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <Input
              value={
                values.maxTokenSupply.value 
                  ? `${parseFloat(values.maxTokenSupply.value).toLocaleString()} tokens`
                  : `${parseFloat(DEFAULT_TOTAL_SUPPLY).toLocaleString()} tokens (default)`
              }
              isDisabled={true}
              bg="color-neutral-900"
              opacity={0.5}
              placeholder={t('maxTokenSupplyPlaceholder')}
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
              value={parseFloat(values.saleTokenPrice.value || '0')}
              onChange={() => {}} // No-op since it's calculated automatically
              min={0}
              precision={6}
              step={0.000001}
              placeholder={values.valuation > 0 ? 'Calculated from FDV' : 'Enter FDV to calculate'}
              leftAddon={<Text color="gray.500">$</Text>}
              isDisabled={true}
              bg="color-neutral-900"
              opacity={0.5}
            />
          </LabelComponent>
        </Grid>
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
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInputWithAddon
              value={values.minimumFundraise}
              onChange={val => setFieldValue('minimumFundraise', parseFloat(val) || 0)}
              min={0}
              precision={2}
              step={0.01}
              placeholder={t('minimumFundraisePlaceholder')}
              leftAddon={<Text color="gray.500">$</Text>}
            />
          </LabelComponent>

          <LabelComponent
            label={t('fundraisingCapLabel')}
            isRequired={true}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInputWithAddon
              value={values.fundraisingCap}
              onChange={val => setFieldValue('fundraisingCap', parseFloat(val) || 0)}
              min={0}
              precision={2}
              step={0.01}
              placeholder={t('fundraisingCapPlaceholder')}
              leftAddon={<Text color="gray.500">$</Text>}
            />
          </LabelComponent>
        </Grid>

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
        >
          <LabelComponent
            label={t('valuationLabel') + ' (FDV)'}
            isRequired={true}
            gridContainerProps={{
              templateColumns: '1fr',
              templateRows: '1fr',
            }}
          >
            <NumberInputWithAddon
              value={values.valuation}
              onChange={val => {
                const fdvValue = parseFloat(val) || 0;
                setFieldValue('valuation', fdvValue);
                // Price calculation will be handled by useEffect
              }}
              min={0}
              precision={2}
              step={0.01}
              placeholder={t('valuationPlaceholder')}
              leftAddon={<Text color="gray.500">$</Text>}
            />
          </LabelComponent>

          <LabelComponent
            label={t('saleStartDateLabel')}
            isRequired={true}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <DatePicker
              selectedDate={values.startDate || undefined}
              onChange={date => setFieldValue('startDate', date)}
              minDate={new Date()}
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
          <AssetSelector
            includeNativeToken={true}
            canSelectMultiple={true}
            onSelect={addresses => setFieldValue('acceptedToken', addresses)}
          />
        </LabelComponent>

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
        >
          <LabelComponent
            label={t('minimumPurchaseLabel')}
            subLabel={t('minimumPurchaseSubLabel')}
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInputWithAddon
              value={values.minPurchase}
              onChange={val => setFieldValue('minPurchase', parseFloat(val) || 0)}
              min={0}
              precision={2}
              step={0.01}
              placeholder={t('minimumPurchasePlaceholder')}
              leftAddon={<Text color="gray.500">$</Text>}
              rightAddon={<Text>{t('minimumPurchaseSuffix')}</Text>}
            />
          </LabelComponent>

          <LabelComponent
            isRequired={false}
            label={t('maximumPurchaseLabel')}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInputWithAddon
              value={values.maxPurchase}
              onChange={val => setFieldValue('maxPurchase', parseFloat(val) || 0)}
              min={0}
              precision={2}
              step={0.01}
              placeholder={t('maximumPurchasePlaceholder')}
              leftAddon={<Text color="gray.500">$</Text>}
              rightAddon={<Text>{t('maximumPurchaseSuffix')}</Text>}
            />
          </LabelComponent>
        </Grid>
      </ContentBoxTight>
    </VStack>
  );
}
