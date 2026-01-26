import path from "node:path"
import { fileURLToPath } from "node:url"
import type { StorybookConfig } from "@storybook/react-vite"

const storybookDir = path.dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  // 说明：统一 Storybook 展示所有包的组件 stories
  // 路径相对于 Storybook 项目根目录（apps/storybook/）
  // 从 apps/storybook/ 向上三级到达 monorepo 根目录：../ -> apps/ -> ../ -> monorepo root
  stories: [
    "../../../packages/propel/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../../../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (viteConfig) => {
    // 说明：monorepo 下 `@repo/*` 往往是 workspace symlink 到 packages/* 的源码
    // 这里放开 Vite 访问范围，并保留 symlink，避免 Storybook/Vite 访问路径受限或解析错位
    const existingAllow = viteConfig?.server?.fs?.allow
    const allowList = Array.isArray(existingAllow) ? existingAllow : existingAllow ? [existingAllow] : []
    const existingExclude = viteConfig?.optimizeDeps?.exclude
    const excludeList = Array.isArray(existingExclude) ? existingExclude : existingExclude ? [existingExclude] : []

    return {
      ...viteConfig,
      // 说明：确保依赖预构建（optimizeDeps）也使用 React 自动 JSX runtime，避免出现 React is not defined
      esbuild: {
        ...(viteConfig.esbuild ?? {}),
        jsx: "automatic",
      },
      optimizeDeps: {
        ...(viteConfig.optimizeDeps ?? {}),
        // 说明：避免把 workspace 源码包当成普通依赖预构建，容易导致重复 React（hooks dispatcher 为 null）
        exclude: Array.from(new Set([...excludeList, "@repo/ui", "@repo/propel"])),
        // 说明：强制每次启动重建预构建产物，避免被旧缓存误伤（可稳定复现/验证修复）
        force: true,
        esbuildOptions: {
          ...(viteConfig.optimizeDeps?.esbuildOptions ?? {}),
          jsx: "automatic",
          jsxImportSource: "react",
        },
      },
      resolve: {
        ...viteConfig.resolve,
        // 说明：pnpm + preserveSymlinks 容易导致重复 React / 找不到 scheduler
        preserveSymlinks: false,
        // 说明：强制所有 workspace 包使用同一份 React（解决 useState 读取 null）
        dedupe: ["react", "react-dom", "scheduler"],
      },
      server: {
        ...viteConfig.server,
        fs: {
          ...viteConfig.server?.fs,
          allow: [
            ...allowList,
            path.resolve(storybookDir, ".."),
            path.resolve(storybookDir, "../.."),
            path.resolve(storybookDir, "../../.."),
          ],
        },
      },
    }
  },
}

export default config
