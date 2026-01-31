import { Bars3Icon } from "@heroicons/react/16/solid";
import { Button } from "@repo/ui";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
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
  const sidebarCloseRef = useRef<HTMLButtonElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const prevSidebarOpen = useRef(false);
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      sidebarCloseRef.current?.focus();
    } else {
      document.body.style.overflow = "";
      if (prevSidebarOpen.current) expandButtonRef.current?.focus();
    }
    prevSidebarOpen.current = sidebarOpen;
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

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

  const handleDeleteConversation = useCallback(
    (id: string) => {
      deleteConversation(id);
      if (activeId === id) {
        navigate("/chat", { replace: true });
      }
    },
    [activeId, deleteConversation, navigate],
  );

  const handleBackdropClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) setSidebarOpen(false);
  }, []);

  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 左侧：收起时显示展开图标（ChatGPT 风格），展开时为 overlay 浮层 */}
      <div className="flex shrink-0 flex-col border-r border-border bg-muted transition-[width] duration-200 ease-out motion-reduce:transition-none w-12 overflow-hidden">
        <div className="flex h-full w-12 flex-col items-center py-3">
          <Button
            ref={expandButtonRef}
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleOpenSidebar}
            className="rounded p-2 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
            aria-label="Open sidebar (⌘K)"
            title="Open sidebar (⌘K / Ctrl+K)"
          >
            <Bars3Icon className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {/* Overlay：展开时浮层 + 半透明遮罩，点击遮罩关闭（主流交互） */}
      {sidebarOpen && (
        <>
          <div
            ref={backdropRef}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] animate-in fade-in-0 duration-200 md:bg-black/40"
            onClick={handleBackdropClick}
            aria-hidden
          />
          <div
            className="fixed inset-y-0 left-0 z-50 w-64 animate-in slide-in-from-left-4 duration-200 ease-out"
            role="dialog"
            aria-label="Conversation history"
          >
            <ChatSidebar
              conversations={conversations}
              activeId={conversationId}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              onRenameConversation={updateConversationTitle}
              overlay
              onClose={handleCloseSidebar}
              closeButtonRef={sidebarCloseRef}
            />
          </div>
        </>
      )}
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
  );
}
