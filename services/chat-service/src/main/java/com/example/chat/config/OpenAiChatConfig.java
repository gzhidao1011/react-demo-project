package com.example.chat.config;

import com.example.chat.tool.WebSearchToolCallback;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAI 兼容 Chat 模型配置（支持 OpenAI、DeepSeek 等）
 * 通过 LLM_PROVIDER 切换：openai | deepseek
 * 未配置 api-key 时，ChatServiceImpl 回退到 Mock 模式
 * 联网搜索：采用 Function Calling 方式（Perplexity/ChatGPT 主流实现），需配置 WEB_SEARCH_ENABLED 和 TAVILY_API_KEY
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
            @Value("${spring.ai.openai.chat.options.temperature:0.7}") double temperature,
            @Autowired(required = false) WebSearchToolCallback webSearchToolCallback) {
        String model = "deepseek".equalsIgnoreCase(provider) ? deepseekModel : openaiModel;
        var builder = OpenAiChatOptions.builder()
                .model(model)
                .temperature(temperature);
        // 联网搜索：Function Calling 方式，LLM 在需要实时信息时调用 web_search 工具
        if (webSearchToolCallback != null) {
            builder.toolCallbacks(List.of(webSearchToolCallback.build()))
                    .internalToolExecutionEnabled(true);
        }
        OpenAiChatOptions options = builder.build();
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
