import {
  ArrowRightStartOnRectangleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
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
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui";
import type { KeyboardEvent, MouseEvent } from "react";
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
const LOGOUT = "退出登录";
const ALERT_LOGOUT_TITLE = "确认退出登录？";
const ALERT_LOGOUT_DESC = "退出后需要重新登录才能继续使用。";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation?: (id: string, title: string) => void;
  /** 退出登录回调，不传则不显示退出按钮 */
  onLogout?: () => void | Promise<void>;
}

/**
 * 侧边栏内容：新建对话、会话列表、会话重命名
 * 使用 shadcn Sidebar 组件结构，需置于 SidebarProvider + Sidebar 内
 */
export const ChatSidebar = memo(function ChatSidebar({
  conversations,
  activeId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onLogout,
}: ChatSidebarProps) {
  const { setOpen, setOpenMobile } = useSidebar();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredConversations = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, deferredSearchQuery]);

  const closeSidebar = useCallback(() => {
    setOpen(false);
    setOpenMobile(false);
  }, [setOpen, setOpenMobile]);

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
      closeSidebar();
    },
    [onSelectConversation, closeSidebar],
  );

  const handleNewChatClick = useCallback(() => {
    onNewChat();
    closeSidebar();
  }, [onNewChat, closeSidebar]);

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

  const handleLogoutAlertOpenChange = useCallback((open: boolean) => {
    if (!open) setShowLogoutConfirm(false);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirmId) {
      onDeleteConversation(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, onDeleteConversation]);

  const handleLogoutClick = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const handleConfirmLogout = useCallback(() => {
    onLogout?.();
    setShowLogoutConfirm(false);
    closeSidebar();
  }, [onLogout, closeSidebar]);

  return (
    <>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-1 w-full">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={closeSidebar}
                className="rounded p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shrink-0"
                aria-label={CLOSE_SIDEBAR}
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
              <SidebarMenuButton
                onClick={handleNewChatClick}
                className="flex-1 justify-start gap-2"
                aria-label={NEW_CHAT}
              >
                <PlusIcon className="h-5 w-5 shrink-0" />
                <span>{NEW_CHAT}</span>
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {conversations.length > 0 && (
        <div className="border-b border-sidebar-border p-2">
          <div className="relative">
            <MagnifyingGlassIcon
              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <SidebarInput
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={SEARCH_PLACEHOLDER}
              className="h-9 pl-8"
              aria-label="Search conversations"
            />
          </div>
        </div>
      )}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredConversations.length === 0 ? (
                <li className="px-3 py-4">
                  <p className="text-center text-sm text-muted-foreground">
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
                </li>
              ) : (
                filteredConversations.map((conv) => (
                  <SidebarMenuItem key={conv.id}>
                    <div
                      className={cn(
                        "group flex items-center gap-2 rounded-lg px-2 py-1.5",
                        activeId === conv.id && "bg-sidebar-accent",
                      )}
                    >
                      {editingId === conv.id ? (
                        <Input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, conv.id)}
                          onBlur={() => saveEdit(conv.id)}
                          className="min-w-0 flex-1 h-8"
                          aria-label="Edit conversation title"
                          autoFocus
                        />
                      ) : (
                        <>
                          <SidebarMenuButton
                            onClick={() => handleSelect(conv.id)}
                            isActive={activeId === conv.id}
                            className="min-w-0 flex-1 truncate text-left font-normal"
                          >
                            {conv.title}
                          </SidebarMenuButton>
                          {onRenameConversation && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => handleRenameClick(e, conv)}
                              aria-label={`Rename ${conv.title}`}
                              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100 shrink-0"
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
                            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 shrink-0"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {onLogout && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogoutClick}
                className="justify-start gap-2 text-muted-foreground hover:text-destructive"
                aria-label={LOGOUT}
              >
                <ArrowRightStartOnRectangleIcon className="h-5 w-5 shrink-0" />
                <span>{LOGOUT}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
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
      <AlertDialog open={showLogoutConfirm} onOpenChange={handleLogoutAlertOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ALERT_LOGOUT_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>{ALERT_LOGOUT_DESC}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ALERT_CANCEL}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmLogout}>
              {LOGOUT}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
