import { Tabs, TabList, Tab, TabPanels, TabPanel, Divider, Text } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, Hex } from 'viem';
import { isFeatureEnabled } from '../../../constants/common';
import {
  paymentSorterByWithdrawAmount,
  paymentSorterByStartDate,
  paymentSorterByActiveStatus,
} from '../../../store/roles/rolesStoreUtils';
import NoDataCard from '../../ui/containers/NoDataCard';
import { RolePaymentDetails } from './RolePaymentDetails';
import RoleTermDetails from './RoleTermDetails';
import { SablierPayment } from './types';

type RoleTermDetailProp = {
  termEndDate: Date;
  termNumber: number;
  nominee: string;
};

type CurrentTermProp = RoleTermDetailProp & { termStatus: 'active' | 'inactive' };

function RolesDetailsPayments({
  payments,
  roleHatSmartAddress,
  roleHatWearerAddress,
  roleTerms,
}: {
  payments: (Omit<SablierPayment, 'contractAddress' | 'streamId'> & {
    contractAddress?: Address;
    streamId?: string;
  })[];
  roleHatWearerAddress: Address | undefined;
  roleHatSmartAddress: Address | undefined;
  roleTerms: RoleTermDetailProp[];
}) {
  const { t } = useTranslation(['roles']);
  const sortedPayments = useMemo(
    () =>
      payments
        ? [...payments]
            .sort(paymentSorterByWithdrawAmount)
            .sort(paymentSorterByStartDate)
            .sort(paymentSorterByActiveStatus)
        : [],
    [payments],
  );

  if (!sortedPayments.length) {
    return (
      <NoDataCard
        translationNameSpace="roles"
        emptyText="noActivePayments"
        emptyTextNotProposer="noActivePaymentsNotProposer"
      />
    );
  }

  return (
    <>
      <Divider
        variant="darker"
        my={4}
      />
      <Text
        textStyle="display-lg"
        color="white-0"
      >
        {t('payments')}
      </Text>
      {sortedPayments.map((payment, index) => (
        <RolePaymentDetails
          key={index}
          payment={payment}
          roleHatSmartAddress={roleHatSmartAddress}
          roleTerms={roleTerms}
          roleHatWearerAddress={roleHatWearerAddress}
          showWithdraw
        />
      ))}
    </>
  );
}

function RolesDetailsTerms({
  hatId,
  currentTerm,
  nextTerm,
  expiredTerms,
}: {
  hatId: Hex | undefined;
  nextTerm: RoleTermDetailProp | undefined;
  currentTerm: CurrentTermProp | undefined;
  expiredTerms: RoleTermDetailProp[];
}) {
  return (
    <RoleTermDetails
      hatId={hatId}
      currentTerm={currentTerm}
      nextTerm={nextTerm}
      expiredTerms={expiredTerms}
    />
  );
}

export default function RoleDetailsTabs({
  roleTerms,
  hatId,
  roleHatWearerAddress,
  roleHatSmartAddress,
  sortedPayments,
}: {
  hatId: Hex | undefined;
  roleTerms: {
    currentTerm: CurrentTermProp | undefined;
    nextTerm: RoleTermDetailProp | undefined;
    expiredTerms: RoleTermDetailProp[];
    allTerms: RoleTermDetailProp[];
  };
  roleHatWearerAddress: Address | undefined;
  roleHatSmartAddress: Address | undefined;
  sortedPayments: (Omit<SablierPayment, 'contractAddress' | 'streamId'> & {
    contractAddress?: Address;
    streamId?: string;
  })[];
}) {
  const { t } = useTranslation(['roles']);
  return (
    <Tabs
      variant="twoTone"
      mt={4}
    >
      <TabList>
        {isFeatureEnabled('TERMED_ROLES') && <Tab>{t('terms')}</Tab>}
        <Tab>{t('payments')}</Tab>
      </TabList>
      <TabPanels mt={4}>
        {isFeatureEnabled('TERMED_ROLES') && (
          <TabPanel>
            <RolesDetailsTerms
              hatId={hatId}
              currentTerm={roleTerms.currentTerm}
              nextTerm={roleTerms.nextTerm}
              expiredTerms={roleTerms.expiredTerms}
            />
          </TabPanel>
        )}
        <TabPanel>
          <RolesDetailsPayments
            payments={sortedPayments}
            roleTerms={roleTerms.allTerms}
            roleHatSmartAddress={roleHatSmartAddress}
            roleHatWearerAddress={roleHatWearerAddress}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
