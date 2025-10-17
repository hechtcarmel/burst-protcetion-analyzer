export function formatDuration(minutes: number): string {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds}s`;
  }

  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours = minutes / 60;
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }

  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}

export function formatDurationLong(minutes: number): string {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  if (minutes < 60) {
    const mins = Math.round(minutes);
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  }

  const hours = minutes / 60;
  if (hours < 24) {
    return `${hours.toFixed(1)} hour${hours >= 2 ? 's' : ''}`;
  }

  const days = hours / 24;
  return `${days.toFixed(1)} day${days >= 2 ? 's' : ''}`;
}
