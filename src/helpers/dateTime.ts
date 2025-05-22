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
