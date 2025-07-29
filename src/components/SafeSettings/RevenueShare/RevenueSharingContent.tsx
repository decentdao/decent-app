import { Flex, Button, Icon, Text } from '@chakra-ui/react';
import { Plus, WarningCircle } from '@phosphor-icons/react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { RevenueSharingWalletSplit } from '../../../types/revShare';
import { Badge } from '../../ui/badges/Badge';
import AddressCopier from '../../ui/links/AddressCopier';
import { BarLoader } from '../../ui/loaders/BarLoader';
import { SafeSettingsEdits } from '../../ui/modals/SafeSettingsModal';
import { SettingsContentBox } from '../SettingsContentBox';
import { RevSplitWalletAccordion } from './RevenueSplitWallets';
import { mergeSplitWalletFormData } from './revenueShareFormHandlers';

function RevenueShareHeader() {
  const { values, setFieldValue } = useFormikContext<SafeSettingsEdits>();
  const { t } = useTranslation('revenueSharing');

  return (
    <Flex
      alignItems="center"
      justifyContent="flex-start"
      w="100%"
      mb="0.5rem"
    >
      <Text
        textStyle="text-lg-regular"
        color="color-content-content1-foreground"
      >
        {t('title')}
      </Text>

      <Button
        variant="secondaryV1"
        size="sm"
        ml="auto"
        leftIcon={<Icon as={Plus} />}
        onClick={() => {
          const formWallets = [...(values.revenueSharing?.new || [])];

          formWallets[formWallets.length] = {
            name: t('defaultSplitName'),
            splits: [{} as Partial<RevenueSharingWalletSplit<string, string>>],
          };
          setFieldValue('revenueSharing.new', formWallets);
        }}
      >
        {t('addSplitButton')}
      </Button>
    </Flex>
  );
}

function DaoSafeWalletCard({ displayedAddress }: { displayedAddress: Address }) {
  const { t } = useTranslation('revenueSharing');
  return (
    <Flex
      flexDir="column"
      gap={1}
      border="1px solid"
      borderColor="color-neutral-900"
      borderRadius="0.75rem"
      p={4}
    >
      <Flex
        alignItems="center"
        gap="1.5rem"
      >
        <Text
          textStyle="text-base-regular"
          color="color-content-content1-foreground"
        >
          {t('daoSafeWallet')}
        </Text>

        <AddressCopier
          address={displayedAddress}
          color="color-content-content1-foreground"
          textStyle="text-sm-underlined-regular"
          textDecor="underline"
          variant="secondary"
        >
          {createAccountSubstring(displayedAddress)}
        </AddressCopier>
      </Flex>

      <Badge
        namespace="revenueSharing"
        labelKey="revShareDaoSafeWarning"
        size="base"
        leftIcon={<Icon as={WarningCircle} />}
      />
    </Flex>
  );
}

// @dev this component is within the context of the Safe Settings Form
export function RevenueSharingSettingsContent() {
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    revShareWallets,
  } = useDAOStore({ daoKey });

  const { values } = useFormikContext<SafeSettingsEdits>();

  if (!safe) {
    return (
      <Flex
        h="8.5rem"
        width="100%"
        alignItems="center"
        justifyContent="center"
      >
        <BarLoader />
      </Flex>
    );
  }

  const formWallets = mergeSplitWalletFormData(
    values?.revenueSharing?.existing || [],
    revShareWallets,
  );
  return (
    <>
      <SettingsContentBox
        px={12}
        py={6}
      >
        <RevenueShareHeader />
        <DaoSafeWalletCard displayedAddress={safe.address} />
        <Flex
          direction="column"
          gap="0.5rem"
        >
          {/* form for existing wallets */}
          {formWallets.map((wallet, walletIndex) => (
            <RevSplitWalletAccordion
              walletFormType="existing"
              key={walletIndex}
              wallet={wallet}
              index={walletIndex}
            />
          ))}
          {/* form for new wallets */}
          {values?.revenueSharing?.new?.map((wallet, walletIndex) => (
            <RevSplitWalletAccordion
              walletFormType="new"
              key={walletIndex}
              wallet={wallet}
              index={walletIndex}
            />
          ))}
        </Flex>
      </SettingsContentBox>
    </>
  );
}
