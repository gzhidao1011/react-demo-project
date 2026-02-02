/** 默认 locale（英文，符合国际主流） */
const DEFAULT_LOCALE = "en-US";
/** 时间常量（毫秒） */
const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3600_000;
const MS_PER_DAY = 86_400_000;

/** i18n 简写 locale 到 Intl locale 的映射 */
function toIntlLocale(locale: string): string {
  if (locale.startsWith("zh")) return "zh-CN";
  if (locale.startsWith("en")) return "en-US";
  return locale;
}

export interface FormatTimeOptions {
  /** 语言代码（如 zh、en），用于 Intl 和 i18n */
  locale?: string;
  /** 翻译函数，用于静态文案（如 "Just now"、"Today"） */
  t?: (key: string, values?: Record<string, string | number>) => string;
}

/**
 * 格式化相对时间（如 "Just now"、"2 min ago"、"Yesterday 10:30"）
 * 传入 t 时使用 i18n 文案，否则使用英文默认值
 */
export function formatRelativeTime(ts: number, options?: FormatTimeOptions): string {
  const intlLocale = options?.locale ? toIntlLocale(options.locale) : DEFAULT_LOCALE;
  const t = options?.t;

  const now = Date.now();
  const diff = now - ts;
  const date = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msgStartOfDay = new Date(ts);
  msgStartOfDay.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today.getTime() - msgStartOfDay.getTime()) / MS_PER_DAY);

  if (diff < MS_PER_MINUTE) return t ? t("chat.time.justNow") : "Just now";
  if (diff < MS_PER_HOUR) {
    const count = Math.floor(diff / MS_PER_MINUTE);
    return t ? t("chat.time.minAgo", { count }) : `${count} min ago`;
  }
  if (diff < MS_PER_DAY && daysDiff === 0) {
    return date.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" });
  }
  if (daysDiff === 1) {
    const timeStr = date.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" });
    return t ? `${t("chat.time.yesterday")} ${timeStr}` : `Yesterday ${timeStr}`;
  }
  if (daysDiff < 7) {
    return t ? t("chat.time.daysAgo", { count: daysDiff }) : `${daysDiff} days ago`;
  }
  return date.toLocaleDateString(intlLocale, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 格式化日期分隔符（如 "Today"、"Yesterday"、"Jan 30, 2025"）
 * 传入 t 时使用 i18n 文案，否则使用英文默认值
 */
export function formatDateSeparator(ts: number, options?: FormatTimeOptions): string {
  const intlLocale = options?.locale ? toIntlLocale(options.locale) : DEFAULT_LOCALE;
  const t = options?.t;

  const date = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msgStartOfDay = new Date(ts);
  msgStartOfDay.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today.getTime() - msgStartOfDay.getTime()) / MS_PER_DAY);

  if (daysDiff === 0) return t ? t("chat.time.today") : "Today";
  if (daysDiff === 1) return t ? t("chat.time.yesterday") : "Yesterday";
  if (daysDiff < 7) return t ? t("chat.time.daysAgo", { count: daysDiff }) : `${daysDiff} days ago`;
  return date.toLocaleDateString(intlLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
