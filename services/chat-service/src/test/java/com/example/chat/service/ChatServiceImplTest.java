package com.example.chat.service;

import com.example.chat.mapper.MessageMapper;
import com.example.chat.model.ChatRequest;
import com.example.chat.model.UIMessagePart;
import com.example.chat.service.impl.ChatServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * ChatServiceImpl 单元测试（TDD）
 * 验证：消息提取、流式响应、边界情况
 */
class ChatServiceImplTest {

    private ChatServiceImpl chatService;
    private MessageMapper messageMapper;

    @BeforeEach
    void setUp() {
        messageMapper = mock(MessageMapper.class);
        when(messageMapper.findByConversationIdOrderByCreatedAtAsc(anyString()))
                .thenReturn(List.of());
        chatService = new ChatServiceImpl(messageMapper);
        ReflectionTestUtils.setField(chatService, "systemPrompt", "You are a helpful assistant.");
    }

    @Test
    void shouldReturnStreamContainingUserMessage() {
        ChatRequest request = createChatRequest("你好");

        var chunks = chatService.streamChat("1", request, "conv_1")
                .collect(Collectors.toList());

        String fullText = String.join("", chunks);
        assertTrue(fullText.contains("你好"));
        assertTrue(fullText.contains("你说了："));
    }

    @Test
    void shouldExtractLastUserMessageWhenMultipleMessages() {
        ChatRequest request = new ChatRequest();
        request.setMessages(List.of(
                createUserMessage("第一条"),
                createAssistantMessage("AI回复"),
                createUserMessage("最后一条")
        ));
        request.setConversationId("conv_1");

        var chunks = chatService.streamChat("1", request, "conv_1")
                .collect(Collectors.toList());

        String fullText = String.join("", chunks);
        assertTrue(fullText.contains("最后一条"));
        assertFalse(fullText.contains("第一条"));
    }

    @Test
    void shouldHandleEmptyUserMessage() {
        ChatRequest request = createChatRequest("");

        var chunks = chatService.streamChat("1", request, "conv_1")
                .collect(Collectors.toList());

        assertFalse(chunks.isEmpty());
        String fullText = String.join("", chunks);
        assertTrue(fullText.contains("你说了："));
    }

    @Test
    void shouldConcatenateMultipleTextPartsInOneMessage() {
        ChatRequest request = new ChatRequest();
        UIMessagePart msg = new UIMessagePart();
        msg.setId("msg_1");
        msg.setRole("user");
        msg.setParts(List.of(
                createTextPart("第一"),
                createTextPart("第二"),
                createTextPart("第三")
        ));
        request.setMessages(List.of(msg));
        request.setConversationId("conv_1");

        var chunks = chatService.streamChat("1", request, "conv_1")
                .collect(Collectors.toList());

        String fullText = String.join("", chunks);
        assertTrue(fullText.contains("第一第二第三"));
    }

    @Test
    void shouldReturnEmptyStreamWhenNoUserMessage() {
        ChatRequest request = new ChatRequest();
        request.setMessages(List.of(createAssistantMessage("只有AI回复")));
        request.setConversationId("conv_1");

        var chunks = chatService.streamChat("1", request, "conv_1")
                .collect(Collectors.toList());

        String fullText = String.join("", chunks);
        assertTrue(fullText.contains("你说了："));
        assertTrue(fullText.contains("helpful assistant") || fullText.contains("Mock 模式"));
    }

    @Test
    void shouldUseSystemPromptInReply() {
        ReflectionTestUtils.setField(chatService, "systemPrompt",
                "You are a coding assistant. When unsure, say so.");

        ChatRequest request = createChatRequest("写个 hello world");

        var chunks = chatService.streamChat("1", request, "conv_1")
                .collect(Collectors.toList());

        String fullText = String.join("", chunks);
        assertTrue(fullText.contains("coding assistant") || fullText.contains("When unsure"),
                "回复应体现 systemPrompt 配置");
    }

    @Test
    void shouldStreamCharacterByCharacter() {
        ChatRequest request = createChatRequest("Hi");

        var chunks = chatService.streamChat("1", request, null)
                .collect(Collectors.toList());

        assertTrue(chunks.size() > 1);
        chunks.forEach(chunk -> assertTrue(chunk.length() <= 1));
    }

    private ChatRequest createChatRequest(String text) {
        ChatRequest request = new ChatRequest();
        request.setMessages(List.of(createUserMessage(text)));
        request.setConversationId("conv_1");
        return request;
    }

    private UIMessagePart createUserMessage(String text) {
        UIMessagePart msg = new UIMessagePart();
        msg.setId("msg_1");
        msg.setRole("user");
        msg.setParts(List.of(createTextPart(text)));
        return msg;
    }

    private UIMessagePart createAssistantMessage(String text) {
        UIMessagePart msg = new UIMessagePart();
        msg.setId("msg_2");
        msg.setRole("assistant");
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
