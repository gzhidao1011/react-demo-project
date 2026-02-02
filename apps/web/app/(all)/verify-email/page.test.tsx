import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "../../test-utils";
import "@testing-library/jest-dom/vitest";
import VerifyEmailPage from "./page";

vi.mock("@repo/services", () => ({
  authVerifyEmail: vi.fn(),
  authResendVerification: vi.fn(),
}));

/** 测试用：控制 useSearchParams 返回的查询参数 */
let mockSearchString = "";
vi.mock("react-router", () => ({
  useSearchParams: () => [new URLSearchParams(mockSearchString)],
  useNavigate: vi.fn(),
}));

vi.mock("@repo/propel", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@repo/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@repo/utils")>();
  return {
    ...actual,
    isSystemError: vi.fn(() => false),
    getSystemErrorToastMessage: vi.fn(() => undefined),
  };
});

import { toast } from "@repo/propel";
import { authResendVerification, authVerifyEmail } from "@repo/services";

const mockAuthVerifyEmail = vi.mocked(authVerifyEmail);
const mockAuthResendVerification = vi.mocked(authResendVerification);
const mockToastSuccess = vi.mocked(toast.success);

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchString = "";
  });

  describe("无 token 时", () => {
    it("应该显示链接无效提示", async () => {
      mockSearchString = "";
      await renderWithI18n(<VerifyEmailPage />);

      expect(screen.getByText("链接无效或已过期")).toBeInTheDocument();
      expect(screen.getByText(/该验证链接无效或已过期/)).toBeInTheDocument();
    });

    it("应该显示立即注册按钮", async () => {
      mockSearchString = "";
      await renderWithI18n(<VerifyEmailPage />);

      const btn = screen.getByRole("button", { name: /立即注册/ });
      expect(btn).toBeInTheDocument();
    });
  });

  describe("有 token 时", () => {
    beforeEach(() => {
      mockSearchString = "?token=valid-token-123";
    });

    it("应该显示点击验证按钮", async () => {
      await renderWithI18n(<VerifyEmailPage />);

      expect(screen.getByRole("button", { name: /点击验证/ })).toBeInTheDocument();
    });

    it("应该调用 authVerifyEmail 并跳转（验证成功时）", async () => {
      const user = userEvent.setup({ delay: null });
      mockAuthVerifyEmail.mockResolvedValue({
        accessToken: "token",
        refreshToken: "refresh",
        expiresIn: 3600,
      } as never);
      await renderWithI18n(<VerifyEmailPage />);

      await user.click(screen.getByRole("button", { name: /点击验证/ }));

      await waitFor(
        () => {
          expect(mockAuthVerifyEmail).toHaveBeenCalledWith("valid-token-123");
          expect(mockToastSuccess).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      // 验证成功后按钮显示「验证成功！正在跳转...」并保持禁用
      const button = screen.getByRole("button", { name: /验证成功！正在跳转/ });
      expect(button).toBeDisabled();
    });

    it("验证失败时应显示错误和重新发送区域", async () => {
      const user = userEvent.setup({ delay: null });
      mockAuthVerifyEmail.mockRejectedValue(new Error("Token 无效"));
      await renderWithI18n(<VerifyEmailPage />);

      await user.click(screen.getByRole("button", { name: /点击验证/ }));

      await waitFor(
        () => {
          expect(screen.getByText("Token 无效")).toBeInTheDocument();
          expect(screen.getByRole("button", { name: /重新发送验证邮件/ })).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });

  describe("有 token 和 email 时", () => {
    beforeEach(() => {
      mockSearchString = "?token=valid-token&email=user%40example.com";
    });

    it("验证失败时可直接点击重新发送（无需输入邮箱）", async () => {
      const user = userEvent.setup({ delay: null });
      mockAuthVerifyEmail.mockRejectedValue(new Error("Token 无效"));
      mockAuthResendVerification.mockResolvedValue(undefined as never);
      await renderWithI18n(<VerifyEmailPage />);

      await user.click(screen.getByRole("button", { name: /点击验证/ }));
      await waitFor(() => expect(screen.getByRole("button", { name: /重新发送验证邮件/ })).toBeInTheDocument());

      await user.click(screen.getByRole("button", { name: /重新发送验证邮件/ }));

      await waitFor(
        () => {
          expect(mockAuthResendVerification).toHaveBeenCalledWith("user@example.com");
          expect(mockToastSuccess).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });
  });

  describe("有 token 无 email 时", () => {
    beforeEach(() => {
      mockSearchString = "?token=valid-token";
    });

    it("验证失败时应显示邮箱输入框", async () => {
      const user = userEvent.setup({ delay: null });
      mockAuthVerifyEmail.mockRejectedValue(new Error("Token 无效"));
      await renderWithI18n(<VerifyEmailPage />);

      await user.click(screen.getByRole("button", { name: /点击验证/ }));

      await waitFor(
        () => {
          expect(screen.getByLabelText(/请输入注册时使用的邮箱/)).toBeInTheDocument();
          expect(screen.getByRole("button", { name: /重新发送验证邮件/ })).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("输入邮箱后可重新发送", async () => {
      const user = userEvent.setup({ delay: null });
      mockAuthVerifyEmail.mockRejectedValue(new Error("Token 无效"));
      mockAuthResendVerification.mockResolvedValue(undefined as never);
      await renderWithI18n(<VerifyEmailPage />);

      await user.click(screen.getByRole("button", { name: /点击验证/ }));
      await waitFor(() => expect(screen.getByLabelText(/请输入注册时使用的邮箱/)).toBeInTheDocument());

      const emailInput = screen.getByPlaceholderText("example@email.com");
      await user.type(emailInput, "user@example.com");
      await user.click(screen.getByRole("button", { name: /重新发送验证邮件/ }));

      await waitFor(
        () => {
          expect(mockAuthResendVerification).toHaveBeenCalledWith("user@example.com");
          expect(mockToastSuccess).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });
  });
});
