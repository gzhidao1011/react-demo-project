package com.example.chat.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * Chat 请求体（AI SDK 格式）
 * 对应前端 useChat 发送的 POST /api/chat 请求
 */
@Data
public class ChatRequest {

    /** 对话消息列表（AI SDK UIMessage 格式） */
    @NotEmpty(message = "messages 不能为空")
    @Valid
    private List<UIMessagePart> messages;

    /** 会话 ID，可选，用于加载历史、会话持久化（AI SDK 可能发送 id 或 conversationId） */
    private String conversationId;

    /** AI SDK 默认发送的 chat id，与 conversationId 等价，作为 fallback */
    private String id;

    /**
     * 获取有效的会话 ID（兼容 id 与 conversationId）
     */
    public String getEffectiveConversationId() {
        if (conversationId != null && !conversationId.isBlank()) {
            return conversationId;
        }
        return (id != null && !id.isBlank()) ? id : null;
    }
}
