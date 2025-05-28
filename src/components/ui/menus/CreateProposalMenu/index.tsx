import { Button, Flex, Icon, Text } from '@chakra-ui/react';
import { CaretDown } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Address } from 'viem';
import { DAO_ROUTES } from '../../../../constants/routes';
import useFeatureFlag from '../../../../helpers/environmentFeatureFlags';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../../../store/actions/useProposalActionsStore';
import { ModalType } from '../../modals/ModalProvider';
import { useDecentModal } from '../../modals/useDecentModal';
import { OptionMenu } from '../OptionMenu';
import { IOption } from '../OptionMenu/types';

export function CreateProposalMenu({ safeAddress }: { safeAddress: Address }) {
  const { t } = useTranslation('proposal');

  const { addressPrefix } = useNetworkConfigStore();
  const { resetActions } = useProposalActionsStore();
  const { open: openDappsBrowserModal } = useDecentModal(ModalType.DAPPS_BROWSER);

  const navigate = useNavigate();
  const iframeFeatureEnabled = useFeatureFlag('flag_iframe_template');

  const options: IOption[] = [];

  // @dev Create a new proposal, clearing any pending actions
  options.push({
    optionKey: t('createFromScratch'),
    onClick: () => {
      resetActions();
      navigate(DAO_ROUTES.proposalNew.relative(addressPrefix, safeAddress));
    },
  });
  // @dev Continue a proposal adding adding a action via a template
  options.push({
    optionKey: t('browseTemplates'),
    onClick: () => {
      resetActions();
      navigate(DAO_ROUTES.proposalTemplates.relative(addressPrefix, safeAddress));
    },
  });
  if (iframeFeatureEnabled) {
    options.push({
      optionKey: t('useDapps'),
      onClick: () => {
        resetActions();
        openDappsBrowserModal();
      },
    });
  }

  return (
    <OptionMenu
      trigger={
        <Flex
          alignItems="center"
          gap={2}
        >
          <Text textStyle="body-base">{t('createProposal')}</Text>
          <Icon
            as={CaretDown}
            boxSize="1.5rem"
          />
        </Flex>
      }
      options={options}
      namespace="proposal"
      buttonAs={Button}
      buttonProps={{
        variant: 'tertiary',
        paddingX: '0.5rem',
        paddingY: '0.25rem',
        _hover: { bg: 'neutral-2' },
        _active: {
          color: 'lilac-0',
          bg: 'neutral-2',
        },
      }}
    />
  );
}
