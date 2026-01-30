import { MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { Button, Input } from "@repo/ui";
import { useCallback, useMemo, useState } from "react";
import type { Conversation } from "../lib/chat.types";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string, title: string) => void;
  /** 浮动模式：悬浮于内容之上，点击外部可关闭 */
  overlay?: boolean;
  onClose?: () => void;
  /** 关闭按钮 ref（用于焦点管理） */
  closeButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

/**
 * 侧边栏：新建对话、会话列表、会话重命名
 * 支持浮动/抽屉模式（参考 ChatGPT 2024 设计）
 */
export function ChatSidebar({
  conversations,
  activeId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  overlay = false,
  onClose,
  closeButtonRef,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const startEdit = useCallback((conv: Conversation) => {
    setEditingId(conv.id);
    setEditValue(conv.title);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue("");
  }, []);

  const saveEdit = useCallback(
    (id: string) => {
      const trimmed = editValue.trim();
      if (trimmed && onRenameConversation) {
        onRenameConversation(id, trimmed);
      }
      cancelEdit();
    },
    [editValue, onRenameConversation, cancelEdit],
  );

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveEdit(id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [saveEdit, cancelEdit],
  );

  const handleSelect = useCallback(
    (id: string) => {
      onSelectConversation(id);
      onClose?.();
    },
    [onSelectConversation, onClose],
  );

  const handleNewChatClick = useCallback(() => {
    onNewChat();
    onClose?.();
  }, [onNewChat, onClose]);

  const asideClasses = overlay
    ? "flex h-full w-full flex-col border-r border-border bg-muted shadow-xl"
    : "flex w-64 shrink-0 flex-col border-r border-border bg-muted";

  return (
    <aside className={asideClasses}>
      <div className="flex items-center gap-1 border-b border-border p-2">
        {onClose && (
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="rounded p-1.5 text-muted-foreground hover:bg-card hover:text-foreground"
            aria-label="关闭侧边栏"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="default"
          onClick={handleNewChatClick}
          className="flex flex-1 items-center justify-start gap-2 px-3 py-2"
          aria-label="新建对话"
        >
          <PlusIcon className="h-5 w-5" />
          新建对话
        </Button>
      </div>
      {/* 会话搜索（有会话时显示） */}
      {conversations.length > 0 && (
        <div className="border-b border-border p-2">
          <div className="relative">
            <MagnifyingGlassIcon
              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索会话..."
              className="h-9 w-full pl-8"
              aria-label="搜索会话"
            />
          </div>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="会话列表">
        {filteredConversations.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            {conversations.length === 0 ? (
              <>
                暂无对话
                <br />
                <span className="text-xs">点击上方「新建对话」开始</span>
              </>
            ) : (
              <>未找到匹配的会话</>
            )}
          </p>
        ) : (
          <>
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 rounded-lg px-3 py-2 ${
                  activeId === conv.id ? "bg-card" : ""
                }`}
              >
                {editingId === conv.id ? (
                  <Input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, conv.id)}
                    onBlur={() => saveEdit(conv.id)}
                    className="min-w-0 flex-1"
                    aria-label="编辑会话标题"
                    autoFocus
                  />
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleSelect(conv.id)}
                      className="min-w-0 flex-1 truncate text-left text-sm font-normal hover:text-primary"
                    >
                      {conv.title}
                    </Button>
                    {onRenameConversation && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(conv);
                        }}
                        aria-label={`重命名 ${conv.title}`}
                        className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      aria-label={`删除 ${conv.title}`}
                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
