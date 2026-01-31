package com.example.chat.service.impl;

import com.example.chat.service.WebSearchService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Tavily 搜索服务实现
 * 使用 Tavily API（AI 优化，免费额度 1000 次/月）
 * 参考：https://docs.tavily.com/documentation/api-reference/endpoint/search
 */
@Service
@ConditionalOnProperty(name = "web-search.enabled", havingValue = "true", matchIfMissing = false)
public class WebSearchServiceImpl implements WebSearchService {

    private static final Logger log = LoggerFactory.getLogger(WebSearchServiceImpl.class);
    private static final String TAVILY_SEARCH_URL = "https://api.tavily.com/search";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${web-search.tavily-api-key:}")
    private String apiKey;

    @Override
    public String search(String query) {
        if (query == null || query.isBlank()) {
            return "搜索关键词不能为空";
        }
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Tavily API Key 未配置，跳过搜索");
            return "搜索服务未配置，请设置 TAVILY_API_KEY";
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = Map.of(
                    "query", query.trim(),
                    "max_results", 5,
                    "search_depth", "basic",
                    "include_answer", false);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(TAVILY_SEARCH_URL, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return "搜索请求失败";
            }

            return formatResults(response.getBody(), query);
        } catch (Exception e) {
            log.error("Tavily 搜索失败: query={}", query, e);
            return "搜索失败: " + e.getMessage();
        }
    }

    private String formatResults(String jsonBody, String query) {
        try {
            JsonNode root = objectMapper.readTree(jsonBody);
            JsonNode results = root.get("results");
            if (results == null || !results.isArray() || results.isEmpty()) {
                return "未找到与 \"" + query + "\" 相关的搜索结果";
            }

            StringBuilder sb = new StringBuilder();
            sb.append("【").append(query).append("】的搜索结果：\n\n");
            int i = 1;
            for (JsonNode item : results) {
                String title = item.has("title") ? item.get("title").asText() : "";
                String url = item.has("url") ? item.get("url").asText() : "";
                String content = item.has("content") ? item.get("content").asText() : "";
                sb.append(i++).append(". ").append(title).append("\n");
                sb.append("   链接: ").append(url).append("\n");
                sb.append("   摘要: ").append(content.length() > 300 ? content.substring(0, 300) + "..." : content).append("\n\n");
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("解析 Tavily 响应失败", e);
            return "解析搜索结果失败";
        }
    }
}
