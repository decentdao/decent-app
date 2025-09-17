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

  const handleAddRequirement = (type: 'token' | 'nft' | 'whitelist') => {
    // Create a placeholder requirement - this will be enhanced when forms are added
    let newRequirement: BuyerRequirement;

    switch (type) {
      case 'token':
        newRequirement = {
          type: 'token',
          tokenAddress: '0x' as any, // Placeholder
          minimumBalance: BigInt(0),
        };
        break;
      case 'nft':
        newRequirement = {
          type: 'nft',
          contractAddress: '0x' as any, // Placeholder
          tokenStandard: 'ERC721',
          minimumBalance: BigInt(1),
        };
        break;
      case 'whitelist':
        newRequirement = {
          type: 'whitelist',
          name: 'New Whitelist',
          addresses: [],
        };
        break;
    }

    const updatedRequirements = [...values.buyerRequirements, newRequirement];
    setFieldValue('buyerRequirements', updatedRequirements);
    onClose();
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
