import { Box, Text, HStack, Switch, Flex, Icon, Button, Image } from '@chakra-ui/react';
import { WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useBalance } from 'wagmi';
import { DETAILS_BOX_SHADOW } from '../../constants/common';
import { DAO_ROUTES } from '../../constants/routes';
import { isFeatureEnabled } from '../../helpers/featureFlags';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../store/actions/useProposalActionsStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { BigIntValuePair } from '../../types';
import { formatCoin } from '../../utils';
import { prepareRefillPaymasterActionData } from '../../utils/dao/prepareRefillPaymasterActionData';
import { ModalType } from '../ui/modals/ModalProvider';
import { RefillGasData } from '../ui/modals/RefillGasTankModal';
import { useDecentModal } from '../ui/modals/useDecentModal';
import Divider from '../ui/utils/Divider';
import { StarterPromoBanner } from './StarterPromoBanner';

interface GaslessVotingToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

function GaslessVotingToggleContent({
  isEnabled,
  onToggle,
  isSettings,
}: GaslessVotingToggleProps & { isSettings?: boolean }) {
  const { t } = useTranslation('gaslessVoting');

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
          <Text textStyle={isSettings ? 'body-small' : 'helper-text'}>
            {isSettings ? t('gaslessVotingLabelSettings') : t('gaslessVotingLabel')}
          </Text>
          <Text
            textStyle={isSettings ? 'labels-large' : 'helper-text'}
            color="neutral-7"
          >
            {isSettings ? t('gaslessVotingDescriptionSettings') : t('gaslessVotingDescription')}
          </Text>
        </Flex>
        <Switch
          size="md"
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
  const { t } = useTranslation('gaslessVoting');
  const { chain, gaslessVotingSupported, addressPrefix } = useNetworkConfigStore();

  const navigate = useNavigate();

  // @todo: Retrieve and use the paymaster address here for `gasTankAddress`. Replace safe.address with the paymaster address.
  const { safe } = useDaoInfoStore();
  const paymasterAddress = safe?.address;

  const { data: nativeTokenBalance } = useBalance({
    address: safe?.address,
  });

  const { addAction } = useProposalActionsStore();

  const refillGas = useDecentModal(ModalType.REFILL_GAS, {
    onSubmit: async (refillGasData: RefillGasData) => {
      if (!safe?.address || !paymasterAddress) {
        return;
      }

      const action = prepareRefillPaymasterActionData({
        refillAmount: refillGasData.transferAmount,
        paymasterAddress,
        nonceInput: refillGasData.nonceInput,
        nativeToken: {
          decimals: nativeTokenBalance?.decimals ?? 18,
          symbol: nativeTokenBalance?.symbol ?? 'Native Token',
        },
      });

      addAction({ ...action, content: <></> });

      navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
    },
    showNonceInput: true,
  });

  const { data: balance } = useBalance({ address: paymasterAddress, chainId: chain.id });

  if (!isFeatureEnabled('flag_gasless_voting')) return null;
  if (!gaslessVotingSupported) return null;

  const formattedNativeTokenBalance =
    balance && formatCoin(balance.value, true, balance.decimals, balance.symbol, false);

  const { isEnabled } = props;

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

      {!isEnabled && <StarterPromoBanner />}

      {/* {isEnabled && gasTankAddress && (
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
      )} */}

      {isEnabled && (
        <Flex justifyContent="space-between">
          <Flex
            direction="column"
            justifyContent="space-between"
          >
            <Text
              textStyle="labels-small"
              color="neutral-7"
            >
              {t('paymasterBalance')}
            </Text>
            <Text
              textStyle="labels-large"
              display="flex"
              alignItems="center"
            >
              {formattedNativeTokenBalance}
              <Image
                src={'/images/coin-icon-default.svg'} // @todo: Use the correct image for the token.
                fallbackSrc={'/images/coin-icon-default.svg'}
                alt={balance?.symbol}
                w="1.25rem"
                h="1.25rem"
                ml="0.5rem"
                mr="0.25rem"
              />
              {balance?.symbol}
            </Text>
          </Flex>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              console.log(
                'addGas. Add this action to the proposal, to be submitted via propose changes button.',
              );
              refillGas();

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
      )}
    </Box>
  );
}
