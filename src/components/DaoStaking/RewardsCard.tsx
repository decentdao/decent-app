import { Button, Flex, Icon, Text } from '@chakra-ui/react';
import { abis } from '@decentdao/decent-contracts';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getContract } from 'viem';
import { logError } from '../../helpers/errorLogging';
import { useCurrentDAOKey } from '../../hooks/DAO/useCurrentDAOKey';
import { useNetworkWalletClient } from '../../hooks/useNetworkWalletClient';
import { useDAOStore } from '../../providers/App/AppProvider';
import { formatUSD } from '../../utils';
import { DecentTooltip } from '../ui/DecentTooltip';
import Divider from '../ui/utils/Divider';

function ViewTokens({ numOfTokens }: { numOfTokens: number }) {
  const { t } = useTranslation('staking');

  const isMenuDisabled = numOfTokens === 0;
  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="flex-start"
      flex="1 0 0"
    >
      <Text
        alignSelf="stretch"
        color={isMenuDisabled ? 'color-content-muted' : 'color-content-content1-foreground'}
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

  // Create rewards tokens with claimable amounts
  const rewardsTokensWithClaimableBalances = useMemo(() => {
    if (!stakedToken?.rewardsTokens || !stakedToken?.userClaimableRewards?.length) {
      return [];
    }

    return stakedToken.rewardsTokens
      .map((token, index) => {
        const claimableAmount = stakedToken.userClaimableRewards[index] || 0n;
        const formattedClaimable =
          claimableAmount > 0n
            ? (Number(claimableAmount) / Math.pow(10, token.decimals)).toFixed(4)
            : '0';

        return {
          ...token,
          claimableAmount,
          formattedClaimable,
        };
      })
      .filter(token => token.claimableAmount > 0n);
  }, [stakedToken?.rewardsTokens, stakedToken?.userClaimableRewards]);

  const isMenuDisabled = rewardsTokensWithClaimableBalances.length === 0;
  return (
    <Flex
      minHeight="40px"
      padding="0px 16px"
      direction="column"
      justifyContent="center"
      alignItems="flex-start"
      alignSelf="stretch"
      borderRadius="12px"
      border="1px solid"
      borderColor={!isMenuDisabled ? 'color-layout-border' : 'color-layout-border-10'}
      background="color-alpha-black-950"
      cursor={isMenuDisabled ? 'not-allowed' : 'pointer'}
      onClick={() => !isMenuDisabled && setExpanded(!expanded)}
      aria-label="View Rewards"
    >
      {!expanded ? (
        <Flex
          padding="16px 0px"
          justifyContent="space-between"
          alignItems="center"
          alignSelf="stretch"
        >
          <ViewTokens numOfTokens={rewardsTokensWithClaimableBalances.length} />
          <Icon
            as={CaretDown}
            color={isMenuDisabled ? 'color-content-muted' : 'color-content-content1-foreground'}
          />
        </Flex>
      ) : (
        <>
          <Flex
            padding="16px 0px"
            justifyContent="space-between"
            alignItems="center"
            alignSelf="stretch"
          >
            <ViewTokens numOfTokens={rewardsTokensWithClaimableBalances.length} />
            <Icon
              as={CaretUp}
              color={isMenuDisabled ? 'color-content-muted' : 'color-content-content1-foreground'}
            />
          </Flex>
          {rewardsTokensWithClaimableBalances.map((token, index, arr) => (
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
                  {token.formattedClaimable}
                </Text>
              </Flex>
              {index !== arr.length - 1 && index !== 1 && (
                <Divider
                  variant="darker"
                  mb="8px"
                />
              )}
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

  const { data: walletClient } = useNetworkWalletClient();
  const toastRef = useRef<string | number | null>(null);

  // Calculate if rewards are claimable from global state
  const isClaimable = useMemo(() => {
    return stakedToken?.userClaimableRewards?.some(reward => reward > 0n) ?? false;
  }, [stakedToken?.userClaimableRewards]);

  // Calculate total claimable rewards value
  const totalRewards = useMemo(() => {
    if (!stakedToken?.rewardsTokens || !stakedToken?.userClaimableRewards?.length) {
      return 0;
    }

    return stakedToken.rewardsTokens.reduce((acc, token, index) => {
      const claimableAmount = stakedToken.userClaimableRewards[index] || 0n;
      if (claimableAmount > 0n) {
        const tokenAmount = Number(claimableAmount) / Math.pow(10, token.decimals);
        // Estimate USD value based on proportion of claimable vs total balance
        const proportion = token.balance ? tokenAmount / parseFloat(token.balance) : 0;
        return acc + token.usdValue * proportion;
      }
      return acc;
    }, 0);
  }, [stakedToken?.rewardsTokens, stakedToken?.userClaimableRewards]);

  const claimRewardTokensHandler = () => {
    if (!walletClient || !stakedToken?.address) return;
    toastRef.current = toast.info(t('claimRewardPending'), { duration: Infinity });
    const stakeContract = getContract({
      abi: abis.deployables.VotesERC20StakedV1,
      address: stakedToken?.address,
      client: walletClient,
    });

    stakeContract.write
      .claimRewards([walletClient.account.address])
      .then(() => {
        if (toastRef.current) {
          toast.dismiss(toastRef.current);
        }
        toast.success(t('claimRewardSuccess'));
        // Note: Claimable rewards will be updated automatically via the RewardsClaimed event listener
      })
      .catch(e => {
        logError(e);
        if (toastRef.current) {
          toast.dismiss(toastRef.current);
          toast.error(t('claimRewardError'));
        }
      });
  };

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
          <DecentTooltip label={t('claimAllTooltip')}>
            <Button
              isDisabled={!isClaimable}
              onClick={claimRewardTokensHandler}
            >
              {t('claimAll')}
            </Button>
          </DecentTooltip>
        </Flex>
        <RewardsTokens />
      </Flex>
    </Flex>
  );
}
