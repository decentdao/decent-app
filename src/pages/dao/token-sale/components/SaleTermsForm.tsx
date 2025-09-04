import { Input, VStack, Grid, Text, NumberInput, NumberInputField, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { ContentBoxTight } from '../../../../components/ui/containers/ContentBox';
import { BigIntInput } from '../../../../components/ui/forms/BigIntInput';
import { DatePicker } from '../../../../components/ui/forms/DatePicker';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { SectionHeader } from '../../../../components/ui/forms/SectionHeader';
import { AssetSelector } from '../../../../components/ui/utils/AssetSelector';
import { TokenSaleFormValues } from '../types';

interface SaleTermsFormProps {
  values: TokenSaleFormValues;
  setFieldValue: (field: string, value: any) => void;
}

export function SaleTermsForm({ values, setFieldValue }: SaleTermsFormProps) {
  return (
    <VStack
      align="stretch"
      spacing={6}
    >
      {/* Token Details Section */}
      <ContentBoxTight>
        <SectionHeader
          title="Token Details"
          description="Configure your token name, ticker, and supply."
        />

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
        >
          <LabelComponent
            label="Token Name"
            isRequired={true}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <Input
              placeholder="e.g. Decent"
              value={values.tokenName}
              onChange={e => setFieldValue('tokenName', e.target.value)}
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
              onChange={e => setFieldValue('tokenSymbol', e.target.value)}
            />
          </LabelComponent>
        </Grid>

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
        >
          <LabelComponent
            label="Max Token Supply"
            isRequired={true}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <BigIntInput
              value={values.maxTokenSupply.bigintValue}
              onChange={valuePair => setFieldValue('maxTokenSupply', valuePair)}
              parentFormikValue={values.maxTokenSupply}
              placeholder="1000000000"
              decimalPlaces={0}
            />
          </LabelComponent>

          <LabelComponent
            label="Token Price"
            isRequired={true}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInput
              value={values.tokenPrice}
              onChange={val => setFieldValue('tokenPrice', parseFloat(val) || 0)}
              min={0}
            >
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Text color="gray.500">$</Text>
                </InputLeftElement>
                <NumberInputField placeholder="100" paddingLeft="2rem" />
              </InputGroup>
            </NumberInput>
          </LabelComponent>
        </Grid>
      </ContentBoxTight>

      {/* Sale Pricing & Terms Section */}
      <ContentBoxTight>
        <SectionHeader
          title="Sale Pricing & Terms"
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
            <NumberInput
              value={values.minimumFundraise}
              onChange={val => setFieldValue('minimumFundraise', parseFloat(val) || 0)}
              min={0}
            >
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Text color="gray.500">$</Text>
                </InputLeftElement>
                <NumberInputField placeholder="500,000" paddingLeft="2rem" />
              </InputGroup>
            </NumberInput>
          </LabelComponent>

          <LabelComponent
            label="Fundraising Cap"
            isRequired={true}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInput
              value={values.fundraisingCap}
              onChange={val => setFieldValue('fundraisingCap', parseFloat(val) || 0)}
              min={0}
            >
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Text color="gray.500">$</Text>
                </InputLeftElement>
                <NumberInputField placeholder="10,000,000" paddingLeft="2rem" />
              </InputGroup>
            </NumberInput>
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
            <NumberInput
              value={values.valuation}
              onChange={val => setFieldValue('valuation', parseFloat(val) || 0)}
              min={0}
            >
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Text color="gray.500">$</Text>
                </InputLeftElement>
                <NumberInputField placeholder="5,000,000" paddingLeft="2rem" />
              </InputGroup>
            </NumberInput>
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
            onSelect={addresses => setFieldValue('acceptedToken', addresses)}
          />
        </LabelComponent>

        <Grid
          templateColumns="1fr 1fr"
          gap={4}
        >
          <LabelComponent
            label="Minimum Purchase (USD)"
            helper="Leave blank for no purchase limits"
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInput
              value={values.minPurchase}
              onChange={val => setFieldValue('minPurchase', parseFloat(val) || 0)}
              min={0}
            >
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Text color="gray.500">$</Text>
                </InputLeftElement>
                <NumberInputField placeholder="100" paddingLeft="2rem" />
              </InputGroup>
            </NumberInput>
            <Text
              fontSize="sm"
              color="gray.500"
              mt={1}
            >
              min
            </Text>
          </LabelComponent>

          <LabelComponent
            isRequired={false}
            label="Maximum Purchase (USD)"
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <NumberInput
              value={values.maxPurchase}
              onChange={val => setFieldValue('maxPurchase', parseFloat(val) || 0)}
              min={0}
            >
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Text color="gray.500">$</Text>
                </InputLeftElement>
                <NumberInputField placeholder="10,000" paddingLeft="2rem" />
              </InputGroup>
            </NumberInput>
            <Text
              fontSize="sm"
              color="gray.500"
              mt={1}
            >
              max
            </Text>
          </LabelComponent>
        </Grid>
      </ContentBoxTight>
    </VStack>
  );
}
