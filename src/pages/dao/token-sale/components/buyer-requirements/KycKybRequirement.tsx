import { VStack, Switch } from '@chakra-ui/react';
import { LabelComponent } from '../../../../../components/ui/forms/InputComponent';

interface KycKybRequirementProps {
  requireKYC: boolean;
  setRequireKYC: (value: boolean) => void;
}

export function KycKybRequirement({ requireKYC, setRequireKYC }: KycKybRequirementProps) {
  return (
    <VStack
      spacing={6}
      align="stretch"
    >
      <LabelComponent
        label="Require KYC/KYB"
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
