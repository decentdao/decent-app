import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StakedTokenData } from '../../types/account';

interface StakeAvailabilityResult {
  isAvailable: boolean;
  timeRemaining: string | null;
  displayText: string | null;
}

export function useStakeAvailability(
  stakedToken: StakedTokenData | undefined,
  isConnected: boolean,
): StakeAvailabilityResult {
  const { t } = useTranslation(['staking', 'common']);

  return useMemo(() => {
    // Don't show anything if user is not connected
    if (!isConnected) {
      return {
        isAvailable: false,
        timeRemaining: null,
        displayText: null,
      };
    }

    // Don't show anything if we don't have the required data
    if (
      !stakedToken?.minimumStakingPeriod ||
      !stakedToken?.userLastStakeTimestamp ||
      !stakedToken?.userStakedAmount ||
      stakedToken.userStakedAmount === 0n
    ) {
      return {
        isAvailable: false,
        timeRemaining: null,
        displayText: null,
      };
    }

    const now = BigInt(Math.floor(Date.now() / 1000)); // Current timestamp in seconds
    const unlockTime = stakedToken.userLastStakeTimestamp + stakedToken.minimumStakingPeriod;
    const secondsRemaining = unlockTime - now;

    // If tokens are already available
    if (secondsRemaining <= 0n) {
      return {
        isAvailable: true,
        timeRemaining: null,
        displayText: t('staking:tokensAvailable'),
      };
    }

    // Calculate time remaining
    const secondsRemainingNumber = Number(secondsRemaining);
    const days = Math.floor(secondsRemainingNumber / (24 * 60 * 60));
    const hours = Math.floor((secondsRemainingNumber % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((secondsRemainingNumber % (60 * 60)) / 60);

    let timeString: string;
    if (days > 0) {
      timeString = days === 1 ? `${days} day` : `${days} days`;
    } else if (hours > 0) {
      timeString = hours === 1 ? `${hours} hour` : `${hours} hours`;
    } else {
      const mins = Math.max(1, minutes);
      timeString = mins === 1 ? `${mins} minute` : `${mins} minutes`;
    }

    return {
      isAvailable: false,
      timeRemaining: timeString,
      displayText: t('staking:tokensAvailableIn', { time: timeString }),
    };
  }, [
    stakedToken?.minimumStakingPeriod,
    stakedToken?.userLastStakeTimestamp,
    stakedToken?.userStakedAmount,
    isConnected,
    t,
  ]);
}
