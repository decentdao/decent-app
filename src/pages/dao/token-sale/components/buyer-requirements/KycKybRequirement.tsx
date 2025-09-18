import { VStack, Switch } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { LabelComponent } from '../../../../../components/ui/forms/InputComponent';

interface KycKybRequirementProps {
  requireKYC: boolean;
  setRequireKYC: (value: boolean) => void;
}

export function KycKybRequirement({ requireKYC, setRequireKYC }: KycKybRequirementProps) {
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
          isChecked={requireKYC}
          onChange={e => setRequireKYC(e.target.checked)}
          size="md"
        />
      </LabelComponent>
    </VStack>
  );
}
