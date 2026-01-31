import { useChat } from "@ai-sdk/react";
import { getAccessToken } from "@repo/utils";
import { DefaultChatTransport } from "ai";
import { useMemo, useRef } from "react";

/** finish 事件中 messageMetadata 的会话元信息（后端 SseStreamWriter 输出） */
export interface FinishMessageMetadata {
  conversationId?: string;
  conversationTitle?: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}

export interface UseChatOptions {
  conversationId: string | null;
  initialMessages?: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    parts: Array<{ type: "text"; text: string }>;
  }>;
  /** 错误回调，用于调试（如流结束后仍显示错误时可查看控制台） */
  onError?: (error: Error) => void;
  /** 流结束时回调，options.message.metadata 可能包含后端返回的 conversationId、conversationTitle、usage */
  onFinish?: (options: { message?: unknown; messages?: unknown[] }) => void;
}

/**
 * 封装 useChat + 会话 ID
 * 配置 JWT 鉴权、conversationId 传递
 *
 * @param options.conversationId - 当前会话 ID，用于 body 和 useChat id
 * @param options.initialMessages - 初始消息（从 useConversationMessages 加载）
 * @param options.onError - 错误回调，用于调试
 * @param options.onFinish - 流结束回调，可获取 conversationId/conversationTitle
 * @returns useChat 返回值（messages, sendMessage, status, error, stop, regenerate, clearError 等）
 */
export function useChatWithConversation({ conversationId, initialMessages = [], onError, onFinish }: UseChatOptions) {
  const clearErrorRef = useRef<(() => void) | null>(null);

  // 稳定 transport 引用，避免每次渲染创建新实例导致 Maximum update depth
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        credentials: "include",
        headers: () => {
          const token = getAccessToken();
          return {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          };
        },
        body: () => ({
          ...(conversationId ? { conversationId } : {}),
        }),
      }),
    [conversationId],
  );

  const chat = useChat({
    id: conversationId ?? undefined,
    messages: initialMessages,
    transport,
    onError,
    onFinish: (options) => {
      clearErrorRef.current?.();
      onFinish?.(options);
    },
  });

  clearErrorRef.current = chat.clearError;
  return chat;
}
