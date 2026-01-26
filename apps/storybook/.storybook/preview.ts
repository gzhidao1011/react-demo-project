import type { Preview } from "@storybook/react";
import React from "react";

// 说明：@repo/ui 的组件样式依赖 Tailwind + 主题变量，这里在 Storybook 全局注入一次即可
import "@repo/tailwind-config/shared-styles";

// 说明：部分组件依赖项目主题变量。Storybook 环境下提供一组最小兜底，避免出现不可读的默认样式。
const defaultThemeVars = {
  "--color-bg-card": "#ffffff",
  "--color-bg-secondary": "#f3f4f6",
  "--color-border": "#e5e7eb",
  "--color-primary": "#4f46e5",
  "--color-text-primary": "#111827",
  "--color-text-secondary": "#6b7280",
} as React.CSSProperties;

const preview: Preview = {
  // 说明：默认开启 autodocs。若某个组件不希望生成文档，可在 meta/story 上使用 tags: ["!autodocs"] 关闭。
  tags: ["autodocs"],
  decorators: [(Story) => React.createElement("div", { style: defaultThemeVars }, React.createElement(Story))],
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
