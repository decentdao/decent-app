import { VStack, Box, useDisclosure } from '@chakra-ui/react';
import { useState } from 'react';
import { ContentBoxTight } from '../../../../components/ui/containers/ContentBox';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { TokenSaleFormValues } from '../types';
import { AddRequirementModal } from './buyer-requirements/AddRequirementModal';
import { KycKybRequirement } from './buyer-requirements/KycKybRequirement';
import { RequirementsFooter } from './buyer-requirements/RequirementsFooter';
import { RequirementsList } from './buyer-requirements/RequirementsList';
import { BuyerRequirement } from './buyer-requirements/types';


interface BuyerRequirementsFormProps {
  values: TokenSaleFormValues;
  setFieldValue: (field: string, value: any) => void;
}

export function BuyerRequirementsForm({}: BuyerRequirementsFormProps) {
  const [requireKYC, setRequireKYC] = useState(false);
  const [requirements, setRequirements] = useState<BuyerRequirement[]>([]);
  const [requirementMode, setRequirementMode] = useState<'all' | 'any'>('all');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleAddRequirement = (type: 'token' | 'nft' | 'whitelist') => {
    const newRequirement: BuyerRequirement = {
      id: Date.now().toString(),
      type,
      name: type === 'token' ? 'Token' : type === 'nft' ? 'NFT' : 'Whitelist',
      description:
        type === 'token'
          ? 'Set an ERC-20 threshold'
          : type === 'nft'
            ? 'Set an ERC-721 or ERC-1155 threshold'
            : 'Specify a list of addresses',
    };
    setRequirements([...requirements, newRequirement]);
    onClose();
  };


  return (
    <ContentBoxTight>
      <VStack
        spacing={8}
        align="stretch"
      >
        <KycKybRequirement requireKYC={requireKYC} setRequireKYC={setRequireKYC} />

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

          <RequirementsList requirements={requirements} onOpen={onOpen} />

          <RequirementsFooter
            requirementMode={requirementMode}
            setRequirementMode={setRequirementMode}
            requirementsCount={requirements.length}
          />
        </VStack>

        <AddRequirementModal isOpen={isOpen} onClose={onClose} onAddRequirement={handleAddRequirement} />
      </VStack>
    </ContentBoxTight>
  );
}
