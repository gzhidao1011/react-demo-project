import { Bars3Icon, ChevronDownIcon } from "@heroicons/react/16/solid";
import { toast } from "@repo/propel";
import { Button } from "@repo/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChatInput, ChatMessage, ChatSidebar, ChatWelcome } from "./components";
import { useChatWithConversation } from "./hooks/use-chat";
import { useConversations } from "./hooks/use-conversations";
import { formatDateSeparator } from "./lib/format-time";
import { DEFAULT_SUGGESTED_PROMPTS, FOLLOW_UP_PROMPTS } from "./lib/suggested-prompts";

export default function ChatPage() {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const conversationId = params.id ?? null;

  const { conversations, activeId, createConversation, deleteConversation, setActiveId, updateConversationTitle } =
    useConversations();

  const { messages, sendMessage, status, error, stop, regenerate, clearError } = useChatWithConversation({
    conversationId,
    initialMessages: [],
    onError: (err) => {
      console.error("[Chat] useChat error:", err);
    },
  });

  // 发送失败时 Toast 提示（用户可立即得知原因）
  useEffect(() => {
    if (error) {
      const msg =
        error?.message?.includes("fetch") || error?.message?.includes("Network")
          ? "网络连接失败，请确认后端服务已启动（chat-service 或 api-gateway）"
          : (error?.message ?? "发送失败，请检查网络或稍后重试");
      toast.error(msg);
    }
  }, [error]);

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const messageTimestampsRef = useRef<Map<string, number>>(new Map());

  // 切换会话时显示短暂加载状态（提升过渡体验，仅切换时触发，非初始挂载）
  const prevConversationIdRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevConversationIdRef.current = conversationId;
      return;
    }
    if (conversationId !== prevConversationIdRef.current) {
      prevConversationIdRef.current = conversationId;
      setIsTransitioning(true);
      const t = setTimeout(() => setIsTransitioning(false), 150);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [conversationId]);

  // 记录消息首次出现时间（用于相对时间戳）
  useEffect(() => {
    const map = messageTimestampsRef.current;
    const now = Date.now();
    for (const msg of messages) {
      if (!map.has(msg.id)) map.set(msg.id, now);
    }
  }, [messages]);

  // 访问 /chat 时自动创建新会话并跳转
  useEffect(() => {
    if (!conversationId) {
      const id = createConversation();
      navigate(`/chat/${id}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅当 conversationId 为空时执行一次
  }, [conversationId]);

  // 新消息时滚动到底部（jsdom 测试环境可能无 scrollIntoView）
  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
    } catch {
      // jsdom 等测试环境可能不支持
    }
    setShowScrollToBottom(false);
  }, [messages]);

  // 监听滚动，判断是否显示「回到底部」按钮
  const handleMessagesScroll = useCallback(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const threshold = 100;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    setShowScrollToBottom(!isNearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    try {
      messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
    } catch {
      // jsdom 等测试环境可能不支持
    }
    setShowScrollToBottom(false);
  }, []);

  // Escape 键关闭侧边栏
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  // 侧边栏打开时聚焦关闭按钮，关闭时聚焦汉堡菜单（焦点管理）
  const sidebarCloseRef = useRef<HTMLButtonElement>(null);
  const prevSidebarOpen = useRef(false);
  useEffect(() => {
    if (sidebarOpen && !prevSidebarOpen.current) {
      sidebarCloseRef.current?.focus();
    } else if (!sidebarOpen && prevSidebarOpen.current) {
      hamburgerRef.current?.focus();
    }
    prevSidebarOpen.current = sidebarOpen;
  }, [sidebarOpen]);

  // 输入框自动聚焦（主流交互：进入聊天即聚焦输入）
  useEffect(() => {
    if (status === "ready") {
      inputRef.current?.focus();
    }
  }, [status, conversationId]);

  // Cmd/Ctrl+K 打开侧边栏（参考 ChatGPT）
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

  const handleRenameConversation = (id: string, title: string) => {
    updateConversationTitle(id, title);
  };

  const handleSend = useCallback(
    (text: string, files?: File[]) => {
      clearError();
      // 将 File[] 转为 FileList（sendMessage 期望 FileList）
      let fileList: FileList | undefined;
      if (files?.length) {
        const dt = new DataTransfer();
        files.forEach((f) => dt.items.add(f));
        fileList = dt.files;
      }
      sendMessage({
        text: text || " ",
        files: fileList,
        ...(editingMessageId ? { messageId: editingMessageId } : {}),
      });
      setInput("");
      setEditingMessageId(null);
    },
    [clearError, sendMessage, editingMessageId],
  );

  const handleEditMessage = useCallback((messageId: string, text: string) => {
    setEditingMessageId(messageId);
    setInput(text);
    inputRef.current?.focus();
  }, []);

  const handlePromptSelect = useCallback((text: string) => {
    setInput(text);
    inputRef.current?.focus();
  }, []);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已复制到剪贴板");
    } catch {
      toast.error("复制失败");
    }
  }, []);

  const handleFeedback = useCallback((_messageId: string, direction: "up" | "down") => {
    toast.success(direction === "up" ? "感谢好评" : "感谢反馈");
    // TODO: 对接后端反馈 API
  }, []);

  const isStreaming = status === "streaming" || status === "submitted";
  const isDisabled = status !== "ready";

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 浮动侧边栏 + 遮罩（带滑入/滑出动画，Escape 关闭） */}
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 motion-reduce:transition-none ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-label="关闭侧边栏"
        aria-hidden={!sidebarOpen}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full transition-transform duration-200 ease-out motion-reduce:transition-none sm:w-64 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${!sidebarOpen ? "pointer-events-none" : ""}`}
        aria-hidden={!sidebarOpen}
      >
        <ChatSidebar
          conversations={conversations}
          activeId={conversationId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          overlay
          onClose={() => setSidebarOpen(false)}
          closeButtonRef={sidebarCloseRef}
        />
      </div>
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部栏：汉堡菜单 + 当前会话标题（有消息时） */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
          <Button
            ref={hamburgerRef}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-1.5 rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="打开侧边栏（⌘K）"
            title="打开侧边栏 (⌘K / Ctrl+K)"
          >
            <Bars3Icon className="h-5 w-5" />
            <kbd className="hidden rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
              {typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform ?? "") ? "⌘K" : "Ctrl+K"}
            </kbd>
          </Button>
          {messages.length > 0 && conversationId && (
            <span className="truncate text-sm font-medium text-foreground">
              {conversations.find((c) => c.id === conversationId)?.title ?? "新对话"}
            </span>
          )}
        </header>
        {messages.length === 0 && !isTransitioning ? (
          <ChatWelcome prompts={DEFAULT_SUGGESTED_PROMPTS} onPromptSelect={handlePromptSelect} />
        ) : (
          <div className="relative flex flex-1 flex-col min-h-0">
            {isTransitioning && messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center" aria-busy="true" aria-label="加载中">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">加载会话...</span>
                </div>
              </div>
            ) : (
              <div
                ref={messagesScrollRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto"
                role="log"
                aria-live="polite"
                aria-busy={isStreaming}
              >
                {messages.flatMap((msg, index) => {
                  const ts = messageTimestampsRef.current.get(msg.id);
                  const prevTs = index > 0 ? messageTimestampsRef.current.get(messages[index - 1]!.id) : undefined;
                  const showDateSeparator =
                    ts !== undefined &&
                    (prevTs === undefined || formatDateSeparator(prevTs) !== formatDateSeparator(ts));
                  return [
                    ...(showDateSeparator
                      ? [
                          <div
                            key={`sep-${msg.id}`}
                            className="flex justify-center py-3"
                            role="separator"
                            aria-label={`${formatDateSeparator(ts!)}的消息`}
                          >
                            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                              {formatDateSeparator(ts!)}
                            </span>
                          </div>,
                        ]
                      : []),
                    <ChatMessage
                      key={msg.id}
                      message={{
                        id: msg.id,
                        role: msg.role,
                        parts: msg.parts,
                        metadata: (msg as { metadata?: unknown }).metadata as
                          | { usage?: { inputTokens?: number; outputTokens?: number } }
                          | undefined,
                      }}
                      createdAt={ts}
                      onCopy={handleCopy}
                      onFeedback={handleFeedback}
                      onEdit={
                        !isStreaming && msg.role === "user" && msg.id === lastUserMessage?.id
                          ? (text) => handleEditMessage(msg.id, text)
                          : undefined
                      }
                    />,
                  ];
                })}
                {/* 流式输出时的打字指示器（等待首字时显示） */}
                {isStreaming && !lastAssistantMessage && (
                  <div className="flex justify-start px-4 py-2" aria-hidden>
                    <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-2">
                      <span
                        className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                )}
                {/* 停止/重新生成 + 建议回复：内联在最后一条 AI 消息下方（参考 ChatGPT） */}
                {lastAssistantMessage && (
                  <div className="flex flex-col gap-2 px-4 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {isStreaming ? (
                        <Button type="button" variant="outline" size="sm" onClick={stop}>
                          停止生成
                        </Button>
                      ) : (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={() => regenerate()}>
                            重新生成
                          </Button>
                          {/* 建议回复（后续提示词） */}
                          {FOLLOW_UP_PROMPTS.map((p) => (
                            <Button
                              key={p.id}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSend(p.text)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {p.label}
                            </Button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} aria-hidden />
              </div>
            )}
            {showScrollToBottom && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={scrollToBottom}
                className="absolute bottom-3 right-4 z-10 flex items-center gap-1 rounded-full shadow-md"
                aria-label="滚动到底部"
              >
                <ChevronDownIcon className="h-4 w-4" />
                回到底部
              </Button>
            )}
          </div>
        )}
        {error && (
          <div
            className="flex items-center justify-between gap-3 border-t border-border bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            <span>出错了，请重试。</span>
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="destructive" size="sm" onClick={() => regenerate()}>
                重试
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearError}>
                关闭
              </Button>
            </div>
          </div>
        )}
        <p className="px-4 py-2 text-center text-xs text-muted-foreground" role="note" aria-label="免责声明">
          AI 可能出错，请核实重要信息。
        </p>
        <ChatInput
          inputRef={inputRef}
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isDisabled}
          placeholder="输入消息...（Enter 发送，Shift+Enter 换行）"
        />
      </main>
    </div>
  );
}
