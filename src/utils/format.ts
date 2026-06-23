export function formatDisplayDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDurationFromMinutes(value?: number | null) {
  if (value == null) return "0h 0m";

  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes < 0) return "Invalid time record";

  const roundedMinutes = Math.round(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export function formatDurationFromHours(value?: number | null) {
  if (value == null) return "0h 0m";

  const hours = Number(value);
  if (!Number.isFinite(hours) || hours < 0) return "Invalid time record";

  return formatDurationFromMinutes(hours * 60);
}
