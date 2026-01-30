import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import ChatPageLayout from "./layout";

// Mock @repo/utils
vi.mock("@repo/utils", () => ({
  isAuthenticated: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Outlet: () => <div data-testid="outlet" />,
  };
});

import { isAuthenticated } from "@repo/utils";

describe("ChatPageLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthenticated).mockReturnValue(true);
  });

  it("已登录时应渲染子路由且不重定向", async () => {
    render(<ChatPageLayout />);

    // 等待一个 tick 确保 useEffect 已执行
    await waitFor(() => {
      expect(isAuthenticated).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("未登录时应跳转到登录页", async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false);
    render(<ChatPageLayout />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/sign-in", { replace: true });
    });
  });
});
