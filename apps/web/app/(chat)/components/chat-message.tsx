import {
  CheckIcon,
  ClipboardDocumentIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  PencilSquareIcon,
} from "@heroicons/react/16/solid";
import { Button } from "@repo/ui";
import { useCallback, useRef, useState } from "react";
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

/** 带复制按钮的代码块（用于 Markdown pre） */
function CodeBlock({ children, onCopy }: { children: React.ReactNode; onCopy?: (text: string) => void }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = preRef.current?.textContent ?? "";
    if (text && onCopy) {
      onCopy(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          className="absolute right-2 top-2 rounded p-1.5 opacity-100 transition-opacity hover:bg-muted md:opacity-0 md:group-hover/code:opacity-100"
          aria-label="复制代码"
        >
          {copied ? <CheckIcon className="h-4 w-4 text-primary" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}

/**
 * 单条消息（用户/AI）
 * 用户消息右对齐、主色背景、纯文本；AI 消息左对齐、muted 背景、支持 Markdown
 */
export function ChatMessage({ message, createdAt, onCopy, onFeedback, onEdit }: ChatMessageProps) {
  const isUser = message.role === "user";
  const textContent = getAllText(message);
  const showMarkdown = !isUser && textContent.length > 0;

  return (
    <div
      data-role={message.role}
      role="log"
      aria-live="polite"
      className={`group flex w-full ${isUser ? "justify-end" : "justify-start"} px-4 py-2`}
    >
      <div
        className={`relative max-w-[85%] rounded-lg px-4 py-2.5 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
      >
        {message.parts.map((part, index) => {
          const text = getTextContent(part);
          if (part.type === "reasoning" && part.text) {
            return (
              <details key={`${message.id}-reasoning-${index}`} className="text-muted-foreground">
                <summary className="cursor-pointer select-none text-sm">Thinking</summary>
                <pre className="mt-1 whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs">{part.text}</pre>
              </details>
            );
          }
          if (part.type === "source-url" && part.url) {
            const label =
              part.title ??
              (() => {
                try {
                  return new URL(part.url).hostname;
                } catch {
                  return part.url;
                }
              })();
            return (
              <a
                key={`${message.id}-source-${index}`}
                href={part.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-primary underline"
              >
                [{label}]
              </a>
            );
          }
          if (part.type === "file" && part.url) {
            const isImage = (part.mimeType ?? "").startsWith("image/");
            return (
              <span key={`${message.id}-file-${index}`} className="block">
                {isImage ? (
                  <img src={part.url} alt="附件图片" className="max-h-48 max-w-full rounded object-contain" />
                ) : (
                  <a href={part.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    查看附件
                  </a>
                )}
              </span>
            );
          }
          if (text) {
            return (
              <span key={`${message.id}-${index}`} className="block">
                {showMarkdown ? (
                  <span className="prose prose-sm dark:prose-invert max-w-none [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1">
                    <ReactMarkdown
                      components={{
                        pre: ({ children }) => <CodeBlock onCopy={onCopy}>{children}</CodeBlock>,
                      }}
                    >
                      {text}
                    </ReactMarkdown>
                  </span>
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
            className="absolute -right-2 -top-2 rounded p-1.5 opacity-100 transition-opacity hover:bg-muted md:opacity-0 md:group-hover:opacity-100"
            aria-label="编辑消息"
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
            className="absolute -right-2 -top-2 rounded p-1.5 opacity-100 transition-opacity hover:bg-muted md:opacity-0 md:group-hover:opacity-100"
            aria-label="复制"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
          </Button>
        )}
        {!isUser && onFeedback && textContent && (
          <div className="mt-2 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onFeedback(message.id, "up")}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary"
              aria-label="点赞"
            >
              <HandThumbUpIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onFeedback(message.id, "down")}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary"
              aria-label="点踩"
            >
              <HandThumbDownIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
        {createdAt !== undefined && (
          <div
            className={`mt-1.5 text-[10px] text-muted-foreground ${isUser ? "text-right" : ""}`}
            aria-label={`发送时间：${formatRelativeTime(createdAt)}`}
          >
            {formatRelativeTime(createdAt)}
          </div>
        )}
        {!isUser &&
          (() => {
            const usage = message.metadata?.usage;
            const hasInput = typeof usage?.inputTokens === "number";
            const hasOutput = typeof usage?.outputTokens === "number";
            if (!hasInput && !hasOutput) return null;
            return (
              <div className="mt-2 text-xs text-muted-foreground" aria-label="Token 用量">
                {hasInput && <span>输入 {usage!.inputTokens}</span>}
                {hasInput && hasOutput && " · "}
                {hasOutput && <span>输出 {usage!.outputTokens}</span>}
              </div>
            );
          })()}
      </div>
    </div>
  );
}
