import { VStack } from '@chakra-ui/react';
import { Coins, ImageSquare, ListChecks } from '@phosphor-icons/react';
import { useState } from 'react';
import { ModalBase } from '../../../../../components/ui/modals/ModalBase';
import { BuyerRequirement } from '../../../../../types/tokenSale';
import { NFTRequirementForm } from './NFTRequirementForm';
import { RequirementOption } from './RequirementOption';
import { TokenRequirementForm } from './TokenRequirementForm';
import { WhitelistRequirementForm } from './WhitelistRequirementForm';

interface AddRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRequirement: (requirement: BuyerRequirement) => void;
}

type RequirementStep = 'selection' | 'token' | 'nft' | 'whitelist';

export function AddRequirementModal({
  isOpen,
  onClose,
  onAddRequirement,
}: AddRequirementModalProps) {
  const [currentStep, setCurrentStep] = useState<RequirementStep>('selection');

  const handleClose = () => {
    setCurrentStep('selection');
    onClose();
  };

  const handleBack = () => {
    setCurrentStep('selection');
  };

  const handleSubmitRequirement = (requirement: BuyerRequirement) => {
    onAddRequirement(requirement);
    handleClose();
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'token':
        return (
          <TokenRequirementForm
            onSubmit={handleSubmitRequirement}
            onCancel={handleBack}
          />
        );
      case 'nft':
        return (
          <NFTRequirementForm
            onSubmit={handleSubmitRequirement}
            onCancel={handleBack}
          />
        );
      case 'whitelist':
        return (
          <WhitelistRequirementForm
            onSubmit={handleSubmitRequirement}
            onCancel={handleBack}
          />
        );
      default:
        return (
          <VStack
            spacing={2}
            align="stretch"
          >
            <RequirementOption
              icon={Coins}
              title="Token"
              description="Set an ERC-20 threshold"
              onClick={() => setCurrentStep('token')}
            />

            <RequirementOption
              icon={ImageSquare}
              title="NFT"
              description="Set an ERC-721 or ERC-1155 threshold"
              onClick={() => setCurrentStep('nft')}
            />

            <RequirementOption
              icon={ListChecks}
              title="Whitelist"
              description="Specify a list of addresses"
              onClick={() => setCurrentStep('whitelist')}
            />
          </VStack>
        );
    }
  };

  const getModalTitle = () => {
    switch (currentStep) {
      case 'token':
      case 'nft':
      case 'whitelist':
        return 'Add Requirement';
      default:
        return 'Add Requirement';
    }
  };

  const getModalSize = () => {
    switch (currentStep) {
      case 'token':
      case 'nft':
      case 'whitelist':
        return 'lg';
      default:
        return 'md';
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      size={getModalSize()}
    >
      {renderContent()}
    </ModalBase>
  );
}
