package com.example.chat.sse;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Stream;

/**
 * SSE Data Stream 协议写入器
 * 按 Vercel AI SDK Stream Protocol 输出 SSE 事件
 */
public class SseStreamWriter {

    private static final String SSE_LINE_PREFIX = "data:";
    private static final String LINE_END = "\n\n";

    private final OutputStream outputStream;
    private final ObjectMapper objectMapper;

    public SseStreamWriter(OutputStream outputStream) {
        this.outputStream = outputStream;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 写入 start 事件
     */
    public void writeStart(String messageId) throws IOException {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", "start");
        m.put("messageId", messageId);
        writeJson(m);
    }

    /**
     * 写入 text-start 事件
     */
    public void writeTextStart(String textId) throws IOException {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", "text-start");
        m.put("id", textId);
        writeJson(m);
    }

    /**
     * 写入 text-delta 事件
     */
    public void writeTextDelta(String textId, String delta) throws IOException {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", "text-delta");
        m.put("id", textId);
        m.put("delta", delta);
        writeJson(m);
    }

    /**
     * 写入 text-end 事件
     */
    public void writeTextEnd(String textId) throws IOException {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", "text-end");
        m.put("id", textId);
        writeJson(m);
    }

    /**
     * 写入 finish 事件
     */
    public void writeFinish() throws IOException {
        writeFinish(null);
    }

    /**
     * 写入 finish 事件，附带 messageMetadata（符合 AI SDK Data Stream 协议）
     * 会话元信息放入 messageMetadata，供前端 useChat 解析并更新侧边栏
     *
     * @param meta 会话元信息，可为 null
     */
    public void writeFinish(com.example.chat.model.ConversationMeta meta) throws IOException {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", "finish");
        if (meta != null) {
            Map<String, Object> messageMetadata = new LinkedHashMap<>();
            if (meta.getConversationId() != null) {
                messageMetadata.put("conversationId", meta.getConversationId());
            }
            if (meta.getConversationTitle() != null) {
                messageMetadata.put("conversationTitle", meta.getConversationTitle());
            }
            if (meta.getUsage() != null) {
                Map<String, Object> usage = new LinkedHashMap<>();
                usage.put("promptTokens", meta.getUsage().getPromptTokens());
                usage.put("completionTokens", meta.getUsage().getCompletionTokens());
                usage.put("totalTokens", meta.getUsage().getTotalTokens());
                messageMetadata.put("usage", usage);
            }
            if (!messageMetadata.isEmpty()) {
                m.put("messageMetadata", messageMetadata);
            }
        }
        writeJson(m);
    }

    /**
     * 写入 [DONE] 结束标记
     */
    public void writeDone() throws IOException {
        writeRaw("[DONE]");
    }

    /**
     * 写入完整流式序列（从 chunks 流）
     */
    public void writeStream(String messageId, String textId, Stream<String> chunks) throws IOException {
        writeStream(messageId, textId, chunks, null);
    }

    /**
     * 写入完整流式序列，流结束后调用 onComplete 持久化并返回会话元信息，finish 事件附带 meta
     *
     * @param onComplete 流结束回调，接收完整文本、返回会话元信息（可为 null）；返回 null 时 finish 不附带 meta
     */
    public void writeStream(String messageId, String textId, Stream<String> chunks,
            Function<String, com.example.chat.model.ConversationMeta> onComplete) throws IOException {
        writeStart(messageId);
        writeTextStart(textId);
        StringBuilder fullText = new StringBuilder();
        chunks.forEach(chunk -> {
            try {
                fullText.append(chunk);
                writeTextDelta(textId, chunk);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
        writeTextEnd(textId);
        com.example.chat.model.ConversationMeta meta = onComplete != null ? onComplete.apply(fullText.toString()) : null;
        writeFinish(meta);
        writeDone();
    }

    private void writeJson(Map<String, Object> data) throws IOException {
        try {
            String json = objectMapper.writeValueAsString(data);
            writeRaw(json);
        } catch (JsonProcessingException e) {
            throw new IOException("JSON 序列化失败", e);
        }
    }

    private void writeRaw(String data) throws IOException {
        outputStream.write((SSE_LINE_PREFIX + data + LINE_END).getBytes(StandardCharsets.UTF_8));
        outputStream.flush();
    }
}
