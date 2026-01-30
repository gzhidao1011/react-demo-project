package com.example.chat.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 会话元信息（用于 finish 事件返回前端）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationMeta {

    private String conversationId;
    private String conversationTitle;
    private UsageInfo usage;

    /** 兼容旧构造：无 usage */
    public ConversationMeta(String conversationId, String conversationTitle) {
        this.conversationId = conversationId;
        this.conversationTitle = conversationTitle;
        this.usage = null;
    }

    /**
     * Token 用量（用于 finish 事件供前端展示）
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsageInfo {
        private int promptTokens;
        private int completionTokens;
        private int totalTokens;
    }
}
