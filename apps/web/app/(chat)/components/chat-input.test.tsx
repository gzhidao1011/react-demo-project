import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ChatInput } from "./chat-input";

describe("ChatInput", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    onSend: vi.fn(),
    disabled: false,
    placeholder: "输入消息...",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("渲染", () => {
    it("应该渲染输入框", () => {
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole("textbox", { name: /消息|输入/ });
      expect(input).toBeInTheDocument();
    });

    it("应该渲染发送按钮", () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByRole("button", { name: /发送/ })).toBeInTheDocument();
    });

    it("应该显示 placeholder", () => {
      render(<ChatInput {...defaultProps} placeholder="说点什么..." />);

      expect(screen.getByPlaceholderText("说点什么...")).toBeInTheDocument();
    });

    it("应该显示 value", () => {
      render(<ChatInput {...defaultProps} value="Hello" />);

      expect(screen.getByRole("textbox")).toHaveValue("Hello");
    });
  });

  describe("交互", () => {
    it("输入时应调用 onChange", async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = vi.fn();
      render(<ChatInput {...defaultProps} onChange={onChange} />);

      await user.type(screen.getByRole("textbox"), "Hi");

      expect(onChange).toHaveBeenCalled();
    });

    it("点击发送应调用 onSend 并传入当前 value", async () => {
      const user = userEvent.setup({ delay: null });
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} value="Hello" onSend={onSend} />);

      await user.click(screen.getByRole("button", { name: /发送/ }));

      expect(onSend).toHaveBeenCalledWith("Hello", undefined);
    });

    it("空内容时点击发送不应调用 onSend（或调用时传入空，由实现决定）", async () => {
      const user = userEvent.setup({ delay: null });
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} value="" onSend={onSend} />);

      await user.click(screen.getByRole("button", { name: /发送/ }));

      // 空内容时不应发送
      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe("附件（图片）", () => {
    it("应显示附件按钮", () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByRole("button", { name: /附件|添加图片|上传/i })).toBeInTheDocument();
    });

    it("点击附件应显示文件选择器", () => {
      render(<ChatInput {...defaultProps} />);

      const attachBtn = screen.getByRole("button", { name: /附件|添加图片|上传/i });
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("accept", expect.stringContaining("image"));
    });

    it("选择图片后发送应调用 onSend 并传入 text 和 files", async () => {
      const user = userEvent.setup({ delay: null });
      const onSend = vi.fn();
      const file = new File(["image"], "test.png", { type: "image/png" });
      render(<ChatInput {...defaultProps} value="描述图片" onSend={onSend} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      await user.upload(fileInput!, file);

      await user.click(screen.getByRole("button", { name: /发送/ }));

      expect(onSend).toHaveBeenCalledWith("描述图片", expect.any(Array));
      expect((onSend.mock.calls[0][1] as File[])[0]).toBe(file);
    });

    it("仅附件无文字时发送应调用 onSend 并传入占位文字和 files", async () => {
      const user = userEvent.setup({ delay: null });
      const onSend = vi.fn();
      const file = new File(["image"], "pic.jpg", { type: "image/jpeg" });
      render(<ChatInput {...defaultProps} value="" onSend={onSend} />);

      const fileInput = document.querySelector('input[type="file"]');
      await user.upload(fileInput!, file);

      await user.click(screen.getByRole("button", { name: /发送/ }));

      // 有附件时即使无文字也应可发送
      expect(onSend).toHaveBeenCalled();
      expect((onSend.mock.calls[0][1] as File[])[0]).toBe(file);
    });
  });

  describe("键盘快捷键", () => {
    it("Enter 应发送消息", async () => {
      const user = userEvent.setup({ delay: null });
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} value="Test" onSend={onSend} />);

      const input = screen.getByRole("textbox");
      input.focus();
      await user.keyboard("{Enter}");

      expect(onSend).toHaveBeenCalledWith("Test", undefined);
    });

    it("Shift+Enter 应换行而非发送", async () => {
      const user = userEvent.setup({ delay: null });
      const onSend = vi.fn();
      render(<ChatInput {...defaultProps} value="Line1" onSend={onSend} />);

      const input = screen.getByRole("textbox");
      input.focus();
      await user.keyboard("{Shift>}{Enter}{/Shift}");

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe("禁用状态", () => {
    it("disabled 时输入框应禁用", () => {
      render(<ChatInput {...defaultProps} disabled />);

      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("disabled 时发送按钮应禁用", () => {
      render(<ChatInput {...defaultProps} disabled />);

      expect(screen.getByRole("button", { name: /发送/ })).toBeDisabled();
    });
  });

  describe("可访问性", () => {
    it("输入框应有 label 或 aria-label", () => {
      render(<ChatInput {...defaultProps} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-label");
    });
  });
});
