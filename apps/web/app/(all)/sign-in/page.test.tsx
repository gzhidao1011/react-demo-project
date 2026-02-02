import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "../../test-utils";
import "@testing-library/jest-dom/vitest";
import type { ApiResponseBase, LoginResponse } from "@repo/services";
import type { ServerError } from "@repo/utils";
import SignInPage from "./page";

// Mock API 调用
vi.mock("@repo/services", () => ({
  authLogin: vi.fn(),
}));

// Mock 路由
const mockNavigateFn = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigateFn,
}));

// Mock Toast
vi.mock("@repo/propel", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Token 存储工具
vi.mock("@repo/utils", async () => {
  const actual = await vi.importActual("@repo/utils");
  return {
    ...actual,
    saveTokens: vi.fn(),
    handleServerError: vi.fn(),
  };
});

import { toast } from "@repo/propel";
// 导入 mock 函数
import { authLogin } from "@repo/services";
import { handleServerError, saveTokens } from "@repo/utils";

const mockAuthLogin = vi.mocked(authLogin);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);
const mockSaveTokens = vi.mocked(saveTokens);
const mockHandleServerError = vi.mocked(handleServerError);

describe("SignInPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // mockNavigateFn 已经在模块级别定义，这里只需要清除调用记录
    mockNavigateFn.mockClear();
  });

  describe("表单渲染", () => {
    it("应该渲染邮箱输入框", async () => {
      // Arrange & Act
      await renderWithI18n(<SignInPage />);

      // Assert
      expect(screen.getByLabelText("邮箱地址")).toBeInTheDocument();
    });

    it("应该渲染密码输入框", async () => {
      // Arrange & Act
      await renderWithI18n(<SignInPage />);

      // Assert
      expect(screen.getByLabelText("密码")).toBeInTheDocument();
    });

    it("应该渲染登录按钮", async () => {
      // Arrange & Act
      await renderWithI18n(<SignInPage />);

      // Assert
      expect(screen.getByRole("button", { name: /登录/ })).toBeInTheDocument();
    });

    it("应该渲染忘记密码链接", async () => {
      // Arrange & Act
      await renderWithI18n(<SignInPage />);

      // Assert
      expect(screen.getByText("忘记密码？")).toBeInTheDocument();
    });

    it("应该渲染立即注册链接", async () => {
      // Arrange & Act
      await renderWithI18n(<SignInPage />);

      // Assert
      expect(screen.getByText("立即注册")).toBeInTheDocument();
    });

    it("应该初始化为空表单", async () => {
      // Arrange & Act
      await renderWithI18n(<SignInPage />);

      // Assert - 使用 RTL 的断言方法而不是直接访问 DOM 属性
      const emailInput = screen.getByLabelText("邮箱地址");
      const passwordInput = screen.getByLabelText("密码");
      expect(emailInput).toHaveValue("");
      expect(passwordInput).toHaveValue("");
    });
  });

  describe("表单验证", () => {
    it("应该显示邮箱格式错误（当输入无效邮箱时）", async () => {
      // Arrange
      const user = userEvent.setup();
      await renderWithI18n(<SignInPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      // Act
      await user.type(emailInput, "invalid-email");
      await user.tab(); // 触发 onBlur 验证

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/请输入有效的邮箱地址/)).toBeInTheDocument();
      });
    });

    it("应该显示密码必填错误（当密码为空时）", async () => {
      // Arrange
      const user = userEvent.setup();
      await renderWithI18n(<SignInPage />);
      const passwordInput = screen.getByLabelText("密码");

      // Act
      await user.click(passwordInput);
      await user.tab(); // 触发 onBlur 验证

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/密码不能为空/)).toBeInTheDocument();
      });
    });

    it("应该在失去焦点时验证字段（onBlur 模式）", async () => {
      // Arrange
      const user = userEvent.setup();
      await renderWithI18n(<SignInPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      // Act
      await user.type(emailInput, "invalid");
      await user.tab(); // 触发 onBlur

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/请输入有效的邮箱地址/)).toBeInTheDocument();
      });
    });

    it("应该在输入有效数据后清除错误消息", async () => {
      // Arrange
      const user = userEvent.setup();
      await renderWithI18n(<SignInPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      // Act
      await user.type(emailInput, "invalid");
      await user.tab(); // 触发错误
      await user.clear(emailInput);
      await user.type(emailInput, "user@example.com");
      await user.tab(); // 触发验证

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/请输入有效的邮箱地址/)).not.toBeInTheDocument();
      });
    });
  });

  describe("表单提交", () => {
    it("应该调用 authLogin API（当表单有效时）", async () => {
      // Arrange
      const user = userEvent.setup();
      mockAuthLogin.mockResolvedValue({
        code: 0,
        message: "success",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 3600,
        },
      });
      await renderWithI18n(<SignInPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.click(screen.getByRole("button", { name: /登录/ }));

      // Assert
      await waitFor(() => {
        expect(mockAuthLogin).toHaveBeenCalledWith({
          email: "user@example.com",
          password: "password123",
        });
      });
    });

    it("应该传递正确的参数（email 和 password）", async () => {
      // Arrange
      const user = userEvent.setup();
      mockAuthLogin.mockResolvedValue({
        code: 0,
        message: "success",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 3600,
        },
      });
      await renderWithI18n(<SignInPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.click(screen.getByRole("button", { name: /登录/ }));

      // Assert
      await waitFor(() => {
        expect(mockAuthLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "user@example.com",
            password: "password123",
          }),
        );
      });
    });

    it("应该保存 Token（登录成功后）", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockResponse = {
        code: 0,
        message: "success",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 3600,
        },
      };
      mockAuthLogin.mockResolvedValue(mockResponse);
      await renderWithI18n(<SignInPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.click(screen.getByRole("button", { name: /登录/ }));

      // Assert
      await waitFor(() => {
        expect(mockSaveTokens).toHaveBeenCalled();
      });
    });

    it("应该显示成功消息（使用 toast.success）", async () => {
      // Arrange
      const user = userEvent.setup();
      mockAuthLogin.mockResolvedValue({
        code: 0,
        message: "success",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 3600,
        },
      });
      await renderWithI18n(<SignInPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.click(screen.getByRole("button", { name: /登录/ }));

      // Assert
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("登录成功！正在跳转...", {
          duration: 2000,
        });
      });
    });

    it("应该跳转到 Chat 页（登录成功后）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      mockAuthLogin.mockResolvedValue({
        code: 0,
        message: "success",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 3600,
        },
      });
      await renderWithI18n(<SignInPage />);

      // Act
      const emailInput = screen.getByLabelText("邮箱地址");
      const passwordInput = screen.getByLabelText("密码");
      await user.type(emailInput, "user@example.com");
      await user.type(passwordInput, "password123");
      await user.click(screen.getByRole("button", { name: /登录/ }));

      // 等待 API 调用完成
      await waitFor(() => {
        expect(mockAuthLogin).toHaveBeenCalled();
      });

      // 等待保存 token 和显示 toast
      await waitFor(() => {
        expect(mockSaveTokens).toHaveBeenCalled();
        expect(mockToastSuccess).toHaveBeenCalled();
      });

      // 等待导航被调用（登录成功后有 2 秒延迟，所以需要等待更长时间）
      await waitFor(
        () => {
          expect(mockNavigateFn).toHaveBeenCalledWith("/chat", { replace: true });
        },
        { timeout: 5000 }, // 增加超时时间以等待 setTimeout 完成
      );
    });

    it("应该显示错误消息（登录失败时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const mockError = new Error("登录失败");
      mockAuthLogin.mockRejectedValue(mockError);

      // Mock handleServerError 设置表单级错误（用户可见）
      mockHandleServerError.mockImplementation((_error, setError) => {
        setError("root", {
          type: "server",
          message: "登录失败，请重试",
        });
        return {
          type: "form",
          shouldShowToast: false,
        };
      });

      await renderWithI18n(<SignInPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.click(screen.getByRole("button", { name: /登录/ }));

      // Assert - 测试用户可见的错误消息，而不是实现细节
      await waitFor(() => {
        expect(screen.getByText("登录失败，请重试")).toBeInTheDocument();
      });

      // 验证错误消息具有正确的角色（role="alert" 在外层 div 上）
      const errorAlert = screen.getByRole("alert");
      expect(errorAlert).toHaveTextContent("登录失败，请重试");
    });

    it("应该处理字段级错误（API 返回 errors 数组时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const mockError: ServerError = new Error("验证失败");
      mockError.errors = [{ field: "email", message: "邮箱已被使用" }];
      mockAuthLogin.mockRejectedValue(mockError);

      // Mock handleServerError 设置字段级错误（用户可见）
      mockHandleServerError.mockImplementation((_error, setError) => {
        setError("email", {
          type: "server",
          message: "邮箱已被使用",
        });
        return {
          type: "field",
          shouldShowToast: false,
        };
      });

      await renderWithI18n(<SignInPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.click(screen.getByRole("button", { name: /登录/ }));

      // Assert - 测试用户可见的字段级错误消息
      await waitFor(() => {
        expect(screen.getByText("邮箱已被使用")).toBeInTheDocument();
      });

      // 验证错误消息具有正确的角色和关联
      const errorMessage = screen.getByText("邮箱已被使用");
      expect(errorMessage).toHaveAttribute("role", "alert");
      expect(errorMessage).toHaveAttribute("id", "email-error");

      // 验证输入框的 aria-invalid 属性
      const emailInput = screen.getByLabelText("邮箱地址");
      expect(emailInput).toHaveAttribute("aria-invalid", "true");

      // 验证字段级错误不显示 Toast
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it("应该显示系统级错误的 Toast（网络错误时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const networkError = new Error("网络连接失败");
      mockAuthLogin.mockRejectedValue(networkError);

      // Mock handleServerError 返回系统级错误（需要显示 Toast）
      mockHandleServerError.mockImplementation((_error, setError) => {
        setError("root", {
          type: "server",
          message: "网络连接失败，请检查网络设置",
        });
        return {
          type: "system",
          shouldShowToast: true,
          toastMessage: "网络连接失败，请检查网络设置",
        };
      });

      await renderWithI18n(<SignInPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.click(screen.getByRole("button", { name: /登录/ }));

      // Assert - 测试用户可见的表单级错误消息
      await waitFor(() => {
        expect(screen.getByText("网络连接失败，请检查网络设置")).toBeInTheDocument();
      });

      // 验证系统级错误显示 Toast（用户可见的反馈）
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("网络连接失败，请检查网络设置");
      });
    });

    it("应该禁用提交按钮（提交中时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      // 使用未解析的 Promise 来模拟正在进行的异步操作
      let resolvePromise: (value: ApiResponseBase<LoginResponse>) => void;
      const pendingPromise = new Promise<ApiResponseBase<LoginResponse>>((resolve) => {
        resolvePromise = resolve;
      });

      mockAuthLogin.mockReturnValue(pendingPromise);
      await renderWithI18n(<SignInPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      const submitButton = screen.getByRole("button", { name: /登录/ });
      await user.click(submitButton);

      // Assert - 等待按钮被禁用（用户可见的状态）
      await waitFor(
        () => {
          expect(submitButton).toBeDisabled();
        },
        { timeout: 3000 },
      );

      // 验证按钮文本变为"登录中..."（用户可见的反馈）
      expect(submitButton).toHaveTextContent("登录中...");

      // Cleanup - 解析 Promise 以完成测试
      resolvePromise!({
        code: 0,
        message: "success",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 3600,
        },
      });

      // 等待 Promise 完成
      await pendingPromise;
    });
  });

  describe("用户交互", () => {
    it("应该允许用户输入邮箱", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      await renderWithI18n(<SignInPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      // Act
      await user.type(emailInput, "user@example.com");

      // Assert - 使用 RTL 的断言方法而不是直接访问 DOM 属性
      expect(emailInput).toHaveValue("user@example.com");
    });

    it("应该允许用户输入密码", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      await renderWithI18n(<SignInPage />);
      const passwordInput = screen.getByLabelText("密码");

      // Act
      await user.type(passwordInput, "password123");

      // Assert - 使用 RTL 的断言方法，user.type 已经等待完成，通常不需要 waitFor
      expect(passwordInput).toHaveValue("password123");
    });

    it("应该允许用户点击取消按钮返回首页", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      await renderWithI18n(<SignInPage />);

      // Act
      await user.click(screen.getByRole("button", { name: /取消/ }));

      // Assert
      await waitFor(
        () => {
          expect(mockNavigateFn).toHaveBeenCalledWith("/");
        },
        { timeout: 3000 },
      );
    });

    it("应该允许用户点击立即注册跳转到注册页", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      await renderWithI18n(<SignInPage />);

      // Act
      await user.click(screen.getByText("立即注册"));

      // Assert
      await waitFor(
        () => {
          expect(mockNavigateFn).toHaveBeenCalledWith("/sign-up");
        },
        { timeout: 3000 },
      );
    });
  });

  describe("可访问性", () => {
    it("应该为输入框提供正确的 label 和 id", async () => {
      // Arrange & Act
      await renderWithI18n(<SignInPage />);

      // Assert
      const emailInput = screen.getByLabelText("邮箱地址");
      expect(emailInput).toHaveAttribute("id", "email");
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("应该为输入框和 label 正确关联（htmlFor 和 id）", async () => {
      // Arrange & Act
      await renderWithI18n(<SignInPage />);

      // Assert
      const emailInput = screen.getByLabelText("邮箱地址");
      expect(emailInput).toHaveAttribute("id", "email");
      // Label 组件可能使用 htmlFor 或 for 属性，或者通过嵌套关联
      // 只要 getByLabelText 能找到，说明关联正确
      expect(emailInput).toBeInTheDocument();
    });

    it("应该在错误时设置 aria-invalid=true", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      await renderWithI18n(<SignInPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      // Act
      await user.type(emailInput, "invalid");
      await user.tab();

      // Assert
      await waitFor(
        () => {
          expect(emailInput).toHaveAttribute("aria-invalid", "true");
        },
        { timeout: 3000 },
      );
    });

    it("应该为错误消息提供 role=alert", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      await renderWithI18n(<SignInPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      // Act
      await user.type(emailInput, "invalid");
      await user.tab();

      // Assert
      await waitFor(
        () => {
          const errorMessage = screen.getByText(/请输入有效的邮箱地址/);
          expect(errorMessage).toHaveAttribute("role", "alert");
        },
        { timeout: 3000 },
      );
    });
  });
});
