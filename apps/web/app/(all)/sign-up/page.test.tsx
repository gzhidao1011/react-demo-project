import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { ApiResponseBase, LoginResponse } from "@repo/services";
import type { AxiosResponse } from "axios";
import SignUpPage from "./page";

// Mock API 调用
vi.mock("@repo/services", () => ({
  authRegister: vi.fn(),
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
  toastError: vi.fn(),
}));

// Mock 错误处理工具（toastError 内部会调用 handleServerError）
vi.mock("@repo/utils", async () => {
  const actual = await vi.importActual("@repo/utils");
  return {
    ...actual,
    handleServerError: vi.fn(),
  };
});

import { toast, toastError } from "@repo/propel";
// 导入 mock 函数
import { authRegister } from "@repo/services";
import { handleServerError } from "@repo/utils";

const mockAuthRegister = vi.mocked(authRegister);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toastError);
const mockHandleServerError = vi.mocked(handleServerError);

describe("SignUpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // mockNavigateFn 已经在模块级别定义，这里只需要清除调用记录
    mockNavigateFn.mockClear();

    // 设置默认的 handleServerError mock 实现
    mockHandleServerError.mockImplementation((error, setError, defaultMessage) => {
      // 模拟设置表单级错误
      setError("root", {
        type: "server",
        message: defaultMessage || "操作失败，请检查网络连接",
      });
      // 判断是否为系统级错误
      const isSystem = error instanceof Error && error.message.includes("网络");
      return {
        type: isSystem ? "system" : "form",
        shouldShowToast: isSystem,
        toastMessage: isSystem ? "网络连接失败，请检查网络设置" : undefined,
      };
    });
  });

  describe("表单渲染", () => {
    it("应该渲染邮箱输入框", () => {
      // Arrange & Act
      render(<SignUpPage />);

      // Assert
      expect(screen.getByLabelText("邮箱地址")).toBeInTheDocument();
    });

    it("应该渲染密码输入框", () => {
      // Arrange & Act
      render(<SignUpPage />);

      // Assert
      expect(screen.getByLabelText("密码")).toBeInTheDocument();
    });

    it("应该渲染确认密码输入框", () => {
      // Arrange & Act
      render(<SignUpPage />);

      // Assert
      expect(screen.getByLabelText("确认密码")).toBeInTheDocument();
    });

    it("应该渲染注册按钮", () => {
      // Arrange & Act
      render(<SignUpPage />);

      // Assert
      expect(screen.getByRole("button", { name: /创建账户/ })).toBeInTheDocument();
    });

    it("应该渲染取消按钮", () => {
      // Arrange & Act
      render(<SignUpPage />);

      // Assert
      expect(screen.getByRole("button", { name: /取消/ })).toBeInTheDocument();
    });

    it("应该渲染立即登录链接", () => {
      // Arrange & Act
      render(<SignUpPage />);

      // Assert
      expect(screen.getByText("立即登录")).toBeInTheDocument();
    });

    it("应该初始化为空表单", () => {
      // Arrange & Act
      render(<SignUpPage />);

      // Assert
      const emailInput = screen.getByLabelText("邮箱地址");
      const passwordInput = screen.getByLabelText("密码");
      const confirmPasswordInput = screen.getByLabelText("确认密码");
      expect(emailInput).toHaveValue("");
      expect(passwordInput).toHaveValue("");
      expect(confirmPasswordInput).toHaveValue("");
    });
  });

  describe("表单验证", () => {
    it("应该显示邮箱格式错误（当输入无效邮箱时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      // Act
      await user.type(emailInput, "invalid-email");
      await user.tab(); // 触发 onBlur 验证

      // Assert
      await waitFor(
        () => {
          expect(screen.getByText(/请输入有效的邮箱地址/)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("应该显示密码必填错误（当密码为空时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const passwordInput = screen.getByLabelText("密码");

      // Act
      await user.click(passwordInput);
      await user.tab(); // 触发 onBlur 验证

      // Assert
      await waitFor(
        () => {
          expect(screen.getByText(/密码不能为空/)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("应该显示密码长度错误（当密码少于 6 个字符时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const passwordInput = screen.getByLabelText("密码");

      // Act
      await user.type(passwordInput, "12345"); // 只有 5 个字符
      await user.tab(); // 触发 onBlur 验证

      // Assert
      await waitFor(
        () => {
          expect(screen.getByText(/密码至少需要 6 个字符/)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("应该显示密码不一致错误（当两次密码不一致时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const passwordInput = screen.getByLabelText("密码");
      const confirmPasswordInput = screen.getByLabelText("确认密码");

      // Act
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password456");
      await user.tab(); // 触发 onBlur 验证

      // Assert
      await waitFor(
        () => {
          expect(screen.getByText(/两次输入的密码不一致/)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("应该在失去焦点时验证字段（onBlur 模式）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      // Act
      await user.type(emailInput, "invalid");
      await user.tab(); // 触发 onBlur

      // Assert
      await waitFor(
        () => {
          expect(screen.getByText(/请输入有效的邮箱地址/)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("应该在输入有效数据后清除错误消息", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      // Act - 先输入无效数据
      await user.type(emailInput, "invalid");
      await user.tab(); // 触发错误

      // Assert - 验证错误显示
      await waitFor(
        () => {
          expect(screen.getByText(/请输入有效的邮箱地址/)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Act - 输入有效数据
      await user.clear(emailInput);
      await user.type(emailInput, "user@example.com");
      await user.tab(); // 触发验证

      // Assert - 验证错误消失
      await waitFor(
        () => {
          expect(screen.queryByText(/请输入有效的邮箱地址/)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });

  describe("用户交互", () => {
    it("应该允许用户输入邮箱", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const emailInput = screen.getByLabelText("邮箱地址") as HTMLInputElement;

      // Act
      await user.type(emailInput, "user@example.com");

      // Assert
      expect(emailInput.value).toBe("user@example.com");
    });

    it("应该允许用户输入密码", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const passwordInput = screen.getByLabelText("密码") as HTMLInputElement;

      // Act
      await user.type(passwordInput, "password123");

      // Assert
      expect(passwordInput.value).toBe("password123");
    });

    it("应该允许用户输入确认密码", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const confirmPasswordInput = screen.getByLabelText("确认密码") as HTMLInputElement;

      // Act
      await user.type(confirmPasswordInput, "password123");

      // Assert
      expect(confirmPasswordInput.value).toBe("password123");
    });

    it("应该允许用户切换密码显示/隐藏", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const passwordInput = screen.getByLabelText("密码") as HTMLInputElement;
      // 页面上有两个"显示密码"按钮（密码和确认密码），使用 getAllByLabelText 并选择第一个
      const toggleButtons = screen.getAllByLabelText("显示密码");
      const passwordToggleButton = toggleButtons[0]; // 第一个是密码字段的切换按钮

      // Act
      await user.type(passwordInput, "password123");
      await user.click(passwordToggleButton);

      // Assert
      expect(passwordInput.type).toBe("text");
      // 验证密码字段的切换按钮变为"隐藏密码"
      const hideButtons = screen.getAllByLabelText("隐藏密码");
      expect(hideButtons.length).toBeGreaterThan(0);
    });

    it("应该允许用户切换确认密码显示/隐藏", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const confirmPasswordInput = screen.getByLabelText("确认密码") as HTMLInputElement;
      const toggleButtons = screen.getAllByLabelText("显示密码");
      const confirmPasswordToggle = toggleButtons[1]; // 第二个是确认密码的切换按钮

      // Act
      await user.type(confirmPasswordInput, "password123");
      await user.click(confirmPasswordToggle);

      // Assert
      expect(confirmPasswordInput.type).toBe("text");
    });

    it("应该允许用户点击取消按钮返回首页", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const cancelButton = screen.getByRole("button", { name: /取消/ });

      // Act
      await user.click(cancelButton);

      // Assert
      expect(mockNavigateFn).toHaveBeenCalledWith("/");
    });

    it("应该允许用户点击立即登录跳转到登录页", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const loginLink = screen.getByText("立即登录");

      // Act
      await user.click(loginLink);

      // Assert
      expect(mockNavigateFn).toHaveBeenCalledWith("/sign-in");
    });

    it("应该支持键盘导航（Tab键在字段间切换）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);

      // Act & Assert - 使用 Tab 键导航
      // 第一个 Tab：邮箱输入框
      await user.tab();
      expect(screen.getByLabelText("邮箱地址")).toHaveFocus();

      // 第二个 Tab：密码输入框
      await user.tab();
      expect(screen.getByLabelText("密码")).toHaveFocus();

      // 第三个 Tab：密码显示/隐藏按钮（这是正确的键盘导航行为）
      await user.tab();
      const passwordToggleButton = screen.getAllByLabelText("显示密码")[0];
      expect(passwordToggleButton).toHaveFocus();

      // 第四个 Tab：确认密码输入框
      await user.tab();
      expect(screen.getByLabelText("确认密码")).toHaveFocus();

      // 第五个 Tab：确认密码显示/隐藏按钮
      await user.tab();
      const confirmPasswordToggleButton = screen.getAllByLabelText("显示密码")[1];
      expect(confirmPasswordToggleButton).toHaveFocus();

      // 第六个 Tab：取消按钮
      await user.tab();
      expect(screen.getByRole("button", { name: /取消/ })).toHaveFocus();

      // 第七个 Tab：提交按钮
      await user.tab();
      expect(screen.getByRole("button", { name: /创建账户/ })).toHaveFocus();
    });
  });

  describe("表单提交", () => {
    it("应该调用 authRegister API（当表单有效时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      mockAuthRegister.mockResolvedValue({
        code: 0,
        message: "success",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 3600,
        },
      });
      render(<SignUpPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.type(screen.getByLabelText("确认密码"), "password123");
      await user.click(screen.getByRole("button", { name: /创建账户/ }));

      // Assert
      await waitFor(
        () => {
          expect(mockAuthRegister).toHaveBeenCalledWith({
            email: "user@example.com",
            password: "password123",
          });
        },
        { timeout: 3000 },
      );
    });

    it("应该传递正确的参数（email 和 password）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      mockAuthRegister.mockResolvedValue({
        code: 0,
        message: "success",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 3600,
        },
      });
      render(<SignUpPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "test@example.com");
      await user.type(screen.getByLabelText("密码"), "testpassword");
      await user.type(screen.getByLabelText("确认密码"), "testpassword");
      await user.click(screen.getByRole("button", { name: /创建账户/ }));

      // Assert
      await waitFor(
        () => {
          expect(mockAuthRegister).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "testpassword",
          });
        },
        { timeout: 3000 },
      );
    });

    it("应该显示成功消息（使用 toast.success）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      mockAuthRegister.mockResolvedValue({
        code: 0,
        message: "success",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 3600,
        },
      });
      render(<SignUpPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.type(screen.getByLabelText("确认密码"), "password123");
      await user.click(screen.getByRole("button", { name: /创建账户/ }));

      // Assert
      await waitFor(
        () => {
          expect(mockToastSuccess).toHaveBeenCalledWith("注册成功！正在跳转到登录页...", {
            duration: 2000,
          });
        },
        { timeout: 3000 },
      );
    });

    it("应该跳转到登录页（注册成功后）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      mockAuthRegister.mockResolvedValue({
        code: 0,
        message: "success",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 3600,
        },
      });
      render(<SignUpPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.type(screen.getByLabelText("确认密码"), "password123");
      await user.click(screen.getByRole("button", { name: /创建账户/ }));

      // Assert - 验证 API 被调用
      await waitFor(
        () => {
          expect(mockAuthRegister).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      // 等待 setTimeout 执行（使用 waitFor 等待导航调用，而不是使用 fake timers）
      await waitFor(
        () => {
          expect(mockNavigateFn).toHaveBeenCalledWith("/sign-in", { replace: true });
        },
        { timeout: 5000 }, // 增加超时时间，因为需要等待 2 秒的 setTimeout
      );
    });

    it("应该显示错误消息（注册失败时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const error = new Error("注册失败");
      mockAuthRegister.mockRejectedValue(error);
      render(<SignUpPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.type(screen.getByLabelText("确认密码"), "password123");
      await user.click(screen.getByRole("button", { name: /创建账户/ }));

      // Assert - 验证 toastError 被调用（toastError 是同步的，但需要等待 catch 块执行）
      await waitFor(
        () => {
          expect(mockToastError).toHaveBeenCalledWith(error, expect.any(Function), "注册失败，请检查网络连接");
        },
        { timeout: 3000 },
      );
    });

    it("应该处理字段级错误（API 返回 errors 数组时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const error = {
        response: {
          data: {
            code: 400,
            message: "验证失败",
            errors: [{ field: "email", message: "邮箱已被注册" }],
          },
        },
      };
      mockAuthRegister.mockRejectedValue(error);
      render(<SignUpPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "existing@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.type(screen.getByLabelText("确认密码"), "password123");
      await user.click(screen.getByRole("button", { name: /创建账户/ }));

      // Assert
      await waitFor(
        () => {
          expect(mockToastError).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it("应该禁用提交按钮（提交中时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      // 使用可控制的 Promise 来模拟正在进行的异步操作
      let resolvePromise: (value: AxiosResponse<ApiResponseBase<LoginResponse>>) => void;
      const pendingPromise = new Promise<AxiosResponse<ApiResponseBase<LoginResponse>>>((resolve) => {
        resolvePromise = resolve;
      });

      mockAuthRegister.mockReturnValue(pendingPromise);
      render(<SignUpPage />);
      const submitButton = screen.getByRole("button", { name: /创建账户/ });

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.type(screen.getByLabelText("确认密码"), "password123");
      await user.click(submitButton);

      // Assert - 等待按钮被禁用（用户可见的状态）
      await waitFor(
        () => {
          expect(submitButton).toBeDisabled();
        },
        { timeout: 3000 },
      );

      // 验证按钮文本变为"注册中..."（用户可见的反馈）
      expect(submitButton).toHaveTextContent("注册中...");

      // Cleanup - 解析 Promise 以完成测试
      resolvePromise!({
        data: {
          code: 0,
          message: "success",
          data: {
            accessToken: "access-token",
            refreshToken: "refresh-token",
            expiresIn: 3600,
          },
        },
      });

      // 等待 Promise 完成
      await pendingPromise;
    });

    it("应该显示加载状态（提交中时）", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      // 使用可控制的 Promise 来模拟正在进行的异步操作
      let resolvePromise: (value: AxiosResponse<ApiResponseBase<LoginResponse>>) => void;
      const pendingPromise = new Promise<AxiosResponse<ApiResponseBase<LoginResponse>>>((resolve) => {
        resolvePromise = resolve;
      });

      mockAuthRegister.mockReturnValue(pendingPromise);
      render(<SignUpPage />);
      const submitButton = screen.getByRole("button", { name: /创建账户/ });

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.type(screen.getByLabelText("确认密码"), "password123");
      await user.click(submitButton);

      // Assert - 等待加载状态显示（用户可见的反馈）
      await waitFor(
        () => {
          expect(screen.getByText(/注册中/)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // 验证按钮被禁用
      expect(submitButton).toBeDisabled();

      // Cleanup - 解析 Promise 以完成测试
      resolvePromise!({
        data: {
          code: 0,
          message: "success",
          data: {
            accessToken: "access-token",
            refreshToken: "refresh-token",
            expiresIn: 3600,
          },
        },
      });

      // 等待 Promise 完成
      await pendingPromise;
    });
  });

  describe("可访问性", () => {
    it("应该为输入框提供正确的 label 和 id", () => {
      // Arrange & Act
      render(<SignUpPage />);

      // Assert
      const emailInput = screen.getByLabelText("邮箱地址");
      const passwordInput = screen.getByLabelText("密码");
      const confirmPasswordInput = screen.getByLabelText("确认密码");

      expect(emailInput).toHaveAttribute("id", "email");
      expect(passwordInput).toHaveAttribute("id", "password");
      expect(confirmPasswordInput).toHaveAttribute("id", "confirmPassword");
    });

    it("应该为输入框和 label 正确关联（htmlFor 和 id）", () => {
      // Arrange & Act
      render(<SignUpPage />);

      // Assert
      const emailLabel = screen.getByText("邮箱地址").closest("label");
      const passwordLabel = screen.getByText("密码").closest("label");
      const confirmPasswordLabel = screen.getByText("确认密码").closest("label");

      expect(emailLabel).toHaveAttribute("for", "email");
      expect(passwordLabel).toHaveAttribute("for", "password");
      expect(confirmPasswordLabel).toHaveAttribute("for", "confirmPassword");
    });

    it("应该在错误时设置 aria-invalid='true'", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      // Act
      await user.type(emailInput, "invalid-email");
      await user.tab(); // 触发 onBlur 验证

      // Assert
      await waitFor(
        () => {
          expect(emailInput).toHaveAttribute("aria-invalid", "true");
        },
        { timeout: 3000 },
      );
    });

    it("应该为错误消息提供 role='alert'", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      // Act
      await user.type(emailInput, "invalid-email");
      await user.tab(); // 触发 onBlur 验证

      // Assert
      await waitFor(
        () => {
          const errorMessage = screen.getByText(/请输入有效的邮箱地址/);
          expect(errorMessage).toHaveAttribute("role", "alert");
        },
        { timeout: 3000 },
      );
    });

    it("应该为错误消息提供 aria-describedby 关联", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      render(<SignUpPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      // Act
      await user.type(emailInput, "invalid-email");
      await user.tab(); // 触发 onBlur 验证

      // Assert
      await waitFor(
        () => {
          expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
          const errorMessage = screen.getByText(/请输入有效的邮箱地址/);
          expect(errorMessage).toHaveAttribute("id", "email-error");
        },
        { timeout: 3000 },
      );
    });

    it("应该为密码显示/隐藏按钮提供 aria-label", () => {
      // Arrange & Act
      render(<SignUpPage />);

      // Assert
      const passwordToggleButtons = screen.getAllByLabelText("显示密码");
      expect(passwordToggleButtons.length).toBeGreaterThan(0);
    });

    it("应该支持 Enter 键提交表单", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      mockAuthRegister.mockResolvedValue({
        code: 0,
        message: "success",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 3600,
        },
      });
      render(<SignUpPage />);

      // Act
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.type(screen.getByLabelText("确认密码"), "password123");
      await user.keyboard("{Enter}");

      // Assert
      await waitFor(
        () => {
          expect(mockAuthRegister).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });
  });

  describe("状态管理", () => {
    it("应该初始化为空表单", () => {
      // Arrange & Act
      render(<SignUpPage />);

      // Assert
      const emailInput = screen.getByLabelText("邮箱地址") as HTMLInputElement;
      const passwordInput = screen.getByLabelText("密码") as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText("确认密码") as HTMLInputElement;

      expect(emailInput.value).toBe("");
      expect(passwordInput.value).toBe("");
      expect(confirmPasswordInput.value).toBe("");
    });

    it("应该在提交前清除之前的错误", async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      mockAuthRegister.mockResolvedValue({
        code: 0,
        message: "success",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 3600,
        },
      });
      render(<SignUpPage />);

      // Act - 先触发一个验证错误
      const emailInput = screen.getByLabelText("邮箱地址");
      await user.type(emailInput, "invalid");
      await user.tab(); // 触发 onBlur 验证

      // Assert - 验证错误显示
      await waitFor(
        () => {
          expect(screen.getByText(/请输入有效的邮箱地址/)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Act - 修复错误并提交
      await user.clear(emailInput);
      await user.type(emailInput, "user@example.com");
      await user.type(screen.getByLabelText("密码"), "password123");
      await user.type(screen.getByLabelText("确认密码"), "password123");
      await user.click(screen.getByRole("button", { name: /创建账户/ }));

      // Assert - 验证错误被清除
      await waitFor(
        () => {
          expect(screen.queryByText(/请输入有效的邮箱地址/)).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });
});
