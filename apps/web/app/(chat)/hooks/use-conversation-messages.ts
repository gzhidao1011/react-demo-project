import { chatGetConversationMessages } from "@repo/services";
import { useCallback, useEffect, useState } from "react";

/** useChat 期望的 initialMessages 格式 */
export interface InitialMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: Array<{ type: "text"; text: string }>;
}

/**
 * 从后端加载会话历史消息
 * 用于刷新后恢复聊天记录
 */
export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<InitialMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const dtos = await chatGetConversationMessages(id);
      const converted: InitialMessage[] = dtos.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        parts: [{ type: "text" as const, text: m.content ?? "" }],
      }));
      setMessages(converted);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }
    load(conversationId);
  }, [conversationId, load]);

  return { messages, loading, error, reload: () => conversationId && load(conversationId) };
}
