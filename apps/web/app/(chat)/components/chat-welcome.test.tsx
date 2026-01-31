import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { SuggestedPrompt } from "../lib/chat.types";
import { ChatWelcome } from "./chat-welcome";

const defaultPrompts: SuggestedPrompt[] = [
  { id: "1", label: "写一封邮件", text: "帮我写一封邮件" },
  { id: "2", label: "总结文章", text: "总结这篇文章" },
];

describe("ChatWelcome", () => {
  describe("渲染", () => {
    it("应该渲染欢迎文案", () => {
      render(<ChatWelcome prompts={defaultPrompts} onPromptSelect={vi.fn()} />);

      expect(screen.getByText(/What|你好|欢迎|开始/i)).toBeInTheDocument();
    });

    it("应该渲染快捷提示词按钮", () => {
      render(<ChatWelcome prompts={defaultPrompts} onPromptSelect={vi.fn()} />);

      expect(screen.getByRole("button", { name: "写一封邮件" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "总结文章" })).toBeInTheDocument();
    });

    it("空 prompts 时不应渲染按钮", () => {
      render(<ChatWelcome prompts={[]} onPromptSelect={vi.fn()} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("交互", () => {
    it("点击快捷提示词应调用 onPromptSelect 并传入对应 text", async () => {
      const user = userEvent.setup({ delay: null });
      const onPromptSelect = vi.fn();
      render(<ChatWelcome prompts={defaultPrompts} onPromptSelect={onPromptSelect} />);

      await user.click(screen.getByRole("button", { name: "写一封邮件" }));

      expect(onPromptSelect).toHaveBeenCalledWith("帮我写一封邮件");
    });

    it("点击不同提示词应传入不同 text", async () => {
      const user = userEvent.setup({ delay: null });
      const onPromptSelect = vi.fn();
      render(<ChatWelcome prompts={defaultPrompts} onPromptSelect={onPromptSelect} />);

      await user.click(screen.getByRole("button", { name: "总结文章" }));

      expect(onPromptSelect).toHaveBeenCalledWith("总结这篇文章");
    });
  });

  describe("可访问性", () => {
    it("快捷提示词按钮应可 Tab 聚焦", async () => {
      const user = userEvent.setup({ delay: null });
      render(<ChatWelcome prompts={defaultPrompts} onPromptSelect={vi.fn()} />);

      await user.tab();
      const firstButton = screen.getByRole("button", { name: "写一封邮件" });
      expect(firstButton).toHaveFocus();
    });
  });
});
