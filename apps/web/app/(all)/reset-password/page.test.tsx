import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "../../test-utils";
import "@testing-library/jest-dom/vitest";
import ResetPasswordPage from "./page";

vi.mock("@repo/services", () => ({
  authForgotPassword: vi.fn(),
  authResetPassword: vi.fn(),
}));

/** 测试用：控制 useSearchParams 返回的查询参数 */
let mockSearchString = "";
vi.mock("react-router", () => ({
  useSearchParams: () => [new URLSearchParams(mockSearchString)],
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
    isSystemError: vi.fn(() => false),
    getSystemErrorToastMessage: vi.fn(() => undefined),
  };
});

import { toast } from "@repo/propel";
import { authForgotPassword, authResetPassword } from "@repo/services";

const mockAuthResetPassword = vi.mocked(authResetPassword);
const mockAuthForgotPassword = vi.mocked(authForgotPassword);
const mockToastSuccess = vi.mocked(toast.success);

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchString = "";
  });

  describe("无 token 时", () => {
    it("应该显示链接无效提示", async () => {
      mockSearchString = "";
      await renderWithI18n(<ResetPasswordPage />);

      expect(screen.getByText("链接无效或已过期")).toBeInTheDocument();
      expect(screen.getByText(/该重置链接无效或已过期/)).toBeInTheDocument();
    });

    it("应该显示返回登录和忘记密码入口", async () => {
      mockSearchString = "";
      await renderWithI18n(<ResetPasswordPage />);

      expect(screen.getByRole("link", { name: /返回登录/ })).toHaveAttribute("href", "/sign-in");
      expect(screen.getByRole("link", { name: /忘记密码？/ })).toHaveAttribute("href", "/forgot-password");
    });
  });

  describe("有 token 时", () => {
    beforeEach(() => {
      mockSearchString = "?token=valid-token&email=user%40example.com";
    });

    it("应该渲染重置密码表单", async () => {
      await renderWithI18n(<ResetPasswordPage />);
      expect(screen.getAllByText("重置密码").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByLabelText("新密码")).toBeInTheDocument();
      expect(screen.getByLabelText("确认密码")).toBeInTheDocument();
    });

    it("应该调用 authResetPassword（提交有效表单时）", async () => {
      const user = userEvent.setup();
      mockAuthResetPassword.mockResolvedValue(undefined);
      await renderWithI18n(<ResetPasswordPage />);

      await user.type(screen.getByLabelText("新密码"), "newPassword123");
      await user.type(screen.getByLabelText("确认密码"), "newPassword123");
      await user.click(screen.getByRole("button", { name: /重置密码/ }));

      await waitFor(() => {
        expect(mockAuthResetPassword).toHaveBeenCalledWith("valid-token", "newPassword123");
      });
    });

    it("应该显示成功 toast（提交成功后）", async () => {
      const user = userEvent.setup();
      mockAuthResetPassword.mockResolvedValue(undefined);
      await renderWithI18n(<ResetPasswordPage />);

      await user.type(screen.getByLabelText("新密码"), "newPassword123");
      await user.type(screen.getByLabelText("确认密码"), "newPassword123");
      await user.click(screen.getByRole("button", { name: /重置密码/ }));

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("密码重置成功！正在跳转到登录页...", {
          duration: 2000,
        });
      });
    });

    it("应该显示密码不一致错误", async () => {
      const user = userEvent.setup();
      await renderWithI18n(<ResetPasswordPage />);

      await user.type(screen.getByLabelText("新密码"), "password123");
      await user.type(screen.getByLabelText("确认密码"), "different");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/两次输入的密码不一致/)).toBeInTheDocument();
      });
    });

    it("失败且有 email 时应显示重新发送按钮", async () => {
      const user = userEvent.setup({ delay: null });
      mockAuthResetPassword.mockRejectedValue(new Error("链接已过期"));
      await renderWithI18n(<ResetPasswordPage />);

      await user.type(screen.getByLabelText("新密码"), "newPassword123");
      await user.type(screen.getByLabelText("确认密码"), "newPassword123");
      await user.click(screen.getByRole("button", { name: /重置密码/ }));

      await waitFor(() => {
        expect(screen.getByText("链接已过期")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /重新发送重置邮件/ })).toBeInTheDocument();
      });
    });

    it("点击重新发送应调用 authForgotPassword", async () => {
      const user = userEvent.setup({ delay: null });
      mockAuthResetPassword.mockRejectedValue(new Error("链接已过期"));
      mockAuthForgotPassword.mockResolvedValue(undefined);
      await renderWithI18n(<ResetPasswordPage />);

      await user.type(screen.getByLabelText("新密码"), "newPassword123");
      await user.type(screen.getByLabelText("确认密码"), "newPassword123");
      await user.click(screen.getByRole("button", { name: /重置密码/ }));
      await waitFor(() => expect(screen.getByRole("button", { name: /重新发送重置邮件/ })).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: /重新发送重置邮件/ }));

      await waitFor(() => {
        expect(mockAuthForgotPassword).toHaveBeenCalledWith("user@example.com");
        expect(mockToastSuccess).toHaveBeenCalled();
      });
    });
  });
});
