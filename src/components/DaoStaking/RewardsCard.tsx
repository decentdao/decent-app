import { Button, Flex, Text } from '@chakra-ui/react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {  useDurationDisplay } from '../../helpers/dateTime';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useDAOStore } from '../../providers/App/AppProvider';
import { formatUSD } from '../../utils';
import Divider from '../ui/utils/Divider';

function ViewTokens({ numOfTokens }: { numOfTokens: number }) {
  const { t } = useTranslation('staking');
  
  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="flex-start"
      flex="1 0 0"
    >
      <Text
        alignSelf="stretch"
        color="color-content-content1-foreground"
        textStyle="text-sm-regular"
      >
        {numOfTokens === 1
          ? t('viewToken')
          : numOfTokens > 1
            ? t('viewTokens', { count: numOfTokens })
            : t('noRewardTokens')}
      </Text>
    </Flex>
  );
}

function RewardsTokens() {
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { stakedToken },
  } = useDAOStore({ daoKey });
  const [expanded, setExpanded] = useState(false);

  return (
    <Flex
      minHeight="40px"
      padding="0px 16px"
      direction="column"
      justifyContent="center"
      alignItems="flex-start"
      alignSelf="stretch"
      borderRadius="12px"
      border="1px solid var(--colors-color-layout-border)"
      background="color-alpha-black-950"
      onClick={() => setExpanded(!expanded)}
      aria-label="View 3 Tokens"
    >
      {!expanded ? (
        <Flex
          padding="16px 0px"
          justifyContent="space-between"
          alignItems="center"
          alignSelf="stretch"
        >
          <ViewTokens numOfTokens={stakedToken?.rewardsTokens.length ?? 0} />
          <CaretDown />
        </Flex>
      ) : (
        <>
          <Flex
            padding="16px 0px"
            justifyContent="space-between"
            alignItems="center"
            alignSelf="stretch"
          >
            <ViewTokens numOfTokens={stakedToken?.rewardsTokens.length ?? 0} />
            <CaretUp />
          </Flex>
          {stakedToken?.rewardsTokens.map((token, index, arr) => (
            <Flex
              key={index}
              direction="column"
              alignSelf="stretch"
              >
              <Flex
                gap="4px"
                justifyContent="space-between"
                alignSelf="stretch"
                mb="8px"
              >
                <Text
                  textStyle="text-sm-regular"
                  color="color-layout-foreground"
                >
                  {token.symbol}
                </Text>
                <Text
                  textStyle="text-xs-regular"
                  color="color-content-muted"
                >
                  {token.formattedBalance}
                </Text>
              </Flex>
              {index !== arr.length - 1 && index !== 1 && <Divider variant="darker" mb="8px"/>}
            </Flex>
          ))}
        </>
      )}
    </Flex>
  );
}

export default function RewardsCard() {
  const { t } = useTranslation('staking');
  const { daoKey } = useCurrentDAOKey();
  const {
    governance: { stakedToken },
  } = useDAOStore({ daoKey });

  const totalRewards = stakedToken?.rewardsTokens.reduce((acc, token) => acc + token.usdValue, 0) ?? 0;
  const lockPeriod = useDurationDisplay(stakedToken?.minimumStakingPeriod)
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
            {t('rewardsOverview')}
          </Text>
        </Flex>

        <Flex
          justifyContent="space-between"
          alignItems="center"
          alignSelf="stretch"
        >
          <Text
            color="color-layout-foreground"
            textStyle="text-2xl-regular"
          >
            {formatUSD(totalRewards)}
          </Text>
          <Button>{t('claimAll')}</Button>
        </Flex>

        <RewardsTokens />
      </Flex>

      <Flex
        direction="column"
        alignItems="flex-start"
        gap="8px"
        alignSelf="stretch"
      >
        <Flex
          justifyContent="space-between"
          alignItems="flex-start"
          alignSelf="stretch"
        >
          <Text
            color="color-content-content1-foreground"
            textStyle="text-sm-regular"
          >
            {t('lockPeriod')}
          </Text>
          <Text
            color="color-content-content4-foreground"
            textStyle="text-sm-regular"
          >
            {lockPeriod}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}
