import { Button, Flex, Icon } from '@chakra-ui/react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { CreatorSteps, ICreationStepProps } from '../../types';

interface IStepButtons extends ICreationStepProps {
  isNextDisabled?: boolean;
  isEdit?: boolean;
}

export function StepButtons({
  errors,
  transactionPending,
  isSubmitting,
  isSubDAO,
  isNextDisabled,
  isEdit,
  steps,
}: IStepButtons) {
  const navigate = useNavigate();
  const { t } = useTranslation(['daoCreate', 'common']);
  const user = useAccount();
  const location = useLocation();
  const paths = location.pathname.split('/');
  // @dev paths[paths.length - 1] will be empty string if we have trailing slash, so then we're falling back to the item before that
  const step = (paths[paths.length - 1] || paths[paths.length - 2]) as CreatorSteps | undefined;
  const currentStepIndex = steps.findIndex(_step => _step === step);
  const nextStep = steps[currentStepIndex + 1];
  const prevStep = steps[currentStepIndex - 1];

  const prevStepUrl = `${location.pathname.replace(`${step}`, `${prevStep}`)}${location.search}`;
  const nextStepUrl = `${location.pathname.replace(`${step}`, `${nextStep}`)}${location.search}`;

  const isLastStep = steps[steps.length - 1] === step;

  const forwardButtonText =
    isLastStep && isSubDAO
      ? t('labelDeploySubDAO')
      : isLastStep && isEdit
        ? t('labelDeployAzorius')
        : t(isLastStep ? 'deploy' : 'next', { ns: 'common' });
  const buttonType = isLastStep ? 'submit' : 'button';
  return (
    <Flex
      alignItems="center"
      justifyContent="flex-end"
      width="100%"
      mt="1.5rem"
      gap="0.75rem"
    >
      {prevStep && (
        <Button
          data-testid="create-prevButton"
          variant="text"
          isDisabled={transactionPending || isSubmitting}
          onClick={() => navigate(prevStepUrl)}
          color="color-lilac-100"
          px="2rem"
        >
          <Icon as={CaretLeft} />
          {t('back', { ns: 'common' })}
        </Button>
      )}
      <Button
        type={buttonType}
        isDisabled={transactionPending || isSubmitting || !step || !!errors[step] || isNextDisabled}
        px="2rem"
        onClick={() => {
          if (!isLastStep && nextStep) {
            navigate(nextStepUrl);
          } else if (isLastStep && !user.address) {
            toast.info(t('toastDisconnected'));
          }
        }}
        data-testid={!isLastStep ? 'create-skipNextButton' : 'create-deployDAO'}
      >
        {forwardButtonText}
        {!isLastStep && <Icon as={CaretRight} />}
      </Button>
    </Flex>
  );
}
