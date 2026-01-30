import { useCallback, useEffect, useState } from "react";
import type { Conversation } from "../lib/chat.types";

const STORAGE_KEY = "chat_conversations";

function loadFromStorage(): Conversation[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is Conversation =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as Conversation).id === "string" &&
        typeof (c as Conversation).title === "string" &&
        typeof (c as Conversation).createdAt === "number",
    );
  } catch {
    return [];
  }
}

function saveToStorage(conversations: Conversation[]): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // 忽略存储错误
  }
}

function generateId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 会话列表管理 Hook
 * 提供会话的增删改查及 localStorage 持久化
 */
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadFromStorage());
  const [activeId, setActiveIdState] = useState<string | null>(null);

  useEffect(() => {
    saveToStorage(conversations);
  }, [conversations]);

  const createConversation = useCallback((): string => {
    const id = generateId();
    const newConv: Conversation = {
      id,
      title: "新对话",
      createdAt: Date.now(),
    };
    setConversations((prev) => [...prev, newConv]);
    setActiveIdState(id);
    return id;
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveIdState((prev) => (prev === id ? null : prev));
  }, []);

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id);
  }, []);

  const updateConversationTitle = useCallback((id: string, title: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }, []);

  return {
    conversations,
    activeId,
    createConversation,
    deleteConversation,
    setActiveId,
    updateConversationTitle,
  };
}
