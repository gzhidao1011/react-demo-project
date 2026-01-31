import { toast } from "@repo/propel";
import { Button } from "@repo/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatWithConversation } from "../hooks/use-chat";
import type { InitialMessage } from "../hooks/use-conversation-messages";
import { formatDateSeparator } from "../lib/format-time";
import { DEFAULT_SUGGESTED_PROMPTS, FOLLOW_UP_PROMPTS } from "../lib/suggested-prompts";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";

interface ChatContentProps {
  conversationId: string;
  initialMessages: InitialMessage[];
  conversations: Array<{ id: string; title: string; createdAt: number }>;
  onUpdateConversationTitle: (id: string, title: string) => void;
}

/**
 * 聊天主体：消息列表 + 输入框
 * 仅在加载完历史消息后挂载，确保 useChat 获得正确的 initialMessages
 */
export function ChatContent({
  conversationId,
  initialMessages,
  conversations,
  onUpdateConversationTitle,
}: ChatContentProps) {
  const handleChatError = useCallback((err: Error) => {
    console.error("[Chat] useChat error:", err);
  }, []);

  const handleChatFinish = useCallback(
    (options: { message?: unknown; messages?: unknown[] }) => {
      const meta = (options?.message as { metadata?: { conversationId?: string; conversationTitle?: string } })
        ?.metadata;
      if (meta?.conversationId && meta?.conversationTitle) {
        onUpdateConversationTitle(meta.conversationId, meta.conversationTitle);
      }
    },
    [onUpdateConversationTitle],
  );

  const { messages, sendMessage, status, error, stop, regenerate, clearError } = useChatWithConversation({
    conversationId,
    initialMessages,
    onError: handleChatError,
    onFinish: handleChatFinish,
  });

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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messageTimestampsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const map = messageTimestampsRef.current;
    const now = Date.now();
    for (const msg of messages) {
      if (!map.has(msg.id)) map.set(msg.id, now);
    }
  }, [messages]);

  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
    } catch {
      // jsdom 等测试环境可能不支持
    }
  }, [messages]);

  useEffect(() => {
    if (status === "ready") {
      inputRef.current?.focus();
    }
  }, [status, conversationId]);

  const handleSend = useCallback(
    (text: string, files?: File[]) => {
      clearError();
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
  }, []);

  const isStreaming = status === "streaming" || status === "submitted";
  const isDisabled = status !== "ready";

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {messages.length === 0 ? (
        /* 空状态：参考 ChatGPT，标题 + 快捷提示 + 输入框整体上下居中 */
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
          <div className="flex w-full max-w-2xl flex-col items-center gap-6">
            <h2 className="text-center text-2xl font-semibold text-foreground">What can I help with?</h2>
            {DEFAULT_SUGGESTED_PROMPTS.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {DEFAULT_SUGGESTED_PROMPTS.map((p) => (
                  <Button
                    key={p.id}
                    type="button"
                    variant="outline"
                    onClick={() => handlePromptSelect(p.text)}
                    className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            )}
            <div className="w-full max-w-2xl">
              <ChatInput
                inputRef={inputRef}
                value={input}
                onChange={setInput}
                onSend={handleSend}
                disabled={isDisabled}
                placeholder="Message ChatGPT..."
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-1 flex-col min-h-0">
          <div
            ref={messagesScrollRef}
            className="flex-1 overflow-y-auto pb-20"
            role="log"
            aria-live="polite"
            aria-busy={isStreaming}
          >
            <div className="mx-auto max-w-3xl">
              {messages.flatMap((msg, index) => {
                const ts = messageTimestampsRef.current.get(msg.id);
                const prevTs = index > 0 ? messageTimestampsRef.current.get(messages[index - 1]!.id) : undefined;
                const showDateSeparator =
                  ts !== undefined && (prevTs === undefined || formatDateSeparator(prevTs) !== formatDateSeparator(ts));
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
              {lastAssistantMessage && (
                <div className="flex flex-col gap-2 px-4 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {isStreaming ? (
                      <Button type="button" variant="outline" size="sm" onClick={stop}>
                        Stop generating
                      </Button>
                    ) : (
                      <>
                        <Button type="button" variant="outline" size="sm" onClick={() => regenerate()}>
                          Regenerate
                        </Button>
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
          </div>
        </div>
      )}
      {messages.length > 0 && error && (
        <div
          className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <span>Something went wrong. Please try again.</span>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="destructive" size="sm" onClick={() => regenerate()}>
              Retry
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
      {messages.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center px-4 py-4 sm:px-6">
          <div className="w-full max-w-3xl">
            <ChatInput
              inputRef={inputRef}
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={isDisabled}
              placeholder="Message ChatGPT... (Enter to send, Shift+Enter for new line)"
            />
          </div>
        </div>
      )}
    </div>
  );
}
