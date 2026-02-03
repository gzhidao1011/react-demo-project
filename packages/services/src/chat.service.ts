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
 * 后端会话 DTO（与 chat-service ConversationDTO 对齐）
 * updatedAt 为 ISO-8601 字符串
 */
export interface ChatConversationDTO {
  id: string;
  title: string;
  updatedAt: string;
}

/**
 * 获取当前用户的会话列表（按更新时间倒序）
 * GET /api/chat/conversations
 */
export async function chatListConversations(): Promise<ChatConversationDTO[]> {
  const response: AxiosResponse<ChatConversationDTO[]> =
    await apiService.get<ChatConversationDTO[]>("/chat/conversations");
  return response.data ?? [];
}

/**
 * 创建新会话（标题可选）
 * POST /api/chat/conversations
 */
export async function chatCreateConversation(title?: string): Promise<ChatConversationDTO> {
  const response: AxiosResponse<ChatConversationDTO> = await apiService.post<ChatConversationDTO>(
    "/chat/conversations",
    title != null && title.trim() !== "" ? { title: title.trim() } : {},
  );
  return response.data as ChatConversationDTO;
}

/**
 * 重命名会话
 * PATCH /api/chat/conversations/:id
 */
export async function chatRenameConversation(conversationId: string, title: string): Promise<ChatConversationDTO> {
  const response: AxiosResponse<ChatConversationDTO> = await apiService.patch<ChatConversationDTO>(
    `/chat/conversations/${conversationId}`,
    { title: title.trim() },
  );
  return response.data as ChatConversationDTO;
}

/**
 * 删除会话（级联删除消息）
 * DELETE /api/chat/conversations/:id
 */
export async function chatDeleteConversation(conversationId: string): Promise<void> {
  await apiService.delete(`/chat/conversations/${conversationId}`);
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
