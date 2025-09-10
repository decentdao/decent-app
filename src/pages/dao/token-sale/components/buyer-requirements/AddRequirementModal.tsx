import { VStack } from '@chakra-ui/react';
import { Coins, ImageSquare, ListChecks } from '@phosphor-icons/react';
import { ModalBase } from '../../../../../components/ui/modals/ModalBase';
import { RequirementOption } from './RequirementOption';

interface AddRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRequirement: (type: 'token' | 'nft' | 'whitelist') => void;
}

export function AddRequirementModal({ isOpen, onClose, onAddRequirement }: AddRequirementModalProps) {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Add Requirement" size="md">
      <VStack spacing={2} align="stretch">
        <RequirementOption
          icon={Coins}
          title="Token"
          description="Set an ERC-20 threshold"
          onClick={() => onAddRequirement('token')}
        />
        
        <RequirementOption
          icon={ImageSquare}
          title="NFT"
          description="Set an ERC-721 or ERC-1155 threshold"
          onClick={() => onAddRequirement('nft')}
        />
        
        <RequirementOption
          icon={ListChecks}
          title="Whitelist"
          description="Specify a list of addresses"
          onClick={() => onAddRequirement('whitelist')}
        />
      </VStack>
    </ModalBase>
  );
}
