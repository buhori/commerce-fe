export function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatWeight(grams: number) {
  return grams >= 1000
    ? `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(grams / 1000)} kg`
    : `${new Intl.NumberFormat("id-ID").format(grams)} g`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600], ["month", 30 * 24 * 3600], ["week", 7 * 24 * 3600],
  ["day", 24 * 3600], ["hour", 3600], ["minute", 60],
];

/** "2 jam yang lalu", "kemarin"; anything under a minute reads as "baru saja". */
export function formatRelative(date: Date, now = new Date()) {
  const seconds = (date.getTime() - now.getTime()) / 1000;
  const format = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
  for (const [unit, size] of relativeUnits) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return "baru saja";
}

// Pre-order estimates count calendar days from the order date, like the backend.
export function addDays(days: number, from: Date | string = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date;
}
