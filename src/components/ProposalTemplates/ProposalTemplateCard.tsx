import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { GearFine } from '@phosphor-icons/react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DAO_ROUTES } from '../../constants/routes';
import useRemoveProposalTemplate from '../../hooks/DAO/proposal/useRemoveProposalTemplate';
import useSubmitProposal from '../../hooks/DAO/proposal/useSubmitProposal';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { useDAOStore } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { ProposalTemplate } from '../../types/proposalBuilder';
import ContentBox from '../ui/containers/ContentBox';
import { OptionMenu } from '../ui/menus/OptionMenu';
import { ModalType } from '../ui/modals/ModalProvider';
import { useDecentModal } from '../ui/modals/useDecentModal';
import Avatar from '../ui/page/Header/Avatar';
import Markdown from '../ui/proposal/Markdown';

type ProposalTemplateCardProps = {
  proposalTemplate: ProposalTemplate;
  templateIndex: number;
};

export default function ProposalTemplateCard({
  proposalTemplate,
  templateIndex,
}: ProposalTemplateCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('proposalTemplate');
  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
  } = useDAOStore({ daoKey });

  const { addressPrefix } = useNetworkConfigStore();

  const { prepareRemoveProposalTemplateProposal } = useRemoveProposalTemplate();
  const { submitProposal } = useSubmitProposal();
  const { canUserCreateProposal } = useCanUserCreateProposal();
  const { title, description } = proposalTemplate;

  const { open: openProposalForm } = useDecentModal(ModalType.CREATE_PROPOSAL_FROM_TEMPLATE, {
    proposalTemplate,
  });
  const { open: openForkTemplateForm } = useDecentModal(ModalType.COPY_PROPOSAL_TEMPLATE, {
    proposalTemplate,
    templateIndex,
  });

  const successCallback = useCallback(() => {
    if (safe?.address) {
      // Redirecting to proposals page so that user will see Proposal for Proposal Template creation
      navigate(DAO_ROUTES.dao.relative(addressPrefix, safe.address));
    }
  }, [navigate, safe, addressPrefix]);

  const nonce = safe?.nextNonce;
  const handleRemoveTemplate = useCallback(async () => {
    const proposalData = await prepareRemoveProposalTemplateProposal(templateIndex);
    if (!!proposalData) {
      submitProposal({
        proposalData,
        nonce,
        pendingToastMessage: t('removeTemplatePendingToastMessage'),
        successToastMessage: t('removeTemplateSuccessToastMessage'),
        failedToastMessage: t('removeTemplateFailureToastMessage'),
        successCallback,
      });
    }
  }, [
    nonce,
    prepareRemoveProposalTemplateProposal,
    submitProposal,
    successCallback,
    t,
    templateIndex,
  ]);

  const manageTemplateOptions = useMemo(() => {
    let options = [];
    const forkTemplateOption = {
      optionKey: 'optionForkTemplate',
      onClick: openForkTemplateForm,
    };
    if (canUserCreateProposal) {
      const removeTemplateOption = {
        optionKey: 'optionRemoveTemplate',
        onClick: handleRemoveTemplate,
      };
      options.push(removeTemplateOption);
    }

    options.push(forkTemplateOption);

    return options;
  }, [canUserCreateProposal, openForkTemplateForm, handleRemoveTemplate]);

  return (
    <ContentBox
      containerBoxProps={{
        minW: '165px',
        minHeight: '112px',
        mx: '0',
        p: '1rem',
      }}
      onClick={canUserCreateProposal ? openProposalForm : undefined}
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
      >
        <Avatar
          size="md"
          address={`0x${title}`}
        />
        <OptionMenu
          trigger={
            <Icon
              as={GearFine}
              color="color-lilac-100"
              width="1.25rem"
              height="1.25rem"
            />
          }
          titleKey="titleManageProposalTemplate"
          options={manageTemplateOptions}
          namespace="menu"
        />
      </Flex>
      <Text
        textStyle="text-xl-regular"
        color="color-white"
        my="0.5rem"
      >
        {title}
      </Text>

      <Box
      // bg="color-alpha-black-900"
      // p="0.5rem"
      // borderRadius="0.75rem"
      >
        <Markdown content={description} />
      </Box>
    </ContentBox>
  );
}
