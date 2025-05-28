import { Flex, Button, Text, Icon, Box, Image } from '@chakra-ui/react';
import { WarningCircle } from '@phosphor-icons/react';
import { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import warningSVG from '../../../../public/images/warning-yellow.svg';
import { COLOR_CHARCOAL_300 } from '../../../constants/common';

export function ConfirmationModal({
  title,
  description,
  primaryButtonProps,
  secondaryButtonProps,
  icon,
}: {
  title: string;
  description: ReactNode;
  primaryButtonProps: {
    onClick: () => void;
    label: string;
    leftIcon?: JSX.Element;
  };
  secondaryButtonProps: {
    onClick: () => void;
    label: string;
    leftIcon?: JSX.Element;
  };
  icon?: ReactNode;
}) {
  return (
    <>
      <Flex
        direction="column"
        alignItems="center"
        px="1rem"
        pb="1.5rem"
      >
        {icon}
        <Text
          my="1rem"
          color="color-white"
          textStyle="text-2xl-regular"
        >
          {title}
        </Text>
        {typeof description === 'string' ? (
          <Text
            mt="0.5rem"
            textStyle="text-sm-medium"
            color={COLOR_CHARCOAL_300}
          >
            {description}
          </Text>
        ) : (
          description
        )}
      </Flex>
      <Flex
        justifyContent="center"
        gap="0.75rem"
        mt="1rem"
        mx="1rem"
      >
        <Button
          w="full"
          leftIcon={secondaryButtonProps.leftIcon}
          variant="secondary"
          px="2rem"
          onClick={secondaryButtonProps.onClick}
        >
          {secondaryButtonProps.label}
        </Button>
        <Button
          w="full"
          leftIcon={primaryButtonProps.leftIcon}
          onClick={primaryButtonProps.onClick}
          px="2rem"
        >
          {primaryButtonProps.label}
        </Button>
      </Flex>
    </>
  );
}

function ConfirmRejectProposalAdditionalContent() {
  const { t } = useTranslation(['proposal']);
  return (
    <Box>
      <Text
        mt="0.5rem"
        textStyle="text-sm-medium"
        color={COLOR_CHARCOAL_300}
        fontStyle="italic"
      >
        {t('rejectProposalDescription')}
      </Text>
      <Text
        my="1rem"
        textStyle="text-sm-medium"
        color={COLOR_CHARCOAL_300}
      >
        {t('rejectProposalAreYouSure')}
      </Text>
      <Flex
        alignItems="center"
        gap="0.5rem"
        color="color-yellow-200"
        justifyContent="center"
        my="1rem"
        pt="1rem"
      >
        <Image
          src={warningSVG}
          boxSize="1.5rem"
        />
        <Text textStyle="text-lg-regular">{t('rejectProposalAreYouSureDescription')}</Text>
      </Flex>
    </Box>
  );
}

export function ConfirmRejectProposalModal({
  submitRejection,
  cancel,
}: {
  submitRejection: () => void;
  cancel: () => void;
}) {
  const { t } = useTranslation(['proposal']);
  return (
    <ConfirmationModal
      title={t('confirmRejectProposal')}
      icon={
        <Icon
          as={WarningCircle}
          boxSize="2rem"
          color="color-lilac-100"
        />
      }
      description={<ConfirmRejectProposalAdditionalContent />}
      primaryButtonProps={{
        onClick: cancel,
        label: t('rejectProposalNevermind'),
      }}
      secondaryButtonProps={{
        onClick: submitRejection,
        label: t('rejectProposalYesRejectIt'),
      }}
    />
  );
}

export function ConfirmExecutionModal({
  submitExecution,
  nonce,
  cancel,
}: {
  submitExecution: () => void;
  nonce: number | undefined;
  cancel: () => void;
}) {
  const { t } = useTranslation(['proposal', 'modals']);
  return (
    <ConfirmationModal
      title={t('confirmExecution')}
      icon={
        <Icon
          as={WarningCircle}
          boxSize="2rem"
          color="color-lilac-100"
        />
      }
      description={
        <Box>
          <Text
            mt="0.5rem"
            textStyle="text-sm-medium"
            color={COLOR_CHARCOAL_300}
            fontStyle="italic"
          >
            <Trans
              t={t}
              i18nKey="executionDescription"
              values={{ nonce }}
              components={{
                color: (
                  <Box
                    as="span"
                    color="color-white"
                    fontStyle="normal"
                  />
                ),
              }}
            />
          </Text>
        </Box>
      }
      primaryButtonProps={{
        onClick: submitExecution,
        label: t('modalContinue', { ns: 'modals' }),
      }}
      secondaryButtonProps={{
        onClick: cancel,
        label: t('modalCancel', { ns: 'modals' }),
      }}
    />
  );
}
