import { VStack } from '@chakra-ui/react';
import { Coins, ImageSquare, ListChecks } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('tokenSale');
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
              title={t('tokenRequirementTitle')}
              description={t('tokenRequirementDescription')}
              onClick={() => setCurrentStep('token')}
            />

            <RequirementOption
              icon={ImageSquare}
              title={t('nftRequirementTitle')}
              description={t('nftRequirementDescription')}
              onClick={() => setCurrentStep('nft')}
            />

            <RequirementOption
              icon={ListChecks}
              title={t('whitelistRequirementTitle')}
              description={t('whitelistRequirementDescription')}
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
        return t('addRequirementModalTitle');
      default:
        return t('addRequirementModalTitle');
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
