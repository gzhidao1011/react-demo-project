import {
  chatCreateConversation,
  chatDeleteConversation,
  chatListConversations,
  chatRenameConversation,
} from "@repo/services";
import { useCallback, useEffect, useState } from "react";
import type { Conversation } from "../lib/chat.types";

/** 将后端 DTO 转为前端 Conversation（updatedAt ISO 字符串 -> createdAt 时间戳） */
function dtoToConversation(dto: { id: string; title: string; updatedAt: string }): Conversation {
  const createdAt = typeof dto.updatedAt === "string" ? new Date(dto.updatedAt).getTime() : Date.now();
  return {
    id: dto.id,
    title: dto.title,
    createdAt,
  };
}

/**
 * 会话列表管理 Hook
 * 增删改查均走后端 API，列表从服务端拉取并保持本地状态与后端一致
 */
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<Error | null>(null);

  /** 从后端拉取会话列表 */
  const fetchList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const list = await chatListConversations();
      setConversations(list.map(dtoToConversation));
    } catch (err) {
      setListError(err instanceof Error ? err : new Error(String(err)));
      setConversations([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const createConversation = useCallback(async (): Promise<string> => {
    const dto = await chatCreateConversation();
    const conv = dtoToConversation(dto);
    setConversations((prev) => [conv, ...prev]);
    setActiveIdState(conv.id);
    return conv.id;
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    await chatDeleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveIdState((prev) => (prev === id ? null : prev));
  }, []);

  const setActiveId = useCallback((id: string | null) => {
    setActiveIdState(id);
  }, []);

  const updateConversationTitle = useCallback(async (id: string, title: string) => {
    const dto = await chatRenameConversation(id, title);
    const conv = dtoToConversation(dto);
    setConversations((prev) => prev.map((c) => (c.id === id ? conv : c)));
  }, []);

  return {
    conversations,
    activeId,
    listLoading,
    listError,
    refetchList: fetchList,
    createConversation,
    deleteConversation,
    setActiveId,
    updateConversationTitle,
  };
}
