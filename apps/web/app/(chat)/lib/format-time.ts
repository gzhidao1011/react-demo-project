/** 默认 locale（英文，符合国际主流） */
const DEFAULT_LOCALE = "en-US";
/** 时间常量（毫秒） */
const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3600_000;
const MS_PER_DAY = 86_400_000;

/**
 * 格式化相对时间（如 "Just now"、"2 min ago"、"Yesterday 10:30"）
 */
export function formatRelativeTime(ts: number, locale = DEFAULT_LOCALE): string {
  const now = Date.now();
  const diff = now - ts;
  const date = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msgStartOfDay = new Date(ts);
  msgStartOfDay.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today.getTime() - msgStartOfDay.getTime()) / MS_PER_DAY);

  if (diff < MS_PER_MINUTE) return "Just now";
  if (diff < MS_PER_HOUR) return `${Math.floor(diff / MS_PER_MINUTE)} min ago`;
  if (diff < MS_PER_DAY && daysDiff === 0) {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }
  if (daysDiff === 1) {
    return `Yesterday ${date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (daysDiff < 7) return `${daysDiff} days ago`;
  return date.toLocaleDateString(locale, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 格式化日期分隔符（如 "Today"、"Yesterday"、"Jan 30, 2025"）
 */
export function formatDateSeparator(ts: number, locale = DEFAULT_LOCALE): string {
  const date = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msgStartOfDay = new Date(ts);
  msgStartOfDay.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today.getTime() - msgStartOfDay.getTime()) / MS_PER_DAY);

  if (daysDiff === 0) return "Today";
  if (daysDiff === 1) return "Yesterday";
  if (daysDiff < 7) return `${daysDiff} days ago`;
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
