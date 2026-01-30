package com.example.chat.service.impl;

import com.example.chat.entity.Conversation;
import com.example.chat.entity.Message;
import com.example.chat.mapper.ConversationMapper;
import com.example.chat.mapper.MessageMapper;
import com.example.chat.model.ConversationMeta;
import com.example.chat.service.ConversationPersistenceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;
import java.util.List;

/**
 * 会话持久化服务实现（MyBatis）
 */
@Service
public class ConversationPersistenceServiceImpl implements ConversationPersistenceService {

    private static final String DEFAULT_TITLE = "新对话";
    private static final int TITLE_MAX_LENGTH = 30;

    private final ConversationMapper conversationMapper;
    private final MessageMapper messageMapper;

    public ConversationPersistenceServiceImpl(
            ConversationMapper conversationMapper,
            MessageMapper messageMapper) {
        this.conversationMapper = conversationMapper;
        this.messageMapper = messageMapper;
    }

    @Override
    @Transactional
    public ConversationMeta persistMessages(String userId, String conversationId, String userContent, String assistantContent) {
        Instant now = Instant.now();
        String effectiveConvId = conversationId != null && !conversationId.isBlank()
                ? conversationId
                : "conv_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        // 在插入前估算历史 token（避免重复计入本轮消息）
        int historyTokens = estimateHistoryTokens(effectiveConvId);

        Conversation conv = conversationMapper.findById(effectiveConvId);
        if (conv == null) {
            conv = new Conversation();
            conv.setId(effectiveConvId);
            conv.setUserId(userId);
            conv.setTitle(generateTitleFromUserContent(userContent));
            conv.setCreatedAt(now);
            conv.setUpdatedAt(now);
            conversationMapper.insert(conv);
        } else {
            conv.setUpdatedAt(now);
            conversationMapper.update(conv);
        }

        String userMsgId = "msg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String assistantMsgId = "msg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        Message userMsg = new Message();
        userMsg.setId(userMsgId);
        userMsg.setConversationId(effectiveConvId);
        userMsg.setRole("user");
        userMsg.setContent(userContent);
        userMsg.setCreatedAt(now);
        messageMapper.insert(userMsg);

        Message assistantMsg = new Message();
        assistantMsg.setId(assistantMsgId);
        assistantMsg.setConversationId(effectiveConvId);
        assistantMsg.setRole("assistant");
        assistantMsg.setContent(assistantContent);
        assistantMsg.setCreatedAt(now.plusNanos(1));
        messageMapper.insert(assistantMsg);

        Conversation updated = conversationMapper.findById(effectiveConvId);
        String title = updated != null ? updated.getTitle() : DEFAULT_TITLE;

        // 估算 Token 用量（Mock 模式；真实 LLM 对接时由 provider 返回）
        int promptTokens = estimateTokens(userContent) + historyTokens;
        int completionTokens = estimateTokens(assistantContent);
        int totalTokens = promptTokens + completionTokens;
        ConversationMeta.UsageInfo usage = new ConversationMeta.UsageInfo(promptTokens, completionTokens, totalTokens);

        return new ConversationMeta(effectiveConvId, title, usage);
    }

    /** 粗略估算文本 token 数（约 4 字符/token） */
    private int estimateTokens(String text) {
        if (text == null || text.isEmpty()) return 0;
        return Math.max(1, (int) Math.ceil(text.length() / 4.0));
    }

    /** 估算历史消息 token 数 */
    private int estimateHistoryTokens(String convId) {
        List<Message> history = messageMapper.findByConversationIdOrderByCreatedAtAsc(convId);
        if (history == null) return 0;
        return history.stream()
                .mapToInt(m -> estimateTokens(m.getContent()))
                .sum();
    }

    /**
     * 根据首条用户消息生成会话标题（截取前 N 字）
     */
    private String generateTitleFromUserContent(String userContent) {
        if (userContent == null || userContent.isBlank()) {
            return DEFAULT_TITLE;
        }
        String trimmed = userContent.trim();
        if (trimmed.length() <= TITLE_MAX_LENGTH) {
            return trimmed;
        }
        return trimmed.substring(0, TITLE_MAX_LENGTH);
    }
}
