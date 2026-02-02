import { isAuthenticated } from "@repo/utils";
import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import type { I18nConfig, I18nContextValue, Locale, Messages } from "./types";
import { translate } from "./use-translation";

/** localStorage 存储 key（未登录用户） */
export const LOCALE_STORAGE_KEY = "locale-preference";

/** Cookie 名称（已登录用户，由后端设置） */
export const LOCALE_COOKIE_NAME = "locale";

/**
 * 从 Cookie 中读取 locale
 * 仅在前端执行，用于已登录用户
 */
function getLocaleFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1].trim()) : null;
}

/**
 * 获取初始 locale
 * 优先级：已登录读 Cookie > localStorage > defaultLocale
 */
function getInitialLocale(defaultLocale: Locale): Locale {
  if (typeof window === "undefined") return defaultLocale;
  if (isAuthenticated()) {
    const fromCookie = getLocaleFromCookie();
    if (fromCookie) return fromCookie;
  }
  const fromStorage = localStorage.getItem(LOCALE_STORAGE_KEY);
  return fromStorage || defaultLocale;
}

/** 持久化 locale（根据登录状态选择存储方式） */
async function persistLocale(
  locale: Locale,
  isAuthenticatedUser: boolean,
  onLocaleChange?: (locale: string) => Promise<void>,
): Promise<void> {
  if (isAuthenticatedUser && onLocaleChange) {
    await onLocaleChange(locale);
  } else if (typeof window !== "undefined") {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps extends I18nConfig {
  children: ReactNode;
}

/**
 * i18n 上下文 Provider
 * 管理 locale 状态、messages 缓存、loadMessages 回调、切换函数
 */
export function I18nProvider({
  children,
  loadMessages,
  defaultLocale = "zh",
  isAuthenticated: isAuthenticatedProp,
  onLocaleChange,
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale(defaultLocale));
  const [messages, setMessages] = useState<Messages>({});
  const [isLoading, setIsLoading] = useState(true);
  const [messagesCache] = useState<Map<Locale, Messages>>(new Map());

  // SSR 安全：仅在客户端调用 isAuthenticated（依赖 sessionStorage）
  const isAuthenticatedUser = typeof window !== "undefined" ? (isAuthenticatedProp ?? isAuthenticated()) : false;

  const loadMessagesForLocale = useCallback(
    async (targetLocale: Locale) => {
      const cached = messagesCache.get(targetLocale);
      if (cached) {
        setMessages(cached);
        return cached;
      }
      setIsLoading(true);
      try {
        const loaded = await loadMessages(targetLocale);
        messagesCache.set(targetLocale, loaded);
        setMessages(loaded);
        return loaded;
      } finally {
        setIsLoading(false);
      }
    },
    [loadMessages, messagesCache],
  );

  useEffect(() => {
    loadMessagesForLocale(locale);
  }, [locale, loadMessagesForLocale]);

  const setLocale = useCallback(
    async (newLocale: Locale) => {
      if (newLocale === locale) return;
      setLocaleState(newLocale);
      await persistLocale(newLocale, isAuthenticatedUser, onLocaleChange);
      await loadMessagesForLocale(newLocale);
    },
    [locale, isAuthenticatedUser, onLocaleChange, loadMessagesForLocale],
  );

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      return translate(messages, locale, key, values);
    },
    [messages, locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      messages,
      isLoading,
      setLocale,
      t,
    }),
    [locale, messages, isLoading, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export { I18nContext };
