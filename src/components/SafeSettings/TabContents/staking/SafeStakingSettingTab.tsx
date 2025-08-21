import { Button, Flex, ListItem, Text, UnorderedList } from '@chakra-ui/react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { useCurrentDAOKey } from '../../../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../../../providers/App/AppProvider';
import { useNetworkConfigStore } from '../../../../providers/NetworkConfig/useNetworkConfigStore';
import { BigIntValuePair, ERC20TokenData, GovernanceType, TokenBalance } from '../../../../types';
import DurationUnitStepperInput from '../../../ui/forms/DurationUnitStepperInput';
import { LabelComponent } from '../../../ui/forms/InputComponent';
import { DisplayAddress } from '../../../ui/links/DisplayAddress';
import { BarLoader } from '../../../ui/loaders/BarLoader';
import { SafeSettingsEdits, SafeSettingsFormikErrors } from '../../../ui/modals/SafeSettingsModal';
import { AssetSelector } from '../../../ui/utils/AssetSelector';
import { SettingsContentBox } from '../../SettingsContentBox';

function emptyTokenBalanceForAddress(
  address: Address,
  name: string,
  symbol: string,
  decimals: number,
): TokenBalance {
  const result: TokenBalance = {
    tokenAddress: address,
    decimals,
    symbol,
    name,
    balance: '0',
    verifiedContract: true,
    nativeToken: false,
    balanceFormatted: '0',
    portfolioPercentage: 0,
  };
  return result;
}

function StakingForm() {
  const { t } = useTranslation('staking');
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { stakedToken, votesToken, erc20Token, type },
  } = useDAOStore({ daoKey });
  const {
    stablecoins: { usdc },
  } = useNetworkConfigStore();
  const {
    values,
    setFieldValue,
    status: { readOnly } = {},
  } = useFormikContext<SafeSettingsEdits>();
  const { errors } = useFormikContext<SafeSettingsEdits>();
  const stakingErrors = (errors as SafeSettingsFormikErrors | undefined)?.staking;

  const { address, minimumStakingPeriod, rewardsTokens } = stakedToken || {};
  const minPeriodValue = Number(
    values.staking?.minimumStakingPeriod?.bigintValue || minimumStakingPeriod || 0n,
  );

  const undistributedTokens =
    stakedToken?.assetsFungible.filter(
      asset => asset.balance !== '0' && !rewardsTokens?.includes(asset.tokenAddress),
    ) || [];

  // Add staking contract holdings, DAO token and USDC
  const mergeTokens: TokenBalance[] = [
    ...(stakedToken?.assetsFungible || []),
    emptyTokenBalanceForAddress(usdc, 'USDC', 'USD Coin', 6),
  ];
  let daoErc20Token: ERC20TokenData | undefined;
  if (type === GovernanceType.AZORIUS_ERC20) {
    daoErc20Token = votesToken;
  } else if (type === GovernanceType.MULTISIG) {
    daoErc20Token = erc20Token;
  }
  if (daoErc20Token) {
    mergeTokens.push(
      emptyTokenBalanceForAddress(
        daoErc20Token.address,
        daoErc20Token.symbol,
        daoErc20Token.name,
        daoErc20Token.decimals,
      ),
    );
  }

  return (
    <>
      {address ? (
        <DisplayAddress
          address={address}
          color="color-charcoal-50"
          textStyle="text-sm-underlined"
          p={0}
        >
          {address}
        </DisplayAddress>
      ) : null}

      <LabelComponent
        label={t('minimumStakingPeriod')}
        helper={t('minimumStakingPeriodHelper')}
        isRequired
        gridContainerProps={{
          mt: 2,
          mb: 4,
          templateColumns: '1fr',
          width: { base: '100%', md: '50%' },
        }}
        errorMessage={stakingErrors?.minimumStakingPeriod}
      >
        <DurationUnitStepperInput
          isDisabled={readOnly}
          secondsValue={minPeriodValue}
          onSecondsValueChange={val => {
            if (val === undefined) {
              return;
            }

            const newMinPeriodValue: BigIntValuePair = {
              bigintValue: BigInt(val),
              value: val.toString(),
            };
            if ((minimumStakingPeriod || 0n) !== newMinPeriodValue.bigintValue) {
              setFieldValue('staking.minimumStakingPeriod', newMinPeriodValue);
            } else {
              setFieldValue('staking.minimumStakingPeriod', undefined);
            }
          }}
          hideSteppers
        />
      </LabelComponent>

      {undistributedTokens.length > 0 && (
        <LabelComponent
          label={t('undistributedTokensTitle')}
          isRequired={false}
          gridContainerProps={{
            my: 2,
            templateColumns: '1fr',
            width: { base: '100%' },
          }}
          helper={t('undistributedTokensHelper')}
        >
          <UnorderedList>
            {undistributedTokens.map(asset => (
              <ListItem key={asset.tokenAddress}>
                <DisplayAddress
                  address={asset.tokenAddress}
                  truncate={false}
                >
                  <Text>{asset.symbol}</Text>
                </DisplayAddress>
              </ListItem>
            ))}
          </UnorderedList>
        </LabelComponent>
      )}

      <LabelComponent
        label={t('rewardTokensTitle')}
        isRequired={false}
        gridContainerProps={{
          templateColumns: '1fr',
          width: { base: '100%' },
        }}
        helper={t('rewardTokensHelper')}
      >
        <AssetSelector
          includeNativeToken
          canSelectMultiple
          disabled={readOnly}
          lockedSelections={rewardsTokens}
          hideBalanceAndMergeTokens={mergeTokens}
          onSelect={addresses => {
            const rewardTokensToBeAdded = addresses.filter(
              a => !rewardsTokens?.includes(a as Address),
            );
            if (rewardTokensToBeAdded.length > 0) {
              setFieldValue(
                'staking.newRewardTokens',
                addresses.filter(a => !rewardsTokens?.includes(a as Address)),
              );
            } else {
              setFieldValue('staking.newRewardTokens', undefined);
            }
          }}
        />
      </LabelComponent>
    </>
  );
}

export function SafeStakingSettingTab() {
  const { t } = useTranslation('staking');

  const { daoKey } = useCurrentDAOKey();
  const {
    node: { safe },
    governance: { stakedToken },
  } = useDAOStore({ daoKey });

  const {
    values,
    setFieldValue,
    status: { readOnly } = {},
  } = useFormikContext<SafeSettingsEdits>();
  const deploying = values.staking?.deploying || false;
  const showForm = stakedToken?.address !== undefined || deploying;

  function NoStakingContract() {
    return (
      <Flex
        flexDirection="column"
        gap="1rem"
      >
        <Text
          textStyle="text-sm-regular"
          color="color-white"
        >
          {t('stakingNull')}
        </Text>
        <Button
          mt={1.5}
          isDisabled={readOnly}
          width="fit-content"
          onClick={() => setFieldValue('staking.deploying', true)}
        >
          {t('deployStaking')}
        </Button>
      </Flex>
    );
  }

  return (
    <>
      {!!safe ? (
        <SettingsContentBox
          px={12}
          py={6}
        >
          <Text
            textStyle="text-lg-regular"
            color="color-white"
          >
            {t('stakingTitle')}
          </Text>
          {showForm ? <StakingForm /> : <NoStakingContract />}
        </SettingsContentBox>
      ) : (
        <Flex
          h="8.5rem"
          width="100%"
          alignItems="center"
          justifyContent="center"
        >
          <BarLoader />
        </Flex>
      )}
    </>
  );
}
