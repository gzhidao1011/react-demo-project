import { LocaleSwitcher, useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import { authLogout } from "@repo/services";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui";
import { clearTokens } from "@repo/utils";
import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChatContent, ChatSidebar } from "./components";
import { useConversationMessages } from "./hooks/use-conversation-messages";
import { useConversations } from "./hooks/use-conversations";

const LoadingState = memo(function LoadingState({ message, ariaLabel }: { message: string; ariaLabel: string }) {
  return (
    <div className="flex flex-1 items-center justify-center" aria-busy="true" aria-label={ariaLabel}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
});

export default function ChatPage() {
  const { t } = useLocale();
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const conversationId = params.id ?? null;

  const {
    conversations,
    activeId,
    listLoading,
    listError,
    createConversation,
    deleteConversation,
    setActiveId,
    updateConversationTitle,
  } = useConversations();

  const { messages: initialMessages, loading: messagesLoading } = useConversationMessages(conversationId);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNewChat = useCallback(async () => {
    try {
      const id = await createConversation();
      navigate(`/chat/${id}`, { replace: true });
      setSidebarOpen(false);
    } catch {
      toast.error(t("chat.errorGeneric"));
    }
  }, [createConversation, navigate, t]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      navigate(`/chat/${id}`, { replace: true });
      setSidebarOpen(false);
    },
    [setActiveId, navigate],
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversation(id);
        if (activeId === id) {
          navigate("/chat", { replace: true });
        }
      } catch {
        toast.error(t("chat.errorGeneric"));
      }
    },
    [activeId, deleteConversation, navigate, t],
  );

  const handleSidebarOpenChange = useCallback((open: boolean) => {
    setSidebarOpen(open);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authLogout();
    } catch {
      // 忽略服务端登出失败，本地仍清除 token
    } finally {
      clearTokens();
      toast.success(t("chat.logoutSuccess"));
      navigate("/sign-in", { replace: true });
    }
  }, [navigate, t]);

  // 打开 /chat 无 id 时：先等列表加载，有会话则跳转第一个，否则新建
  useEffect(() => {
    if (conversationId) return;
    if (listLoading) return;
    if (conversations.length > 0) {
      navigate(`/chat/${conversations[0].id}`, { replace: true });
      return;
    }
    createConversation()
      .then((id) => navigate(`/chat/${id}`, { replace: true }))
      .catch(() => toast.error(t("chat.errorGeneric")));
  }, [conversationId, listLoading, conversations, createConversation, navigate, t]);

  return (
    <>
      <LocaleSwitcher className="fixed right-4 top-4 z-10" />
      <SidebarProvider
        defaultOpen={false}
        open={sidebarOpen}
        onOpenChange={handleSidebarOpenChange}
        keyboardShortcut="k"
        className="flex h-screen overflow-hidden bg-background"
      >
        <Sidebar collapsible="offcanvas" className="w-64 shrink-0">
          <ChatSidebar
            conversations={conversations}
            activeId={conversationId}
            listLoading={listLoading}
            listError={listError}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={updateConversationTitle}
            onLogout={handleLogout}
          />
        </Sidebar>
        <SidebarInset>
          <div className="flex h-full min-h-0 w-full flex-col">
            <div className="flex shrink-0 items-center border-b border-border bg-muted px-2 py-2">
              <SidebarTrigger aria-label={t("chat.openSidebar")} title={t("chat.openSidebarTitle")} />
            </div>
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {!conversationId ? (
                <LoadingState
                  message={listLoading ? t("chat.loading") : t("chat.loadingCreating")}
                  ariaLabel={t("chat.loading")}
                />
              ) : messagesLoading ? (
                <LoadingState message={t("chat.loadingHistory")} ariaLabel={t("chat.loading")} />
              ) : (
                <ChatContent
                  key={conversationId}
                  conversationId={conversationId}
                  initialMessages={initialMessages}
                  onUpdateConversationTitle={updateConversationTitle}
                />
              )}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
