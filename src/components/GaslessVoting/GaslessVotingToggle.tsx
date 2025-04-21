import { Box, Button, Flex, HStack, Image, Switch, Text } from '@chakra-ui/react';
import { abis } from '@fractal-framework/fractal-contracts';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Address,
  encodeFunctionData,
  getAbiItem,
  getContract,
  Hex,
  toFunctionSelector,
} from 'viem';
import { EntryPoint07Abi } from '../../assets/abi/EntryPoint07Abi';
import { DAO_ROUTES } from '../../constants/routes';
import useFeatureFlag from '../../helpers/environmentFeatureFlags';
import { useDepositInfo } from '../../hooks/DAO/accountAbstraction/useDepositInfo';
import { usePaymasterValidatorStatus } from '../../hooks/DAO/accountAbstraction/usePaymasterValidatorStatus';
import useSubmitProposal from '../../hooks/DAO/proposal/useSubmitProposal';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import useNetworkPublicClient from '../../hooks/useNetworkPublicClient';
import { useNetworkWalletClient } from '../../hooks/useNetworkWalletClient';
import { useCanUserCreateProposal } from '../../hooks/utils/useCanUserSubmitProposal';
import { useStore } from '../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../providers/NetworkConfig/useNetworkConfigStore';
import { useProposalActionsStore } from '../../store/actions/useProposalActionsStore';
import { useDaoInfoStore } from '../../store/daoInfo/useDaoInfoStore';
import { FractalTokenType } from '../../types/fractal';
import { formatCoin } from '../../utils';
import { prepareRefillPaymasterAction } from '../../utils/dao/prepareRefillPaymasterActionData';
import { RefillGasData } from '../ui/modals/GaslessVoting/RefillGasTankModal';
import { ModalType } from '../ui/modals/ModalProvider';
import { useDecentModal } from '../ui/modals/useDecentModal';
import Divider from '../ui/utils/Divider';

interface LocalProposalExecuteData {
  targets: Address[];
  values: bigint[];
  calldatas: Hex[];
}

function GaslessVotingToggleContent({
  isEnabled,
  onToggle,
  isSettings,
  displayNeedStakingLabel,
  isLoading,
}: {
  isEnabled: boolean;
  onToggle: () => void;
  isSettings?: boolean;
  displayNeedStakingLabel?: boolean;
  isLoading?: boolean;
}) {
  const { t } = useTranslation('gaslessVoting');
  const { bundlerMinimumStake } = useNetworkConfigStore();
  const { canUserCreateProposal } = useCanUserCreateProposal();

  const publicClient = useNetworkPublicClient();
  const nativeCurrency = publicClient.chain.nativeCurrency;
  const formattedMinStakeAmount = formatCoin(
    bundlerMinimumStake || 0n,
    true,
    nativeCurrency.decimals,
    nativeCurrency.symbol,
    false,
  );

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
          {displayNeedStakingLabel && (
            <Text
              textStyle={isSettings ? 'labels-large' : 'helper-text'}
              color="neutral-7"
            >
              {t('gaslessStakingDescription', {
                amount: formattedMinStakeAmount,
                symbol: nativeCurrency.symbol,
              })}
            </Text>
          )}
        </Flex>
        <Switch
          size="md"
          isDisabled={(isSettings && !canUserCreateProposal) || isLoading}
          isChecked={isEnabled}
          onChange={() => onToggle()}
          variant="secondary"
        />
      </HStack>
    </Box>
  );
}

export function GaslessVotingToggleDAOSettings() {
  const { t } = useTranslation(['gaslessVoting', 'proposalMetadata', 'modals']);
  const { submitProposal, pendingCreateTx } = useSubmitProposal();
  const { daoKey } = useCurrentDAOKey();
  const { governanceContracts } = useStore({ daoKey });

  const {
    addressPrefix,
    contracts: { accountAbstraction, paymaster: paymasterConfig },
    bundlerMinimumStake,
  } = useNetworkConfigStore();

  const navigate = useNavigate();
  const publicClient = useNetworkPublicClient();
  const nativeCurrency = publicClient.chain.nativeCurrency;

  const { safe, paymasterAddress } = useDaoInfoStore();
  const { depositInfo } = useDepositInfo(paymasterAddress);
  const { isValidatorSet, isLoading: isLoadingValidatorStatus } = usePaymasterValidatorStatus();

  const { addAction } = useProposalActionsStore();
  const { data: walletClient } = useNetworkWalletClient();

  const isLoading = isLoadingValidatorStatus || pendingCreateTx;

  const handleToggle = async () => {
    if (!safe?.address || !paymasterAddress || !paymasterConfig || isLoading || !safe.nextNonce)
      return;

    const preparedTransactions: {
      target: Address;
      value: bigint;
      abi: any;
      functionName: string;
      args: any[];
    }[] = [];
    let proposalDescription = '';
    let proposalTitle = '';

    const strategies = governanceContracts.strategies;
    const validatorActions: {
      strategyAddress: Address;
      validatorAddress: Address;
      selector: Hex;
    }[] = [];

    for (const strategy of strategies) {
      let validatorAddress: Address | undefined;
      let selector: Hex | undefined;
      if (strategy.type === FractalTokenType.erc20) {
        validatorAddress = paymasterConfig.linearERC20VotingV1ValidatorV1;
        selector = toFunctionSelector(getAbiItem({ abi: abis.LinearERC20VotingV1, name: 'vote' }));
      } else if (strategy.type === FractalTokenType.erc721) {
        validatorAddress = paymasterConfig.linearERC721VotingV1ValidatorV1;
        selector = toFunctionSelector(getAbiItem({ abi: abis.LinearERC721VotingV1, name: 'vote' }));
      }

      if (validatorAddress && selector) {
        validatorActions.push({ strategyAddress: strategy.address, validatorAddress, selector });
      }
    }

    if (isValidatorSet) {
      proposalTitle = t('disableSponsorshipProposalTitle', { ns: 'proposalMetadata' });
      proposalDescription = t('disableSponsorshipProposalDescription', { ns: 'proposalMetadata' });
      for (const action of validatorActions) {
        preparedTransactions.push({
          target: paymasterAddress,
          value: 0n,
          abi: abis.DecentPaymasterV1,
          functionName: 'removeFunctionValidator',
          args: [action.strategyAddress, action.selector],
        });
      }
    } else {
      proposalTitle = t('enableSponsorshipProposalTitle', { ns: 'proposalMetadata' });
      proposalDescription = t('enableSponsorshipProposalDescription', { ns: 'proposalMetadata' });
      for (const action of validatorActions) {
        preparedTransactions.push({
          target: paymasterAddress,
          value: 0n,
          abi: abis.DecentPaymasterV1,
          functionName: 'setFunctionValidator',
          args: [action.strategyAddress, action.selector, action.validatorAddress],
        });
      }
    }

    if (preparedTransactions.length === 0) {
      console.error('No valid validator actions could be prepared.');
      return;
    }

    const proposalExecuteData: LocalProposalExecuteData = {
      targets: preparedTransactions.map(tx => tx.target),
      values: preparedTransactions.map(tx => tx.value),
      calldatas: preparedTransactions.map(tx =>
        encodeFunctionData({
          abi: tx.abi,
          functionName: tx.functionName,
          args: tx.args,
        }),
      ),
    };

    await submitProposal({
      proposalData: {
        ...proposalExecuteData,
        metaData: {
          title: proposalTitle,
          description: proposalDescription,
          documentationUrl: '',
        },
      },
      pendingToastMessage: t('pendingCreateProposalToast', { ns: 'modals' }),
      successToastMessage: t('successCreateProposalToast', { ns: 'modals' }),
      failedToastMessage: t('failedCreateProposalToast', { ns: 'modals' }),
      nonce: safe.nextNonce,
      successCallback: () => {
        navigate(DAO_ROUTES.proposals.relative(addressPrefix, safe.address));
      },
    });
  };

  const refillGas = useDecentModal(ModalType.REFILL_GAS, {
    onSubmit: async (refillGasData: RefillGasData) => {
      if (!safe?.address || !paymasterAddress || !accountAbstraction) {
        return;
      }

      if (refillGasData.isDirectDeposit) {
        if (!walletClient) {
          throw new Error('Wallet client not found');
        }

        const entryPoint = getContract({
          address: accountAbstraction.entryPointv07,
          abi: EntryPoint07Abi,
          client: walletClient,
        });

        entryPoint.write.depositTo([paymasterAddress], {
          value: refillGasData.transferAmount,
        });
        return;
      }

      const action = prepareRefillPaymasterAction({
        refillAmount: refillGasData.transferAmount,
        paymasterAddress,
        nativeToken: nativeCurrency,
        entryPointAddress: accountAbstraction.entryPointv07,
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
  });

  const gaslessFeatureEnabled = useFeatureFlag('flag_gasless_voting');
  const isStakingRequired = bundlerMinimumStake !== undefined && bundlerMinimumStake > 0n;
  const gaslessStakingRelevant = gaslessFeatureEnabled && isStakingRequired;
  const displayNeedStakingLabel =
    gaslessStakingRelevant &&
    isValidatorSet &&
    (depositInfo?.stake || 0n) < (bundlerMinimumStake || 0n);

  console.log({ gaslessFeatureEnabled, paymasterAddress });

  if (!gaslessFeatureEnabled) return null;

  const paymasterBalance = depositInfo?.balance || 0n;
  const stakedAmount = depositInfo?.stake || 0n;
  const formattedPaymasterBalance = formatCoin(
    paymasterBalance,
    true,
    nativeCurrency.decimals,
    nativeCurrency.symbol,
    false,
  );
  const formattedPaymasterStakedAmount = formatCoin(
    stakedAmount,
    true,
    nativeCurrency.decimals,
    nativeCurrency.symbol,
    false,
  );

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
        isEnabled={isValidatorSet}
        onToggle={handleToggle}
        isSettings
        displayNeedStakingLabel={displayNeedStakingLabel}
        isLoading={isLoading}
      />

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
              src={'/images/coin-icon-default.svg'}
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
          onClick={() => {
            refillGas();
          }}
        >
          {t('addGas')}
        </Button>
      </Flex>

      {gaslessStakingRelevant && (
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
              {t('paymasterStakedAmount')}
            </Text>
            <Text
              textStyle="labels-large"
              display="flex"
              alignItems="center"
            >
              {formattedPaymasterStakedAmount}
              <Image
                src={'/images/coin-icon-default.svg'}
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
        </Flex>
      )}
    </Box>
  );
}
