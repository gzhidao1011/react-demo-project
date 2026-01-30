/**
 * 格式化相对时间（如「刚刚」「2 分钟前」「昨天 10:30」）
 */
export function formatRelativeTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const date = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msgDate = new Date(ts);
  msgDate.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today.getTime() - msgDate.getTime()) / 86400000);

  if (diff < 60_000) return "刚刚";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000 && daysDiff === 0) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (daysDiff === 1) {
    return `昨天 ${date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  if (daysDiff < 7) return `${daysDiff} 天前`;
  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 格式化日期分隔符（如「今天」「昨天」「2025年1月30日」）
 */
export function formatDateSeparator(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msgDate = new Date(ts);
  msgDate.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today.getTime() - msgDate.getTime()) / 86400000);

  if (daysDiff === 0) return "今天";
  if (daysDiff === 1) return "昨天";
  if (daysDiff < 7) return `${daysDiff} 天前`;
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
