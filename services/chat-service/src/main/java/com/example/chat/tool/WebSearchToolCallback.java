package com.example.chat.tool;

import com.example.chat.service.WebSearchService;
import com.fasterxml.jackson.annotation.JsonClassDescription;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import org.springframework.ai.tool.function.FunctionToolCallback;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;

/**
 * 联网搜索 Tool Callback
 * 采用主流 Function Calling 方式：LLM 在需要实时信息时调用此工具
 * 参考：Perplexity、ChatGPT Browse、Claude 等产品的实现
 */
@Component
@ConditionalOnBean(WebSearchService.class)
public class WebSearchToolCallback {

    private final WebSearchService webSearchService;

    public WebSearchToolCallback(WebSearchService webSearchService) {
        this.webSearchService = webSearchService;
    }

    /**
     * 构建 web_search 工具定义
     */
    public org.springframework.ai.tool.ToolCallback build() {
        return FunctionToolCallback.<WebSearchRequest, String>builder("web_search", req -> webSearchService.search(req.query()))
                .description("搜索互联网获取实时信息。当用户询问需要最新数据的问题时使用，例如：新闻、天气、股票、体育赛事、名人近况、技术文档、产品信息等。")
                .inputType(WebSearchRequest.class)
                .build();
    }

    @JsonClassDescription("网页搜索请求参数")
    public record WebSearchRequest(
            @JsonProperty(required = true)
            @JsonPropertyDescription("搜索关键词，应简洁明确")
            String query) {
    }
}
