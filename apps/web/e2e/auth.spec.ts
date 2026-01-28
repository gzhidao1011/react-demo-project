import { expect, test } from "@playwright/test";

/**
 * 认证流程 E2E 测试
 *
 * 测试覆盖：
 * - 用户注册流程
 * - 用户登录流程
 * - Token 刷新流程
 * - 错误处理流程
 *
 * 注意：测试使用 API mock，不依赖真实后端服务
 */

test.describe("认证流程", () => {
  // 测试数据
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  // Mock 注册成功响应
  const getMockRegisterResponse = (email: string) => ({
    code: 0,
    message: "success",
    data: {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresIn: 3600,
      tokenType: "Bearer",
      user: {
        id: "1",
        email: email,
        username: "testuser",
      },
    },
  });

  test.beforeEach(async ({ page }) => {
    // Mock API 响应
    await page.route("**/api/auth/**", async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      // Mock 注册接口（始终成功）
      if (url.includes("/api/auth/register") && method === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(getMockRegisterResponse(testEmail)),
        });
        return;
      }

      // 默认继续请求（如果后端服务可用）
      await route.continue();
    });
  });

  test.describe("用户注册", () => {
    test("应该能够成功注册新用户", async ({ page }) => {
      // 1. 直接导航到注册页（注意应用有 base path /sulan/）
      await page.goto("/sign-up");
      await expect(page).toHaveURL(/.*sign-up/);

      // 2. 填写注册表单
      await page.fill("#email", testEmail);
      await page.fill("#password", testPassword);
      await page.fill("#confirmPassword", testPassword);

      // 3. 提交表单
      await page.click('button:has-text("创建账户")');

      // 4. 验证成功消息和跳转
      // 注意：toast 消息使用 sonner，会在页面右上角显示
      // 等待表单提交完成和页面跳转（注册成功后会在 2 秒后跳转）
      await expect(page).toHaveURL(/.*sign-in/, { timeout: 10000 });
    });

    test("应该显示邮箱格式错误", async ({ page }) => {
      // 导航到注册页
      await page.goto("/sign-up");
      await expect(page).toHaveURL(/.*sign-up/);

      // 输入无效邮箱
      await page.fill("#email", "invalid-email");
      await page.locator("#email").blur();

      // 验证错误消息
      await expect(page.locator("text=/请输入有效的邮箱地址/")).toBeVisible();
    });

    test("应该显示密码不一致错误", async ({ page }) => {
      // 导航到注册页
      await page.goto("/sign-up");
      await expect(page).toHaveURL(/.*sign-up/);

      // 输入不一致的密码
      await page.fill("#email", testEmail);
      await page.fill("#password", testPassword);
      await page.fill("#confirmPassword", "DifferentPassword123!");
      await page.locator("#confirmPassword").blur();

      // 验证错误消息
      await expect(page.locator("text=/两次输入的密码不一致/")).toBeVisible();
    });
  });

  test.describe("用户登录", () => {
    test("应该能够成功登录", async ({ page }) => {
      // 1. 直接导航到登录页
      await page.goto("/sign-in");
      await expect(page).toHaveURL(/.*sign-in/);

      // 为成功登录场景单独 Mock 登录接口
      const mockLoginSuccess = {
        code: 0,
        message: "success",
        data: {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          expiresIn: 3600,
          tokenType: "Bearer",
          user: {
            id: "1",
            email: testEmail,
            username: "testuser",
          },
        },
      };
      await page.route("**/api/auth/login", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockLoginSuccess),
        });
      });

      // 2. 填写登录表单
      await page.fill("#email", testEmail);
      await page.fill("#password", testPassword);

      // 3. 提交表单
      await page.click('button:has-text("登录")');

      // 4. 验证成功消息和跳转
      // 注意：toast 消息使用 sonner，会在页面右上角显示
      // 等待 toast 出现和页面跳转
      await page.waitForTimeout(1000); // 等待 toast 动画
      await expect(page).toHaveURL("/", { timeout: 5000 });
    });

    test("应该显示密码错误提示", async ({ page }) => {
      // 导航到登录页
      await page.goto("/sign-in");
      await expect(page).toHaveURL(/.*sign-in/);

      // 为密码错误场景 Mock 登录接口返回 400 错误
      const mockLoginError = {
        code: 40100,
        message: "用户名或密码错误",
        data: null,
      };
      await page.route("**/api/auth/login", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify(mockLoginError),
        });
      });

      // 输入错误的密码
      await page.fill("#email", testEmail);
      await page.fill("#password", "WrongPassword123!");
      await page.click('button:has-text("登录")');

      // 验证错误消息（可能是 toast 或表单错误）
      // 错误消息可能是 "Request failed with status code 400" 或 "用户名或密码错误"
      await expect(page.locator("text=/用户名或密码错误|登录失败|Request failed with status code 400/")).toBeVisible({
        timeout: 5000,
      });
    });

    test("应该显示邮箱格式错误", async ({ page }) => {
      // 导航到登录页
      await page.goto("/sign-in");
      await expect(page).toHaveURL(/.*sign-in/);

      // 输入无效邮箱
      await page.fill("#email", "invalid-email");
      await page.locator("#email").blur();

      // 验证错误消息
      await expect(page.locator("text=/请输入有效的邮箱地址/")).toBeVisible();
    });
  });

  test.describe("页面导航", () => {
    test("应该能够在注册页和登录页之间切换", async ({ page }) => {
      // 从注册页到登录页
      await page.goto("/sign-up");
      await expect(page).toHaveURL(/.*sign-up/);
      await page.click('button:has-text("立即登录")');
      await expect(page).toHaveURL(/.*sign-in/);

      // 从登录页到注册页
      await page.click('button:has-text("立即注册")');
      await expect(page).toHaveURL(/.*sign-up/);
    });

    test("应该能够取消并返回首页", async ({ page }) => {
      // 导航到注册页
      await page.goto("/sign-up");
      await expect(page).toHaveURL(/.*sign-up/);

      // 点击取消按钮
      await page.click('button:has-text("取消")');

      // 验证返回首页
      await expect(page).toHaveURL("/");
    });
  });
});
