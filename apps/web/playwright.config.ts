import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 测试配置
 *
 * 运行测试：
 * - pnpm exec playwright test
 * - pnpm exec playwright test --ui (交互式 UI)
 * - pnpm exec playwright test --headed (有头模式)
 */
export default defineConfig({
  // 测试目录
  testDir: "./e2e",

  // 测试超时时间（30秒）
  timeout: 30000,

  // 期望超时时间（5秒）
  expect: {
    timeout: 5000,
  },

  // 并行执行测试
  fullyParallel: true,

  // 失败时是否继续执行其他测试
  forbidOnly: !!process.env.CI,

  // CI 环境下重试失败测试
  retries: process.env.CI ? 2 : 0,

  // 并行工作进程数
  workers: process.env.CI ? 1 : undefined,

  // 测试报告配置
  reporter: "html",

  // 共享配置
  use: {
    // 基础 URL（开发环境，注意应用有 base path /sulan/）
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:5173/sulan",

    // 截图配置
    screenshot: "only-on-failure",

    // 视频配置
    video: "retain-on-failure",

    // 追踪配置
    trace: "on-first-retry",
  },

  // 项目配置（不同浏览器）
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // 可选：添加其他浏览器
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],

  // Web 服务器配置（启动开发服务器）
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    // 等待服务器就绪的检查间隔
    stdout: "ignore",
    stderr: "pipe",
  },
});
