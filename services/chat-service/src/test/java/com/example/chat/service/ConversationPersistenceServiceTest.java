package com.example.chat.service;

import com.example.chat.entity.Conversation;
import com.example.chat.entity.Message;
import com.example.chat.mapper.ConversationMapper;
import com.example.chat.mapper.MessageMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ConversationPersistenceService 单元测试（TDD）
 * 验证：新建会话、追加消息、会话标题
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ConversationPersistenceServiceTest {

    @Autowired
    private ConversationPersistenceService persistenceService;

    @Autowired
    private ConversationMapper conversationMapper;

    @Autowired
    private MessageMapper messageMapper;

    @Test
    void shouldCreateConversationAndPersistMessagesWhenConversationIdEmpty() {
        String convId = persistenceService.persistMessages("user_1", null, "你好", "你好！有什么可以帮你的？").getConversationId();

        assertNotNull(convId);
        Conversation conv = conversationMapper.findById(convId);
        assertNotNull(conv);
        assertEquals("user_1", conv.getUserId());
        // 首条消息作为标题（短消息直接使用）
        assertEquals("你好", conv.getTitle());

        List<Message> messages = messageMapper.findByConversationIdOrderByCreatedAtAsc(convId);
        assertEquals(2, messages.size());
        assertEquals("user", messages.get(0).getRole());
        assertEquals("你好", messages.get(0).getContent());
        assertEquals("assistant", messages.get(1).getRole());
        assertEquals("你好！有什么可以帮你的？", messages.get(1).getContent());
    }

    @Test
    void shouldAppendMessagesToExistingConversation() {
        Conversation conv = new Conversation();
        conv.setId("conv_existing");
        conv.setUserId("user_1");
        conv.setTitle("已有对话");
        conv.setCreatedAt(java.time.Instant.now());
        conv.setUpdatedAt(java.time.Instant.now());
        conversationMapper.insert(conv);

        String convId = persistenceService.persistMessages("user_1", "conv_existing", "继续问", "继续答").getConversationId();

        assertEquals("conv_existing", convId);
        List<Message> messages = messageMapper.findByConversationIdOrderByCreatedAtAsc("conv_existing");
        assertEquals(2, messages.size());
        assertEquals("继续问", messages.get(0).getContent());
        assertEquals("继续答", messages.get(1).getContent());
    }

    @Test
    void shouldGenerateTitleFromFirstUserMessageWhenCreatingNewConversation() {
        // 超过 30 字，应截取前 30 字作为标题
        String longContent = "这是一段很长很长的首条消息内容用于测试标题自动生成功能是否正常工作";
        String convId = persistenceService.persistMessages("user_1", null, longContent, "回复").getConversationId();

        Conversation conv = conversationMapper.findById(convId);
        assertNotNull(conv);
        assertEquals(longContent.substring(0, 30), conv.getTitle());
    }

    @Test
    void shouldUseDefaultTitleWhenUserContentEmpty() {
        String convId = persistenceService.persistMessages("user_1", null, "", "回复").getConversationId();

        Conversation conv = conversationMapper.findById(convId);
        assertNotNull(conv);
        assertEquals("新对话", conv.getTitle());
    }

    @Test
    void shouldNotChangeTitleWhenAppendingToExistingConversation() {
        Conversation conv = new Conversation();
        conv.setId("conv_keep_title");
        conv.setUserId("user_1");
        conv.setTitle("原有标题");
        conv.setCreatedAt(java.time.Instant.now());
        conv.setUpdatedAt(java.time.Instant.now());
        conversationMapper.insert(conv);

        persistenceService.persistMessages("user_1", "conv_keep_title", "追加消息", "回复");

        Conversation updated = conversationMapper.findById("conv_keep_title");
        assertNotNull(updated);
        assertEquals("原有标题", updated.getTitle());
    }

    @Test
    void shouldUpdateConversationUpdatedAtWhenAppending() {
        java.time.Instant oldTime = java.time.Instant.now().minusSeconds(60);
        Conversation conv = new Conversation();
        conv.setId("conv_time");
        conv.setUserId("user_1");
        conv.setTitle("测试");
        conv.setCreatedAt(oldTime);
        conv.setUpdatedAt(oldTime);
        conversationMapper.insert(conv);

        persistenceService.persistMessages("user_1", "conv_time", "问", "答");

        Conversation updated = conversationMapper.findById("conv_time");
        assertNotNull(updated);
        assertTrue(updated.getUpdatedAt().isAfter(oldTime));
    }

    @Test
    void shouldReturnMetaWithUsageWhenPersistingMessages() {
        com.example.chat.model.ConversationMeta meta = persistenceService.persistMessages(
                "user_1", null, "你好世界", "你好！有什么可以帮你的？");

        assertNotNull(meta.getUsage());
        assertTrue(meta.getUsage().getPromptTokens() >= 1);
        assertTrue(meta.getUsage().getCompletionTokens() >= 1);
        assertEquals(meta.getUsage().getPromptTokens() + meta.getUsage().getCompletionTokens(),
                meta.getUsage().getTotalTokens());
    }
}
