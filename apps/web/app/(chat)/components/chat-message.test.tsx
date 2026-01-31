import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ChatMessage } from "./chat-message";

// 简化的消息结构（与 AI SDK UIMessage 对齐）
const userMessage = {
  id: "msg_1",
  role: "user" as const,
  parts: [{ type: "text" as const, text: "你好" }],
};

const assistantMessage = {
  id: "msg_2",
  role: "assistant" as const,
  parts: [{ type: "text" as const, text: "你好！有什么可以帮助你的？" }],
};

describe("ChatMessage", () => {
  describe("渲染", () => {
    it("应该渲染用户消息内容", () => {
      render(<ChatMessage message={userMessage} />);

      expect(screen.getByText("你好")).toBeInTheDocument();
    });

    it("应该渲染 AI 消息内容", () => {
      render(<ChatMessage message={assistantMessage} />);

      expect(screen.getByText("你好！有什么可以帮助你的？")).toBeInTheDocument();
    });

    it("用户消息应右对齐", () => {
      const { container } = render(<ChatMessage message={userMessage} />);

      const wrapper = container.querySelector('[data-role="user"]');
      expect(wrapper).toBeInTheDocument();
    });

    it("AI 消息应左对齐", () => {
      const { container } = render(<ChatMessage message={assistantMessage} />);

      const wrapper = container.querySelector('[data-role="assistant"]');
      expect(wrapper).toBeInTheDocument();
    });

    it("应处理多条 parts", () => {
      const multiPartMessage = {
        id: "msg_3",
        role: "assistant" as const,
        parts: [
          { type: "text" as const, text: "第一部分" },
          { type: "text" as const, text: "第二部分" },
        ],
      };

      render(<ChatMessage message={multiPartMessage} />);

      expect(screen.getByText("第一部分")).toBeInTheDocument();
      expect(screen.getByText("第二部分")).toBeInTheDocument();
    });
  });

  describe("Markdown 渲染", () => {
    it("AI 消息应渲染 Markdown（如 **粗体**）", () => {
      const markdownMessage = {
        id: "msg_md",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "这是**粗体**文本" }],
      };

      render(<ChatMessage message={markdownMessage} />);

      const strong = document.querySelector("strong");
      expect(strong).toBeInTheDocument();
      expect(strong).toHaveTextContent("粗体");
    });

    it("AI 消息应渲染代码块", () => {
      const codeMessage = {
        id: "msg_code",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "```js\nconst x = 1;\n```" }],
      };

      render(<ChatMessage message={codeMessage} />);

      const code = document.querySelector("code");
      expect(code).toBeInTheDocument();
    });

    it("用户消息应保持纯文本（不渲染 Markdown）", () => {
      const userMarkdown = {
        id: "msg_user",
        role: "user" as const,
        parts: [{ type: "text" as const, text: "这是**粗体**" }],
      };

      render(<ChatMessage message={userMarkdown} />);

      const strong = document.querySelector("strong");
      expect(strong).not.toBeInTheDocument();
      expect(screen.getByText(/这是\*\*粗体\*\*/)).toBeInTheDocument();
    });
  });

  describe("消息复制", () => {
    it("AI 消息应显示复制按钮", () => {
      render(<ChatMessage message={assistantMessage} onCopy={vi.fn()} />);

      expect(screen.getByRole("button", { name: /Copy/i })).toBeInTheDocument();
    });

    it("点击复制应调用 onCopy 并传入消息文本", async () => {
      const user = userEvent.setup({ delay: null });
      const onCopy = vi.fn();
      render(<ChatMessage message={assistantMessage} onCopy={onCopy} />);

      await user.click(screen.getByRole("button", { name: /Copy/i }));

      expect(onCopy).toHaveBeenCalledWith("你好！有什么可以帮助你的？");
    });

    it("无 onCopy 时不应显示复制按钮", () => {
      render(<ChatMessage message={assistantMessage} />);

      expect(screen.queryByRole("button", { name: /Copy/i })).not.toBeInTheDocument();
    });
  });

  describe("消息反馈 👍/👎", () => {
    it("AI 消息有 onFeedback 时应显示点赞和点踩按钮", () => {
      render(<ChatMessage message={assistantMessage} onFeedback={vi.fn()} />);

      expect(screen.getByRole("button", { name: "Like" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Dislike" })).toBeInTheDocument();
    });

    it("无 onFeedback 时不应显示反馈按钮", () => {
      render(<ChatMessage message={assistantMessage} />);

      expect(screen.queryByRole("button", { name: "Like" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Dislike" })).not.toBeInTheDocument();
    });

    it("用户消息不应显示反馈按钮", () => {
      render(<ChatMessage message={userMessage} onFeedback={vi.fn()} />);

      expect(screen.queryByRole("button", { name: "Like" })).not.toBeInTheDocument();
    });

    it("点击点赞应调用 onFeedback 并传入 up", async () => {
      const user = userEvent.setup({ delay: null });
      const onFeedback = vi.fn();
      render(<ChatMessage message={assistantMessage} onFeedback={onFeedback} />);

      await user.click(screen.getByRole("button", { name: "Like" }));

      expect(onFeedback).toHaveBeenCalledWith("msg_2", "up");
    });

    it("点击点踩应调用 onFeedback 并传入 down", async () => {
      const user = userEvent.setup({ delay: null });
      const onFeedback = vi.fn();
      render(<ChatMessage message={assistantMessage} onFeedback={onFeedback} />);

      await user.click(screen.getByRole("button", { name: "Dislike" }));

      expect(onFeedback).toHaveBeenCalledWith("msg_2", "down");
    });
  });

  describe("附件（图片）渲染", () => {
    it("消息含 file part 时应渲染图片", () => {
      const messageWithFile = {
        id: "msg_img",
        role: "user" as const,
        parts: [
          { type: "file" as const, url: "https://example.com/img.png", mimeType: "image/png" },
          { type: "text" as const, text: "看看这张图" },
        ],
      };

      render(<ChatMessage message={messageWithFile} />);

      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/img.png");
    });

    it("file part 无 url 时不应渲染图片", () => {
      const messageWithFileNoUrl = {
        id: "msg_no_url",
        role: "user" as const,
        parts: [{ type: "file" as const, mimeType: "image/png" }],
      };

      render(<ChatMessage message={messageWithFileNoUrl} />);

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });

  describe("Reasoning 思维链展示", () => {
    it("消息含 reasoning part 时应渲染可折叠的 Thinking 区域", () => {
      const messageWithReasoning = {
        id: "msg_reasoning",
        role: "assistant" as const,
        parts: [
          { type: "reasoning" as const, text: "Let me think step by step..." },
          { type: "text" as const, text: "答案是 42" },
        ],
      };

      render(<ChatMessage message={messageWithReasoning} />);

      expect(screen.getByText(/Thinking|思维/i)).toBeInTheDocument();
      expect(screen.getByText("Let me think step by step...")).toBeInTheDocument();
      expect(screen.getByText("答案是 42")).toBeInTheDocument();
    });

    it("reasoning part 应使用 details/summary 可折叠", () => {
      const messageWithReasoning = {
        id: "msg_reasoning",
        role: "assistant" as const,
        parts: [{ type: "reasoning" as const, text: "思考内容" }],
      };

      const { container } = render(<ChatMessage message={messageWithReasoning} />);

      const details = container.querySelector("details");
      expect(details).toBeInTheDocument();
      expect(details?.querySelector("summary")).toBeInTheDocument();
    });
  });

  describe("Sources 引用展示", () => {
    it("消息含 source-url part 时应渲染来源链接", () => {
      const messageWithSource = {
        id: "msg_source",
        role: "assistant" as const,
        parts: [
          { type: "text" as const, text: "参考来源：" },
          {
            type: "source-url" as const,
            url: "https://example.com/doc",
            title: "Example Doc",
          },
        ],
      };

      render(<ChatMessage message={messageWithSource} />);

      const link = screen.getByRole("link", { name: /Example Doc|example\.com/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://example.com/doc");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("source-url 无 title 时应使用 hostname 作为链接文本", () => {
      const messageWithSource = {
        id: "msg_source",
        role: "assistant" as const,
        parts: [
          {
            type: "source-url" as const,
            url: "https://docs.example.com/article",
          },
        ],
      };

      render(<ChatMessage message={messageWithSource} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://docs.example.com/article");
      expect(link).toHaveTextContent(/docs\.example\.com/);
    });
  });

  describe("Token 用量展示", () => {
    it("AI 消息有 metadata.usage 时应显示 Token 用量", () => {
      const messageWithUsage = {
        id: "msg_usage",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "回复内容" }],
        metadata: {
          usage: { inputTokens: 100, outputTokens: 50 },
        },
      };

      render(<ChatMessage message={messageWithUsage} />);

      expect(screen.getByLabelText("Token usage")).toBeInTheDocument();
      expect(screen.getByText("Input 100")).toBeInTheDocument();
      expect(screen.getByText("Output 50")).toBeInTheDocument();
    });

    it("无 metadata 或 usage 时不应显示 Token 用量", () => {
      render(<ChatMessage message={assistantMessage} />);

      expect(screen.queryByLabelText("Token usage")).not.toBeInTheDocument();
    });

    it("用户消息不应显示 Token 用量（即使用户消息有 metadata）", () => {
      const userMsgWithMeta = {
        id: "msg_user",
        role: "user" as const,
        parts: [{ type: "text" as const, text: "你好" }],
        metadata: { usage: { inputTokens: 10, outputTokens: 0 } },
      };

      render(<ChatMessage message={userMsgWithMeta} />);

      expect(screen.queryByLabelText("Token usage")).not.toBeInTheDocument();
    });
  });

  describe("可访问性", () => {
    it("消息列表区域应有 role=log 或 aria-live", () => {
      const { container } = render(<ChatMessage message={userMessage} />);

      const region = container.querySelector('[role="log"]') ?? container.querySelector("[aria-live]");
      expect(region).toBeTruthy();
    });
  });
});
