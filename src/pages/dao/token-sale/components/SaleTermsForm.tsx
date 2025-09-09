import { NumberInput, NumberInputField, VStack } from '@chakra-ui/react';
import { ContentBoxTight } from '../../../../components/ui/containers/ContentBox';
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
    <VStack align="stretch">
      <ContentBoxTight>
        <SectionHeader
          title="Sale Terms"
          description="Configure the timing, pricing, and payment options for your token sale."
        />

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

        <LabelComponent
          label="Sale End Date"
          isRequired={true}
          gridContainerProps={{
            templateColumns: '1fr',
          }}
        >
          <DatePicker
            selectedDate={values.endDate || undefined}
            onChange={date => setFieldValue('endDate', date)}
            minDate={values.startDate || new Date()}
          />
        </LabelComponent>

        <LabelComponent
          label="Total Supply"
          isRequired={true}
          gridContainerProps={{
            templateColumns: '1fr',
          }}
        >
          <NumberInput
            value={values.totalSupply}
            onChange={val => setFieldValue('totalSupply', val)}
            min={0}
          >
            <NumberInputField placeholder="Enter total supply" />
          </NumberInput>
        </LabelComponent>

        <LabelComponent
          label="Sale Price"
          isRequired={true}
          gridContainerProps={{
            templateColumns: '1fr',
          }}
        >
          <NumberInput
            value={values.salePrice}
            onChange={val => setFieldValue('salePrice', val)}
            min={0}
          >
            <NumberInputField placeholder="Enter price per token" />
          </NumberInput>
        </LabelComponent>

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
      </ContentBoxTight>
    </VStack>
  );
}
