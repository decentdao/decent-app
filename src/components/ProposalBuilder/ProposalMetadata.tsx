import { Container, Input, VStack } from '@chakra-ui/react';
import { FormikProps } from 'formik';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { useProposalActionsStore } from '../../store/actions/useProposalActionsStore';
import { CreateProposalForm } from '../../types/proposalBuilder';
import { MarkdownEditor } from '../Markdown/MarkdownEditor';
import { CustomNonceInput } from '../ui/forms/CustomNonceInput';
import { InputComponent, TextareaComponent } from '../ui/forms/InputComponent';
// eslint-disable-next-line import/no-extraneous-dependencies
import '@toast-ui/editor/dist/toastui-editor.css';
// eslint-disable-next-line import/no-extraneous-dependencies
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';

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

export function PlainTextProposalMetadata({
  values,
  typeProps,
}: Pick<ProposalMetadataProps, 'values' | 'typeProps'>) {
  const { t } = useTranslation(['proposal']);
  const { setProposalMetadata } = useProposalActionsStore();
  const { proposalMetadata } = values;

  return (
    <VStack
      align="left"
      spacing={8}
      p="1.5rem"
    >
      <CustomNonceInput
        nonce={values.proposalMetadata.nonce}
        onChange={newNonce => setProposalMetadata('nonce', newNonce)}
        align="end"
        renderTrimmed={false}
      />
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

export function MarkdownProposalMetadata({
  values: { proposalMetadata },
  typeProps,
}: Pick<ProposalMetadataProps, 'values' | 'typeProps'>) {
  const { t } = useTranslation(['proposal']);
  const { setProposalMetadata } = useProposalActionsStore();

  return (
    <VStack
      align="left"
      spacing={8}
      p="1.5rem"
    >
      <Input
        placeholder={t('proposalTitlePlaceholder', { ns: 'proposal' })}
        isRequired
        value={proposalMetadata.title}
        onChange={e => setProposalMetadata('title', e.target.value)}
        data-testid="metadata.title"
        maxLength={50}
      />
      <Container
        margin={0}
        padding={0}
        maxW={{ base: '350px', sm: '440px', md: '768px', lg: '1100px', xl: '1200px' }}
      >
        <MarkdownEditor
          initialValue={proposalMetadata.description}
          placeholder={typeProps.descriptionHelper}
          onChange={value => setProposalMetadata('description', value)}
          height="400px"
        />
      </Container>
      <CustomNonceInput
        nonce={proposalMetadata.nonce}
        onChange={newNonce => setProposalMetadata('nonce', newNonce)}
        align="end"
        renderTrimmed={false}
      />
    </VStack>
  );
}

export default function ProposalMetadata({ values, typeProps }: ProposalMetadataProps) {
  const proposalV1FeatureEnabled = useFeatureFlag('flag_proposal_v1');

  if (proposalV1FeatureEnabled) {
    return (
      <MarkdownProposalMetadata
        values={values}
        typeProps={typeProps}
      />
    );
  } else {
    return (
      <PlainTextProposalMetadata
        values={values}
        typeProps={typeProps}
      />
    );
  }
}
