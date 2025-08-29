import { Flex, Progress, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { formatUnits } from 'viem';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../providers/App/AppProvider';

function BalanceEntry({ label, value }: { label: string; value: string }) {
  return (
    <Flex
      justifyContent="space-between"
      alignItems="flex-start"
      alignSelf="stretch"
    >
      <Text
        width="122px"
        color="color-content-content1-foreground"
        textStyle="text-sm-regular"
      >
        {label}
      </Text>
      <Text
        width="122px"
        height="14px"
        color="color-content-content4-foreground"
        textStyle="text-sm-regular"
        textAlign="end"
      >
        {value}
      </Text>
    </Flex>
  );
}

function ProgressLabel({ color, label }: { color: string; label: string }) {
  return (
    <Flex
      alignItems="center"
      gap="8px"
    >
      <Flex
        width="8px"
        height="8px"
        padding="0px 4px"
        justifyContent="center"
        alignItems="center"
        flexShrink={0}
        aspectRatio="1/1"
        borderRadius="9999px"
        background={color}
      ></Flex>
      <Text
        color="color-primary-100"
        textStyle="text-xs-regular"
      >
        {label}
      </Text>
    </Flex>
  );
}

export default function BalanceCard() {
  const { t } = useTranslation('staking');
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { isAzorius, stakedToken, votesToken, erc20Token },
  } = useDAOStore({ daoKey });

  const unstakedToken = isAzorius ? votesToken : erc20Token;

  const stBalance = stakedToken?.balance || 0n;
  const unStakedBalance = unstakedToken?.balance || 0n;
  const totalBalance = stBalance + unStakedBalance;

  const stakedBalance = formatUnits(stBalance, stakedToken?.decimals || 0);
  const availableBalance = formatUnits(unStakedBalance, unstakedToken?.decimals || 0);

  const stakedPercentage = totalBalance > 0n ? Number((stBalance * 100n) / totalBalance) : 0;
  const availablePercentage =
    totalBalance > 0n ? Number((unStakedBalance * 100n) / totalBalance) : 0;

  return (
    <Flex
      padding="14px 12px"
      direction="column"
      alignItems="flex-start"
      gap="16px"
      alignSelf="stretch"
      borderRadius="14px"
      border="1px solid var(--colors-color-layout-border)"
      boxShadow="0px 1px 2px 0px rgba(0, 0, 0, 0.05)"
    >
      <Flex
        direction="column"
        justifyContent="center"
        alignItems="flex-start"
        gap="16px"
        alignSelf="stretch"
      >
        <Flex
          alignItems="center"
          gap="8px"
          alignSelf="stretch"
        >
          <Text
            color="color-charcoal-400"
            textStyle="labels-large"
          >
            {t('balanceOverview')}
          </Text>
        </Flex>

        <Flex
          direction="column"
          alignItems="flex-start"
          gap="8px"
          alignSelf="stretch"
        >
          <BalanceEntry
            label={t('stakedLabel')}
            value={stakedBalance}
          />
          <BalanceEntry
            label={t('availableLabel')}
            value={availableBalance}
          />
        </Flex>

        <Flex
          alignItems="center"
          gap="8px"
          alignSelf="stretch"
        >
          <Flex
            direction="column"
            alignItems="flex-start"
            gap="8px"
            width="full"
          >
            <Progress
              bg="color-primary-100"
              fill="color-primary-400"
              value={stakedPercentage}
              max={100}
              width="full"
              size="xs"
              h="6px"
              borderRadius="8px"
            />
            <Flex
              justifyContent="space-between"
              alignItems="flex-start"
              alignSelf="stretch"
            >
              <ProgressLabel
                color="color-primary-400"
                label={`${stakedPercentage}% ${t('stakedLabel')}`}
              />
              <ProgressLabel
                color="color-primary-100"
                label={`${availablePercentage}% ${t('availableLabel')}`}
              />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
