import * as amplitude from '@amplitude/analytics-browser';
import { Box, Button, Flex, Show, Text } from '@chakra-ui/react';
import { ArrowsDownUp, HourglassMedium, Parachute } from '@phosphor-icons/react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AddPlus } from '../../../assets/theme/custom/icons/AddPlus';
import ExampleTemplateCard from '../../../components/ProposalTemplates/ExampleTemplateCard';
import ProposalTemplateCard from '../../../components/ProposalTemplates/ProposalTemplateCard';
import NoDataCard from '../../../components/ui/containers/NoDataCard';
import { InfoBoxLoader } from '../../../components/ui/loaders/InfoBoxLoader';
import { AirdropData } from '../../../components/ui/modals/AirdropModal/AirdropModal';
import { ModalType } from '../../../components/ui/modals/ModalProvider';
import { useDecentModal } from '../../../components/ui/modals/useDecentModal';
import PageHeader from '../../../components/ui/page/Header/PageHeader';
import Divider from '../../../components/ui/utils/Divider';
import { DAO_ROUTES } from '../../../constants/routes';
import { useCurrentDAOKey } from '../../../hooks/DAO/useCurrentDAOKey';
import useSendAssetsActionModal from '../../../hooks/DAO/useSendAssetsActionModal';
import { useCanUserCreateProposal } from '../../../hooks/utils/useCanUserSubmitProposal';
import { analyticsEvents } from '../../../insights/analyticsEvents';
import { useStore } from '../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../store/actions/useProposalActionsStore';
import { useDaoInfoStore } from '../../../store/daoInfo/useDaoInfoStore';
import { ProposalActionType } from '../../../types/proposalBuilder';

export function SafeProposalTemplatesPage() {
  useEffect(() => {
    amplitude.track(analyticsEvents.ProposalTemplatesPageOpened);
  }, []);

  const { t } = useTranslation(['modals', 'proposalTemplate', 'common']);
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { proposalTemplates },
    treasury: { assetsFungible },
  } = useStore({ daoKey });
  const { safe } = useDaoInfoStore();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const {
    addressPrefix,
    contracts: { disperse },
  } = useNetworkConfigStore();
  const navigate = useNavigate();
  const { addAction } = useProposalActionsStore();

  const safeAddress = safe?.address;
  const { openSendAssetsModal } = useSendAssetsActionModal();
  const hasAvailableAssetsForSablierStream =
    assetsFungible.filter(
      asset => !asset.possibleSpam && !asset.nativeToken && parseFloat(asset.balance) > 0,
    ).length > 0;

  const handleAirdropSubmit = (data: AirdropData) => {
    if (!safeAddress) return;

    const totalAmount = data.recipients.reduce((acc, recipient) => acc + recipient.amount, 0n);

    addAction({
      actionType: ProposalActionType.AIRDROP,
      content: <></>,
      transactions: [
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
      ],
    });

    navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safeAddress));
  };

  const openAirdropModal = useDecentModal(ModalType.AIRDROP, {
    onSubmit: handleAirdropSubmit,
    submitButtonText: t('submitProposal'),
  });

  const EXAMPLE_TEMPLATES = useMemo(() => {
    if (!safeAddress) return [];

    return [
      {
        icon: Parachute,
        title: t('templateAirdropTitle'),
        description: t('templateAirdropDescription'),
        onProposalTemplateClick: openAirdropModal,
      },
      {
        icon: HourglassMedium,
        title: t('templateSablierTitle'),
        description: t('templateSablierDescription'),
        onProposalTemplateClick: () => {
          if (hasAvailableAssetsForSablierStream) {
            navigate(DAO_ROUTES.proposalSablierNew.relative(addressPrefix, safeAddress));
          } else {
            toast.info(t('noAssetsWithBalance', { ns: 'modals' }));
          }
        },
      },
      {
        icon: ArrowsDownUp,
        title: t('templateTransferTitle'),
        description: t('templateTransferDescription'),
        onProposalTemplateClick: openSendAssetsModal,
      },
    ];
  }, [
    safeAddress,
    t,
    openAirdropModal,
    openSendAssetsModal,
    hasAvailableAssetsForSablierStream,
    navigate,
    addressPrefix,
  ]);

  return (
    <div>
      <PageHeader
        title={t('proposalTemplates', { ns: 'breadcrumbs' })}
        breadcrumbs={[
          {
            terminus: t('proposalTemplates', { ns: 'breadcrumbs' }),
            path: '',
          },
        ]}
      >
        {canUserCreateProposal && safeAddress && (
          <Link to={DAO_ROUTES.proposalTemplateNew.relative(addressPrefix, safeAddress)}>
            <Button minW={0}>
              <AddPlus />
              <Show above="sm">{t('create')}</Show>
            </Button>
          </Link>
        )}
      </PageHeader>
      <Flex
        flexDirection={proposalTemplates && proposalTemplates.length > 0 ? 'row' : 'column'}
        flexWrap="wrap"
        gap="1rem"
      >
        {!proposalTemplates ? (
          <Box>
            <InfoBoxLoader />
          </Box>
        ) : proposalTemplates.length > 0 ? (
          proposalTemplates.map((proposalTemplate, i) => (
            <ProposalTemplateCard
              key={i}
              proposalTemplate={proposalTemplate}
              templateIndex={i}
            />
          ))
        ) : (
          <NoDataCard
            translationNameSpace="proposalTemplate"
            emptyText="emptyProposalTemplates"
            emptyTextNotProposer="emptyProposalTemplatesNotProposer"
          />
        )}
      </Flex>
      <Divider
        variant="light"
        my="2rem"
      />
      <Text
        textStyle="heading-large"
        color="white-0"
        mb="1rem"
      >
        {t('defaultTemplates')}
      </Text>
      <Flex
        flexDirection="row"
        flexWrap="wrap"
        gap="1rem"
      >
        {EXAMPLE_TEMPLATES.map((exampleTemplate, i) => (
          <ExampleTemplateCard
            key={i}
            icon={exampleTemplate.icon}
            title={exampleTemplate.title}
            description={exampleTemplate.description}
            onProposalTemplateClick={exampleTemplate.onProposalTemplateClick}
          />
        ))}
      </Flex>
    </div>
  );
}
