import * as amplitude from '@amplitude/analytics-browser';
import { Box, Button, Flex, Grid, Show, Text } from '@chakra-ui/react';
import { ArrowsDownUp, HourglassMedium, Parachute } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AddPlus } from '../../../assets/theme/custom/icons/AddPlus';
import ExampleTemplateCard from '../../../components/ProposalTemplates/ExampleTemplateCard';
import ProposalTemplateCard from '../../../components/ProposalTemplates/ProposalTemplateCard';
import NoDataCard from '../../../components/ui/containers/NoDataCard';
import { InfoBoxLoader } from '../../../components/ui/loaders/InfoBoxLoader';
import { ModalType } from '../../../components/ui/modals/ModalProvider';
import { useDecentModal } from '../../../components/ui/modals/useDecentModal';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import { DAO_ROUTES } from '../../../constants/routes';
import useFeatureFlag from '../../../helpers/environmentFeatureFlags';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import useSendAssetsActionModal from '../../../hooks/DAO/useSendAssetsActionModal';
import { useSubscription } from '../../../hooks/DAO/useSubscription';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { analyticsEvents } from '../../../insights/analyticsEvents';
import { useDAOStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import { AirdropData } from '../../../types';
import { ProposalActionType } from '../../../types/proposalBuilder';
import { SubscriptionTier } from '../../../types/subscription';

export function SafeProposalTemplatesPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.ProposalTemplatesPageOpened);
  }, []);

  const { t: tModals } = useTranslation('modals');
  const { t: tProposalTemplate } = useTranslation('proposalTemplate');
  const { t: tCommon } = useTranslation('common');
  const { t: tBreadcrumbs } = useTranslation('breadcrumbs');
  const { t: tProposalMetadata } = useTranslation('proposalMetadata');

  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { proposalTemplates },
    treasury: { assetsFungible },
    node: { safe },
  } = useDAOStore({ daoKey });
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const {
    addressPrefix,
    contracts: { disperse },
    chain,
  } = useNetworkConfigStore();
  const { hasTier } = useSubscription(safe?.address || '0x0', chain.id);
  const isSubscriptionsEnabled = useFeatureFlag('flag_subscriptions');
  const navigate = useNavigate();
  const { addAction, resetActions, setProposalMetadata } = useProposalActionsStore();

  const safeAddress = safe?.address;
  const { openSendAssetsModal } = useSendAssetsActionModal();
  const hasAvailableAssetsForSablierStream =
    assetsFungible.filter(
      asset => !asset.possibleSpam && !asset.nativeToken && parseFloat(asset.balance) > 0,
    ).length > 0;

  const handleAirdropSubmit = useCallback(
    async (data: AirdropData) => {
      if (!safeAddress) return;

      const totalAmount = data.recipients.reduce((acc, recipient) => acc + recipient.amount, 0n);
      let transactions = [
        {
          targetAddress: data.asset.tokenAddress,
          ethValue: {
            bigintValue: 0n,
            value: '0',
          },
          functionName: 'approve',
          parameters: [
            { signature: 'address', value: disperse },
            { signature: 'uint256', value: totalAmount.toString() },
          ],
        },
        {
          targetAddress: disperse,
          ethValue: {
            bigintValue: 0n,
            value: '0',
          },
          functionName: 'disperseToken',
          parameters: [
            { signature: 'address', value: data.asset.tokenAddress },
            {
              signature: 'address[]',
              value: `[${data.recipients.map(recipient => recipient.address).join(',')}]`,
            },
            {
              signature: 'uint256[]',
              value: `[${data.recipients.map(recipient => recipient.amount.toString()).join(',')}]`,
            },
          ],
        },
      ];

      resetActions();
      addAction({
        actionType: ProposalActionType.AIRDROP,
        content: <></>,
        transactions,
      });

      navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safeAddress));
    },
    [addAction, addressPrefix, disperse, navigate, resetActions, safeAddress],
  );

  const { open: openAirdropModal } = useDecentModal(ModalType.AIRDROP, {
    onSubmit: handleAirdropSubmit,
    submitButtonText: tModals('submitProposal'),
  });

  const { open: openFeatureGatedStreamsModal } = useDecentModal(ModalType.FEATURE_GATED_STREAMS);
  const { open: openFeatureGatedAirdropModal } = useDecentModal(ModalType.FEATURE_GATED_AIRDROP);

  const EXAMPLE_TEMPLATES = useMemo(() => {
    if (!safeAddress) return [];

    // Check if user has required tiers for each feature
    const hasProTier = isSubscriptionsEnabled ? hasTier(SubscriptionTier.Pro) : true;
    const hasAdvancedTier = isSubscriptionsEnabled ? hasTier(SubscriptionTier.Advanced) : true;

    return [
      {
        icon: Parachute,
        title: tProposalTemplate('templateAirdropTitle'),
        description: tProposalTemplate('templateAirdropDescription'),
        onProposalTemplateClick: openAirdropModal,
        testId: 'templateAirdrop',
        showUpgradeBadge: isSubscriptionsEnabled && !hasAdvancedTier,
        onUpgradeBadgeClick: openFeatureGatedAirdropModal,
      },
      {
        icon: HourglassMedium,
        title: tProposalTemplate('templateSablierTitle'),
        description: tProposalTemplate('templateSablierDescription'),
        onProposalTemplateClick: () => {
          if (hasAvailableAssetsForSablierStream) {
            navigate(DAO_ROUTES.proposalSablierNew.relative(addressPrefix, safeAddress));
          } else {
            toast.info(tModals('noAssetsWithBalance'));
          }
        },
        testId: 'templateSablier',
        showUpgradeBadge: isSubscriptionsEnabled && !hasProTier,
        onUpgradeBadgeClick: openFeatureGatedStreamsModal,
      },
      {
        icon: ArrowsDownUp,
        title: tProposalTemplate('templateTransferTitle'),
        description: tProposalTemplate('templateTransferDescription'),
        onProposalTemplateClick: openSendAssetsModal,
        testId: 'templateTransfer',
      },
    ];
  }, [
    safeAddress,
    tModals,
    tProposalTemplate,
    openAirdropModal,
    openSendAssetsModal,
    hasAvailableAssetsForSablierStream,
    navigate,
    addressPrefix,
    isSubscriptionsEnabled,
    hasTier,
    openFeatureGatedAirdropModal,
    openFeatureGatedStreamsModal,
  ]);

  const { open: openTransactionBuilderModal } = useDecentModal(ModalType.TRANSACTION_BUILDER, {
    onSubmit: transactionBuilderData => {
      if (!safeAddress) return;

      const defaultProposalMetadata = {
        title: tProposalMetadata('createProposalTemplateTitle'),
        description: tProposalMetadata('createProposalTemplateDescription'),
      };
      const actionType = ProposalActionType.CREATE_TEMPLATE;

      resetActions();
      addAction({
        actionType: actionType,
        content: <></>,
        transactions: transactionBuilderData,
      });
      setProposalMetadata('title', defaultProposalMetadata.title);
      setProposalMetadata('description', defaultProposalMetadata.description);

      navigate(DAO_ROUTES.proposalTemplateNew.relative(addressPrefix, safeAddress));
    },
    submitButtonText: tModals('submitProposal'),
  });

  return (
    <div>
      <PageHeader
        title={tBreadcrumbs('proposalTemplates')}
        breadcrumbs={[
          {
            terminus: tBreadcrumbs('proposalTemplates'),
            path: '',
          },
        ]}
      >
        {canUserCreateProposal && safeAddress && (
          <Button
            onClick={openTransactionBuilderModal}
            data-testid="proposalTemplates-create"
            minW={0}
          >
            <AddPlus />
            <Show above="sm">{tCommon('create')}</Show>
          </Button>
        )}
      </PageHeader>
      <Flex
        flexDirection={proposalTemplates && proposalTemplates.length > 0 ? 'row' : 'column'}
        flexWrap="wrap"
        gap="1rem"
        mb="1rem"
      >
        {!proposalTemplates ? (
          <Box>
            <InfoBoxLoader />
          </Box>
        ) : proposalTemplates.length > 0 ? (
          <Grid
            templateColumns="repeat(3, 1fr)"
            columnGap="1rem"
            w="full"
          >
            {proposalTemplates.map((proposalTemplate, i) => (
              <ProposalTemplateCard
                key={i}
                proposalTemplate={proposalTemplate}
                templateIndex={i}
              />
            ))}
          </Grid>
        ) : (
          <NoDataCard
            translationNameSpace="proposalTemplate"
            emptyText="emptyProposalTemplates"
            emptyTextNotProposer="emptyProposalTemplatesNotProposer"
          />
        )}
      </Flex>

      <Text
        textStyle="text-3xl-regular"
        color="color-white"
      >
        {tProposalTemplate('defaultTemplates')}
      </Text>
      <Grid
        templateColumns="repeat(3, 1fr)"
        columnGap="1rem"
      >
        {EXAMPLE_TEMPLATES.map((exampleTemplate, i) => (
          <ExampleTemplateCard
            key={i}
            icon={exampleTemplate.icon}
            title={exampleTemplate.title}
            description={exampleTemplate.description}
            onProposalTemplateClick={exampleTemplate.onProposalTemplateClick}
            testId={exampleTemplate.testId}
            showUpgradeBadge={exampleTemplate.showUpgradeBadge}
            onUpgradeBadgeClick={exampleTemplate.onUpgradeBadgeClick}
          />
        ))}
      </Grid>
    </div>
  );
}
