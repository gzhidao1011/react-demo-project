import { useContext } from "react";
import { I18nContext } from "./context";
import type { I18nContextValue } from "./types";

/**
 * 获取当前 locale 和翻译能力
 *
 * @returns locale、setLocale、t、isLoading
 * @throws 必须在 I18nProvider 内使用
 */
export function useLocale(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useLocale 必须在 I18nProvider 内使用");
  }
  return context;
}
