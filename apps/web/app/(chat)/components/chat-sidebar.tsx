import {
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import { useLocale } from "@repo/i18n";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import type { KeyboardEvent } from "react";
import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router";
import type { Conversation } from "../lib/chat.types";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  /** 会话列表是否正在从后端加载 */
  listLoading?: boolean;
  /** 会话列表加载失败时的错误 */
  listError?: Error | null;
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
  listLoading = false,
  listError = null,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onLogout,
}: ChatSidebarProps) {
  const { t } = useLocale();
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
                aria-label={t("chat.closeSidebar")}
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
              <SidebarMenuButton
                onClick={handleNewChatClick}
                className="flex-1 justify-start gap-2"
                aria-label={t("chat.newChat")}
              >
                <PlusIcon className="h-5 w-5 shrink-0" />
                <span>{t("chat.newChat")}</span>
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
              placeholder={t("chat.searchPlaceholder")}
              className="h-9 pl-8"
              aria-label={t("chat.searchLabel")}
            />
          </div>
        </div>
      )}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {listLoading ? (
                <li className="px-3 py-4">
                  <p className="text-center text-sm text-muted-foreground" aria-busy="true">
                    {t("chat.loading")}
                  </p>
                  <div className="mx-auto mt-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </li>
              ) : listError ? (
                <li className="px-3 py-4">
                  <p className="text-center text-sm text-destructive" role="alert">
                    {listError.message || t("chat.errorGeneric")}
                  </p>
                </li>
              ) : filteredConversations.length === 0 ? (
                <li className="px-3 py-4">
                  <p className="text-center text-sm text-muted-foreground">
                    {conversations.length === 0 ? (
                      <>
                        {t("chat.emptyList")}
                        <br />
                        <span className="text-xs">{t("chat.emptyListHint")}</span>
                      </>
                    ) : (
                      <>{t("chat.noMatch")}</>
                    )}
                  </p>
                </li>
              ) : (
                filteredConversations.map((conv) => (
                  <SidebarMenuItem key={conv.id}>
                    <div
                      className={cn(
                        "group/row flex items-center gap-2 rounded-lg px-2 py-1.5",
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
                          aria-label={t("chat.editConversationTitle")}
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => e.stopPropagation()}
                                aria-label={t("chat.conversationActions", { title: conv.title })}
                                className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/row:opacity-100 shrink-0"
                              >
                                <EllipsisVerticalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              {onRenameConversation && (
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    startEdit(conv);
                                  }}
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                  <span>{t("chat.renameLabel")}</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setDeleteConfirmId(conv.id);
                                }}
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span>{t("chat.delete")}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              to="/settings"
              onClick={closeSidebar}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2"
              aria-label={t("chat.settings")}
            >
              <Cog6ToothIcon className="h-5 w-5 shrink-0" />
              <span>{t("chat.settings")}</span>
            </Link>
          </SidebarMenuItem>
          {onLogout && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogoutClick}
                className="justify-start gap-2 text-muted-foreground hover:text-destructive"
                aria-label={t("chat.logout")}
              >
                <ArrowRightStartOnRectangleIcon className="h-5 w-5 shrink-0" />
                <span>{t("chat.logout")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <AlertDialog open={!!deleteConfirmId} onOpenChange={handleAlertOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("chat.deleteConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              {t("chat.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showLogoutConfirm} onOpenChange={handleLogoutAlertOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.logoutConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("chat.logoutConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmLogout}>
              {t("chat.logout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
