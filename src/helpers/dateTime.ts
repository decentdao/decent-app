import differenceInDays from 'date-fns/differenceInDays';
import differenceInHours from 'date-fns/differenceInHours';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import differenceInMonths from 'date-fns/differenceInMonths';
import differenceInYears from 'date-fns/differenceInYears';
import { useTranslation } from 'react-i18next';

/**
 * Takes a Date parameter and returns a human readable string which is either a countdown time, or the
 * total elapsed time, depending on whether the reference date is in the future or past, respectively.
 *
 * @param referenceDate the point of reference (future or past), from which to calculate the time difference,
 * between then and now.
 * @returns a string formatted in the form "{difference} left" if the reference date is in the future,
 * or "{difference} ago" if the reference is in the past.
 */
export function useDateTimeDisplay(referenceDate: Date) {
  const now = new Date();

  // if this is a future date, the display will be a countdown, e.g. "{time} left",
  // otherwise it will display as "{time} ago"

  const isCountdown = referenceDate.getTime() > now.getTime();

  const diffInMinutes = Math.abs(differenceInMinutes(referenceDate, now));
  const diffInMonths = Math.abs(differenceInMonths(referenceDate, now));

  const { t } = useTranslation('common');
  if (diffInMinutes < 5) {
    return t(isCountdown ? 'labelNowishLeft' : 'labelNowishAgo');
  } else if (diffInMinutes < 60) {
    return t(isCountdown ? 'labelMinutesLeft' : 'labelMinutesAgo', {
      count: Math.floor(diffInMinutes),
    });
  } else if (diffInMinutes < 60 * 24) {
    return t(isCountdown ? 'labelHoursLeft' : 'labelHoursAgo', {
      count: Math.abs(differenceInHours(referenceDate, now)),
    });
  } else if (diffInMonths < 1) {
    return t(isCountdown ? 'labelDaysLeft' : 'labelDaysAgo', {
      count: Math.abs(differenceInDays(referenceDate, now)),
    });
  } else if (diffInMonths < 12) {
    return t(isCountdown ? 'labelMonthsLeft' : 'labelMonthsAgo', {
      count: diffInMonths,
    });
  } else {
    return t(isCountdown ? 'labelYearsLeft' : 'labelYearsAgo', {
      count: Math.abs(differenceInYears(referenceDate, now)),
    });
  }
}

/**
 * Takes a duration in seconds and returns a human readable string with the appropriate time unit.
 * Automatically selects the most appropriate unit (minutes, hours, days, weeks, years).
 *
 * @param seconds the duration in seconds (supports number, bigint, or undefined)
 * @returns a string formatted as "{count} {unit}" (e.g., "5 minutes", "2 hours", "1 week")
 */
export function useDurationDisplay(seconds: number | bigint | undefined) {
  const { t } = useTranslation('common');

  // Handle undefined or null
  if (seconds === undefined || seconds === null || seconds === 0n || seconds === 0) {
    return '';
  }

  // Convert bigint to number for calculations
  const numSeconds = typeof seconds === 'bigint' ? Number(seconds) : seconds;
  const absSeconds = Math.abs(numSeconds);

  // Less than 5 minutes
  if (absSeconds < 300) {
    return t('labelNowishLeft').replace(' left', '');
  }

  // Minutes (5 minutes to 1 hour)
  if (absSeconds < 3600) {
    const minutes = Math.floor(absSeconds / 60);
    return t('labelMinutesLeft', { count: minutes }).replace(' left', '');
  }

  // Hours (1 hour to 1 day)
  if (absSeconds < 86400) {
    const hours = Math.floor(absSeconds / 3600);
    return t('labelHoursLeft', { count: hours }).replace(' left', '');
  }

  // Days (1 day to 1 week)
  if (absSeconds < 604800) {
    const days = Math.floor(absSeconds / 86400);
    return t('labelDaysLeft', { count: days }).replace(' left', '');
  }

  // Weeks (1 week to 1 year)
  if (absSeconds < 31536000) {
    const weeks = Math.floor(absSeconds / 604800);
    return t('labelWeeksLeft', { count: weeks }).replace(' left', '');
  }

  // Years
  const years = Math.floor(absSeconds / 31536000);
  return t('labelYearsLeft', { count: years }).replace(' left', '');
}
