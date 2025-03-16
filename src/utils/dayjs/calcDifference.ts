import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "./dayjs";

dayjs.extend(relativeTime);

export function formatDifference(createdAt: string): string {
  const formattedDate = dayjs(createdAt).format("YYYY-MM-DD HH:mm");
  if (!createdAt) return "Unknown time";
  return dayjs(formattedDate).fromNow();
}

export function calcDifference(createdAt: string): number {
  const now = dayjs();
  const diffInDays = now.diff(dayjs(createdAt), "day");
  return diffInDays;
}
