package com.example.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * 租户过滤器
 * 在 API Gateway 层提取并验证租户ID
 */
@Component
@Slf4j
public class TenantFilter implements GlobalFilter, Ordered {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        // 跳过健康检查等公共端点
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        // 从 Header 获取租户ID
        String tenantId = request.getHeaders().getFirst(TENANT_HEADER);

        // 也可以从子域名解析: tenant1.example.com
        String host = request.getHeaders().getFirst("Host");
        if (tenantId == null && host != null && host.contains(".") && !host.startsWith("localhost")) {
            String subdomain = host.split("\\.")[0];
            // 排除 www, api 等保留子域名
            if (!isReservedSubdomain(subdomain)) {
                tenantId = subdomain;
            }
        }

        // 如果没有租户ID，使用默认租户（或者可以选择拒绝请求）
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = "default";
            log.debug("未提供租户ID，使用默认租户");
        }

        log.debug("处理请求 - path={}, tenantId={}", path, tenantId);

        // 将租户ID传递到下游服务
        ServerHttpRequest mutatedRequest = request.mutate()
            .header(TENANT_HEADER, tenantId)
            .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        return -100; // 在认证之前执行
    }

    /**
     * 判断是否为公共路径（不需要租户ID）
     */
    private boolean isPublicPath(String path) {
        return path.startsWith("/actuator") ||
               path.startsWith("/api/health") ||
               path.startsWith("/api/info") ||
               path.equals("/favicon.ico");
    }

    /**
     * 判断是否为保留子域名
     */
    private boolean isReservedSubdomain(String subdomain) {
        return "www".equals(subdomain) ||
               "api".equals(subdomain) ||
               "admin".equals(subdomain) ||
               "app".equals(subdomain);
    }
}
