package com.example.gateway.config;

import com.alibaba.csp.sentinel.adapter.gateway.common.rule.GatewayFlowRule;
import com.alibaba.csp.sentinel.adapter.gateway.common.rule.GatewayRuleManager;
import com.alibaba.csp.sentinel.adapter.gateway.sc.callback.BlockRequestHandler;
import com.alibaba.csp.sentinel.adapter.gateway.sc.callback.GatewayCallbackManager;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Sentinel 网关限流配置
 * 
 * 配置说明：
 * 1. 基于路由 ID 的限流规则
 * 2. 自定义限流响应
 */
@Configuration
public class SentinelGatewayConfig {

    @PostConstruct
    public void init() {
        // 初始化限流规则
        initGatewayRules();
        // 初始化限流响应处理器
        initBlockHandler();
    }

    /**
     * 配置网关限流规则
     * 
     * 规则类型：
     * - PARAM_PARSE_STRATEGY_CLIENT_IP: 按客户端 IP 限流
     * - PARAM_PARSE_STRATEGY_HOST: 按 Host 限流
     * - PARAM_PARSE_STRATEGY_HEADER: 按请求头限流
     * - PARAM_PARSE_STRATEGY_URL_PARAM: 按 URL 参数限流
     */
    private void initGatewayRules() {
        Set<GatewayFlowRule> rules = new HashSet<>();

        // 用户服务限流规则
        // 每秒最多 100 个请求，超过则限流
        rules.add(new GatewayFlowRule("user-service")
                .setCount(100)                    // QPS 阈值
                .setIntervalSec(1)                // 统计时间窗口（秒）
                .setBurst(20)                     // 突发流量允许额外 20 个请求
        );

        // 订单服务限流规则
        // 每秒最多 50 个请求（订单操作相对较重）
        rules.add(new GatewayFlowRule("order-service")
                .setCount(50)                     // QPS 阈值
                .setIntervalSec(1)                // 统计时间窗口（秒）
                .setBurst(10)                     // 突发流量允许额外 10 个请求
        );

        // 加载规则
        GatewayRuleManager.loadRules(rules);
    }

    /**
     * 自定义限流响应处理器
     * 当请求被限流时返回友好的 JSON 响应
     */
    private void initBlockHandler() {
        GatewayCallbackManager.setBlockHandler(new BlockRequestHandler() {
            @Override
            public Mono<ServerResponse> handleRequest(ServerWebExchange exchange, Throwable t) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 429);
                result.put("message", "请求过于频繁，请稍后再试");
                result.put("success", false);
                result.put("timestamp", System.currentTimeMillis());
                
                return ServerResponse
                        .status(HttpStatus.TOO_MANY_REQUESTS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(result);
            }
        });
    }
}
