import { Divider, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Address, Hex } from 'viem';
import {
  paymentSorterByActiveStatus,
  paymentSorterByStartDate,
  paymentSorterByWithdrawAmount,
} from '../../store/roles/rolesStoreUtils';
import { SablierPayment } from '../../types/roles';
import NoDataCard from '../ui/containers/NoDataCard';
import { RolePaymentDetails } from './RolePaymentDetails';
import RoleTermDetails from './RoleTermDetails';

type RoleTermDetailProp = {
  termEndDate: Date;
  termNumber: number;
  nominee: string;
};

type CurrentTermProp = RoleTermDetailProp & { isActive: boolean | undefined };

function RolesDetailsPayments({
  payments,
  roleHatSmartAccountAddress,
  roleHatWearerAddress,
  roleHatId,
  roleTerms,
}: {
  payments: (Omit<SablierPayment, 'contractAddress' | 'streamId'> & {
    contractAddress?: Address;
    streamId?: string;
    cancelable?: boolean;
  })[];
  roleHatId: Hex | undefined;
  roleHatWearerAddress: Address | undefined;
  roleHatSmartAccountAddress: Address | undefined;
  roleTerms: RoleTermDetailProp[];
}) {
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
      {sortedPayments.map(payment => {
        const thisPaymentIndex = payments?.findIndex(p => p.streamId === payment.streamId);
        return (
          <RolePaymentDetails
            key={thisPaymentIndex}
            payment={{
              ...payment,
              isCancelableStream: payment.cancelable ?? true,
            }}
            roleHatSmartAccountAddress={roleHatSmartAccountAddress}
            roleHatId={roleHatId}
            roleTerms={roleTerms}
            roleHatWearerAddress={roleHatWearerAddress}
            showWithdraw
          />
        );
      })}
    </>
  );
}

export default function RoleDetailsTabs({
  roleTerms,
  hatId,
  roleHatWearerAddress,
  roleHatSmartAccountAddress,
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
  roleHatSmartAccountAddress: Address | undefined;
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
        <Tab>{t('payments')}</Tab>
        <Tab>{t('terms')}</Tab>
      </TabList>
      <TabPanels mt={4}>
        <TabPanel>
          <RolesDetailsPayments
            payments={sortedPayments}
            roleTerms={roleTerms.allTerms}
            roleHatId={hatId}
            roleHatSmartAccountAddress={roleHatSmartAccountAddress}
            roleHatWearerAddress={roleHatWearerAddress}
          />
        </TabPanel>
        <TabPanel>
          <RoleTermDetails
            hatId={hatId}
            currentTerm={roleTerms.currentTerm}
            nextTerm={roleTerms.nextTerm}
            expiredTerms={roleTerms.expiredTerms}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
