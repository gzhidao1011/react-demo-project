import {
  CheckIcon,
  ClipboardDocumentIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  PencilSquareIcon,
} from "@heroicons/react/16/solid";
import { Button, cn } from "@repo/ui";
import type { ReactNode } from "react";
import { memo, useCallback, useMemo, useRef, useState } from "react";

const PROSE_CLASSES =
  "prose prose-sm dark:prose-invert max-w-none [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1";

const ACTION_BTN_CLASSES =
  "absolute -right-2 -top-2 rounded p-1.5 opacity-100 transition-opacity hover:bg-muted md:opacity-0 md:group-hover:opacity-100";

import ReactMarkdown from "react-markdown";
import type { MessagePart } from "../lib/chat.types";
import { formatRelativeTime } from "../lib/format-time";

interface TextPart {
  type: "text";
  text: string;
}

interface MessageMetadata {
  usage?: { inputTokens?: number; outputTokens?: number };
}

interface ChatMessageProps {
  message: {
    id: string;
    role: "user" | "assistant" | "system";
    parts: MessagePart[];
    metadata?: MessageMetadata;
  };
  /** 消息时间戳（用于显示相对时间） */
  createdAt?: number;
  onCopy?: (text: string) => void;
  onFeedback?: (messageId: string, direction: "up" | "down") => void;
  /** 编辑消息（仅最后一条用户消息显示） */
  onEdit?: (text: string) => void;
}

function getTextContent(part: MessagePart): string | null {
  if (part.type === "text" && typeof (part as TextPart).text === "string") {
    return (part as TextPart).text;
  }
  return null;
}

function getAllText(message: { parts: MessagePart[] }): string {
  return message.parts
    .map((p) => getTextContent(p))
    .filter((t): t is string => t !== null)
    .join("");
}

const THINKING_LABEL = "Thinking";

const ReasoningBlock = memo(function ReasoningBlock({ text }: { text: string }) {
  return (
    <details className="text-muted-foreground">
      <summary className="cursor-pointer select-none text-sm">{THINKING_LABEL}</summary>
      <pre className="mt-1 whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs">{text}</pre>
    </details>
  );
});

function getSourceLabel(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

const SourceLink = memo(function SourceLink({ url, title }: { url: string; title?: string }) {
  const label = title ?? getSourceLabel(url);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block text-primary underline">
      [{label}]
    </a>
  );
});

const IMAGE_MIME_PREFIX = "image/";
const VIEW_ATTACHMENT = "View attachment";
const IMAGE_ALT = "Attachment";

const FilePart = memo(function FilePart({ url, mimeType }: { url: string; mimeType?: string }) {
  const isImage = (mimeType ?? "").startsWith(IMAGE_MIME_PREFIX);
  return (
    <span className="block">
      {isImage ? (
        <img src={url} alt={IMAGE_ALT} className="max-h-48 max-w-full rounded object-contain" />
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          {VIEW_ATTACHMENT}
        </a>
      )}
    </span>
  );
});

const ARIA_COPY_CODE = "Copy code";
const ARIA_EDIT_MESSAGE = "Edit message";
const ARIA_COPY = "Copy";
const ARIA_SENT_AT_PREFIX = "Sent at";
const FEEDBACK_BTN_CLASSES = "rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary";
const USAGE_LABEL_INPUT = "Input";
const USAGE_LABEL_OUTPUT = "Output";
const USAGE_ARIA = "Token usage";

const UsageDisplay = memo(function UsageDisplay({
  usage,
}: {
  usage?: { inputTokens?: number; outputTokens?: number };
}) {
  const hasInput = typeof usage?.inputTokens === "number";
  const hasOutput = typeof usage?.outputTokens === "number";
  if (!hasInput && !hasOutput) return null;
  return (
    <div className="mt-2 text-xs text-muted-foreground" aria-label={USAGE_ARIA}>
      {hasInput && (
        <span>
          {USAGE_LABEL_INPUT} {usage!.inputTokens}
        </span>
      )}
      {hasInput && hasOutput && " · "}
      {hasOutput && (
        <span>
          {USAGE_LABEL_OUTPUT} {usage!.outputTokens}
        </span>
      )}
    </div>
  );
});

const COPIED_TIMEOUT_MS = 2000;
const CODE_BLOCK_BTN_CLASSES =
  "absolute right-2 top-2 rounded p-1.5 opacity-100 transition-opacity hover:bg-muted md:opacity-0 md:group-hover/code:opacity-100";

/** 带复制按钮的代码块（用于 Markdown pre） */
const CodeBlock = memo(function CodeBlock({
  children,
  onCopy,
}: {
  children: ReactNode;
  onCopy?: (text: string) => void;
}) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = preRef.current?.textContent ?? "";
    if (text && onCopy) {
      onCopy(text);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_TIMEOUT_MS);
    }
  }, [onCopy]);

  return (
    <div className="group/code relative">
      <pre ref={preRef} className="rounded bg-muted p-2 [&>code]:!bg-transparent [&>code]:!p-0">
        {children}
      </pre>
      {onCopy && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          className={CODE_BLOCK_BTN_CLASSES}
          aria-label={ARIA_COPY_CODE}
        >
          {copied ? <CheckIcon className="h-4 w-4 text-primary" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
});

const MarkdownContent = memo(function MarkdownContent({
  text,
  onCopy,
}: {
  text: string;
  onCopy?: (text: string) => void;
}) {
  return (
    <span className={PROSE_CLASSES}>
      <ReactMarkdown
        components={{
          pre: ({ children }) => <CodeBlock onCopy={onCopy}>{children}</CodeBlock>,
        }}
      >
        {text}
      </ReactMarkdown>
    </span>
  );
});

const FeedbackButtons = memo(function FeedbackButtons({
  messageId,
  onFeedback,
}: {
  messageId: string;
  onFeedback: (messageId: string, direction: "up" | "down") => void;
}) {
  return (
    <div className="mt-2 flex gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onFeedback(messageId, "up")}
        className={FEEDBACK_BTN_CLASSES}
        aria-label="Like"
      >
        <HandThumbUpIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onFeedback(messageId, "down")}
        className={FEEDBACK_BTN_CLASSES}
        aria-label="Dislike"
      >
        <HandThumbDownIcon className="h-4 w-4" />
      </Button>
    </div>
  );
});

/**
 * 单条消息（用户/AI）
 * 用户消息右对齐、主色背景、纯文本；AI 消息左对齐、muted 背景、支持 Markdown
 */
export const ChatMessage = memo(function ChatMessage({
  message,
  createdAt,
  onCopy,
  onFeedback,
  onEdit,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const textContent = getAllText(message);
  const showMarkdown = !isUser && textContent.length > 0;
  const relativeTime = useMemo(() => (createdAt !== undefined ? formatRelativeTime(createdAt) : null), [createdAt]);

  return (
    <div
      data-role={message.role}
      role="log"
      aria-live="polite"
      className={cn("group flex w-full px-4 py-2", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "relative max-w-[85%] rounded-lg px-4 py-2.5",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {message.parts.map((part, index) => {
          const text = getTextContent(part);
          if (part.type === "reasoning" && part.text) {
            return <ReasoningBlock key={`${message.id}-reasoning-${index}`} text={part.text} />;
          }
          if (part.type === "source-url" && part.url) {
            return <SourceLink key={`${message.id}-source-${index}`} url={part.url} title={part.title} />;
          }
          if (part.type === "file" && part.url) {
            return <FilePart key={`${message.id}-file-${index}`} url={part.url} mimeType={part.mimeType} />;
          }
          if (text) {
            return (
              <span key={`${message.id}-${index}`} className="block">
                {showMarkdown ? (
                  <MarkdownContent text={text} onCopy={onCopy} />
                ) : (
                  <span className="whitespace-pre-wrap">{text}</span>
                )}
              </span>
            );
          }
          return null;
        })}
        {isUser && onEdit && textContent && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onEdit(textContent)}
            className={ACTION_BTN_CLASSES}
            aria-label={ARIA_EDIT_MESSAGE}
          >
            <PencilSquareIcon className="h-4 w-4" />
          </Button>
        )}
        {!isUser && onCopy && textContent && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onCopy(textContent)}
            className={ACTION_BTN_CLASSES}
            aria-label={ARIA_COPY}
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
          </Button>
        )}
        {!isUser && onFeedback && textContent && <FeedbackButtons messageId={message.id} onFeedback={onFeedback} />}
        {relativeTime !== null && (
          <div
            className={cn("mt-1.5 text-[10px] text-muted-foreground", isUser && "text-right")}
            aria-label={`${ARIA_SENT_AT_PREFIX} ${relativeTime}`}
          >
            {relativeTime}
          </div>
        )}
        {!isUser && <UsageDisplay usage={message.metadata?.usage} />}
      </div>
    </div>
  );
});
