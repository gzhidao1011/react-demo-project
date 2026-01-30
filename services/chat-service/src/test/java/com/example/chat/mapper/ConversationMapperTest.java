package com.example.chat.mapper;

import com.example.chat.entity.Conversation;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ConversationMapper 单元测试（MyBatis）
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ConversationMapperTest {

    @Autowired
    private ConversationMapper mapper;

    @Test
    void shouldSaveAndFindById() {
        Conversation conv = new Conversation();
        conv.setId("conv_1");
        conv.setUserId("user_1");
        conv.setTitle("测试对话");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());

        mapper.insert(conv);

        Conversation found = mapper.findById("conv_1");
        assertNotNull(found);
        assertEquals("user_1", found.getUserId());
        assertEquals("测试对话", found.getTitle());
    }

    @Test
    void shouldFindByUserIdOrderByUpdatedAtDesc() {
        Instant now = Instant.now();
        Conversation c1 = createConversation("conv_a", "user_1", "对话1", now.minusSeconds(10));
        Conversation c2 = createConversation("conv_b", "user_1", "对话2", now);
        mapper.insert(c1);
        mapper.insert(c2);

        List<Conversation> list = mapper.findByUserIdOrderByUpdatedAtDesc("user_1");

        assertEquals(2, list.size());
        assertEquals("conv_b", list.get(0).getId());
        assertEquals("conv_a", list.get(1).getId());
    }

    @Test
    void shouldNotFindOtherUsersConversations() {
        Conversation conv = createConversation("conv_c", "user_1", "对话", Instant.now());
        mapper.insert(conv);

        List<Conversation> list = mapper.findByUserIdOrderByUpdatedAtDesc("user_2");

        assertTrue(list.isEmpty());
    }

    @Test
    void shouldDeleteById() {
        Conversation conv = createConversation("conv_del", "user_1", "待删除", Instant.now());
        mapper.insert(conv);

        int rows = mapper.deleteById("conv_del");

        assertEquals(1, rows);
        assertNull(mapper.findById("conv_del"));
    }

    @Test
    void shouldUpdateConversation() {
        Instant now = Instant.now();
        Conversation conv = createConversation("conv_upd", "user_1", "原标题", now);
        mapper.insert(conv);

        conv.setTitle("新标题");
        Instant newTime = now.plusSeconds(60);
        conv.setUpdatedAt(newTime);
        int rows = mapper.update(conv);

        assertEquals(1, rows);
        Conversation found = mapper.findById("conv_upd");
        assertNotNull(found);
        assertEquals("新标题", found.getTitle());
        assertTrue(found.getUpdatedAt().isAfter(now) || found.getUpdatedAt().equals(now));
    }

    private Conversation createConversation(String id, String userId, String title, Instant updatedAt) {
        Conversation c = new Conversation();
        c.setId(id);
        c.setUserId(userId);
        c.setTitle(title);
        c.setCreatedAt(updatedAt);
        c.setUpdatedAt(updatedAt);
        return c;
    }
}
