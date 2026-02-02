import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "../../test-utils";
import "@testing-library/jest-dom/vitest";
import ForgotPasswordPage from "./page";

vi.mock("@repo/services", () => ({
  authForgotPassword: vi.fn(),
}));

const mockNavigateFn = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigateFn,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock("@repo/propel", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@repo/utils", async () => {
  const actual = await vi.importActual("@repo/utils");
  return {
    ...actual,
    handleServerError: vi.fn(),
  };
});

import { toast } from "@repo/propel";
import { authForgotPassword } from "@repo/services";
import { handleServerError } from "@repo/utils";

const mockAuthForgotPassword = vi.mocked(authForgotPassword);
const mockToastSuccess = vi.mocked(toast.success);
const mockHandleServerError = vi.mocked(handleServerError);

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigateFn.mockClear();
    mockHandleServerError.mockImplementation((_error, setError, defaultMessage) => {
      setError("root", {
        type: "server",
        message: defaultMessage || "忘记密码请求失败，请检查网络连接",
      });
      return {
        type: "form",
        shouldShowToast: false,
      };
    });
  });

  describe("表单渲染", () => {
    it("应该渲染忘记密码标题", async () => {
      await renderWithI18n(<ForgotPasswordPage />);
      expect(screen.getByText("忘记密码")).toBeInTheDocument();
    });

    it("应该渲染邮箱输入框", async () => {
      await renderWithI18n(<ForgotPasswordPage />);
      expect(screen.getByLabelText("邮箱地址")).toBeInTheDocument();
    });

    it("应该渲染发送重置链接按钮", async () => {
      await renderWithI18n(<ForgotPasswordPage />);
      expect(screen.getByRole("button", { name: /发送重置链接/ })).toBeInTheDocument();
    });

    it("应该渲染无法收到邮件提示", async () => {
      await renderWithI18n(<ForgotPasswordPage />);
      expect(screen.getByText(/无法收到邮件？/)).toBeInTheDocument();
    });

    it("应该渲染返回登录链接", async () => {
      await renderWithI18n(<ForgotPasswordPage />);
      expect(screen.getByRole("link", { name: /返回登录/ })).toHaveAttribute("href", "/sign-in");
    });
  });

  describe("表单验证", () => {
    it("应该显示邮箱格式错误（当输入无效邮箱时）", async () => {
      const user = userEvent.setup();
      await renderWithI18n(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      await user.type(emailInput, "invalid-email");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/请输入有效的邮箱地址/)).toBeInTheDocument();
      });
    });
  });

  describe("表单提交", () => {
    it("应该调用 authForgotPassword API（当表单有效时）", async () => {
      const user = userEvent.setup();
      mockAuthForgotPassword.mockResolvedValue(undefined);
      await renderWithI18n(<ForgotPasswordPage />);

      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.click(screen.getByRole("button", { name: /发送重置链接/ }));

      await waitFor(() => {
        expect(mockAuthForgotPassword).toHaveBeenCalledWith("user@example.com");
      });
    });

    it("应该对 email 做 trim 和 toLowerCase 标准化", async () => {
      const user = userEvent.setup();
      mockAuthForgotPassword.mockResolvedValue(undefined);
      await renderWithI18n(<ForgotPasswordPage />);

      await user.type(screen.getByLabelText("邮箱地址"), "  User@Example.COM  ");
      await user.click(screen.getByRole("button", { name: /发送重置链接/ }));

      await waitFor(() => {
        expect(mockAuthForgotPassword).toHaveBeenCalledWith("user@example.com");
      });
    });

    it("应该显示成功 toast 并跳转（提交成功后）", async () => {
      const user = userEvent.setup({ delay: null });
      mockAuthForgotPassword.mockResolvedValue(undefined);
      await renderWithI18n(<ForgotPasswordPage />);

      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.click(screen.getByRole("button", { name: /发送重置链接/ }));

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("请查收邮件，点击链接重置密码", {
          duration: 2000,
        });
      });

      await waitFor(
        () => {
          expect(mockNavigateFn).toHaveBeenCalledWith("/sign-in", { replace: true });
        },
        { timeout: 5000 },
      );
    });

    it("应该显示错误（提交失败时）", async () => {
      const user = userEvent.setup({ delay: null });
      mockAuthForgotPassword.mockRejectedValue(new Error("请求失败"));
      mockHandleServerError.mockImplementation((_error, setError) => {
        setError("root", {
          type: "server",
          message: "忘记密码请求失败，请检查网络连接",
        });
        return { type: "form", shouldShowToast: false };
      });

      await renderWithI18n(<ForgotPasswordPage />);
      await user.type(screen.getByLabelText("邮箱地址"), "user@example.com");
      await user.click(screen.getByRole("button", { name: /发送重置链接/ }));

      await waitFor(() => {
        expect(screen.getByText("忘记密码请求失败，请检查网络连接")).toBeInTheDocument();
      });
    });
  });

  describe("可访问性", () => {
    it("应该为邮箱输入框提供 aria-invalid 和 aria-describedby", async () => {
      const user = userEvent.setup();
      await renderWithI18n(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText("邮箱地址");

      await user.type(emailInput, "invalid");
      await user.tab();

      await waitFor(() => {
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
      });
    });
  });
});
