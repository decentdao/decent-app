import { Input, VStack, Grid, Text, Image, Flex } from '@chakra-ui/react';
import { useMemo } from 'react';
import { ContentBoxTight } from '../../../../components/ui/containers/ContentBox';
import { DatePicker } from '../../../../components/ui/forms/DatePicker';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { NumberInputWithAddon } from '../../../../components/ui/forms/InputWithAddon';
import { SectionHeader } from '../../../../components/ui/forms/SectionHeader';
import { DropdownMenu } from '../../../../components/ui/menus/DropdownMenu';
import { AssetSelector } from '../../../../components/ui/utils/AssetSelector';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { TokenSaleFormValues } from '../types';

interface SaleTermsFormProps {
  values: TokenSaleFormValues;
  setFieldValue: (field: string, value: any) => void;
}

export function SaleTermsForm({ values, setFieldValue }: SaleTermsFormProps) {
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
      selected: values.selectedToken?.tokenAddress === token.tokenAddress,
      ...token, // Include all token properties
    }));
  }, [availableTokens, values.selectedToken]);

  // Handle token selection
  const handleTokenSelect = (item: any) => {
    const selectedToken = availableTokens.find(token => token.tokenAddress === item.value);
    if (selectedToken) {
      setFieldValue('selectedToken', selectedToken);
      setFieldValue('tokenName', selectedToken.name);
      setFieldValue('tokenSymbol', selectedToken.symbol);
      setFieldValue('maxTokenSupply', {
        value: selectedToken.totalSupply || '0',
        bigintValue: selectedToken.totalSupply ? BigInt(selectedToken.totalSupply) : BigInt(0),
      });
      // Calculate token price based on USD value if available
      if (selectedToken.usdPrice) {
        // TODO this needs to be calculated based on PRD
        setFieldValue('tokenPrice', selectedToken.usdPrice);
      }
    }
  };

  return (
    <VStack align="stretch">
      {/* Token Details Section */}
      <ContentBoxTight>
        <LabelComponent
          label="Sale Name"
          isRequired={true}
          gridContainerProps={{
            templateColumns: '1fr',
            mb: '2rem',
          }}
        >
          <Input
            placeholder="e.g. Series A"
            value={values.saleName}
            onChange={e => setFieldValue('saleName', e.target.value)}
          />
        </LabelComponent>

        <SectionHeader
          title="Token Details"
          description="Configure your token name, ticker, and supply."
          tooltip="Lorem Ipsum"
        />

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
        >
          <LabelComponent
            label="Sale Token"
            isRequired={true}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <DropdownMenu
              items={tokenDropdownItems}
              selectedItem={tokenDropdownItems.find(item => item.selected)}
              onSelect={handleTokenSelect}
              selectPlaceholder="Select Token"
              emptyMessage="No tokens available in treasury"
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
            label="Token Symbol"
            isRequired={true}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <Input
              placeholder="e.g. DCNT"
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
            label="Max Token Supply"
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <Input
              value={values.maxTokenSupply.value || 'Select a token first'}
              isDisabled={true}
              bg="color-neutral-900"
              opacity={0.5}
              placeholder="Token supply will be set when token is selected"
            />
          </LabelComponent>

          <LabelComponent
            label="Token Price"
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInputWithAddon
              value={values.tokenPrice}
              onChange={() => {}} // No-op since it's disabled
              min={0}
              precision={2}
              step={0.01}
              placeholder="1.00"
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
          title="Sale Pricing & Terms"
          tooltip="Lorem Ipsum"
          description="Configure your token price, fundraising cap, sale dates, and purchase limits."
        />

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
        >
          <LabelComponent
            label="Minimum Fundraise"
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
              placeholder="500,000"
              leftAddon={<Text color="gray.500">$</Text>}
            />
          </LabelComponent>

          <LabelComponent
            label="Fundraising Cap"
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
              placeholder="10,000,000"
              leftAddon={<Text color="gray.500">$</Text>}
            />
          </LabelComponent>
        </Grid>

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
        >
          <LabelComponent
            label="Valuation"
            isRequired={true}
            gridContainerProps={{
              templateColumns: '1fr',
              templateRows: '1fr',
            }}
          >
            <NumberInputWithAddon
              value={values.valuation}
              onChange={val => setFieldValue('valuation', parseFloat(val) || 0)}
              min={0}
              precision={2}
              step={0.01}
              placeholder="5,000,000"
              leftAddon={<Text color="gray.500">$</Text>}
            />
          </LabelComponent>

          <LabelComponent
            label="Sale Start Date"
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
          label="Accepted Payment Token"
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
            label="Minimum Purchase (USD)"
            subLabel="Leave blank for no purchase limits"
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
              placeholder="100"
              leftAddon={<Text color="gray.500">$</Text>}
              rightAddon={<Text>min</Text>}
            />
          </LabelComponent>

          <LabelComponent
            isRequired={false}
            label="Maximum Purchase (USD)"
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
              placeholder="10,000"
              leftAddon={<Text color="gray.500">$</Text>}
              rightAddon={<Text>max</Text>}
            />
          </LabelComponent>
        </Grid>
      </ContentBoxTight>
    </VStack>
  );
}
