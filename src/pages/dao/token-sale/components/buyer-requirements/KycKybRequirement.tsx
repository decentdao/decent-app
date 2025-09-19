import { VStack, Switch } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { LabelComponent } from '../../../../../components/ui/forms/InputComponent';

interface KycKybRequirementProps {
  kycEnabled: boolean;
  setFieldValue: (field: string, value: any) => void;
}

export function KycKybRequirement({ kycEnabled, setFieldValue }: KycKybRequirementProps) {
  const { t } = useTranslation('tokenSale');
  return (
    <VStack
      spacing={6}
      align="stretch"
    >
      <LabelComponent
        label={t('requireKycKybLabel')}
        helper="Lorem Ipsum"
        isRequired={false}
        gridContainerProps={{
          templateColumns: '1fr auto',
          alignItems: 'center',
        }}
      >
        <Switch
          isChecked={kycEnabled}
          onChange={e => setFieldValue('kycEnabled', e.target.checked)}
          size="md"
        />
      </LabelComponent>
    </VStack>
  );
}
