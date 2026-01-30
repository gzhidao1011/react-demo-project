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

    /** 会话 ID，可选，用于加载历史、会话持久化 */
    private String conversationId;
}
