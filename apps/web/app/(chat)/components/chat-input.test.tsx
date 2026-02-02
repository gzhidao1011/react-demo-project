import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { renderWithI18n } from "../../test-utils";
import { ChatInput } from "./chat-input";

describe("ChatInput", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    onSend: vi.fn(),
    disabled: false,
    placeholder: "输入消息...",
  };

  const renderInput = async (props = {}) => renderWithI18n(<ChatInput {...defaultProps} {...props} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("渲染", () => {
    it("应该渲染输入框", async () => {
      await renderInput();

      const input = screen.getByRole("textbox", { name: /Message|输入|消息/i });
      expect(input).toBeInTheDocument();
    });

    it("应该渲染发送按钮", async () => {
      await renderInput();

      expect(screen.getByRole("button", { name: /Send|发送/i })).toBeInTheDocument();
    });

    it("应该显示 placeholder", async () => {
      await renderInput({ placeholder: "说点什么..." });

      expect(screen.getByPlaceholderText("说点什么...")).toBeInTheDocument();
    });

    it("应该显示 value", async () => {
      await renderInput({ value: "Hello" });

      expect(screen.getByRole("textbox")).toHaveValue("Hello");
    });
  });

  describe("交互", () => {
    it("输入时应调用 onChange", async () => {
      const user = userEvent.setup({ delay: null });
      const onChange = vi.fn();
      await renderInput({ onChange });

      await user.type(screen.getByRole("textbox"), "Hi");

      expect(onChange).toHaveBeenCalled();
    });

    it("点击发送应调用 onSend 并传入当前 value", async () => {
      const user = userEvent.setup({ delay: null });
      const onSend = vi.fn();
      await renderInput({ value: "Hello", onSend });

      await user.click(screen.getByRole("button", { name: /Send|发送/i }));

      expect(onSend).toHaveBeenCalledWith("Hello", undefined);
    });

    it("空内容时点击发送不应调用 onSend（或调用时传入空，由实现决定）", async () => {
      const user = userEvent.setup({ delay: null });
      const onSend = vi.fn();
      await renderInput({ value: "", onSend });

      await user.click(screen.getByRole("button", { name: /Send|发送/i }));

      // 空内容时不应发送
      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe("附件（图片）", () => {
    it("应显示附件按钮", async () => {
      await renderInput();

      expect(screen.getByRole("button", { name: /添加附件|Add attachments/i })).toBeInTheDocument();
    });

    it("点击附件应显示文件选择器", async () => {
      await renderInput();

      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("accept", expect.stringContaining("image"));
    });

    it("选择图片后发送应调用 onSend 并传入 text 和 files", async () => {
      const user = userEvent.setup({ delay: null });
      const onSend = vi.fn();
      const file = new File(["image"], "test.png", { type: "image/png" });
      await renderInput({ value: "描述图片", onSend });

      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      await user.upload(fileInput!, file);

      await user.click(screen.getByRole("button", { name: /Send|发送/i }));

      expect(onSend).toHaveBeenCalledWith("描述图片", expect.any(Array));
      expect((onSend.mock.calls[0][1] as File[])[0]).toBe(file);
    });

    it("仅附件无文字时发送应调用 onSend 并传入占位文字和 files", async () => {
      const user = userEvent.setup({ delay: null });
      const onSend = vi.fn();
      const file = new File(["image"], "pic.jpg", { type: "image/jpeg" });
      await renderInput({ value: "", onSend });

      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
      await user.upload(fileInput!, file);

      await user.click(screen.getByRole("button", { name: /Send|发送/i }));

      // 有附件时即使无文字也应可发送
      expect(onSend).toHaveBeenCalled();
      expect((onSend.mock.calls[0][1] as File[])[0]).toBe(file);
    });
  });

  describe("键盘快捷键", () => {
    it("Enter 应发送消息", async () => {
      const user = userEvent.setup({ delay: null });
      const onSend = vi.fn();
      await renderInput({ value: "Test", onSend });

      const input = screen.getByRole("textbox");
      input.focus();
      await user.keyboard("{Enter}");

      expect(onSend).toHaveBeenCalledWith("Test", undefined);
    });

    it("Shift+Enter 应换行而非发送", async () => {
      const user = userEvent.setup({ delay: null });
      const onSend = vi.fn();
      await renderInput({ value: "Line1", onSend });

      const input = screen.getByRole("textbox");
      input.focus();
      await user.keyboard("{Shift>}{Enter}{/Shift}");

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe("禁用状态", () => {
    it("disabled 时输入框应禁用", async () => {
      await renderInput({ disabled: true });

      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("disabled 时发送按钮应禁用", async () => {
      await renderInput({ disabled: true });

      expect(screen.getByRole("button", { name: /Send|发送/i })).toBeDisabled();
    });
  });

  describe("可访问性", () => {
    it("输入框应有 label 或 aria-label", async () => {
      await renderInput();

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-label");
    });
  });
});
