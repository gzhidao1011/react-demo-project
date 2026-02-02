import type { Messages } from "@repo/i18n";
import { I18nProvider, useLocale } from "@repo/i18n";
import { type RenderOptions, type RenderResult, render, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { expect } from "vitest";
import zh from "../locales/zh.json";

/** 测试用 loadMessages：返回 zh 翻译 */
async function loadMessagesForTest(_locale: string): Promise<Messages> {
  return zh as Messages;
}

/** 等待 i18n 加载完成后渲染子组件 */
function I18nReady({ children }: { children: React.ReactNode }) {
  const { isLoading } = useLocale();
  if (isLoading) return <div data-testid="i18n-loading" />;
  return <>{children}</>;
}

/** 使用 I18nProvider 包装的 render，供需要 useLocale 的组件使用 */
async function renderWithI18n(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">): Promise<RenderResult> {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <I18nProvider loadMessages={loadMessagesForTest} defaultLocale="zh">
        <I18nReady>{children}</I18nReady>
      </I18nProvider>
    );
  }
  const result = render(ui, { wrapper: Wrapper, ...options });
  await waitFor(
    () => {
      expect(result.queryByTestId("i18n-loading")).not.toBeInTheDocument();
    },
    { timeout: 1000 },
  );
  return result;
}
export { renderWithI18n };
