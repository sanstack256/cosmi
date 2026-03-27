export function getNextRunDate({
  interval,
  customDays,
  startDate,
}: {
  interval: string;
  customDays?: number;
  startDate: string;
}) {
  const base = new Date(startDate);

  if (interval === "monthly") {
    base.setMonth(base.getMonth() + 1);
  } else if (interval === "weekly") {
    base.setDate(base.getDate() + 7);
  } else if (interval === "custom" && customDays) {
    base.setDate(base.getDate() + customDays);
  }

  return base.toISOString();
}