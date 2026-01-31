import { Bars3Icon } from "@heroicons/react/16/solid";
import { Button } from "@repo/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChatContent, ChatSidebar } from "./components";
import { useConversationMessages } from "./hooks/use-conversation-messages";
import { useConversations } from "./hooks/use-conversations";

export default function ChatPage() {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const conversationId = params.id ?? null;

  const { conversations, activeId, createConversation, deleteConversation, setActiveId, updateConversationTitle } =
    useConversations();

  const { messages: initialMessages, loading: messagesLoading } = useConversationMessages(conversationId);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarCloseRef = useRef<HTMLButtonElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const prevSidebarOpen = useRef(false);
  useEffect(() => {
    if (sidebarOpen && !prevSidebarOpen.current) {
      sidebarCloseRef.current?.focus();
    } else if (!sidebarOpen && prevSidebarOpen.current) {
      expandButtonRef.current?.focus();
    }
    prevSidebarOpen.current = sidebarOpen;
  }, [sidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!conversationId) {
      const id = createConversation();
      navigate(`/chat/${id}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅当 conversationId 为空时执行一次
  }, [conversationId]);

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

  const handleDeleteConversation = (id: string) => {
    deleteConversation(id);
    if (activeId === id) {
      navigate("/chat", { replace: true });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 左侧：收起时显示展开图标（参考 ChatGPT），展开时显示完整侧边栏 */}
      <div
        className={`flex shrink-0 flex-col border-r border-border bg-muted transition-[width] duration-200 ease-out motion-reduce:transition-none ${
          sidebarOpen ? "w-64" : "w-12 overflow-hidden"
        }`}
      >
        {sidebarOpen ? (
          <ChatSidebar
          conversations={conversations}
          activeId={conversationId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={updateConversationTitle}
          onClose={() => setSidebarOpen(false)}
          closeButtonRef={sidebarCloseRef}
        />
        ) : (
          <div className="flex h-full w-12 flex-col items-center py-3">
            <Button
              ref={expandButtonRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setSidebarOpen(true)}
              className="rounded p-2 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
              aria-label="打开侧边栏（⌘K）"
              title="打开侧边栏 (⌘K / Ctrl+K)"
            >
              <Bars3Icon className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {!conversationId ? (
          <div className="flex flex-1 items-center justify-center" aria-busy="true" aria-label="加载中">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">创建会话...</span>
            </div>
          </div>
        ) : messagesLoading ? (
          <div className="flex flex-1 items-center justify-center" aria-busy="true" aria-label="加载中">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">加载聊天记录...</span>
            </div>
          </div>
        ) : (
          <ChatContent
            key={conversationId}
            conversationId={conversationId}
            initialMessages={initialMessages}
            conversations={conversations}
            onUpdateConversationTitle={updateConversationTitle}
          />
        )}
      </main>
    </div>
  );
}
