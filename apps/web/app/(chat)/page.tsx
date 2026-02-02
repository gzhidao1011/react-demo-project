import { toast } from "@repo/propel";
import { authLogout } from "@repo/services";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui";
import { clearTokens } from "@repo/utils";
import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChatContent, ChatSidebar } from "./components";
import { useConversationMessages } from "./hooks/use-conversation-messages";
import { useConversations } from "./hooks/use-conversations";

const LOADING_CREATING = "Creating conversation...";
const LOADING_HISTORY = "Loading chat history...";
const ARIA_LOADING = "Loading";

const LoadingState = memo(function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center" aria-busy="true" aria-label={ARIA_LOADING}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
});

export default function ChatPage() {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const conversationId = params.id ?? null;

  const { conversations, activeId, createConversation, deleteConversation, setActiveId, updateConversationTitle } =
    useConversations();

  const { messages: initialMessages, loading: messagesLoading } = useConversationMessages(conversationId);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNewChat = useCallback(() => {
    const id = createConversation();
    navigate(`/chat/${id}`, { replace: true });
    setSidebarOpen(false);
  }, [createConversation, navigate]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      navigate(`/chat/${id}`, { replace: true });
      setSidebarOpen(false);
    },
    [setActiveId, navigate],
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      deleteConversation(id);
      if (activeId === id) {
        navigate("/chat", { replace: true });
      }
    },
    [activeId, deleteConversation, navigate],
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
      toast.success("已退出登录");
      navigate("/sign-in", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!conversationId) {
      const id = createConversation();
      navigate(`/chat/${id}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅当 conversationId 为空时执行一次
  }, [conversationId]);

  return (
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
            <SidebarTrigger aria-label="Open sidebar (⌘K)" title="Open sidebar (⌘K / Ctrl+K)" />
          </div>
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {!conversationId ? (
              <LoadingState message={LOADING_CREATING} />
            ) : messagesLoading ? (
              <LoadingState message={LOADING_HISTORY} />
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
  );
}
