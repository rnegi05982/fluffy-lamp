import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/** Interpret a wall-clock string (e.g. `2026-10-01T09:00:00`) in `tz` and return the UTC instant. */
export function zonedToUtc(wallClock: string, tz: string): Date {
  return dayjs.tz(wallClock, tz).utc().toDate();
}

/** Format a UTC instant as a wall-clock string in `tz` (e.g. `2026-10-01T05:00:00`). */
export function utcToZoned(instant: Date, tz: string): string {
  return dayjs(instant).tz(tz).format('YYYY-MM-DDTHH:mm:ss');
}

/**
 * Delivery/expiry target: take the calendar date of `baseInstant` in `tz`, add `days`
 * calendar days (so days = 0 means the same day), set the time to `HH:MM`, and return the
 * UTC instant. Calendar add is DST-safe. If the resulting time-of-day is earlier than
 * `baseInstant` (e.g. days = 0 with a time already passed), the target is in the past and the
 * scheduler picks it up on the next tick.
 */
export function scheduleAt(baseInstant: Date, days: number, timeOfDay: string, tz: string): Date {
  const [hStr, mStr] = timeOfDay.split(':');
  const hour = Number(hStr);
  const minute = Number(mStr ?? '0');

  return dayjs(baseInstant)
    .tz(tz)
    .add(days, 'day')
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .utc()
    .toDate();
}
