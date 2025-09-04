import { useEffect, useMemo, useState } from 'react';
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
  const [currentTime, setCurrentTime] = useState(() => Math.floor(Date.now() / 1000));

  const calculateAvailability = useMemo(() => {
    // Don't show anything if user is not connected
    if (!isConnected) {
      return {
        isAvailable: false,
        timeRemaining: null,
        displayText: null,
        secondsRemaining: 0,
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
        secondsRemaining: 0,
      };
    }

    const now = BigInt(currentTime);
    const unlockTime = stakedToken.userLastStakeTimestamp + stakedToken.minimumStakingPeriod;
    const secondsRemaining = unlockTime - now;

    // If tokens are already available
    if (secondsRemaining <= 0n) {
      return {
        isAvailable: true,
        timeRemaining: null,
        displayText: t('staking:tokensAvailable'),
        secondsRemaining: 0,
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
      secondsRemaining: secondsRemainingNumber,
    };
  }, [
    stakedToken?.minimumStakingPeriod,
    stakedToken?.userLastStakeTimestamp,
    stakedToken?.userStakedAmount,
    isConnected,
    currentTime,
    t,
  ]);

  // Set up intelligent timer based on time remaining
  useEffect(() => {
    if (!calculateAvailability.secondsRemaining || calculateAvailability.isAvailable) {
      return;
    }

    const secondsRemaining = calculateAvailability.secondsRemaining;
    let interval: number;

    // If more than 2 hours left, update every hour
    if (secondsRemaining > 2 * 60 * 60) {
      interval = 60 * 60 * 1000; // 1 hour in milliseconds
    } 
    // If less than 1 hour left, update every minute
    else if (secondsRemaining < 60 * 60) {
      interval = 60 * 1000; // 1 minute in milliseconds
    }
    // Between 1-2 hours, update every hour
    else {
      interval = 60 * 60 * 1000; // 1 hour in milliseconds
    }

    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, interval);

    return () => clearInterval(timer);
  }, [calculateAvailability.secondsRemaining, calculateAvailability.isAvailable]);

  // Return result without the internal secondsRemaining property
  return {
    isAvailable: calculateAvailability.isAvailable,
    timeRemaining: calculateAvailability.timeRemaining,
    displayText: calculateAvailability.displayText,
  };
}
