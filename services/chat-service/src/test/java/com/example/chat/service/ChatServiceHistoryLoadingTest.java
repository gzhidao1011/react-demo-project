package com.example.chat.service;

import com.example.chat.entity.Conversation;
import com.example.chat.entity.Message;
import com.example.chat.mapper.ConversationMapper;
import com.example.chat.mapper.MessageMapper;
import com.example.chat.model.ChatRequest;
import com.example.chat.model.UIMessagePart;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ChatService 历史消息加载集成测试（TDD）
 * 验证：conversationId 存在时从 DB 加载历史消息作为上下文
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ChatServiceHistoryLoadingTest {

    @Autowired
    private ChatService chatService;

    @Autowired
    private ConversationMapper conversationMapper;

    @Autowired
    private MessageMapper messageMapper;

    private static final String CONV_ID = "conv_history_test";

    @BeforeEach
    void setUp() {
        Conversation conv = new Conversation();
        conv.setId(CONV_ID);
        conv.setUserId("user_1");
        conv.setTitle("测试");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        Message m1 = new Message();
        m1.setId("msg_1");
        m1.setConversationId(CONV_ID);
        m1.setRole("user");
        m1.setContent("第一条用户消息");
        m1.setCreatedAt(Instant.now());
        messageMapper.insert(m1);

        Message m2 = new Message();
        m2.setId("msg_2");
        m2.setConversationId(CONV_ID);
        m2.setRole("assistant");
        m2.setContent("第一条助手回复");
        m2.setCreatedAt(Instant.now().plusSeconds(1));
        messageMapper.insert(m2);
    }

    @Test
    void shouldLoadHistoryWhenConversationIdProvided() {
        ChatRequest request = new ChatRequest();
        request.setMessages(List.of(createUserMessage("第二条用户消息")));
        request.setConversationId(CONV_ID);

        var chunks = chatService.streamChat("user_1", request, CONV_ID)
                .collect(Collectors.toList());

        String fullText = String.join("", chunks);
        // Mock 模式下，加载了 2 条历史消息，回复应体现
        assertTrue(fullText.contains("历史共2条") || fullText.contains("历史 2 条"),
                "回复应体现已加载历史消息数量");
    }

    @Test
    void shouldNotLoadHistoryWhenConversationIdEmpty() {
        ChatRequest request = new ChatRequest();
        request.setMessages(List.of(createUserMessage("新对话消息")));
        request.setConversationId(null);

        var chunks = chatService.streamChat("user_1", request, "")
                .collect(Collectors.toList());

        String fullText = String.join("", chunks);
        assertFalse(fullText.contains("历史共"),
                "无 conversationId 时不应加载历史");
    }

    private UIMessagePart createUserMessage(String text) {
        UIMessagePart msg = new UIMessagePart();
        msg.setId("msg_new");
        msg.setRole("user");
        msg.setParts(List.of(createTextPart(text)));
        return msg;
    }

    private UIMessagePart.MessagePart createTextPart(String text) {
        UIMessagePart.MessagePart part = new UIMessagePart.MessagePart();
        part.setType("text");
        part.setText(text);
        return part;
    }
}
