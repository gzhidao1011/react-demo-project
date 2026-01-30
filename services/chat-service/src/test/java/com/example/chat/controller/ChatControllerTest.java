package com.example.chat.controller;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.chat.entity.Conversation;
import com.example.chat.mapper.ConversationMapper;
import com.example.chat.model.ChatRequest;
import com.example.chat.model.ConversationMeta;
import com.example.chat.model.UIMessagePart;
import com.example.chat.service.ChatRateLimitService;
import com.example.chat.service.ChatService;
import com.example.chat.service.ConversationPersistenceService;
import com.example.chat.util.TestJwtHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ChatController 集成测试（TDD）
 * 验证：401 无鉴权、SSE 响应格式、Data Stream 协议头
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = {
    "spring.cloud.nacos.discovery.enabled=false",
    "jwt.algorithm=RS256",
    "jwt.public-key-path=classpath:keys/public.pem",
    "jwt.issuer=https://auth.example.com",
    "jwt.audience=api.example.com"
})
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ChatService chatService;

    @MockBean
    private ConversationPersistenceService persistenceService;

    @MockBean
    private ChatRateLimitService chatRateLimitService;

    @Autowired
    private ConversationMapper conversationMapper;

    private String validAccessToken;

    @BeforeEach
    void setUp() throws Exception {
        validAccessToken = TestJwtHelper.generateAccessToken("1", "testuser", List.of("USER"));
    }

    @Test
    void shouldReturn400WhenMessagesEmpty() throws Exception {
        String body = "{\"messages\":[],\"conversationId\":\"conv_1\"}";

        mockMvc.perform(post("/api/chat")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").exists())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void shouldReturn400WhenMessagesNull() throws Exception {
        String body = "{\"conversationId\":\"conv_1\"}";

        mockMvc.perform(post("/api/chat")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn500WhenChatServiceThrows() throws Exception {
        ChatRequest request = createChatRequest("你好");

        doThrow(new RuntimeException("LLM 调用失败"))
                .when(chatService).streamChat(anyString(), any(), anyString());

        mockMvc.perform(post("/api/chat")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").exists());
    }

    @Test
    void shouldReturn401WhenNoAuthorizationHeader() throws Exception {
        ChatRequest request = createChatRequest("你好");

        mockMvc.perform(post("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn401WhenInvalidToken() throws Exception {
        ChatRequest request = createChatRequest("你好");

        mockMvc.perform(post("/api/chat")
                .header("Authorization", "Bearer invalid.token.here")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn401WhenTokenExpired() throws Exception {
        String expiredToken = TestJwtHelper.generateExpiredAccessToken("1", "testuser", List.of("USER"));
        ChatRequest request = createChatRequest("你好");

        mockMvc.perform(post("/api/chat")
                .header("Authorization", "Bearer " + expiredToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        verify(chatService, never()).streamChat(anyString(), any(), anyString());
    }

    @Test
    void shouldReturn200WithSseStreamWhenValidJwt() throws Exception {
        ChatRequest request = createChatRequest("你好");

        when(chatService.streamChat(anyString(), any(), anyString()))
                .thenAnswer(invocation -> {
                    java.util.stream.Stream<String> stream = java.util.stream.Stream.of("你", "好", "！");
                    return stream;
                });
        when(persistenceService.persistMessages(anyString(), any(), anyString(), anyString()))
                .thenReturn(new ConversationMeta("conv_xxx", "你好"));

        MvcResult result = mockMvc.perform(post("/api/chat")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().exists("Content-Type"))
                .andExpect(header().string("Content-Type", containsString("text/event-stream")))
                .andExpect(header().string("x-vercel-ai-ui-message-stream", "v1"))
                .andExpect(header().string("Cache-Control", "no-cache"))
                .andExpect(header().string("Connection", "keep-alive"))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertTrue(body.contains("data:{\"type\":\"start\""));
        assertTrue(body.contains("data:{\"type\":\"text-start\""));
        assertTrue(body.contains("data:{\"type\":\"text-delta\""));
        assertTrue(body.contains("data:{\"type\":\"text-end\""));
        assertTrue(body.contains("data:{\"type\":\"finish\""));
        assertTrue(body.contains("data:[DONE]"));
        // finish 事件应附带 conversationId、conversationTitle（供前端更新侧边栏）
        assertTrue(body.contains("conversationId"));
        assertTrue(body.contains("conversationTitle"));
        assertTrue(body.contains("conv_xxx"));

        // 流结束后应调用持久化
        verify(persistenceService).persistMessages(eq("1"), eq("conv_xxx"), eq("你好"), eq("你好！"));
    }

    @Test
    void shouldEmitFinishWithUsageWhenPersistenceReturnsMetaWithUsage() throws Exception {
        ChatRequest request = createChatRequest("你好");

        when(chatService.streamChat(anyString(), any(), anyString()))
                .thenAnswer(invocation -> java.util.stream.Stream.of("你", "好", "！"));
        when(persistenceService.persistMessages(anyString(), any(), anyString(), anyString()))
                .thenReturn(new ConversationMeta("conv_123", "测试标题",
                        new ConversationMeta.UsageInfo(10, 20, 30)));

        MvcResult result = mockMvc.perform(post("/api/chat")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertTrue(body.contains("data:{\"type\":\"finish\""));
        assertTrue(body.contains("\"usage\":{\"promptTokens\":10,\"completionTokens\":20,\"totalTokens\":30}"));
    }

    @Test
    void shouldReturn400WhenMalformedJson() throws Exception {
        mockMvc.perform(post("/api/chat")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{invalid json body"))
                .andExpect(status().isBadRequest());

        verify(chatService, never()).streamChat(anyString(), any(), anyString());
    }

    @Test
    void shouldReturn415WhenMissingContentType() throws Exception {
        ChatRequest request = createChatRequest("你好");

        mockMvc.perform(post("/api/chat")
                .header("Authorization", "Bearer " + validAccessToken)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnsupportedMediaType());

        verify(chatService, never()).streamChat(anyString(), any(), anyString());
    }

    @Test
    void shouldReturn429WhenRateLimitExceeded() throws Exception {
        ChatRequest request = createChatRequest("你好");

        doThrow(new BusinessException(ResultCode.RATE_LIMIT_EXCEEDED))
                .when(chatRateLimitService).checkRateLimit(anyString());

        mockMvc.perform(post("/api/chat")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(42901))
                .andExpect(jsonPath("$.message", containsString("请求过于频繁")));

        verify(chatService, never()).streamChat(anyString(), any(), anyString());
    }

    @Test
    void shouldReturn403WhenChatWithOtherUserConversationId() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_other_user");
        conv.setUserId("other_user");
        conv.setTitle("他人会话");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        ChatRequest request = createChatRequest("你好");
        request.setConversationId("conv_other_user");

        mockMvc.perform(post("/api/chat")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(40300));

        verify(chatService, never()).streamChat(anyString(), any(), anyString());
    }

    private ChatRequest createChatRequest(String text) {
        ChatRequest request = new ChatRequest();
        UIMessagePart msg = new UIMessagePart();
        msg.setId("msg_xxx");
        msg.setRole("user");
        msg.setParts(List.of(createTextPart(text)));
        request.setMessages(List.of(msg));
        request.setConversationId("conv_xxx");
        return request;
    }

    private UIMessagePart.MessagePart createTextPart(String text) {
        UIMessagePart.MessagePart part = new UIMessagePart.MessagePart();
        part.setType("text");
        part.setText(text);
        return part;
    }
}
