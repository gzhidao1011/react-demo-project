package com.example.chat.controller;

import com.example.chat.entity.Conversation;
import com.example.chat.mapper.ConversationMapper;
import com.example.chat.model.ChatRequest;
import com.example.chat.model.UIMessagePart;
import com.example.chat.service.ChatRateLimitService;
import com.example.chat.service.ChatService;
import com.example.chat.service.ConversationPersistenceService;
import com.example.chat.sse.SseStreamWriter;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * Chat 控制器
 * POST /api/chat - SSE 流式对话
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private static final String SSE_HEADER = "x-vercel-ai-ui-message-stream";

    private final ChatService chatService;
    private final ConversationPersistenceService persistenceService;
    private final ConversationMapper conversationMapper;
    private final ChatRateLimitService chatRateLimitService;

    /**
     * 流式 Chat 接口
     * 符合 Vercel AI SDK Data Stream 协议
     * 流结束后自动持久化用户消息与助手回复
     */
    @PostMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public void chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal String userId,
            HttpServletResponse response) throws IOException {

        String effectiveUserId = userId != null ? userId : "anonymous";
        String conversationId = request.getEffectiveConversationId();
        String userContent = extractLastUserMessage(request);

        // 限流校验（按用户）
        chatRateLimitService.checkRateLimit(effectiveUserId);

        // 会话所有权校验：conversationId 存在且会话已存在时，仅允许访问本人会话
        if (conversationId != null && !conversationId.isBlank()) {
            Conversation conv = conversationMapper.findById(conversationId);
            if (conv != null && !effectiveUserId.equals(conv.getUserId())) {
                throw new ResponseStatusException(FORBIDDEN, "无权限访问该会话");
            }
        }

        // 先获取流（异常在设置响应头之前抛出，便于 GlobalExceptionHandler 返回 JSON 错误）
        Stream<String> chunks = chatService.streamChat(effectiveUserId, request, conversationId != null ? conversationId : "");

        // 设置 SSE 响应头（Data Stream 协议要求）
        response.setContentType(MediaType.TEXT_EVENT_STREAM_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader(SSE_HEADER, "v1");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no"); // 禁用 Nginx 缓冲

        String messageId = "msg_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String textId = "text_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        SseStreamWriter writer = new SseStreamWriter(response.getOutputStream());
        writer.writeStream(messageId, textId, chunks, fullAssistantText -> {
            try {
                return persistenceService.persistMessages(effectiveUserId, conversationId, userContent, fullAssistantText);
            } catch (Exception e) {
                // 持久化失败不中断 SSE 流（已发送完毕），仅记录日志
                org.slf4j.LoggerFactory.getLogger(ChatController.class).warn("消息持久化失败", e);
                return null;
            }
        });
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
