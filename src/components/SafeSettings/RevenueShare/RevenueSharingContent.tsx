import { Flex, Button, Icon, Text } from '@chakra-ui/react';
import { Plus, WarningCircle } from '@phosphor-icons/react';
import { useFormikContext } from 'formik';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, getCreateAddress } from 'viem';
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
  } = useDAOStore({ daoKey });

  const { values } = useFormikContext<SafeSettingsEdits>();

  // TEST DATA; WILL COME FROM GLOBAL STORE
  const dummyAddress = useMemo(
    () => getCreateAddress({ from: '0x0000000000000000000000000000000000000000', nonce: 0n }),
    [],
  );
  const dummyAddress02 = useMemo(
    () => getCreateAddress({ from: '0x0000000000000000000000000000000000000000', nonce: 1n }),
    [],
  );
  const dummyAddress03 = useMemo(
    () => getCreateAddress({ from: '0x0000000000000000000000000000000000000000', nonce: 2n }),
    [],
  );
  const dummyAddress04 = useMemo(
    () => getCreateAddress({ from: '0x0000000000000000000000000000000000000000', nonce: 3n }),
    [],
  );

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

  const revenueShareWallets: any[] = [
    {
      address: dummyAddress,
      name: 'Test 1',
      splits: [
        {
          address: dummyAddress,
          percentage: 40,
        },
        {
          address: dummyAddress02,
          percentage: 25,
        },
        {
          address: dummyAddress03,
          percentage: 20,
        },
        {
          address: dummyAddress04,
          percentage: 5,
        },
      ],
    },
  ];

  const existingFormWalletsLength = values?.revenueSharing?.existing?.length || 0;
  const existingWalletsLength = revenueShareWallets?.length || 0;
  const maxLength = Math.max(existingFormWalletsLength, existingWalletsLength);

  const existingFormWallets = Array.from({ length: maxLength }, (_, walletIndex) => {
    const existingWalletData = revenueShareWallets[walletIndex];
    const existingWalletFormData = values?.revenueSharing?.existing?.[walletIndex];

    const splitsLength = existingWalletData?.splits?.length || 0;
    const newSplitsLength = existingWalletFormData?.splits?.length || 0;
    const maxSplitsLength = Math.max(splitsLength, newSplitsLength);

    const splits = Array.from({ length: maxSplitsLength }, (__, splitIndex) => {
      const existingSplitData = existingWalletData?.splits?.[splitIndex];
      const existingSplitFormData = existingWalletFormData?.splits?.[splitIndex];
      return {
        address: existingSplitFormData?.address || existingSplitData?.address,
        percentage: existingSplitFormData?.percentage || existingSplitData?.percentage,
      };
    });

    return {
      name: existingWalletFormData?.name || existingWalletData?.name,
      address: existingWalletFormData?.address || existingWalletData?.address,
      splits: splits,
    };
  });

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
          {existingFormWallets.map((wallet, walletIndex) => (
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
