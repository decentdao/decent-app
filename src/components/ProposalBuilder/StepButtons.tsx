import { Button, Flex, Icon } from '@chakra-ui/react';
import { CaretLeft } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { CreateProposalSteps } from '../../types';

interface StepButtonsProps {
  renderButtons: (currentStep: CreateProposalSteps) => React.ReactNode;
  currentStep: CreateProposalSteps;
  onStepChange: (step: CreateProposalSteps) => void;
  createProposalBlocked: boolean;
}

interface StepButtonBaseProps {
  isDisabled?: boolean;
  onStepChange: (step: CreateProposalSteps) => void;
}

export function GoToTransactionsStepButton({ isDisabled, onStepChange }: StepButtonBaseProps) {
  const { t } = useTranslation('common');

  return (
    <Button
      px="2rem"
      isDisabled={isDisabled}
      onClick={() => onStepChange(CreateProposalSteps.TRANSACTIONS)}
    >
      {t('next')}
    </Button>
  );
}

function GoToMetadataStepButton({ onStepChange }: StepButtonBaseProps) {
  const { t } = useTranslation('common');

  return (
    <Button
      variant="text"
      px="2rem"
      color="lilac-0"
      onClick={() => onStepChange(CreateProposalSteps.METADATA)}
    >
      <Icon
        bg="transparent"
        aria-label="Back"
        as={CaretLeft}
        color="lilac-0"
      />
      {t('back', { ns: 'common' })}
    </Button>
  );
}

export function CreateProposalButton({ isDisabled }: { isDisabled: boolean }) {
  const { t } = useTranslation(['common', 'proposal']);

  return (
    <Button
      px="2rem"
      type="submit"
      isDisabled={isDisabled}
    >
      {t('createProposal', { ns: 'proposal' })}
    </Button>
  );
}

export default function StepButtons({
  renderButtons,
  currentStep,
  onStepChange,
  createProposalBlocked,
}: StepButtonsProps) {
  const { safe } = useDaoInfoStore();

  if (!safe?.address) {
    return null;
  }

  return (
    <Flex
      mt="1.5rem"
      gap="0.75rem"
      alignItems="center"
      justifyContent="flex-end"
      width="100%"
    >
      {currentStep === CreateProposalSteps.TRANSACTIONS && (
        <GoToMetadataStepButton onStepChange={onStepChange} />
      )}
      {renderButtons(currentStep)}
      {currentStep === CreateProposalSteps.TRANSACTIONS && (
        <CreateProposalButton isDisabled={createProposalBlocked} />
      )}
    </Flex>
  );
}
