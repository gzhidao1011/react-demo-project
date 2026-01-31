package com.example.chat.controller;

import com.example.chat.entity.Conversation;
import com.example.chat.entity.Message;
import com.example.chat.mapper.ConversationMapper;
import com.example.chat.mapper.MessageMapper;
import com.example.chat.model.ConversationDTO;
import com.example.chat.model.MessageDTO;
import com.example.chat.model.RenameConversationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 会话与消息查询接口
 * GET /api/chat/conversations - 会话列表
 * GET /api/chat/conversations/:id/messages - 消息列表
 * PATCH /api/chat/conversations/:id - 会话重命名
 * DELETE /api/chat/conversations/:id - 删除会话
 */
@RestController
@RequestMapping("/api/chat/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationMapper conversationMapper;
    private final MessageMapper messageMapper;

    /**
     * 获取当前用户的会话列表（按更新时间倒序）
     */
    @GetMapping
    public ResponseEntity<List<ConversationDTO>> listConversations(@AuthenticationPrincipal String userId) {
        String effectiveUserId = userId != null ? userId : "anonymous";
        List<Conversation> list = conversationMapper.findByUserIdOrderByUpdatedAtDesc(effectiveUserId);
        List<ConversationDTO> dtos = list.stream()
                .map(c -> new ConversationDTO(c.getId(), c.getTitle(), c.getUpdatedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * 获取指定会话的消息列表（按创建时间正序）
     * 仅允许访问本人会话。
     * 会话不存在时返回 404。
     */
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<MessageDTO>> listMessages(
            @AuthenticationPrincipal String userId,
            @PathVariable("conversationId") String conversationId) {
        String effectiveUserId = userId != null ? userId : "anonymous";
        Conversation conv = conversationMapper.findById(conversationId);
        if (conv == null) {
            return ResponseEntity.notFound().build();
        }
        if (!effectiveUserId.equals(conv.getUserId())) {
            return ResponseEntity.status(403).build();
        }
        List<Message> list = messageMapper.findByConversationIdOrderByCreatedAtAsc(conversationId);
        List<MessageDTO> dtos = list.stream()
                .map(m -> new MessageDTO(m.getId(), m.getRole(), m.getContent(), m.getCreatedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * 重命名指定会话
     * 仅允许重命名本人会话
     */
    @PatchMapping("/{conversationId}")
    public ResponseEntity<ConversationDTO> renameConversation(
            @AuthenticationPrincipal String userId,
            @PathVariable("conversationId") String conversationId,
            @Valid @RequestBody RenameConversationRequest request) {
        String effectiveUserId = userId != null ? userId : "anonymous";
        Conversation conv = conversationMapper.findById(conversationId);
        if (conv == null) {
            return ResponseEntity.notFound().build();
        }
        if (!effectiveUserId.equals(conv.getUserId())) {
            return ResponseEntity.status(403).build();
        }
        conv.setTitle(request.getTitle());
        conv.setUpdatedAt(Instant.now());
        conversationMapper.update(conv);
        return ResponseEntity.ok(new ConversationDTO(conv.getId(), conv.getTitle(), conv.getUpdatedAt()));
    }

    /**
     * 删除指定会话（级联删除消息）
     * 仅允许删除本人会话
     */
    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> deleteConversation(
            @AuthenticationPrincipal String userId,
            @PathVariable("conversationId") String conversationId) {
        String effectiveUserId = userId != null ? userId : "anonymous";
        Conversation conv = conversationMapper.findById(conversationId);
        if (conv == null) {
            return ResponseEntity.notFound().build();
        }
        if (!effectiveUserId.equals(conv.getUserId())) {
            return ResponseEntity.status(403).build();
        }
        // 先删消息（H2 测试环境无 FK 级联），再删会话
        messageMapper.deleteByConversationId(conversationId);
        conversationMapper.deleteById(conversationId);
        return ResponseEntity.noContent().build();
    }
}
