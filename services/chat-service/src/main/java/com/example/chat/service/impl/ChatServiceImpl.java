package com.example.chat.service.impl;

import com.example.chat.entity.Message;
import com.example.chat.mapper.MessageMapper;
import com.example.chat.model.ChatRequest;
import com.example.chat.model.UIMessagePart;
import com.example.chat.service.ChatService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Stream;

/**
 * Chat 服务实现
 * 当前使用 Mock LLM，后续对接 OpenAI/Anthropic
 */
@Service
public class ChatServiceImpl implements ChatService {

    @Value("${chat.system-prompt:You are a helpful assistant.}")
    private String systemPrompt;

    private final MessageMapper messageMapper;

    public ChatServiceImpl(MessageMapper messageMapper) {
        this.messageMapper = messageMapper;
    }

    @Override
    public Stream<String> streamChat(String userId, ChatRequest request, String conversationId) {
        String userText = extractLastUserMessage(request);
        List<Message> history = loadHistory(conversationId);
        String historyHint = history.isEmpty() ? "" : String.format("（历史共%d条）", history.size());
        // Mock：逐字返回回复，体现 systemPrompt 与历史上下文（后续替换为真实 LLM 调用）
        String reply = String.format("你好！你说了：%s。%s%s（当前为 Mock 模式）",
                userText, systemPrompt, historyHint);
        return reply.chars()
                .mapToObj(c -> String.valueOf((char) c));
    }

    /**
     * 当 conversationId 存在时从 DB 加载历史消息
     */
    private List<Message> loadHistory(String conversationId) {
        if (conversationId == null || conversationId.isBlank()) {
            return List.of();
        }
        return messageMapper.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    private String extractLastUserMessage(ChatRequest request) {
        List<UIMessagePart> messages = request.getMessages();
        if (messages == null || messages.isEmpty()) {
            return "";
        }
        for (int i = messages.size() - 1; i >= 0; i--) {
            UIMessagePart msg = messages.get(i);
            if ("user".equals(msg.getRole()) && msg.getParts() != null) {
                return msg.getParts().stream()
                        .filter(p -> "text".equals(p.getType()) && p.getText() != null)
                        .map(UIMessagePart.MessagePart::getText)
                        .reduce("", (a, b) -> a + b);
            }
        }
        return "";
    }
}
