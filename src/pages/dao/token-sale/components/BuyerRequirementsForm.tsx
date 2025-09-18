import { VStack, Box, useDisclosure } from '@chakra-ui/react';
import { useState } from 'react';
import { ContentBoxTight } from '../../../../components/ui/containers/ContentBox';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { BuyerRequirement, TokenSaleFormValues } from '../../../../types/tokenSale';
import { AddRequirementModal } from './buyer-requirements/AddRequirementModal';
import { KycKybRequirement } from './buyer-requirements/KycKybRequirement';
import { RequirementsFooter } from './buyer-requirements/RequirementsFooter';
import { RequirementsList } from './buyer-requirements/RequirementsList';

interface BuyerRequirementsFormProps {
  values: TokenSaleFormValues;
  setFieldValue: (field: string, value: any) => void;
}

export function BuyerRequirementsForm({ values, setFieldValue }: BuyerRequirementsFormProps) {
  const [requireKYC, setRequireKYC] = useState(false);
  const [requirementMode, setRequirementMode] = useState<'all' | 'any'>('all');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleAddRequirement = (requirement: BuyerRequirement) => {
    const updatedRequirements = [...values.buyerRequirements, requirement];
    setFieldValue('buyerRequirements', updatedRequirements);
  };

  return (
    <ContentBoxTight>
      <VStack
        spacing={8}
        align="stretch"
      >
        <KycKybRequirement
          requireKYC={requireKYC}
          setRequireKYC={setRequireKYC}
        />

        {/* Buyer Requirements Section */}
        <VStack
          spacing={6}
          align="stretch"
        >
          <LabelComponent
            label="Buyer Requirements"
            helper="Curate your available buyers by setting up a whitelist, KYC/KYB, ERC-20, or ERC-721 eligibility requirements for your sale."
            isRequired={false}
            gridContainerProps={{
              templateColumns: '1fr',
            }}
          >
            <Box />
          </LabelComponent>

          <RequirementsList
            requirements={values.buyerRequirements}
            onAddRequirement={onOpen}
          />

          <RequirementsFooter
            requirementMode={requirementMode}
            setRequirementMode={setRequirementMode}
            requirementsCount={values.buyerRequirements.length}
          />
        </VStack>

        <AddRequirementModal
          isOpen={isOpen}
          onClose={onClose}
          onAddRequirement={handleAddRequirement}
        />
      </VStack>
    </ContentBoxTight>
  );
}
