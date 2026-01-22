/**
 * 获取语义化颜色类名
 * 统一使用项目的 CSS 变量系统
 */
export const colors = {
  // 背景色
  bg: {
    primary: "bg-[var(--color-bg-primary)]",
    secondary: "bg-[var(--color-bg-secondary)]",
    card: "bg-[var(--color-bg-card)]",
    input: "bg-[var(--color-bg-input)]",
    inputFocus: "bg-[var(--color-bg-input-focus)]",
  },
  // 文本色
  text: {
    primary: "text-[var(--color-text-primary)]",
    secondary: "text-[var(--color-text-secondary)]",
    tertiary: "text-[var(--color-text-tertiary)]",
  },
  // 边框色
  border: {
    default: "border-[var(--color-border)]",
    focus: "border-[var(--color-border-focus)]",
  },
  // 主题色
  primary: {
    bg: "bg-[var(--color-primary)]",
    text: "text-[var(--color-primary)]",
    border: "border-[var(--color-primary)]",
  },
} as const;
