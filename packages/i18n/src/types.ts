/**
 * i18n 类型定义
 * 支持双存储模式：未登录用 localStorage，已登录用后端 Cookie
 *
 * @see .cursor/plans/多语言功能计划/locale-cookie-backend.md
 */

/** 语言代码（BCP 47 简化形式，如 zh、en、ja、ko） */
export type Locale = string;

/** 翻译消息对象，支持嵌套结构 */
export type Messages = Record<string, unknown>;

/** 加载翻译文件的回调函数 */
export type LoadMessagesFn = (locale: string) => Promise<Messages>;

/** I18nProvider 配置 */
export interface I18nConfig {
  /** 加载翻译文件的回调 */
  loadMessages: LoadMessagesFn;
  /** 默认语言，未检测到用户偏好时使用 */
  defaultLocale?: Locale;
  /** 是否已登录，用于选择持久化方式（localStorage vs 后端 Cookie） */
  isAuthenticated?: boolean;
  /** 已登录时更新 locale 的 API 调用（调用 PATCH /api/user/locale） */
  onLocaleChange?: (locale: string) => Promise<void>;
}

/** I18nContext 值 */
export interface I18nContextValue {
  /** 当前语言 */
  locale: Locale;
  /** 翻译消息 */
  messages: Messages;
  /** 是否正在加载翻译 */
  isLoading: boolean;
  /** 设置语言并持久化 */
  setLocale: (locale: Locale) => Promise<void>;
  /** 翻译函数 */
  t: (key: string, values?: Record<string, string | number>) => string;
}
