import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    // 测试环境
    environment: "jsdom",
    // 测试文件匹配模式
    include: ["app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    // 全局测试设置文件
    setupFiles: ["./.vitest-setup.ts"],
    // 测试超时时间（30秒，用于处理 userEvent 异步操作）
    testTimeout: 5000,
    // 钩子超时时间
    hookTimeout: 5000,
    // 覆盖率配置
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "app/**/*.test.tsx", "app/**/*.spec.tsx", "**/*.d.ts", "vitest.config.ts"],
    },
    // 全局设置
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
      "@repo/utils": path.resolve(__dirname, "../../packages/utils/src"),
      "@repo/services": path.resolve(__dirname, "../../packages/services/src"),
      "@repo/schemas": path.resolve(__dirname, "../../packages/schemas/src"),
      "@repo/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@repo/propel": path.resolve(__dirname, "../../packages/propel/src"),
    },
  },
});
