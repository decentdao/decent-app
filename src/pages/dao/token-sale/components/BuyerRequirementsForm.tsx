import { VStack, Box, useDisclosure } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('tokenSale');
  const [requireKYC, setRequireKYC] = useState(false);
  const [requirementMode, setRequirementMode] = useState<'all' | 'any'>('all');
  const [editingRequirement, setEditingRequirement] = useState<{
    requirement: BuyerRequirement;
    index: number;
  } | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleAddRequirement = (requirement: BuyerRequirement) => {
    if (editingRequirement !== null) {
      // Update existing requirement
      const updatedRequirements = [...values.buyerRequirements];
      updatedRequirements[editingRequirement.index] = requirement;
      setFieldValue('buyerRequirements', updatedRequirements);
      setEditingRequirement(null);
    } else {
      // Add new requirement
      const updatedRequirements = [...values.buyerRequirements, requirement];
      setFieldValue('buyerRequirements', updatedRequirements);
    }
  };

  const handleEditRequirement = (requirement: BuyerRequirement, index: number) => {
    setEditingRequirement({ requirement, index });
    onOpen();
  };

  const handleRemoveRequirement = (index: number) => {
    const updatedRequirements = values.buyerRequirements.filter((_, i) => i !== index);
    setFieldValue('buyerRequirements', updatedRequirements);
  };

  const handleCloseModal = () => {
    setEditingRequirement(null);
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
            label={t('buyerRequirementsLabel')}
            helper={t('buyerRequirementsHelper')}
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
            onEditRequirement={handleEditRequirement}
            onRemoveRequirement={handleRemoveRequirement}
          />

          <RequirementsFooter
            requirementMode={requirementMode}
            setRequirementMode={setRequirementMode}
            requirementsCount={values.buyerRequirements.length}
          />
        </VStack>

        <AddRequirementModal
          isOpen={isOpen}
          onClose={handleCloseModal}
          onAddRequirement={handleAddRequirement}
          editingRequirement={editingRequirement?.requirement}
        />
      </VStack>
    </ContentBoxTight>
  );
}
