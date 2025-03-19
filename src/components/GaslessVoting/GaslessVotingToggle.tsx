import { Box, Text, HStack, Switch, Flex, Icon, Button, Image } from '@chakra-ui/react';
import { WarningCircle } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getContract } from 'viem';
import { EntryPointAbi } from '../../assets/abi/EntryPointAbi';
import { DETAILS_BOX_SHADOW, ENTRY_POINT_ADDRESS } from '../../constants/common';
import { DAO_ROUTES } from '../../constants/routes';
import { isFeatureEnabled } from '../../helpers/featureFlags';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../store/actions/useProposalActionsStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { BigIntValuePair } from '../../types';
import { formatCoin } from '../../utils';
import { prepareRefillPaymasterAction } from '../../utils/dao/prepareRefillPaymasterActionData';
import { RefillGasData } from '../ui/modals/GaslessVoting/RefillGasTankModal';
import { ModalType } from '../ui/modals/ModalProvider';
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
          isDisabled={isSettings && !canUserCreateProposal}
          isChecked={isEnabled}
          onChange={() => onToggle()}
          variant="secondary"
        />
      </HStack>
    </Box>
  );
}

export function GaslessVotingToggleDAOCreate(props: GaslessVotingToggleProps) {
  const { t } = useTranslation(['daoCreate', 'gaslessVoting']);
  const { chain, gaslessVotingSupported } = useNetworkConfigStore();

  if (!isFeatureEnabled('flag_gasless_voting')) return null;
  if (!gaslessVotingSupported) return null;

  return (
    <Flex
      direction="column"
      gap="0.5rem"
    >
      <Box
        borderRadius="0.75rem"
        bg="neutral-2"
        p="1.5rem"
        display="flex"
        flexDirection="column"
        gap="1.5rem"
        boxShadow={DETAILS_BOX_SHADOW}
        mt={2}
      >
        <Box
          borderRadius="0.5rem"
          border="1px solid"
          borderColor="neutral-3"
          px="1.5rem"
          py="1rem"
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          mt={2}
        >
          <GaslessVotingToggleContent {...props} />
        </Box>
      </Box>
      <StarterPromoBanner />
    </Flex>
  );
}

export function GaslessVotingToggleDAOSettings(props: GaslessVotingToggleProps) {
  const { t } = useTranslation('gaslessVoting');
  const { gaslessVotingSupported, addressPrefix } = useNetworkConfigStore();

  const navigate = useNavigate();
  const publicClient = useNetworkPublicClient();
  const nativeCurrency = publicClient.chain.nativeCurrency;

  const { safe, gaslessVotingEnabled, paymasterAddress } = useDaoInfoStore();

  const { canUserCreateProposal } = useCanUserCreateProposal();

  const [paymasterBalance, setPaymasterBalance] = useState<BigIntValuePair>();
  useEffect(() => {
    if (!paymasterAddress) return;
    const entryPoint = getContract({
      address: ENTRY_POINT_ADDRESS,
      abi: EntryPointAbi,
      client: publicClient,
    });

    entryPoint.read.balanceOf([paymasterAddress]).then(balance => {
      setPaymasterBalance({
        value: balance.toString(),
        bigintValue: balance,
      });
    });
  }, [paymasterAddress, publicClient]);

  const { addAction } = useProposalActionsStore();

  const refillGas = useDecentModal(ModalType.REFILL_GAS, {
    onSubmit: async (refillGasData: RefillGasData) => {
      if (!safe?.address || !paymasterAddress) {
        return;
      }

      const action = prepareRefillPaymasterAction({
        refillAmount: refillGasData.transferAmount,
        paymasterAddress,
        nonceInput: refillGasData.nonceInput,
        nativeToken: nativeCurrency,
      });
      const formattedRefillAmount = formatCoin(
        refillGasData.transferAmount,
        true,
        nativeCurrency.decimals,
        nativeCurrency.symbol,
        false,
      );

      addAction({
        ...action,
        content: (
          <Box>
            <Text>
              {t('refillPaymasterAction', {
                amount: formattedRefillAmount,
                symbol: nativeCurrency.symbol,
              })}
            </Text>
          </Box>
        ),
      });

      navigate(DAO_ROUTES.proposalWithActionsNew.relative(addressPrefix, safe.address));
    },
    showNonceInput: true,
  });

  if (!isFeatureEnabled('flag_gasless_voting')) return null;
  if (!gaslessVotingSupported) return null;

  const formattedPaymasterBalance =
    paymasterBalance &&
    formatCoin(paymasterBalance.value, true, nativeCurrency.decimals, nativeCurrency.symbol, false);

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

      {!gaslessVotingEnabled && <StarterPromoBanner />}

      {gaslessVotingEnabled && (
        <Flex justifyContent="space-between">
          <Flex
            direction="column"
            justifyContent="space-between"
          >
            <Text
              textStyle="labels-small"
              color="neutral-7"
              mb="0.25rem"
            >
              {t('paymasterBalance')}
            </Text>
            <Text
              textStyle="labels-large"
              display="flex"
              alignItems="center"
            >
              {formattedPaymasterBalance}
              <Image
                src={'/images/coin-icon-default.svg'} // @todo: Use the correct image for the token.
                fallbackSrc={'/images/coin-icon-default.svg'}
                alt={nativeCurrency.symbol}
                w="1.25rem"
                h="1.25rem"
                ml="0.5rem"
                mr="0.25rem"
              />
              {nativeCurrency.symbol}
            </Text>
          </Flex>

          <Button
            variant="secondary"
            size="sm"
            isDisabled={!canUserCreateProposal}
            onClick={() => {
              refillGas();
            }}
          >
            {t('addGas')}
          </Button>
        </Flex>
      )}
    </Box>
  );
}
