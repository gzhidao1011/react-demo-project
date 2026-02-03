package com.example.chat.model;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 创建会话请求体（标题可选，默认「新对话」）
 */
@Data
public class CreateConversationRequest {

    @Size(max = 255, message = "标题不能超过 255 个字符")
    private String title;
}
