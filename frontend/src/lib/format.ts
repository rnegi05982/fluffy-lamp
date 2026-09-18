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

export function formatMoney(m: { amount: string; currency: string }): string {
  return `${m.amount} ${m.currency}`;
}
