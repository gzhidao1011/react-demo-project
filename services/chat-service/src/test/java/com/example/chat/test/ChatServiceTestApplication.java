package com.example.chat.test;

import com.example.chat.config.OpenAiChatConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

/**
 * 测试专用启动类：排除 OpenAiChatConfig，强制 ChatServiceImpl 使用 Mock 模式
 * 避免因环境变量 OPENAI_API_KEY/DEEPSEEK_API_KEY 导致测试调用真实 LLM
 * 置于 com.example.chat.test 包，避免被其他测试自动发现导致多配置冲突
 */
@SpringBootApplication
@ComponentScan(
    basePackages = {"com.example.chat", "com.example.api.exception"},
    excludeFilters =
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = OpenAiChatConfig.class))
public class ChatServiceTestApplication {
  public static void main(String[] args) {
    SpringApplication.run(ChatServiceTestApplication.class, args);
  }
}
