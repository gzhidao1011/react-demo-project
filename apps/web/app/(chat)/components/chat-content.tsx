import { useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import { Button } from "@repo/ui";
import type { RefObject } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChatWithConversation } from "../hooks/use-chat";
import type { InitialMessage } from "../hooks/use-conversation-messages";
import { formatDateSeparator } from "../lib/format-time";
import { getDefaultSuggestedPrompts, getFollowUpPrompts } from "../lib/suggested-prompts";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";

const DOT_DELAYS = [0, 150, 300] as const;

interface ErrorBannerProps {
  errorMsg: string;
  retryLabel: string;
  dismissLabel: string;
  onRetry: () => void;
  onDismiss: () => void;
}

const ERROR_BANNER_CLASSES =
  "flex shrink-0 items-center justify-between gap-3 border-t border-border bg-destructive/10 px-4 py-3 text-sm text-destructive";
const ErrorBanner = memo(function ErrorBanner({
  errorMsg,
  retryLabel,
  dismissLabel,
  onRetry,
  onDismiss,
}: ErrorBannerProps) {
  return (
    <div className={ERROR_BANNER_CLASSES} role="alert">
      <span>{errorMsg}</span>
      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="destructive" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
          {dismissLabel}
        </Button>
      </div>
    </div>
  );
});

interface StreamingDotsProps {
  ariaLabel: string;
}

const StreamingDots = memo(function StreamingDots({ ariaLabel }: StreamingDotsProps) {
  return (
    <div className="flex justify-start px-4 py-2" aria-hidden>
      <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-2" role="status" aria-label={ariaLabel}>
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

interface DateSeparatorProps {
  ts: number;
  locale: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const DateSeparator = memo(function DateSeparator({ ts, locale, t }: DateSeparatorProps) {
  const label = formatDateSeparator(ts, { locale, t });
  const ariaLabel = `${t("chat.messagesFrom")} ${label}`;
  return (
    <div className="flex justify-center py-3" role="separator" aria-label={ariaLabel}>
      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{label}</span>
    </div>
  );
});

interface ActionButtonsProps {
  isStreaming: boolean;
  onStop: () => void;
  onRegenerate: () => void;
  onFollowUp: (text: string) => void;
  stopLabel: string;
  regenerateLabel: string;
  prompts: Array<{ id: string; label: string; text: string }>;
}

const ActionButtons = memo(function ActionButtons({
  isStreaming,
  onStop,
  onRegenerate,
  onFollowUp,
  stopLabel,
  regenerateLabel,
  prompts,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isStreaming ? (
        <Button type="button" variant="outline" size="sm" onClick={onStop}>
          {stopLabel}
        </Button>
      ) : (
        <>
          <Button type="button" variant="outline" size="sm" onClick={onRegenerate}>
            {regenerateLabel}
          </Button>
          {prompts.map((p) => (
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
  emptyStateTitle: string;
  messagePlaceholder: string;
  prompts: Array<{ id: string; label: string; text: string }>;
}

interface BottomInputBarProps {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  input: string;
  onInputChange: (v: string) => void;
  onSend: (text: string, files?: File[]) => void;
  disabled: boolean;
  placeholder: string;
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
  placeholder,
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
          placeholder={placeholder}
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
  emptyStateTitle,
  messagePlaceholder,
  prompts,
}: EmptyStateProps) {
  return (
    <div className={EMPTY_STATE_WRAPPER}>
      <div className={EMPTY_STATE_INNER}>
        <h2 className="text-center text-2xl font-semibold text-foreground">{emptyStateTitle}</h2>
        <SuggestedPrompts prompts={prompts} onSelect={onPromptSelect} />
        <div className="w-full max-w-2xl">
          <ChatInput
            inputRef={inputRef}
            value={input}
            onChange={onInputChange}
            onSend={onSend}
            disabled={disabled}
            placeholder={messagePlaceholder}
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
  const { t, locale } = useLocale();
  const defaultPrompts = useMemo(() => getDefaultSuggestedPrompts(t), [t]);
  const followUpPrompts = useMemo(() => getFollowUpPrompts(t), [t]);

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
          ? t("chat.errorNetwork")
          : (error?.message ?? t("chat.errorGeneric"));
      toast.error(msg);
    } else if (!error) {
      prevErrorRef.current = null;
    }
  }, [error, t]);

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

  const handleCopy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(t("chat.copied"));
      } catch {
        toast.error(t("chat.copyFailed"));
      }
    },
    [t],
  );

  const handleFeedback = useCallback(
    (_messageId: string, _direction: "up" | "down") => {
      toast.success(t("chat.thanksFeedback"));
    },
    [t],
  );

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
          emptyStateTitle={t("chat.emptyStateTitle")}
          messagePlaceholder={t("chat.messagePlaceholder")}
          prompts={defaultPrompts}
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
                  ts !== undefined &&
                  (prevTs === undefined ||
                    formatDateSeparator(prevTs, { locale, t }) !== formatDateSeparator(ts, { locale, t }));
                return [
                  ...(showDateSeparator && ts !== undefined
                    ? [<DateSeparator key={`sep-${msg.id}`} ts={ts} locale={locale} t={t} />]
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
              {isStreaming && !lastAssistantMessage && <StreamingDots ariaLabel={t("chat.generating")} />}
              {lastAssistantMessage && (
                <div className="flex flex-col gap-2 px-4 pb-2">
                  <ActionButtons
                    isStreaming={isStreaming}
                    onStop={handleStop}
                    onRegenerate={handleRegenerate}
                    onFollowUp={handleFollowUpClick}
                    stopLabel={t("chat.stopGenerating")}
                    regenerateLabel={t("chat.regenerate")}
                    prompts={followUpPrompts}
                  />
                </div>
              )}
              <div ref={messagesEndRef} aria-hidden />
            </div>
          </div>
        </div>
      )}
      {hasMessages && error && (
        <ErrorBanner
          errorMsg={t("chat.errorGeneric")}
          retryLabel={t("chat.retry")}
          dismissLabel={t("chat.dismiss")}
          onRetry={handleRegenerate}
          onDismiss={handleDismissError}
        />
      )}
      {hasMessages && (
        <BottomInputBar
          inputRef={inputRef}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          disabled={isDisabled}
          placeholder={t("chat.messagePlaceholderHint")}
        />
      )}
    </div>
  );
});
