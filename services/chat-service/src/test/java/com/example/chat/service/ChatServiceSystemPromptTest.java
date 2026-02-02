package com.example.chat.service;

import com.example.chat.test.ChatServiceTestApplication;
import com.example.chat.model.ChatRequest;
import com.example.chat.model.UIMessagePart;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ChatService system-prompt 配置集成测试（TDD）
 * 验证：chat.system-prompt 从配置读取并影响回复内容
 */
@SpringBootTest(classes = ChatServiceTestApplication.class)
@ActiveProfiles("test")
@TestPropertySource(
    properties = {
      "chat.system-prompt=You are a coding expert. Always write clean code.",
      "OPENAI_API_KEY=",
      "DEEPSEEK_API_KEY="
    })
class ChatServiceSystemPromptTest {

    @Autowired
    private ChatService chatService;

    @Test
    void shouldUseConfiguredSystemPrompt() {
        ChatRequest request = new ChatRequest();
        request.setMessages(List.of(createUserMessage("写个 hello world")));
        request.setConversationId(null);

        var chunks = chatService.streamChat("user_1", request, "")
                .collect(Collectors.toList());

        String fullText = String.join("", chunks);
        assertTrue(fullText.contains("coding expert") || fullText.contains("clean code"),
                "回复应体现配置的 systemPrompt");
    }

    private UIMessagePart createUserMessage(String text) {
        UIMessagePart msg = new UIMessagePart();
        msg.setId("msg_1");
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
