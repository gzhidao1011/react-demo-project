import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "../test-utils";
import "@testing-library/jest-dom/vitest";
import SettingsPage from "./page";

vi.mock("@repo/services", () => ({
  authChangePassword: vi.fn(),
}));

vi.mock("@repo/utils", async () => {
  const actual = await vi.importActual("@repo/utils");
  return {
    ...actual,
    isAuthenticated: vi.fn(() => true),
  };
});

vi.mock("@repo/propel", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => mockNavigate,
}));

import { toast } from "@repo/propel";
import { authChangePassword } from "@repo/services";

const mockAuthChangePassword = vi.mocked(authChangePassword);
const mockToastSuccess = vi.mocked(toast.success);

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该渲染账户设置表单", async () => {
    await renderWithI18n(<SettingsPage />);

    expect(screen.getByText("账户设置")).toBeInTheDocument();
    expect(screen.getByText(/修改密码需验证当前密码/)).toBeInTheDocument();
    expect(screen.getByLabelText("当前密码")).toBeInTheDocument();
    expect(screen.getByLabelText("新密码")).toBeInTheDocument();
    expect(screen.getByLabelText("确认新密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /修改密码/ })).toBeInTheDocument();
  });

  it("应该调用 authChangePassword（提交有效表单时）", async () => {
    const user = userEvent.setup();
    mockAuthChangePassword.mockResolvedValue(undefined);
    await renderWithI18n(<SettingsPage />);

    await user.type(screen.getByLabelText("当前密码"), "Password123!");
    await user.type(screen.getByLabelText("新密码"), "NewPassword456!");
    await user.type(screen.getByLabelText("确认新密码"), "NewPassword456!");
    await user.click(screen.getByRole("button", { name: /修改密码/ }));

    await waitFor(() => {
      expect(mockAuthChangePassword).toHaveBeenCalledWith({
        currentPassword: "Password123!",
        newPassword: "NewPassword456!",
      });
    });
  });

  it("应该显示成功 toast 并跳转登录页（提交成功后）", async () => {
    const user = userEvent.setup();
    mockAuthChangePassword.mockResolvedValue(undefined);
    await renderWithI18n(<SettingsPage />);

    await user.type(screen.getByLabelText("当前密码"), "Password123!");
    await user.type(screen.getByLabelText("新密码"), "NewPassword456!");
    await user.type(screen.getByLabelText("确认新密码"), "NewPassword456!");
    await user.click(screen.getByRole("button", { name: /修改密码/ }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("密码已修改，请使用新密码重新登录", {
        duration: 3000,
      });
      expect(mockNavigate).toHaveBeenCalledWith("/sign-in", { replace: true });
    });
  });

  it("应该显示密码不一致错误", async () => {
    const user = userEvent.setup();
    await renderWithI18n(<SettingsPage />);

    await user.type(screen.getByLabelText("当前密码"), "Password123!");
    await user.type(screen.getByLabelText("新密码"), "NewPassword456!");
    await user.type(screen.getByLabelText("确认新密码"), "different");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/两次输入的新密码不一致/)).toBeInTheDocument();
    });
  });

  it("应该显示返回对话链接", async () => {
    await renderWithI18n(<SettingsPage />);

    expect(screen.getByRole("link", { name: /返回对话/ })).toHaveAttribute("href", "/chat");
  });
});
