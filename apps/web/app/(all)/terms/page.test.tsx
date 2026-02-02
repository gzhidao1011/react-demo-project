import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "../../test-utils";
import "@testing-library/jest-dom/vitest";
import { screen } from "@testing-library/react";
import TermsPage from "./page";

vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
}));

describe("TermsPage", () => {
  describe("渲染", () => {
    it("应该渲染服务条款标题", async () => {
      await renderWithI18n(<TermsPage />);
      expect(screen.getByRole("heading", { name: /服务条款/ })).toBeInTheDocument();
    });

    it("应该渲染页面主要内容", async () => {
      await renderWithI18n(<TermsPage />);
      expect(screen.getByText(/欢迎使用/)).toBeInTheDocument();
    });
  });
});
