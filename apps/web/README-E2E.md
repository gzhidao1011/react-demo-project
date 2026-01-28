# E2E 测试指南

本文档说明如何运行和管理 E2E 测试。

## 安装依赖

E2E 测试使用 Playwright，依赖已包含在 `package.json` 中。

```bash
# 安装 Playwright 浏览器
pnpm exec playwright install chromium
```

## 运行测试

### 基本命令

```bash
# 运行所有 E2E 测试
pnpm --filter @repo/web test:e2e

# 交互式 UI 模式（推荐用于调试）
pnpm --filter @repo/web test:e2e:ui

# 有头模式（显示浏览器窗口）
pnpm --filter @repo/web test:e2e:headed

# 运行特定测试文件
pnpm --filter @repo/web exec playwright test e2e/auth.spec.ts

# 调试模式
pnpm --filter @repo/web exec playwright test --debug
```

## 测试配置

配置文件：`apps/web/playwright.config.ts`

### 环境变量

- `PLAYWRIGHT_TEST_BASE_URL`：测试基础 URL（默认：`http://localhost:5373`）

### 配置说明

- **测试目录**：`./e2e`
- **超时时间**：30 秒
- **并行执行**：启用
- **重试**：CI 环境下重试 2 次
- **Web 服务器**：自动启动开发服务器（`pnpm dev`）

## 测试覆盖

### 认证流程测试 (`e2e/auth.spec.ts`)

- ✅ 用户注册流程
  - 成功注册新用户
  - 邮箱格式错误验证
  - 密码不一致错误验证

- ✅ 用户登录流程
  - 成功登录
  - 密码错误提示
  - 邮箱格式错误验证

- ✅ 页面导航
  - 注册页和登录页之间切换
  - 取消返回首页

## API Mock

测试使用 Playwright 的 `route` 功能来 mock API 响应，不依赖真实后端服务。

Mock 的 API：
- `POST /api/auth/register` - 注册接口
- `POST /api/auth/login` - 登录接口

## 调试技巧

1. **使用 UI 模式**：`pnpm test:e2e:ui` 提供可视化界面
2. **使用有头模式**：`pnpm test:e2e:headed` 可以看到浏览器操作
3. **使用调试模式**：`--debug` 可以逐步执行测试
4. **查看截图和视频**：测试失败时会自动保存截图和视频到 `test-results/` 目录

## CI/CD 集成

在 CI/CD 中运行 E2E 测试：

```yaml
# .github/workflows/e2e.yml
- name: Install Playwright Browsers
  run: pnpm exec playwright install --with-deps chromium

- name: Run E2E tests
  run: pnpm --filter @repo/web test:e2e
  env:
    PLAYWRIGHT_TEST_BASE_URL: http://localhost:5373
```

## 注意事项

1. **测试数据**：每次测试使用唯一的邮箱地址（基于时间戳）
2. **API Mock**：测试使用 mock API，不依赖真实后端
3. **Toast 消息**：成功消息通过页面跳转验证，不直接检测 toast
4. **页面加载**：确保开发服务器已启动或配置了 `webServer`
