import { toast } from "@repo/propel";
import { Button } from "@repo/ui";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { useChatWithConversation } from "../hooks/use-chat";
import type { InitialMessage } from "../hooks/use-conversation-messages";
import { formatDateSeparator } from "../lib/format-time";
import { DEFAULT_SUGGESTED_PROMPTS, FOLLOW_UP_PROMPTS } from "../lib/suggested-prompts";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";

/** 空状态标题 */
const EMPTY_STATE_TITLE = "What can I help with?";
/** 空状态输入框 placeholder */
const EMPTY_PLACEHOLDER = "Message ChatGPT...";
/** 有消息时底部输入框 placeholder */
const BOTTOM_PLACEHOLDER = "Message ChatGPT... (Enter to send, Shift+Enter for new line)";
/** 错误 Toast 文案 */
const ERROR_NETWORK = "Network error. Please check your connection and ensure the backend is running.";
const ERROR_GENERIC = "Something went wrong. Please try again.";
const ERROR_BANNER_MSG = ERROR_GENERIC;
const BTN_RETRY = "Retry";
const BTN_DISMISS = "Dismiss";
const TOAST_COPIED = "Copied to clipboard";
const TOAST_COPY_FAILED = "Failed to copy";
const TOAST_FEEDBACK = "Thanks for your feedback!";

const DOT_DELAYS = [0, 150, 300] as const;
const ARIA_GENERATING = "Generating";

interface ErrorBannerProps {
  onRetry: () => void;
  onDismiss: () => void;
}

const ERROR_BANNER_CLASSES =
  "flex shrink-0 items-center justify-between gap-3 border-t border-border bg-destructive/10 px-4 py-3 text-sm text-destructive";
const ErrorBanner = memo(function ErrorBanner({ onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div className={ERROR_BANNER_CLASSES} role="alert">
      <span>{ERROR_BANNER_MSG}</span>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="destructive" size="sm" onClick={onRetry}>
          {BTN_RETRY}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
          {BTN_DISMISS}
        </Button>
      </div>
    </div>
  );
});

const StreamingDots = memo(function StreamingDots() {
  return (
    <div className="flex justify-start px-4 py-2" aria-hidden>
      <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-2" role="status" aria-label={ARIA_GENERATING}>
        {DOT_DELAYS.map((delay) => (
          <span
            key={delay}
            className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
});

interface SuggestedPromptsProps {
  prompts: Array<{ id: string; label: string; text: string }>;
  onSelect: (text: string) => void;
}

const SuggestedPrompts = memo(function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  if (prompts.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {prompts.map((p) => (
        <Button
          key={p.id}
          type="button"
          variant="outline"
          onClick={() => onSelect(p.text)}
          className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
});

interface ActionButtonsProps {
  isStreaming: boolean;
  onStop: () => void;
  onRegenerate: () => void;
  onFollowUp: (text: string) => void;
}

interface DateSeparatorProps {
  ts: number;
}

const ARIA_MESSAGES_FROM_PREFIX = "Messages from";
const DateSeparator = memo(function DateSeparator({ ts }: DateSeparatorProps) {
  const label = formatDateSeparator(ts);
  return (
    <div className="flex justify-center py-3" role="separator" aria-label={`${ARIA_MESSAGES_FROM_PREFIX} ${label}`}>
      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{label}</span>
    </div>
  );
});

const BTN_STOP = "Stop generating";
const BTN_REGENERATE = "Regenerate";

const ActionButtons = memo(function ActionButtons({
  isStreaming,
  onStop,
  onRegenerate,
  onFollowUp,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isStreaming ? (
        <Button type="button" variant="outline" size="sm" onClick={onStop}>
          {BTN_STOP}
        </Button>
      ) : (
        <>
          <Button type="button" variant="outline" size="sm" onClick={onRegenerate}>
            {BTN_REGENERATE}
          </Button>
          {FOLLOW_UP_PROMPTS.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onFollowUp(p.text)}
              className="text-muted-foreground hover:text-foreground"
            >
              {p.label}
            </Button>
          ))}
        </>
      )}
    </div>
  );
});

interface EmptyStateProps {
  onPromptSelect: (text: string) => void;
  input: string;
  onInputChange: (v: string) => void;
  onSend: (text: string, files?: File[]) => void;
  disabled: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

interface BottomInputBarProps {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  input: string;
  onInputChange: (v: string) => void;
  onSend: (text: string, files?: File[]) => void;
  disabled: boolean;
}

const BOTTOM_INPUT_WRAPPER =
  "fixed bottom-0 left-0 right-0 flex justify-center px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-6";
const BOTTOM_INPUT_INNER = "w-full max-w-3xl";
const MESSAGES_SCROLL_CLASSES = "flex-1 overflow-y-auto pb-20";
const BottomInputBar = memo(function BottomInputBar({
  inputRef,
  input,
  onInputChange,
  onSend,
  disabled,
}: BottomInputBarProps) {
  return (
    <div className={BOTTOM_INPUT_WRAPPER}>
      <div className={BOTTOM_INPUT_INNER}>
        <ChatInput
          inputRef={inputRef}
          value={input}
          onChange={onInputChange}
          onSend={onSend}
          disabled={disabled}
          placeholder={BOTTOM_PLACEHOLDER}
        />
      </div>
    </div>
  );
});

const EMPTY_STATE_WRAPPER = "flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8";
const EMPTY_STATE_INNER = "flex w-full max-w-2xl flex-col items-center gap-6";
const EmptyState = memo(function EmptyState({
  onPromptSelect,
  input,
  onInputChange,
  onSend,
  disabled,
  inputRef,
}: EmptyStateProps) {
  return (
    <div className={EMPTY_STATE_WRAPPER}>
      <div className={EMPTY_STATE_INNER}>
        <h2 className="text-center text-2xl font-semibold text-foreground">{EMPTY_STATE_TITLE}</h2>
        <SuggestedPrompts prompts={DEFAULT_SUGGESTED_PROMPTS} onSelect={onPromptSelect} />
        <div className="w-full max-w-2xl">
          <ChatInput
            inputRef={inputRef}
            value={input}
            onChange={onInputChange}
            onSend={onSend}
            disabled={disabled}
            placeholder={EMPTY_PLACEHOLDER}
          />
        </div>
      </div>
    </div>
  );
});

interface ChatContentProps {
  conversationId: string;
  initialMessages: InitialMessage[];
  onUpdateConversationTitle: (id: string, title: string) => void;
}

/**
 * 聊天主体：消息列表 + 输入框
 * 仅在加载完历史消息后挂载，确保 useChat 获得正确的 initialMessages
 */
export const ChatContent = memo(function ChatContent({
  conversationId,
  initialMessages,
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

  const prevErrorRef = useRef<Error | null>(null);
  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      prevErrorRef.current = error;
      const msg =
        error?.message?.includes("fetch") || error?.message?.includes("Network")
          ? ERROR_NETWORK
          : (error?.message ?? ERROR_GENERIC);
      toast.error(msg);
    } else if (!error) {
      prevErrorRef.current = null;
    }
  }, [error]);

  const [input, setInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  /** 消息滚动容器 ref（用于未来可能的滚动控制，如 scrollToTop） */
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messageTimestampsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const map = messageTimestampsRef.current;
    const now = Date.now();
    for (const msg of messages) {
      if (!map.has(msg.id)) map.set(msg.id, now);
    }
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

  const toFileList = useCallback((files: File[]) => {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    return dt.files;
  }, []);

  const handleSend = useCallback(
    (text: string, files?: File[]) => {
      clearError();
      const fileList = files?.length ? toFileList(files) : undefined;
      sendMessage({
        text: text || " ",
        files: fileList,
        ...(editingMessageId ? { messageId: editingMessageId } : {}),
      });
      setInput("");
      setEditingMessageId(null);
    },
    [clearError, sendMessage, editingMessageId, toFileList],
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

  const handleFollowUpClick = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend],
  );

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(TOAST_COPIED);
    } catch {
      toast.error(TOAST_COPY_FAILED);
    }
  }, []);

  const handleFeedback = useCallback((_messageId: string, _direction: "up" | "down") => {
    toast.success(TOAST_FEEDBACK);
  }, []);

  const isStreaming = status === "streaming" || status === "submitted";
  const isDisabled = status !== "ready";

  const { lastAssistantMessage, lastUserMessage } = useMemo(() => {
    const reversed = [...messages].reverse();
    return {
      lastAssistantMessage: reversed.find((m) => m.role === "assistant"),
      lastUserMessage: reversed.find((m) => m.role === "user"),
    };
  }, [messages]);

  const handleRegenerate = regenerate;
  const handleDismissError = clearError;
  const handleStop = stop;

  const hasMessages = messages.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {!hasMessages ? (
        <EmptyState
          onPromptSelect={handlePromptSelect}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          disabled={isDisabled}
          inputRef={inputRef}
        />
      ) : (
        <div className="relative flex flex-1 flex-col min-h-0">
          <div
            ref={messagesScrollRef}
            className={MESSAGES_SCROLL_CLASSES}
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
                  ...(showDateSeparator && ts !== undefined ? [<DateSeparator key={`sep-${msg.id}`} ts={ts} />] : []),
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
              {isStreaming && !lastAssistantMessage && <StreamingDots />}
              {lastAssistantMessage && (
                <div className="flex flex-col gap-2 px-4 pb-2">
                  <ActionButtons
                    isStreaming={isStreaming}
                    onStop={handleStop}
                    onRegenerate={handleRegenerate}
                    onFollowUp={handleFollowUpClick}
                  />
                </div>
              )}
              <div ref={messagesEndRef} aria-hidden />
            </div>
          </div>
        </div>
      )}
      {hasMessages && error && <ErrorBanner onRetry={handleRegenerate} onDismiss={handleDismissError} />}
      {hasMessages && (
        <BottomInputBar
          inputRef={inputRef}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          disabled={isDisabled}
        />
      )}
    </div>
  );
});
