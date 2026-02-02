import IntlMessageFormat from "intl-messageformat";
import type { Messages } from "./types";

/**
 * 根据点分隔的 key 路径获取嵌套对象的值
 * 例如 getNestedValue(obj, "home.nav.home") 返回 obj.home?.nav?.home
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * 翻译函数
 * 使用 IntlMessageFormat 支持 ICU 语法（plural、select、变量插值）
 *
 * @param messages - 翻译消息对象
 * @param locale - 当前语言
 * @param key - 翻译 key，支持点分隔路径如 "home.nav.home"
 * @param values - 插值变量，如 { count: 1, field: "用户名" }
 * @returns 翻译后的字符串，未找到时返回 key
 */
export function translate(
  messages: Messages,
  locale: string,
  key: string,
  values?: Record<string, string | number>,
): string {
  const message = getNestedValue(messages as Record<string, unknown>, key);
  if (message == null || typeof message !== "string") {
    return key;
  }
  try {
    const formatter = new IntlMessageFormat(message, locale);
    return formatter.format(values ?? {}) as string;
  } catch {
    return key;
  }
}
