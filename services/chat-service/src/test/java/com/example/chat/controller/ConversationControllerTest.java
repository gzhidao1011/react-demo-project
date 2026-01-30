package com.example.chat.controller;

import com.example.chat.entity.Conversation;
import com.example.chat.entity.Message;
import com.example.chat.mapper.ConversationMapper;
import com.example.chat.mapper.MessageMapper;
import com.example.chat.util.TestJwtHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.http.MediaType;

import java.time.Instant;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ConversationController 集成测试（TDD）
 * 验证：GET 会话列表、GET 消息列表、401 鉴权
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
class ConversationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ConversationMapper conversationMapper;

    @Autowired
    private MessageMapper messageMapper;

    private String validAccessToken;

    @BeforeEach
    void setUp() throws Exception {
        validAccessToken = TestJwtHelper.generateAccessToken("1", "testuser", List.of("USER"));
    }

    @Test
    void shouldReturnConversationsListWhenAuthenticated() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_list_1");
        conv.setUserId("1");
        conv.setTitle("测试对话");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        mockMvc.perform(get("/api/chat/conversations")
                .header("Authorization", "Bearer " + validAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value("conv_list_1"))
                .andExpect(jsonPath("$[0].title").value("测试对话"))
                .andExpect(jsonPath("$[0].updatedAt").exists());
    }

    @Test
    void shouldReturn401WhenNoAuthForConversations() throws Exception {
        mockMvc.perform(get("/api/chat/conversations"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn401WhenTokenExpiredForConversations() throws Exception {
        String expiredToken = TestJwtHelper.generateExpiredAccessToken("1", "testuser", List.of("USER"));

        mockMvc.perform(get("/api/chat/conversations")
                .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnMessagesListWhenAuthenticated() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_msg_1");
        conv.setUserId("1");
        conv.setTitle("测试");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        Message msg = new Message();
        msg.setId("msg_1");
        msg.setConversationId("conv_msg_1");
        msg.setRole("user");
        msg.setContent("你好");
        msg.setCreatedAt(Instant.now());
        messageMapper.insert(msg);

        mockMvc.perform(get("/api/chat/conversations/conv_msg_1/messages")
                .header("Authorization", "Bearer " + validAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value("msg_1"))
                .andExpect(jsonPath("$[0].role").value("user"))
                .andExpect(jsonPath("$[0].content").value("你好"));
    }

    @Test
    void shouldReturn401WhenNoAuthForMessages() throws Exception {
        mockMvc.perform(get("/api/chat/conversations/conv_1/messages"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn404WhenGetMessagesOfNonExistentConversation() throws Exception {
        mockMvc.perform(get("/api/chat/conversations/non_existent_conv/messages")
                .header("Authorization", "Bearer " + validAccessToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldDeleteConversationWhenAuthenticated() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_del_1");
        conv.setUserId("1");
        conv.setTitle("待删除");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        Message msg = new Message();
        msg.setId("msg_del_1");
        msg.setConversationId("conv_del_1");
        msg.setRole("user");
        msg.setContent("测试");
        msg.setCreatedAt(Instant.now());
        messageMapper.insert(msg);

        mockMvc.perform(delete("/api/chat/conversations/conv_del_1")
                .header("Authorization", "Bearer " + validAccessToken))
                .andExpect(status().isNoContent());

        // 验证会话已删除
        assertNull(conversationMapper.findById("conv_del_1"));
        // 验证消息已级联删除
        assertTrue(messageMapper.findByConversationIdOrderByCreatedAtAsc("conv_del_1").isEmpty());
    }

    @Test
    void shouldReturn401WhenNoAuthForDelete() throws Exception {
        mockMvc.perform(delete("/api/chat/conversations/conv_1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn404WhenDeleteNonExistentConversation() throws Exception {
        mockMvc.perform(delete("/api/chat/conversations/non_existent_id")
                .header("Authorization", "Bearer " + validAccessToken))
                .andExpect(status().isNotFound());
    }

    // ===== 会话所有权校验 =====

    @Test
    void shouldReturn403WhenGetMessagesOfOtherUserConversation() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_other_1");
        conv.setUserId("other_user");
        conv.setTitle("他人会话");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        mockMvc.perform(get("/api/chat/conversations/conv_other_1/messages")
                .header("Authorization", "Bearer " + validAccessToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn403WhenDeleteOtherUserConversation() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_other_del");
        conv.setUserId("other_user");
        conv.setTitle("他人会话");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        mockMvc.perform(delete("/api/chat/conversations/conv_other_del")
                .header("Authorization", "Bearer " + validAccessToken))
                .andExpect(status().isForbidden());

        // 验证会话未被删除
        assertNotNull(conversationMapper.findById("conv_other_del"));
    }

    // ===== 会话重命名 PATCH =====

    @Test
    void shouldRenameConversationWhenAuthenticated() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_rename_1");
        conv.setUserId("1");
        conv.setTitle("原标题");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        mockMvc.perform(patch("/api/chat/conversations/conv_rename_1")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"新标题\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("conv_rename_1"))
                .andExpect(jsonPath("$.title").value("新标题"));

        Conversation updated = conversationMapper.findById("conv_rename_1");
        assertNotNull(updated);
        assertEquals("新标题", updated.getTitle());
    }

    @Test
    void shouldReturn401WhenNoAuthForRename() throws Exception {
        mockMvc.perform(patch("/api/chat/conversations/conv_1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"新标题\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn404WhenRenameNonExistentConversation() throws Exception {
        mockMvc.perform(patch("/api/chat/conversations/non_existent_id")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"新标题\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn403WhenRenameOtherUserConversation() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_other_rename");
        conv.setUserId("other_user");
        conv.setTitle("他人会话");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        mockMvc.perform(patch("/api/chat/conversations/conv_other_rename")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"篡改标题\"}"))
                .andExpect(status().isForbidden());

        Conversation unchanged = conversationMapper.findById("conv_other_rename");
        assertNotNull(unchanged);
        assertEquals("他人会话", unchanged.getTitle());
    }

    @Test
    void shouldReturn400WhenRenameWithEmptyTitle() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_rename_empty");
        conv.setUserId("1");
        conv.setTitle("原标题");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        mockMvc.perform(patch("/api/chat/conversations/conv_rename_empty")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(40004))
                .andExpect(jsonPath("$.errors").isArray());

        Conversation unchanged = conversationMapper.findById("conv_rename_empty");
        assertNotNull(unchanged);
        assertEquals("原标题", unchanged.getTitle());
    }

    @Test
    void shouldReturn400WhenRenameWithBlankTitle() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_rename_blank");
        conv.setUserId("1");
        conv.setTitle("原标题");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        mockMvc.perform(patch("/api/chat/conversations/conv_rename_blank")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void shouldReturn400WhenRenameWithTitleExceedingMaxLength() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_rename_long");
        conv.setUserId("1");
        conv.setTitle("原标题");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        String longTitle = "a".repeat(256);

        mockMvc.perform(patch("/api/chat/conversations/conv_rename_long")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + longTitle + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void shouldReturn400WhenRenameWithMissingTitleField() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_rename_no_title");
        conv.setUserId("1");
        conv.setTitle("原标题");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        mockMvc.perform(patch("/api/chat/conversations/conv_rename_no_title")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());

        Conversation unchanged = conversationMapper.findById("conv_rename_no_title");
        assertNotNull(unchanged);
        assertEquals("原标题", unchanged.getTitle());
    }

    @Test
    void shouldReturn400WhenRenameWithMalformedJson() throws Exception {
        Conversation conv = new Conversation();
        conv.setId("conv_rename_malformed");
        conv.setUserId("1");
        conv.setTitle("原标题");
        conv.setCreatedAt(Instant.now());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.insert(conv);

        mockMvc.perform(patch("/api/chat/conversations/conv_rename_malformed")
                .header("Authorization", "Bearer " + validAccessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{invalid json"))
                .andExpect(status().isBadRequest());

        Conversation unchanged = conversationMapper.findById("conv_rename_malformed");
        assertNotNull(unchanged);
        assertEquals("原标题", unchanged.getTitle());
    }
}
