import {
  VStack,
  HStack,
  Text,
  Box,
  Select,
  useDisclosure,
} from '@chakra-ui/react';
import { useState } from 'react';
import { ContentBoxTight } from '../../../../components/ui/containers/ContentBox';
import { LabelComponent } from '../../../../components/ui/forms/InputComponent';
import { TokenSaleFormValues } from '../types';
import { AddRequirementModal } from './buyer-requirements/AddRequirementModal';
import { KycKybRequirement } from './buyer-requirements/KycKybRequirement';
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

            {/* Requirements Footer */}
            <HStack
              spacing={2}
              justify="center"
            >
              <Text
                color="color-white"
                fontSize="sm"
              >
                Should meet
              </Text>
              <Select
                value={requirementMode}
                onChange={e => setRequirementMode(e.target.value as 'all' | 'any')}
                size="sm"
                w="auto"
                minW="80px"
                bg="color-neutral-900"
                border="1px solid"
                borderColor="color-neutral-800"
                color="color-neutral-400"
                fontSize="sm"
                isDisabled={requirements.length === 0}
                opacity={requirements.length === 0 ? 0.5 : 1}
              >
                <option value="all">All</option>
                <option value="any">Any</option>
              </Select>
              <Text
                color="color-white"
                fontSize="sm"
              >
                requirements out of {Math.max(1, requirements.length)}
              </Text>
            </HStack>
        </VStack>

        <AddRequirementModal isOpen={isOpen} onClose={onClose} onAddRequirement={handleAddRequirement} />
      </VStack>
    </ContentBoxTight>
  );
}
