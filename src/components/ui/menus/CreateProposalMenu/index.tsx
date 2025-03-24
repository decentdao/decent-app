import { Button, Flex, Icon, Text } from '@chakra-ui/react';
import { CaretDown } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Address } from 'viem';
import { DAO_ROUTES } from '../../../../constants/routes';
import { isFeatureEnabled } from '../../../../helpers/featureFlags';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { OptionMenu } from '../OptionMenu';

export function CreateProposalMenu({ safeAddress }: { safeAddress: Address }) {
  const { t } = useTranslation('proposal');

  const { addressPrefix } = useNetworkConfigStore();

  const navigate = useNavigate();

  const options = [
    {
      optionKey: t('createFromScratch'),
      onClick: () => navigate(DAO_ROUTES.proposalNew.relative(addressPrefix, safeAddress)),
    },
    {
      optionKey: t('browseTemplates'),
      onClick: () => navigate(DAO_ROUTES.proposalTemplates.relative(addressPrefix, safeAddress)),
    },
  ];
  if (isFeatureEnabled('flag_iframe_template')) {
    options.push({
      optionKey: t('useDapps'),
      onClick: () => {},
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
