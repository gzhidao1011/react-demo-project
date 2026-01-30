package com.example.chat.mapper;

import com.example.chat.entity.Conversation;
import com.example.chat.entity.Message;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * MessageMapper 单元测试（MyBatis）
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MessageMapperTest {

    @Autowired
    private ConversationMapper conversationMapper;

    @Autowired
    private MessageMapper messageMapper;

    private static final String TEST_CONV_ID = "conv_msg_test";

    @BeforeEach
    void setUp() {
        Conversation conv = new Conversation();
        conv.setId(TEST_CONV_ID);
        conv.setUserId("user_1");
        conv.setTitle("测试");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);
    }

    @Test
    void shouldSaveAndFindByConversationId() {
        Message msg = new Message();
        msg.setId("msg_1");
        msg.setConversationId(TEST_CONV_ID);
        msg.setRole("user");
        msg.setContent("你好");
        msg.setCreatedAt(Instant.now());
        messageMapper.insert(msg);

        List<Message> list = messageMapper.findByConversationIdOrderByCreatedAtAsc(TEST_CONV_ID);

        assertEquals(1, list.size());
        assertEquals("msg_1", list.get(0).getId());
        assertEquals("user", list.get(0).getRole());
        assertEquals("你好", list.get(0).getContent());
    }

    @Test
    void shouldReturnMessagesInOrder() {
        Instant base = Instant.now();
        Message m1 = createMessage("msg_1", TEST_CONV_ID, "user", "第一条", base);
        Message m2 = createMessage("msg_2", TEST_CONV_ID, "assistant", "回复1", base.plusSeconds(1));
        Message m3 = createMessage("msg_3", TEST_CONV_ID, "user", "第二条", base.plusSeconds(2));
        messageMapper.insert(m1);
        messageMapper.insert(m2);
        messageMapper.insert(m3);

        List<Message> list = messageMapper.findByConversationIdOrderByCreatedAtAsc(TEST_CONV_ID);

        assertEquals(3, list.size());
        assertEquals("msg_1", list.get(0).getId());
        assertEquals("msg_2", list.get(1).getId());
        assertEquals("msg_3", list.get(2).getId());
    }

    @Test
    void shouldDeleteByConversationId() {
        Message m1 = createMessage("msg_del_1", TEST_CONV_ID, "user", "内容1", Instant.now());
        Message m2 = createMessage("msg_del_2", TEST_CONV_ID, "assistant", "内容2", Instant.now().plusSeconds(1));
        messageMapper.insert(m1);
        messageMapper.insert(m2);

        int rows = messageMapper.deleteByConversationId(TEST_CONV_ID);

        assertEquals(2, rows);
        assertTrue(messageMapper.findByConversationIdOrderByCreatedAtAsc(TEST_CONV_ID).isEmpty());
    }

    private Message createMessage(String id, String convId, String role, String content, Instant createdAt) {
        Message m = new Message();
        m.setId(id);
        m.setConversationId(convId);
        m.setRole(role);
        m.setContent(content);
        m.setCreatedAt(createdAt);
        return m;
    }
}
