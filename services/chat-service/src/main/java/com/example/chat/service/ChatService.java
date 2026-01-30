package com.example.chat.service;

import com.example.chat.model.ChatRequest;

import java.util.stream.Stream;

/**
 * Chat 服务接口
 * 负责 LLM 流式调用、消息转换
 */
public interface ChatService {

    /**
     * 流式 Chat 调用
     *
     * @param userId 用户 ID（从 JWT 解析）
     * @param request 请求体
     * @param conversationId 会话 ID（可选）
     * @return 文本 chunk 流
     */
    Stream<String> streamChat(String userId, ChatRequest request, String conversationId);
}
