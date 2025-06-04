import { Flex, Text, Icon, Image, Button } from '@chakra-ui/react';
import { Empty, Link, Plus, TrashSimple } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { SettingsContentBox } from '../../../../components/SafeSettings/SettingsContentBox';
import { BarLoader } from '../../../../components/ui/loaders/BarLoader';
import Divider from '../../../../components/ui/utils/Divider';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useGetAccountName } from '../../../../hooks/utils/useGetAccountName';
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

  const displayedAddress = safe?.address;
  const { displayName } = useGetAccountName(displayedAddress);

  const currentDaoTreasureShare = 30;
  const revSplitTotal = 100;

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
            gap={2}
          >
            {/* DAO Safe Wallet */}
            <Flex
              border="1px solid"
              borderColor="color-neutral-900"
              borderRadius="0.75rem"
              gap={2}
              flexDir="column"
              p={6}
            >
              <Text>{t('daoSafeWallet')}</Text>
              <Flex
                direction="row"
                alignItems="center"
                gap={2}
              >
                <Text
                  ml="0.75rem"
                  textStyle="text-sm-underlined"
                >
                  {displayName}
                </Text>
                <Icon as={Link} />
              </Flex>

              <Flex
                flexDir="row"
                alignItems="center"
                gap={2}
              >
                <Image
                  boxSize={4}
                  src="/images/warning-yellow.svg"
                />
                <Text color="color-warning-500">{t('revShareDaoSafeWarning')}</Text>
              </Flex>
            </Flex>

            <Flex
              border="1px solid"
              borderColor="color-neutral-900"
              borderRadius="0.75rem"
              gap={2}
              flexDir="column"
              p={6}
            >
              <Text>{t('revSplitWallet')}</Text>
              <Flex
                direction="row"
                alignItems="center"
                gap={2}
              >
                <Text
                  ml="0.75rem"
                  textStyle="text-sm-underlined"
                >
                  {displayName}
                </Text>
                <Icon as={Link} />
              </Flex>

              <Divider my={4} />

              <Flex
                flexDir="row"
                alignItems="center"
                justifyContent="space-between"
                gap={2}
              >
                <Text>{t('counterparties')}</Text>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Icon as={Plus} />}
                >
                  {t('revShareAddSplitWallet')}
                </Button>
              </Flex>

              <Flex
                flexDir="row"
                alignItems="center"
                mt={4}
                border="1px solid"
                borderColor="color-neutral-900"
                borderRadius="0.75rem"
                p={2}
              >
                <Flex
                  flexDir="row"
                  justifyContent="space-between"
                  w="100%"
                  p={3}
                >
                  <Text flex={4}>{t('currentDaoTreasureShareLabel')}</Text>
                  <Text
                    color="color-neutral-400"
                    flex={2}
                  >
                    {currentDaoTreasureShare} %
                  </Text>
                  <Icon
                    as={TrashSimple}
                    color="color-lilac-100"
                  />
                </Flex>
              </Flex>

              <Flex
                flexDir="row"
                justifyContent="space-between"
                w="100%"
                p={6}
              >
                <Text
                  color="color-neutral-500"
                  flex={4}
                >
                  {t('revSplitTotalLabel')}
                </Text>
                <Text flex={2}>{revSplitTotal}%</Text>
                <Icon
                  as={Empty}
                  color="transparent"
                />
              </Flex>
            </Flex>
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
