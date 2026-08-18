export function formatRelativeTime(
  timestampSeconds: number | null,
  nowMilliseconds = Date.now(),
) {
  if (timestampSeconds == null) return "Time unavailable";
  const elapsed = Math.max(
    0,
    Math.floor((nowMilliseconds - timestampSeconds * 1_000) / 1_000),
  );
  if (elapsed < 60) return `${elapsed || 1} seconds ago`;
  const minutes = Math.floor(elapsed / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function formatFullTimestamp(timestampSeconds: number | null) {
  if (timestampSeconds == null) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "long",
  }).format(new Date(timestampSeconds * 1_000));
}
