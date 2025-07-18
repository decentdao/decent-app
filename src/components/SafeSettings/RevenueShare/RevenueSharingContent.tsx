import { Flex, Button, Icon, Text } from '@chakra-ui/react';
import { Plus, WarningCircle } from '@phosphor-icons/react';
import { useFormikContext } from 'formik';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import { createAccountSubstring } from '../../../hooks/utils/useGetAccountName';
import { useDAOStore } from '../../../providers/App/AppProvider';
import {
  RevenueSharingWallet,
  RevenueSharingWalletFormValues,
  RevenueSharingWalletSplit,
} from '../../../types/revShare';
import { Badge } from '../../ui/badges/Badge';
import AddressCopier from '../../ui/links/AddressCopier';
import { BarLoader } from '../../ui/loaders/BarLoader';
import { SafeSettingsEdits } from '../../ui/modals/SafeSettingsModal';
import { SettingsContentBox } from '../SettingsContentBox';
import { RevSplitWalletAccordion } from './RevenueSplitWallets';

function RevenueShareHeader({ numberOfDeployedWallets }: { numberOfDeployedWallets: number }) {
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
          const formWallets = [...(values.revenueSharing?.wallets || [])];
          const formWalletsLength = formWallets.length;
          const walletsLength = numberOfDeployedWallets;
          const newWalletIndex =
            formWalletsLength >= walletsLength ? formWalletsLength : walletsLength;

          formWallets[newWalletIndex] = {
            name: t('defaultSplitName'),
            splits: [{} as Partial<RevenueSharingWalletSplit<string, string>>],
          };
          setFieldValue('revenueSharing.wallets', formWallets);
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
    node: { safe, subgraphInfo },
  } = useDAOStore({ daoKey });

  const { values } = useFormikContext<SafeSettingsEdits>();

  const isCurrentDAOAddress = (address: Address | string) => {
    return address === safe?.address;
  };

  const isParentDAOAddress = (address: Address | string) => {
    return address === subgraphInfo?.parentAddress;
  };

  // TEST DATA; WILL COME FROM GLOBAL STORE
  const dummyAddress = useMemo(
    () => '0x' + Math.floor(Math.random() * 10000000000000000000000000000000000000000).toString(16),
    [],
  );
  const dummyAddress02 = useMemo(
    () => '0x' + Math.floor(Math.random() * 10000000000000000000000000000000000000000).toString(16),
    [],
  );
  const dummyAddress03 = useMemo(
    () => '0x' + Math.floor(Math.random() * 10000000000000000000000000000000000000000).toString(16),
    [],
  );
  const dummyAddress04 = useMemo(
    () => '0x' + Math.floor(Math.random() * 10000000000000000000000000000000000000000).toString(16),
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

  const foo: any[] = [
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

  // function to combine foo and values, where form values take precedence
  const combineFooAndValues = (
    existingWallets: RevenueSharingWallet[],
    formWallets: RevenueSharingWalletFormValues[] | undefined,
  ) => {
    const formWalletsLength = formWallets?.length ?? 0;
    const existingWalletsLength = existingWallets?.length;
    const newWalletsArrayLength =
      formWalletsLength >= existingWalletsLength ? formWalletsLength : existingWalletsLength;
    return Array.from({ length: newWalletsArrayLength }, (_, index) => {
      const formWallet = formWallets?.[index];
      const existingWallet = existingWallets?.[index];
      const existingSplits = existingWallet?.splits ?? [];
      const formSplits = formWallet?.splits ?? [];
      const currentSplitsArrayLength =
        formSplits?.length >= existingSplits?.length ? formSplits?.length : existingSplits?.length;
      return {
        ...existingWallet,
        name: formWallet?.name || existingWallet?.name,
        splits: Array.from({ length: currentSplitsArrayLength }, (__, splitIndex) => {
          const formSplit = formSplits?.[splitIndex];
          const existingSplit = existingSplits?.[splitIndex];
          if (formSplit && !existingSplit) {
            return {
              ...formSplit,
            };
          }
          return {
            ...existingSplit,
            percentage: formSplit?.percentage || existingSplit?.percentage?.toString(),
            address: formSplit?.address || existingSplit?.address,
          };
        }),
      };
    });
  };

  const wallets = combineFooAndValues(foo, values?.revenueSharing?.wallets)
    .map(wallet => {
      return {
        ...wallet,
        isCurrentDAOAddress: isCurrentDAOAddress(wallet.address),
        isParentDAOAddress: isParentDAOAddress(wallet.address),
      };
    })
    .sort((a, b) => {
      if (a.isCurrentDAOAddress) return -1;
      if (b.isCurrentDAOAddress) return 1;
      if (a.isParentDAOAddress) return -1;
      if (b.isParentDAOAddress) return 1;
      return 0;
    });

  return (
    <>
      <SettingsContentBox
        px={12}
        py={6}
      >
        <RevenueShareHeader numberOfDeployedWallets={wallets.length} />
        <DaoSafeWalletCard displayedAddress={safe.address} />
        <Flex
          direction="column"
          gap="0.5rem"
        >
          {wallets.map((wallet, index) => (
            <RevSplitWalletAccordion
              key={index}
              wallet={wallet}
              index={index}
            />
          ))}
        </Flex>
      </SettingsContentBox>
    </>
  );
}
