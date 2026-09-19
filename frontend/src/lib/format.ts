export interface Money {
  amount: string;
  currency: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format a UTC ISO instant in a specific IANA timezone for display. */
export function formatInTz(iso: string | null, tz: string): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Format a wall-clock string ('YYYY-MM-DDTHH:mm:ss') as-is, without applying a timezone. */
export function formatLocal(s: string | null): string {
  if (!s) return '—';
  const [date, time] = s.split('T');
  const [y, m, d] = (date ?? '').split('-');
  const month = MONTHS[Number(m) - 1] ?? m;
  return `${Number(d)} ${month} ${y}, ${(time ?? '').slice(0, 5)}`;
}

export function formatMoney(m: Money): string {
  return `${m.amount} ${m.currency}`;
}
