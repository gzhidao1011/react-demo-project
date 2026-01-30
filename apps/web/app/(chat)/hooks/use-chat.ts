import { useChat } from "@ai-sdk/react";
import { getAccessToken } from "@repo/utils";
import { DefaultChatTransport } from "ai";
import { useRef } from "react";

export interface UseChatOptions {
  conversationId: string | null;
  initialMessages?: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    parts: Array<{ type: "text"; text: string }>;
  }>;
  /** 错误回调，用于调试（如流结束后仍显示错误时可查看控制台） */
  onError?: (error: Error) => void;
}

/**
 * 封装 useChat + 会话 ID
 * 配置 JWT 鉴权、conversationId 传递
 */
export function useChatWithConversation({ conversationId, initialMessages = [], onError }: UseChatOptions) {
  const clearErrorRef = useRef<(() => void) | null>(null);

  const chat = useChat({
    id: conversationId ?? undefined,
    messages: initialMessages,
    transport: new DefaultChatTransport({
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
    onError,
    // 流成功完成时清除错误，避免误报（如 SDK 解析或连接关闭时的边缘情况）
    onFinish: () => clearErrorRef.current?.(),
  });

  clearErrorRef.current = chat.clearError;
  return chat;
}
