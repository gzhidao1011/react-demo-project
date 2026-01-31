import { MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/16/solid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  cn,
  Input,
} from "@repo/ui";
import type { KeyboardEvent, MouseEvent, RefObject } from "react";
import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import type { Conversation } from "../lib/chat.types";

const EMPTY_LIST_MSG = "No conversations yet";
const EMPTY_LIST_HINT = 'Click "New chat" above to get started';
const NO_MATCH_MSG = "No matching conversations";
const ALERT_DELETE_TITLE = "Delete conversation?";
const ALERT_DELETE_DESC =
  "This action cannot be undone. The conversation and all its messages will be permanently removed.";
const ALERT_CANCEL = "Cancel";
const ALERT_DELETE = "Delete";
const SEARCH_PLACEHOLDER = "Search conversations...";
const NEW_CHAT = "New chat";
const CLOSE_SIDEBAR = "Close sidebar";
const ASIDE_BASE = "flex flex-col border-r border-border bg-muted";

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
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * 侧边栏：新建对话、会话列表、会话重命名
 * 支持 overlay 模式（参考 ChatGPT/Claude 主流交互）
 */
export const ChatSidebar = memo(function ChatSidebar({
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredConversations = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, deferredSearchQuery]);

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
    (e: KeyboardEvent<HTMLInputElement>, id: string) => {
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

  const handleRenameClick = useCallback(
    (e: MouseEvent, conv: Conversation) => {
      e.stopPropagation();
      startEdit(conv);
    },
    [startEdit],
  );

  const handleDeleteClick = useCallback((e: MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  }, []);

  const handleAlertOpenChange = useCallback((open: boolean) => {
    if (!open) setDeleteConfirmId(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirmId) {
      onDeleteConversation(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, onDeleteConversation]);

  const asideClasses = useMemo(
    () => (overlay ? `${ASIDE_BASE} h-full w-full shadow-xl` : `${ASIDE_BASE} w-64 shrink-0`),
    [overlay],
  );

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
            aria-label={CLOSE_SIDEBAR}
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
          aria-label={NEW_CHAT}
        >
          <PlusIcon className="h-5 w-5" />
          {NEW_CHAT}
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
              placeholder={SEARCH_PLACEHOLDER}
              className="h-9 w-full pl-8"
              aria-label="Search conversations"
            />
          </div>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Conversation list">
        {filteredConversations.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            {conversations.length === 0 ? (
              <>
                {EMPTY_LIST_MSG}
                <br />
                <span className="text-xs">{EMPTY_LIST_HINT}</span>
              </>
            ) : (
              <>{NO_MATCH_MSG}</>
            )}
          </p>
        ) : (
          <>
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={cn("group flex items-center gap-2 rounded-lg px-3 py-2", activeId === conv.id && "bg-card")}
              >
                {editingId === conv.id ? (
                  <Input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, conv.id)}
                    onBlur={() => saveEdit(conv.id)}
                    className="min-w-0 flex-1"
                    aria-label="Edit conversation title"
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
                        onClick={(e) => handleRenameClick(e, conv)}
                        aria-label={`Rename ${conv.title}`}
                        className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => handleDeleteClick(e, conv.id)}
                      aria-label={`Delete ${conv.title}`}
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
      {/* 删除确认弹窗（主流交互：防止误删） */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={handleAlertOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ALERT_DELETE_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>{ALERT_DELETE_DESC}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ALERT_CANCEL}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              {ALERT_DELETE}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
});
