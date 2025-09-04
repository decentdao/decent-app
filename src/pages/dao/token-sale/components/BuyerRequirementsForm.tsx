import { NumberInput, NumberInputField, VStack } from '@chakra-ui/react';
import { InputComponent, LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { SectionHeader } from '../../../../components/ui/forms/SectionHeader';
import { TokenSaleFormValues } from '../types';

interface BuyerRequirementsFormProps {
  values: TokenSaleFormValues;
  setFieldValue: (field: string, value: any) => void;
}

export function BuyerRequirementsForm({ values, setFieldValue }: BuyerRequirementsFormProps) {
  return (
    <VStack spacing={8} align="stretch">
      <SectionHeader
        title="Buyer Requirements"
        description="Set purchase limits and optional verification requirements for your token sale."
      />
      
      <VStack spacing={6} align="stretch">
        <LabelComponent
          label="Minimum Purchase"
          isRequired={true}
        >
          <NumberInput
            value={values.minPurchase}
            onChange={(val) => setFieldValue('minPurchase', val)}
            min={0}
          >
            <NumberInputField placeholder="Enter minimum purchase amount" />
          </NumberInput>
        </LabelComponent>
        
        <LabelComponent
          label="Maximum Purchase"
          isRequired={true}
        >
          <NumberInput
            value={values.maxPurchase}
            onChange={(val) => setFieldValue('maxPurchase', val)}
            min={0}
          >
            <NumberInputField placeholder="Enter maximum purchase amount" />
          </NumberInput>
        </LabelComponent>
        
        <InputComponent
          label="Whitelist Address (Optional)"
          isRequired={false}
          value={values.whitelistAddress}
          onChange={(e) => setFieldValue('whitelistAddress', e.target.value)}
          testId="whitelist-address"
          placeholder="Enter whitelist contract address"
        />
        
        <InputComponent
          label="KYC Provider (Optional)"
          isRequired={false}
          value={values.kycProvider}
          onChange={(e) => setFieldValue('kycProvider', e.target.value)}
          testId="kyc-provider"
          placeholder="Enter KYC provider details"
        />
      </VStack>
    </VStack>
  );
}
