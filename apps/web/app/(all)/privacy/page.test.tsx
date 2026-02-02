import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "../../test-utils";
import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import PrivacyPage from "./page";

vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
}));

describe("PrivacyPage", () => {
  describe("渲染", () => {
    it("应该渲染隐私政策标题", async () => {
      await renderWithI18n(<PrivacyPage />);
      expect(screen.getByRole("heading", { name: /隐私政策/ })).toBeInTheDocument();
    });

    it("应该渲染页面主要内容", async () => {
      await renderWithI18n(<PrivacyPage />);
      expect(screen.getByText(/我们重视您的隐私/)).toBeInTheDocument();
    });
  });
});
