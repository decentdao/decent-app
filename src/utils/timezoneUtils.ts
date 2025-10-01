import { zonedTimeToUtc } from 'date-fns-tz';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Combines date and time in user's timezone, converts to UTC timestamp
 */
export const combineDateTimeToUTC = (
  dateString: string,    // ISO date string from DatePicker
  timeString: string,    // "HH:MM" format from TimeInput  
  userTimezone?: string  // Optional override, defaults to browser timezone
): number => {
  const userTz = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Parse date and time in user's timezone
  const dateTime = `${dateString.split('T')[0]}T${timeString}:00`;
  const zonedDateTime = zonedTimeToUtc(dateTime, userTz);
  
  return Math.floor(zonedDateTime.getTime() / 1000);
};

/**
 * Converts UTC timestamp back to user's local date/time for editing
 */
export const utcTimestampToLocalDateTime = (
  timestamp: number,
  userTimezone?: string
): { date: string; time: string } => {
  const userTz = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const localDateTime = formatInTimeZone(
    timestamp * 1000,
    userTz,
    "yyyy-MM-dd'T'HH:mm"
  );
  
  const [date, time] = localDateTime.split('T');
  
  return {
    date: `${date}T00:00:00.000Z`, // Convert to ISO format expected by DatePicker
    time: time
  };
};