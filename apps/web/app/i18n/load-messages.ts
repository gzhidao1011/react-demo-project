import type { Messages } from "@repo/i18n";

/**
 * 使用 import.meta.glob 预声明所有语言，Vite 为每种语言生成独立 chunk
 * 按需动态加载，支持 10+ 种语言时控制首屏体积
 */
const modules = import.meta.glob<{ default: Messages }>("../../locales/*.json");

/**
 * 动态加载指定语言的翻译文件
 *
 * @param locale - 语言代码（如 zh、en、ja、ko）
 * @returns 翻译消息对象
 * @throws 语言不存在时抛出错误
 */
export async function loadMessages(locale: string): Promise<Messages> {
  const loader = modules[`../../locales/${locale}.json`];
  if (!loader) {
    throw new Error(`Locale ${locale} not found`);
  }
  const mod = await loader();
  return mod.default;
}
