package com.example.chat.service.impl;

import com.example.chat.entity.Message;
import com.example.chat.mapper.MessageMapper;
import com.example.chat.model.ChatRequest;
import com.example.chat.model.UIMessagePart;
import com.example.chat.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/**
 * Chat 服务实现
 * 对接 Spring AI（OpenAI/Anthropic 等），支持流式响应
 * 当 ChatModel 不可用时（如测试环境）回退到 Mock 模式
 */
@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);

    @Value("${chat.system-prompt:You are a helpful assistant. When unsure, say so and suggest rephrasing.}")
    private String systemPrompt;

    private final MessageMapper messageMapper;

    @Autowired(required = false)
    private ChatModel chatModel;

    public ChatServiceImpl(MessageMapper messageMapper) {
        this.messageMapper = messageMapper;
    }

    @Override
    public Stream<String> streamChat(String userId, ChatRequest request, String conversationId) {
        String userText = extractLastUserMessage(request);
        List<Message> history = loadHistory(conversationId);

        if (chatModel != null) {
            return streamWithLlm(userText, history);
        }
        return streamMock(userText, history);
    }

    /**
     * 使用 Spring AI 流式调用 LLM
     */
    private Stream<String> streamWithLlm(String userText, List<Message> history) {
        List<org.springframework.ai.chat.messages.Message> messages = buildPromptMessages(userText, history);

        Flux<String> contentFlux = chatModel.stream(new Prompt(messages))
                .map(r -> {
                    if (r.getResult() != null && r.getResult().getOutput() != null) {
                        String content = r.getResult().getOutput().getText();
                        return content != null ? content : "";
                    }
                    return "";
                })
                .filter(c -> !c.isEmpty());

        return contentFlux.toStream();
    }

    /**
     * 构建 Prompt 消息列表：system + 历史 + 当前请求
     */
    private List<org.springframework.ai.chat.messages.Message> buildPromptMessages(
            String userText, List<Message> history) {
        List<org.springframework.ai.chat.messages.Message> result = new ArrayList<>();

        result.add(new SystemMessage(systemPrompt));

        for (Message m : history) {
            if ("user".equals(m.getRole())) {
                result.add(new UserMessage(m.getContent()));
            } else if ("assistant".equals(m.getRole())) {
                result.add(new AssistantMessage(m.getContent()));
            }
        }

        result.add(new UserMessage(userText));
        return result;
    }

    /**
     * Mock 模式：无 LLM 时逐字返回（用于测试或未配置 API Key）
     */
    private Stream<String> streamMock(String userText, List<Message> history) {
        String historyHint = history.isEmpty() ? "" : String.format("（历史共%d条）", history.size());
        String reply = String.format("你好！你说了：%s。%s%s（当前为 Mock 模式）",
                userText, systemPrompt, historyHint);
        return reply.chars()
                .mapToObj(c -> String.valueOf((char) c));
    }

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
