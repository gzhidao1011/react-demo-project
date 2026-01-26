import { defineConfig } from "vitest/config"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    // 测试环境
    environment: "node",
    // 测试文件匹配模式
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    // 全局测试设置文件
    setupFiles: ["./.vitest-setup.ts"],
    // 覆盖率配置
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "**/*.d.ts",
        "vitest.config.ts",
        "src/index.ts",
      ],
    },
    // 全局设置
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
