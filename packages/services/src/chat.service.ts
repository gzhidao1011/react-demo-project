import type { AxiosResponse } from "axios";
import { apiService } from "./api.service";

/**
 * 后端消息 DTO（与 chat-service MessageDTO 对齐）
 */
export interface ChatMessageDTO {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

/**
 * 获取指定会话的消息列表
 * GET /api/chat/conversations/:id/messages
 * 后端直接返回 List<MessageDTO>，无 code/message 包装
 * 404 时返回空数组（会话尚未在后端创建）
 */
export async function chatGetConversationMessages(conversationId: string): Promise<ChatMessageDTO[]> {
  try {
    const response: AxiosResponse<ChatMessageDTO[]> = await apiService.get<ChatMessageDTO[]>(
      `/chat/conversations/${conversationId}/messages`,
    );
    return response.data ?? [];
  } catch (err: unknown) {
    // 404：会话尚未在后端创建（新建但未发消息）
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return [];
    throw err;
  }
}
