import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { useParams } from "react-router";
import ChatPage from "./page";

// Mock useChatWithConversation
const mockRegenerate = vi.fn();
const mockUseChatWithConversation = vi.fn((_opts?: unknown) => ({
  messages: [],
  sendMessage: vi.fn(),
  status: "ready",
  error: undefined,
  stop: vi.fn(),
  regenerate: mockRegenerate,
  clearError: vi.fn(),
}));
vi.mock("./hooks/use-chat", () => ({
  useChatWithConversation: mockUseChatWithConversation,
}));

// Mock useConversations
const mockCreateConversation = vi.fn(() => "conv_new_123");
const mockDeleteConversation = vi.fn();
const mockSetActiveId = vi.fn();
const mockUpdateConversationTitle = vi.fn();

vi.mock("./hooks/use-conversations", () => ({
  useConversations: vi.fn(() => ({
    conversations: [{ id: "conv_1", title: "会话1", createdAt: 1000 }],
    activeId: "conv_1",
    createConversation: mockCreateConversation,
    deleteConversation: mockDeleteConversation,
    setActiveId: mockSetActiveId,
    updateConversationTitle: mockUpdateConversationTitle,
  })),
}));

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: vi.fn(() => ({})),
  };
});

// Mock toast
vi.mock("@repo/propel", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ChatPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue({ id: "conv_1" });
  });

  describe("渲染", () => {
    it("应该渲染打开侧边栏按钮（汉堡菜单）", () => {
      render(<ChatPage />);

      expect(screen.getByRole("button", { name: /打开侧边栏/i })).toBeInTheDocument();
    });

    it("应该渲染欢迎区域（无消息时）", () => {
      render(<ChatPage />);

      expect(screen.getByText(/你好|欢迎|开始/)).toBeInTheDocument();
    });

    it("应该渲染输入框", () => {
      render(<ChatPage />);

      expect(screen.getByRole("textbox", { name: /输入消息/ })).toBeInTheDocument();
    });

    it("应该渲染发送按钮", () => {
      render(<ChatPage />);

      expect(screen.getByRole("button", { name: /发送/ })).toBeInTheDocument();
    });

    it("应显示免责声明（AI 能力边界提示）", () => {
      render(<ChatPage />);

      expect(screen.getByText(/AI.*出错|核实|mistakes|重要信息/i)).toBeInTheDocument();
    });
  });

  describe("有消息时", () => {
    beforeEach(() => {
      mockUseChatWithConversation.mockReturnValue({
        messages: [
          { id: "msg_1", role: "user", parts: [{ type: "text", text: "你好" }] },
          { id: "msg_2", role: "assistant", parts: [{ type: "text", text: "你好！" }] },
        ],
        sendMessage: vi.fn(),
        status: "ready",
        error: undefined,
        stop: vi.fn(),
        regenerate: mockRegenerate,
        clearError: vi.fn(),
      } as never);
    });

    it("应显示重新生成按钮", () => {
      render(<ChatPage />);

      expect(screen.getByRole("button", { name: /重新生成/ })).toBeInTheDocument();
    });

    it("点击重新生成应调用 regenerate", async () => {
      const user = userEvent.setup({ delay: null });
      render(<ChatPage />);

      await user.click(screen.getByRole("button", { name: /重新生成/ }));

      expect(mockRegenerate).toHaveBeenCalledTimes(1);
    });
  });

  describe("交互", () => {
    beforeEach(() => {
      mockUseChatWithConversation.mockReturnValue({
        messages: [],
        sendMessage: vi.fn(),
        status: "ready",
        error: undefined,
        stop: vi.fn(),
        regenerate: mockRegenerate,
        clearError: vi.fn(),
      });
    });

    it("点击新建对话应创建会话并跳转", async () => {
      const user = userEvent.setup({ delay: null });
      mockCreateConversation.mockReturnValue("conv_new_123");
      render(<ChatPage />);

      // 先打开侧边栏，再点击新建对话
      await user.click(screen.getByRole("button", { name: /打开侧边栏/i }));
      await user.click(screen.getByRole("button", { name: /新建对话/ }));

      expect(mockCreateConversation).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/chat/conv_new_123", { replace: true });
    });

    it("点击快捷提示词应填入输入框", async () => {
      const user = userEvent.setup({ delay: null });
      render(<ChatPage />);

      await user.click(screen.getByRole("button", { name: "写一封邮件" }));

      expect(screen.getByRole("textbox")).toHaveValue("帮我写一封邮件");
    });
  });
});
