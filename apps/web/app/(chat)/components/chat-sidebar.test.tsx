import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Sidebar, SidebarProvider } from "@repo/ui";
import { renderWithI18n } from "../../test-utils";
import type { Conversation } from "../lib/chat.types";
import { ChatSidebar } from "./chat-sidebar";

const mockConversations: Conversation[] = [
  { id: "conv_1", title: "会话1", createdAt: 1000 },
  { id: "conv_2", title: "会话2", createdAt: 2000 },
];

async function renderWithSidebar(ui: React.ReactElement) {
  return renderWithI18n(
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="offcanvas">{ui}</Sidebar>
    </SidebarProvider>,
  );
}

describe("ChatSidebar", () => {
  const defaultProps = {
    conversations: mockConversations,
    activeId: "conv_1",
    onNewChat: vi.fn(),
    onSelectConversation: vi.fn(),
    onDeleteConversation: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("渲染", () => {
    it("应该渲染新建对话按钮", async () => {
      await renderWithSidebar(<ChatSidebar {...defaultProps} />);

      expect(screen.getByRole("button", { name: /新建对话/i })).toBeInTheDocument();
    });

    it("应该渲染会话列表", async () => {
      await renderWithSidebar(<ChatSidebar {...defaultProps} />);

      expect(screen.getByText("会话1")).toBeInTheDocument();
      expect(screen.getByText("会话2")).toBeInTheDocument();
    });

    it("空会话列表时不应渲染会话项", async () => {
      await renderWithSidebar(<ChatSidebar {...defaultProps} conversations={[]} />);

      expect(screen.queryByText("会话1")).not.toBeInTheDocument();
    });
  });

  describe("交互", () => {
    it("点击新建对话应调用 onNewChat", async () => {
      const user = userEvent.setup({ delay: null });
      const onNewChat = vi.fn();
      await renderWithSidebar(<ChatSidebar {...defaultProps} onNewChat={onNewChat} />);

      await user.click(screen.getByRole("button", { name: /新建对话/i }));

      expect(onNewChat).toHaveBeenCalledTimes(1);
    });

    it("点击会话项应调用 onSelectConversation 并传入 id", async () => {
      const user = userEvent.setup({ delay: null });
      const onSelectConversation = vi.fn();
      await renderWithSidebar(<ChatSidebar {...defaultProps} onSelectConversation={onSelectConversation} />);

      await user.click(screen.getByText("会话2"));

      expect(onSelectConversation).toHaveBeenCalledWith("conv_2");
    });

    it("点击删除应调用 onDeleteConversation", async () => {
      const user = userEvent.setup({ delay: null });
      const onDeleteConversation = vi.fn();
      await renderWithSidebar(<ChatSidebar {...defaultProps} onDeleteConversation={onDeleteConversation} />);

      const deleteButtons = screen.getAllByRole("button", { name: /删除/i });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole("button", { name: /^删除$/ }));

      expect(onDeleteConversation).toHaveBeenCalledWith("conv_1");
    });
  });

  describe("会话重命名", () => {
    it("有 onRenameConversation 时应显示编辑按钮", async () => {
      const onRenameConversation = vi.fn();
      await renderWithSidebar(<ChatSidebar {...defaultProps} onRenameConversation={onRenameConversation} />);

      const editButtons = screen.getAllByRole("button", { name: /重命名/i });
      expect(editButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("无 onRenameConversation 时不应显示编辑按钮", async () => {
      await renderWithSidebar(<ChatSidebar {...defaultProps} />);

      expect(screen.queryByRole("button", { name: /重命名/i })).not.toBeInTheDocument();
    });

    it("点击编辑应进入编辑模式并显示输入框", async () => {
      const user = userEvent.setup({ delay: null });
      const onRenameConversation = vi.fn();
      await renderWithSidebar(<ChatSidebar {...defaultProps} onRenameConversation={onRenameConversation} />);

      const editButtons = screen.getAllByRole("button", { name: /重命名/i });
      await user.click(editButtons[0]);

      const input = screen.getByDisplayValue("会话1");
      expect(input).toBeInTheDocument();
    });

    it("编辑后按 Enter 应调用 onRenameConversation 并退出编辑模式", async () => {
      const user = userEvent.setup({ delay: null });
      const onRenameConversation = vi.fn();
      await renderWithSidebar(<ChatSidebar {...defaultProps} onRenameConversation={onRenameConversation} />);

      const editButtons = screen.getAllByRole("button", { name: /重命名/i });
      await user.click(editButtons[0]);

      const input = screen.getByDisplayValue("会话1");
      await user.clear(input);
      await user.type(input, "新标题{Enter}");

      expect(onRenameConversation).toHaveBeenCalledWith("conv_1", "新标题");
      expect(screen.queryByDisplayValue("新标题")).not.toBeInTheDocument();
    });

    it("编辑后按 Escape 应取消编辑且不调用 onRenameConversation", async () => {
      const user = userEvent.setup({ delay: null });
      const onRenameConversation = vi.fn();
      await renderWithSidebar(<ChatSidebar {...defaultProps} onRenameConversation={onRenameConversation} />);

      const editButtons = screen.getAllByRole("button", { name: /重命名/i });
      await user.click(editButtons[0]);

      const input = screen.getByDisplayValue("会话1");
      await user.type(input, "修改内容");
      await user.keyboard("{Escape}");

      expect(onRenameConversation).not.toHaveBeenCalled();
      expect(screen.getByText("会话1")).toBeInTheDocument();
    });

    it("编辑时输入空标题按 Enter 应不调用 onRenameConversation 或恢复原标题", async () => {
      const user = userEvent.setup({ delay: null });
      const onRenameConversation = vi.fn();
      await renderWithSidebar(<ChatSidebar {...defaultProps} onRenameConversation={onRenameConversation} />);

      const editButtons = screen.getAllByRole("button", { name: /重命名/i });
      await user.click(editButtons[0]);

      const input = screen.getByDisplayValue("会话1");
      await user.clear(input);
      await user.keyboard("{Enter}");

      expect(onRenameConversation).not.toHaveBeenCalled();
    });
  });

  describe("关闭按钮", () => {
    it("应显示关闭按钮（使用 shadcn Sidebar 时始终显示）", async () => {
      await renderWithSidebar(<ChatSidebar {...defaultProps} />);

      expect(screen.getByRole("button", { name: /关闭侧边栏/i })).toBeInTheDocument();
    });

    it("点击关闭按钮应关闭侧边栏（通过 useSidebar）", async () => {
      const user = userEvent.setup({ delay: null });
      await renderWithSidebar(<ChatSidebar {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /关闭侧边栏/i }));

      expect(screen.getByRole("button", { name: /关闭侧边栏/i })).toBeInTheDocument();
    });
  });

  describe("可访问性", () => {
    it("新建对话按钮应可 Tab 聚焦", async () => {
      const user = userEvent.setup({ delay: null });
      await renderWithSidebar(<ChatSidebar {...defaultProps} />);

      await user.tab();
      await user.tab();
      expect(screen.getByRole("button", { name: /新建对话/i })).toHaveFocus();
    });
  });
});
