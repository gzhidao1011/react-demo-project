package com.example.chat.service;

import com.example.chat.model.ConversationMeta;

/**
 * 会话持久化服务
 * 负责创建/更新会话、保存用户消息与助手回复
 */
public interface ConversationPersistenceService {

    /**
     * 持久化用户消息与助手回复
     *
     * @param userId 用户 ID
     * @param conversationId 会话 ID，为空时创建新会话
     * @param userContent 用户消息内容
     * @param assistantContent 助手回复内容
     * @return 会话元信息（id、title），供 finish 事件返回前端
     */
    ConversationMeta persistMessages(String userId, String conversationId, String userContent, String assistantContent);
}
