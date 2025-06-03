import { Flex, Box, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';

export function SafeRevenueSharingSettingsPage() {
  const { t } = useTranslation('settings');
  // const { setFieldValue, values: formValues } = useFormikContext<SafeSettingsEdits>();
  // const { errors } = useFormikContext<SafeSettingsFormikErrors>();
  // const generalEditFormikErrors = (errors as SafeSettingsFormikErrors).general;

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  return (
    <>
      {!!safe ? (
        <SettingsContentBox
          px={12}
          py={6}
        >
          <Flex
            flexDir="column"
            justifyContent="space-between"
          >
            <Text
              ml={6}
              mb={0.5}
              textStyle="text-lg-regular"
            >
              {t('daoSettingsRevenueSharing')}
            </Text>

            <Box h={12} />
          </Flex>
        </SettingsContentBox>
      ) : (
        <Flex
          h="8.5rem"
          width="100%"
          alignItems="center"
          justifyContent="center"
        >
          <BarLoader />
        </Flex>
      )}
    </>
  );
}
