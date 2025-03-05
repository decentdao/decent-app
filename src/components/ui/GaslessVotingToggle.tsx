import { Box, Text, HStack, Switch, Flex, Icon, Button } from '@chakra-ui/react';
import { GasPump, WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useBalance } from 'wagmi';
import { DETAILS_BOX_SHADOW } from '../../constants/common';
import { isFeatureEnabled } from '../../helpers/featureFlags';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { BigIntValuePair } from '../../types';
import { formatCoin } from '../../utils';
import EtherscanLink from './links/EtherscanLink';
import Divider from './utils/Divider';

interface GaslessVotingToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

function GaslessVotingToggleContent({
  isEnabled,
  onToggle,
  isSettings,
}: GaslessVotingToggleProps & { isSettings?: boolean }) {
  const { t } = useTranslation('daoCreate');

  const { canUserCreateProposal } = useCanUserCreateProposal();

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap="1.5rem"
      w="100%"
    >
      <HStack
        justify="space-between"
        width="100%"
        alignItems="flex-start"
      >
        <Flex
          flexDirection="column"
          gap="0.25rem"
        >
          <Text textStyle={isSettings ? 'heading-small' : 'helper-text'}>
            {isSettings
              ? t('gaslessVotingLabelSettings', { ns: 'daoEdit' })
              : t('gaslessVotingLabel')}
          </Text>
          <Text
            textStyle={isSettings ? 'label-large' : 'helper-text'}
            color="neutral-7"
            w="17.25rem"
          >
            {isSettings
              ? t('gaslessVotingDescriptionSettings', { ns: 'daoEdit' })
              : t('gaslessVotingDescription')}
          </Text>
        </Flex>
        <Switch
          size="md"
          isDisabled={!canUserCreateProposal}
          isChecked={isEnabled}
          onChange={() => onToggle()}
          variant="secondary"
        />
      </HStack>
    </Box>
  );
}

export function GaslessVotingToggleDAOCreate(props: GaslessVotingToggleProps) {
  const { t } = useTranslation('daoCreate');
  const { chain, gaslessVotingSupported } = useNetworkConfigStore();

  if (!isFeatureEnabled('flag_gasless_voting')) return null;
  if (!gaslessVotingSupported) return null;

  return (
    <Box
      borderRadius="0.75rem"
      bg="neutral-2"
      p="1.5rem"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      gap="1.5rem"
      boxShadow={DETAILS_BOX_SHADOW}
      mt={2}
    >
      <GaslessVotingToggleContent {...props} />

      <Box
        p="1rem"
        bg="neutral-3"
        borderRadius="0.75rem"
      >
        <Flex alignItems="center">
          <Icon
            as={WarningCircle}
            color="lilac-0"
            width="1.5rem"
            height="1.5rem"
          />
          <Text
            color="lilac-0"
            marginLeft="1rem"
          >
            {t('gaslessVotingGettingStarted', {
              symbol: chain.nativeCurrency.symbol,
            })}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

export function GaslessVotingToggleDAOSettings(
  props: GaslessVotingToggleProps & {
    onGasTankTopupAmountChange: (amount: BigIntValuePair) => void;
  },
) {
  const { t } = useTranslation('daoEdit');
  const { chain, gaslessVotingSupported } = useNetworkConfigStore();

  // @todo: Retrieve and use the paymaster address here for `gasTankAddress`. Replace safe.address with the paymaster address. Remove use of `useDaoInfoStore`.
  const { safe } = useDaoInfoStore();
  const gasTankAddress = safe?.address;

  const { data: balance } = useBalance({ address: gasTankAddress, chainId: chain.id });

  if (!isFeatureEnabled('flag_gasless_voting')) return null;
  if (!gaslessVotingSupported) return null;

  const formattedNativeTokenBalance =
    balance && formatCoin(balance.value, true, balance.decimals, balance.symbol);

  return (
    <Box
      gap="1.5rem"
      display="flex"
      flexDirection="column"
    >
      <Divider
        mt="1rem"
        w={{ base: 'calc(100% + 1.5rem)', md: 'calc(100% + 3rem)' }}
        mx={{ base: '-0.75rem', md: '-1.5rem' }}
      />

      <GaslessVotingToggleContent
        {...props}
        isSettings
      />

      {gasTankAddress && (
        <Box
          borderRadius="0.75rem"
          border="1px solid"
          borderColor="neutral-3"
          p="1rem 0.5rem"
          w="100%"
        >
          <EtherscanLink
            type="address"
            value={gasTankAddress}
            isTextLink
          >
            <Text as="span">{gasTankAddress}</Text>
          </EtherscanLink>
        </Box>
      )}

      <Flex
        mt="-0.55rem"
        justifyContent="space-between"
      >
        <Text textStyle="body-small">
          {t('titleBalance', { ns: 'modals' })}:{' '}
          <Text
            as="span"
            color="neutral-7"
          >
            {formattedNativeTokenBalance}
          </Text>
        </Text>
        <Button
          variant="secondary"
          leftIcon={<Icon as={GasPump} />}
          onClick={() => {
            console.log(
              'addGas. Add this action to the proposal, to be submitted via propose changes button.',
            );

            // @todo: Add UI to set the amount, then call onGasTankTopupAmountChange.
            props.onGasTankTopupAmountChange({
              value: '1',
              bigintValue: 1n,
            });
          }}
        >
          {t('addGas')}
        </Button>
      </Flex>
    </Box>
  );
}
