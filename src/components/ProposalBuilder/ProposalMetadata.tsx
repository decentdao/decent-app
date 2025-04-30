import { VStack } from '@chakra-ui/react';
import { FormikProps } from 'formik';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useProposalActionsStore } from '../../store/actions/useProposalActionsStore';
import { CreateProposalForm } from '../../types/proposalBuilder';
import { InputComponent, TextareaComponent } from '../ui/forms/InputComponent';

export interface ProposalMetadataTypeProps {
  titleLabel: string;
  titleHelper: string;
  descriptionLabel: string;
  descriptionHelper: string;
}

export const DEFAULT_PROPOSAL_METADATA_TYPE_PROPS = (
  t: TFunction<[string, string, string], undefined>,
): ProposalMetadataTypeProps => ({
  titleLabel: t('proposalTitle', { ns: 'proposal' }),
  titleHelper: t('proposalTitleHelper', { ns: 'proposal' }),
  descriptionLabel: t('proposalDescription', { ns: 'proposal' }),
  descriptionHelper: t('proposalDescriptionHelper', { ns: 'proposal' }),
});

export const TEMPLATE_PROPOSAL_METADATA_TYPE_PROPS = (
  t: TFunction<[string, string, string], undefined>,
): ProposalMetadataTypeProps => ({
  titleLabel: t('proposalTemplateTitle', { ns: 'proposalTemplate' }),
  titleHelper: t('proposalTemplateTitleHelperText', { ns: 'proposalTemplate' }),
  descriptionLabel: t('proposalTemplateDescription', { ns: 'proposalTemplate' }),
  descriptionHelper: t('proposalTemplateDescriptionHelperText', { ns: 'proposalTemplate' }),
});

export interface ProposalMetadataProps extends FormikProps<CreateProposalForm> {
  typeProps: ProposalMetadataTypeProps;
}

export default function ProposalMetadata({
  values: { proposalMetadata },
  typeProps,
}: ProposalMetadataProps) {
  const { t } = useTranslation(['proposal']);
  const { setProposalMetadata } = useProposalActionsStore();
  return (
    <VStack
      align="left"
      spacing={8}
      p="1.5rem"
    >
      <InputComponent
        label={typeProps.titleLabel}
        helper={typeProps.titleHelper}
        placeholder={t('proposalTitlePlaceholder', { ns: 'proposal' })}
        isRequired
        value={proposalMetadata.title}
        onChange={e => setProposalMetadata('title', e.target.value)}
        testId="metadata.title"
        maxLength={50}
      />
      <TextareaComponent
        label={typeProps.descriptionLabel}
        subLabel={t('')}
        helper={typeProps.descriptionHelper}
        placeholder={t('proposalDescriptionPlaceholder', { ns: 'proposal' })}
        isRequired={false}
        value={proposalMetadata.description}
        onChange={e => setProposalMetadata('description', e.target.value)}
        rows={12}
      />
      <InputComponent
        label={t('proposalAdditionalResources', { ns: 'proposal' })}
        placeholder={t('proposalAdditionalResourcesPlaceholder', { ns: 'proposal' })}
        helper={t('proposalAdditionalResourcesHelper', { ns: 'proposal' })}
        value={proposalMetadata.documentationUrl || ''}
        onChange={e => setProposalMetadata('documentationUrl', e.target.value)}
        testId="metadata.documentationUrl"
        isRequired={false}
      />
    </VStack>
  );
}
