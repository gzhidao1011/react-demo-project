package com.example.chat.config;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAI 兼容 Chat 模型配置（支持 OpenAI、DeepSeek 等）
 * 通过 LLM_PROVIDER 切换：openai | deepseek
 * 未配置 api-key 时，ChatServiceImpl 回退到 Mock 模式
 */
@Configuration
public class OpenAiChatConfig {

    @Bean
    @ConditionalOnExpression("'${OPENAI_API_KEY:}'.trim().length() > 0 || ('${LLM_PROVIDER:openai}' == 'deepseek' && '${DEEPSEEK_API_KEY:}'.trim().length() > 0)")
    public ChatModel openAiChatModel(
            OpenAiApi openAiApi,
            @Value("${LLM_PROVIDER:openai}") String provider,
            @Value("${OPENAI_MODEL:gpt-4o-mini}") String openaiModel,
            @Value("${DEEPSEEK_MODEL:deepseek-chat}") String deepseekModel,
            @Value("${spring.ai.openai.chat.options.temperature:0.7}") double temperature) {
        String model = "deepseek".equalsIgnoreCase(provider) ? deepseekModel : openaiModel;
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(model)
                .temperature(temperature)
                .build();
        return OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(options)
                .build();
    }

    @Bean
    @ConditionalOnExpression("'${OPENAI_API_KEY:}'.trim().length() > 0 || ('${LLM_PROVIDER:openai}' == 'deepseek' && '${DEEPSEEK_API_KEY:}'.trim().length() > 0)")
    public OpenAiApi openAiApi(
            @Value("${LLM_PROVIDER:openai}") String provider,
            @Value("${OPENAI_API_KEY:}") String openaiKey,
            @Value("${OPENAI_BASE_URL:https://api.openai.com}") String openaiBaseUrl,
            @Value("${DEEPSEEK_API_KEY:}") String deepseekKey,
            @Value("${DEEPSEEK_BASE_URL:https://api.deepseek.com}") String deepseekBaseUrl) {
        boolean useDeepSeek = "deepseek".equalsIgnoreCase(provider) && deepseekKey != null && !deepseekKey.isBlank();
        String apiKey = useDeepSeek ? deepseekKey : openaiKey;
        String baseUrl = useDeepSeek ? deepseekBaseUrl : openaiBaseUrl;
        return OpenAiApi.builder()
                .apiKey(apiKey)
                .baseUrl(baseUrl)
                .build();
    }
}
