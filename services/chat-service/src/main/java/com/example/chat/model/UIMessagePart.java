package com.example.chat.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

/**
 * AI SDK UIMessage 格式
 * 对应前端 message 结构
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UIMessagePart {

    private String id;
    private String role; // "user" | "assistant" | "system"
    private List<MessagePart> parts;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MessagePart {
        private String type; // "text" | "tool-invocation" | "file"
        private String text;
    }
}
