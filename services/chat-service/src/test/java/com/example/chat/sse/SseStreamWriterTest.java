package com.example.chat.sse;

import com.example.chat.model.ConversationMeta;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SseStreamWriter 单元测试（TDD）
 * 验证 Data Stream 协议输出格式
 */
class SseStreamWriterTest {

    @Test
    void shouldEmitStartEvent() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        writer.writeStart("msg_123");

        String result = out.toString(StandardCharsets.UTF_8);
        assertTrue(result.contains("data:{\"type\":\"start\",\"messageId\":\"msg_123\"}"));
    }

    @Test
    void shouldEmitTextStartEvent() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        writer.writeTextStart("text_456");

        String result = out.toString(StandardCharsets.UTF_8);
        assertTrue(result.contains("data:{\"type\":\"text-start\",\"id\":\"text_456\"}"));
    }

    @Test
    void shouldEmitTextDeltaEvents() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        writer.writeTextDelta("text_456", "你");
        writer.writeTextDelta("text_456", "好");

        String result = out.toString(StandardCharsets.UTF_8);
        assertTrue(result.contains("data:{\"type\":\"text-delta\",\"id\":\"text_456\",\"delta\":\"你\"}"));
        assertTrue(result.contains("data:{\"type\":\"text-delta\",\"id\":\"text_456\",\"delta\":\"好\"}"));
    }

    @Test
    void shouldEmitTextEndEvent() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        writer.writeTextEnd("text_456");

        String result = out.toString(StandardCharsets.UTF_8);
        assertTrue(result.contains("data:{\"type\":\"text-end\",\"id\":\"text_456\"}"));
    }

    @Test
    void shouldEmitFinishEvent() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        writer.writeFinish();

        String result = out.toString(StandardCharsets.UTF_8);
        assertTrue(result.contains("data:{\"type\":\"finish\"}"));
    }

    @Test
    void shouldEmitDoneMarker() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        writer.writeDone();

        String result = out.toString(StandardCharsets.UTF_8);
        assertTrue(result.contains("data:[DONE]"));
    }

    @Test
    void shouldEmitFullStreamSequence() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        writer.writeStart("msg_123");
        writer.writeTextStart("text_456");
        writer.writeTextDelta("text_456", "你");
        writer.writeTextDelta("text_456", "好");
        writer.writeTextEnd("text_456");
        writer.writeFinish();
        writer.writeDone();

        String result = out.toString(StandardCharsets.UTF_8);
        assertTrue(result.contains("data:{\"type\":\"start\",\"messageId\":\"msg_123\"}"));
        assertTrue(result.contains("data:{\"type\":\"text-start\",\"id\":\"text_456\"}"));
        assertTrue(result.contains("data:{\"type\":\"text-delta\",\"id\":\"text_456\",\"delta\":\"你\"}"));
        assertTrue(result.contains("data:{\"type\":\"text-delta\",\"id\":\"text_456\",\"delta\":\"好\"}"));
        assertTrue(result.contains("data:{\"type\":\"text-end\",\"id\":\"text_456\"}"));
        assertTrue(result.contains("data:{\"type\":\"finish\"}"));
        assertTrue(result.contains("data:[DONE]"));
    }

    @Test
    void shouldWriteStreamFromChunks() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        Stream<String> chunks = Stream.of("你", "好", "！");
        writer.writeStream("msg_123", "text_456", chunks);

        String result = out.toString(StandardCharsets.UTF_8);
        assertTrue(result.contains("data:{\"type\":\"start\",\"messageId\":\"msg_123\"}"));
        assertTrue(result.contains("data:{\"type\":\"text-start\",\"id\":\"text_456\"}"));
        assertTrue(result.contains("data:{\"type\":\"text-delta\",\"id\":\"text_456\",\"delta\":\"你\"}"));
        assertTrue(result.contains("data:{\"type\":\"text-delta\",\"id\":\"text_456\",\"delta\":\"好\"}"));
        assertTrue(result.contains("data:{\"type\":\"text-delta\",\"id\":\"text_456\",\"delta\":\"！\"}"));
        assertTrue(result.contains("data:{\"type\":\"text-end\",\"id\":\"text_456\"}"));
        assertTrue(result.contains("data:{\"type\":\"finish\"}"));
        assertTrue(result.contains("data:[DONE]"));
    }

    @Test
    void shouldEmitFinishWithConversationMetaWhenProvided() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        ConversationMeta meta = new ConversationMeta("conv_123", "测试标题");
        writer.writeFinish(meta);

        String result = out.toString(StandardCharsets.UTF_8);
        assertTrue(result.contains("\"type\":\"finish\""));
        assertTrue(result.contains("\"messageMetadata\":{\"conversationId\":\"conv_123\",\"conversationTitle\":\"测试标题\"}"));
    }

    @Test
    void shouldInvokeOnCompleteWithFullTextWhenStreamEnds() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        Stream<String> chunks = Stream.of("你", "好", "！");
        StringBuilder collected = new StringBuilder();
        writer.writeStream("msg_123", "text_456", chunks, fullText -> {
            collected.append(fullText);
            return null;
        });

        assertEquals("你好！", collected.toString());
    }

    @Test
    void shouldEmitValidSequenceWhenChunksEmpty() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        Stream<String> chunks = Stream.empty();
        writer.writeStream("msg_123", "text_456", chunks);

        String result = out.toString(StandardCharsets.UTF_8);
        assertTrue(result.contains("data:{\"type\":\"start\",\"messageId\":\"msg_123\"}"));
        assertTrue(result.contains("data:{\"type\":\"text-start\",\"id\":\"text_456\"}"));
        assertTrue(result.contains("data:{\"type\":\"text-end\",\"id\":\"text_456\"}"));
        assertTrue(result.contains("data:{\"type\":\"finish\"}"));
        assertTrue(result.contains("data:[DONE]"));
        assertFalse(result.contains("text-delta"));
    }

    @Test
    void shouldInvokeOnCompleteWithEmptyStringWhenChunksEmpty() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        Stream<String> chunks = Stream.empty();
        StringBuilder collected = new StringBuilder();
        writer.writeStream("msg_123", "text_456", chunks, fullText -> {
            collected.append("[").append(fullText).append("]");
            return null;
        });

        assertEquals("[]", collected.toString());
    }

    @Test
    void shouldEmitFinishWithUsageWhenProvided() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        SseStreamWriter writer = new SseStreamWriter(out);

        ConversationMeta meta = new ConversationMeta("conv_123", "测试标题",
                new ConversationMeta.UsageInfo(10, 20, 30));
        writer.writeFinish(meta);

        String result = out.toString(StandardCharsets.UTF_8);
        assertTrue(result.contains("\"type\":\"finish\""));
        assertTrue(result.contains("\"messageMetadata\""));
        assertTrue(result.contains("\"conversationId\":\"conv_123\""));
        assertTrue(result.contains("\"conversationTitle\":\"测试标题\""));
        assertTrue(result.contains("\"usage\":{\"promptTokens\":10,\"completionTokens\":20,\"totalTokens\":30}"));
    }
}
