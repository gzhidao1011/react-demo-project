package com.example.chat.logging;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;

/**
 * ========================================
 * 分布式追踪实现 - 符合国际标准
 * ========================================
 * 
 * 实现W3C Trace Context规范，支持：
 * - 自动生成traceId（如果请求中没有）
 * - 传递追踪信息到下游服务
 * - 自动记录性能指标
 * - MDC生命周期管理
 * 
 * Reference:
 * - W3C Trace Context: https://www.w3.org/TR/trace-context/
 * - Google SRE: https://sre.google/books/
 */

// ========================================
// 1. HTTP请求过滤器 - 初始化追踪上下文
// ========================================

@Slf4j
@Component
public class DistributedTracingFilter extends OncePerRequestFilter {
    
    private static final String TRACE_ID_HEADER = "X-Trace-ID";
    private static final String SPAN_ID_HEADER = "X-Span-ID";
    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                     HttpServletResponse response, 
                                     FilterChain filterChain)
        throws ServletException, IOException {
        
        // ======== Step 1: 初始化追踪信息 ========
        
        // 获取或生成 traceId（整条链路的唯一标识）
        String traceId = request.getHeader(TRACE_ID_HEADER);
        if (traceId == null || traceId.isEmpty()) {
            // 新请求链起点：生成新的traceId
            traceId = generateTraceId();
            log.debug("Generated new traceId: {}", traceId);
        }
        
        // 生成 spanId（当前操作的ID）
        String spanId = generateSpanId();
        
        // 获取或生成 requestId（单个请求的ID）
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isEmpty()) {
            requestId = generateRequestId();
        }
        
        // 提取用户信息（从JWT或Cookie）
        String userId = extractUserId(request);
        
        // ======== Step 2: 设置MDC（Magic Diagnostic Context） ========
        
        MDC.put("traceId", traceId);
        MDC.put("spanId", spanId);
        MDC.put("requestId", requestId);
        MDC.put("userId", userId);
        MDC.put("method", request.getMethod());
        MDC.put("path", request.getRequestPath());
        MDC.put("remote_addr", getClientIp(request));
        
        // 记录请求开始
        long startTime = System.currentTimeMillis();
        
        // ======== Step 3: 添加追踪信息到响应头 ========
        // 这样调用方可以从响应中获取追踪ID，用于日志查询
        response.setHeader(TRACE_ID_HEADER, traceId);
        response.setHeader(SPAN_ID_HEADER, spanId);
        response.setHeader(REQUEST_ID_HEADER, requestId);
        
        try {
            // ======== Step 4: 继续处理请求 ========
            filterChain.doFilter(request, response);
            
            // ======== Step 5: 记录响应 ========
            long duration = System.currentTimeMillis() - startTime;
            MDC.put("duration_ms", String.valueOf(duration));
            MDC.put("http_status", String.valueOf(response.getStatus()));
            
            // 记录请求完成日志
            log.info(
                "HTTP request completed",
                ofMap(
                    "method", request.getMethod(),
                    "path", request.getRequestPath(),
                    "status", response.getStatus(),
                    "duration_ms", duration
                )
            );
            
            // ======== Step 6: 性能告警 ========
            if (duration > 1000) {
                log.warn(
                    "Request exceeded 1 second SLA",
                    ofMap(
                        "path", request.getRequestPath(),
                        "duration_ms", duration,
                        "sla_threshold_ms", 1000
                    )
                );
            }
            
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error(
                "Request processing failed",
                ofMap(
                    "method", request.getMethod(),
                    "path", request.getRequestPath(),
                    "duration_ms", duration,
                    "error_type", e.getClass().getSimpleName()
                ),
                e
            );
            throw e;
            
        } finally {
            // ======== Step 7: 清理MDC ========
            // 关键：防止MDC内容跨请求泄漏（否则后续请求会继承这些值）
            MDC.clear();
        }
    }
    
    private String generateTraceId() {
        // 生成128-bit hex字符串（推荐做法）
        return UUID.randomUUID().toString().replace("-", "");
    }
    
    private String generateSpanId() {
        // 生成64-bit hex字符串
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
    
    private String generateRequestId() {
        // 格式: req-{timestamp}-{random}
        return "req-" + System.currentTimeMillis() + "-" + 
               UUID.randomUUID().toString().substring(0, 8);
    }
    
    private String extractUserId(HttpServletRequest request) {
        // 从JWT Token或Cookie中提取用户ID
        // 这里只是示例，实际需要根据你的认证方式实现
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            // 简化处理：从JWT中解析用户ID
            // 实际应该用JWT库解析
            return "user-" + System.currentTimeMillis() % 10000;
        }
        return "anonymous";
    }
    
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
    
    private static Map<String, Object> ofMap(Object... args) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < args.length; i += 2) {
            map.put((String) args[i], args[i + 1]);
        }
        return map;
    }
}

// ========================================
// 2. 服务内部方法 - 正确使用MDC
// ========================================

@Slf4j
public class ChatService {
    
    private RestTemplate restTemplate;
    
    /**
     * 业务方法中的日志最佳实践
     */
    public void sendMessage(String userId, String content) {
        // 获取当前的追踪信息（由Filter设置）
        String traceId = MDC.get("traceId");
        String currentSpanId = MDC.get("spanId");
        
        // 业务处理之前记录
        log.info(
            "Processing message",
            ofMap(
                "userId", userId,
                "content_length", content.length()
            )
        );
        
        try {
            // 验证消息
            validateMessage(content);
            log.debug("Message validation passed");
            
            // 调用下游服务
            notifyOrderService(userId);
            
            // 成功
            log.info("Message processed successfully");
            
        } catch (ValidationException e) {
            log.warn("Message validation failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error processing message", ofMap(
                "error_type", e.getClass().getSimpleName()
            ), e);
        }
    }
    
    /**
     * 调用下游服务时的追踪信息传递
     */
    private void notifyOrderService(String userId) {
        // 为这次下游调用生成新的spanId
        String traceId = MDC.get("traceId");
        String parentSpanId = MDC.get("spanId");
        String childSpanId = generateSpanId();
        
        // 暂时保存原spanId
        String originalSpanId = MDC.get("spanId");
        
        try {
            // 更新MDC为子操作的spanId
            MDC.put("spanId", childSpanId);
            MDC.put("downstream_service", "order-service");
            
            long startTime = System.currentTimeMillis();
            
            // 构建HTTP请求，传递追踪信息
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Trace-ID", traceId);
            headers.set("X-Span-ID", childSpanId);
            headers.set("X-Parent-Span-ID", parentSpanId);
            
            var response = restTemplate.exchange(
                "http://order-service:8004/api/points",
                HttpMethod.POST,
                new HttpEntity<>(
                    Map.of("userId", userId, "action", "MESSAGE_SENT"),
                    headers
                ),
                PointResponse.class
            );
            
            long duration = System.currentTimeMillis() - startTime;
            
            log.info(
                "Order service call succeeded",
                ofMap(
                    "service", "order-service",
                    "duration_ms", duration,
                    "http_status", response.getStatusCodeValue()
                )
            );
            
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error(
                "Order service call failed",
                ofMap(
                    "service", "order-service",
                    "error", e.getMessage(),
                    "duration_ms", duration
                ),
                e
            );
        } finally {
            // 恢复原spanId
            MDC.put("spanId", originalSpanId);
            MDC.remove("downstream_service");
        }
    }
    
    private void validateMessage(String content) {
        if (content == null || content.isEmpty()) {
            throw new ValidationException("Empty message");
        }
        if (content.length() > 10000) {
            throw new ValidationException("Message too long");
        }
    }
    
    private String generateSpanId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
    
    private static Map<String, Object> ofMap(Object... args) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < args.length; i += 2) {
            map.put((String) args[i], args[i + 1]);
        }
        return map;
    }
}

// ========================================
// 3. 使用示例 - 实际业务代码
// ========================================

@Slf4j
@RestController
@RequestMapping("/api/messages")
public class MessageController {
    
    @Autowired
    private ChatService chatService;
    
    /**
     * 发送消息接口
     * 
     * 请求信息：
     * Headers:
     *   X-Trace-ID: abc-123-def-456 (可选，没有会自动生成)
     * Body:
     *   {
     *     "content": "Hello World"
     *   }
     * 
     * 响应信息：
     * Headers:
     *   X-Trace-ID: abc-123-def-456 (用于查找日志)
     */
    @PostMapping
    public ResponseEntity<Message> sendMessage(
        @RequestBody MessageRequest request
    ) {
        // 此时FilterChain已经设置了MDC
        // 可以直接使用MDC.get("userId")等
        
        String userId = MDC.get("userId");
        log.info("Sending message for user: " + userId);
        
        // 调用服务
        chatService.sendMessage(userId, request.getContent());
        
        return ResponseEntity.ok(new Message());
    }
}

// ========================================
// 4. 追踪信息在日志中的样子
// ========================================

/*
场景：用户发送消息，系统调用3个微服务

时间线：
14:30:45.100 - API Gateway接收请求
14:30:45.145 - Auth Service验证用户
14:30:45.395 - Chat Service处理消息
14:30:45.455 - Order Service记录积分
14:30:45.460 - API Gateway返回响应

关键：所有日志的traceId都是同一个 abc-123-def-456

通过Kibana查询：
Query: traceId: "abc-123-def-456"

Result: 按时间顺序列出所有相关日志
[
  {
    timestamp: 14:30:45.100,
    service: "api-gateway",
    message: "HTTP request received",
    traceId: "abc-123-def-456",
    spanId: "span-001",
    userId: "user-12345",
    path: "/api/messages"
  },
  {
    timestamp: 14:30:45.145,
    service: "auth-service",
    message: "User authenticated",
    traceId: "abc-123-def-456",
    spanId: "span-002",
    userId: "user-12345",
    duration_ms: 45
  },
  {
    timestamp: 14:30:45.395,
    service: "chat-service",
    message: "Message persisted",
    traceId: "abc-123-def-456",
    spanId: "span-003",
    userId: "user-12345",
    duration_ms: 250
  },
  {
    timestamp: 14:30:45.455,
    service: "order-service",
    message: "Points recorded",
    traceId: "abc-123-def-456",
    spanId: "span-004",
    userId: "user-12345",
    duration_ms: 60
  },
  {
    timestamp: 14:30:45.460,
    service: "api-gateway",
    message: "HTTP request completed",
    traceId: "abc-123-def-456",
    spanId: "span-001",
    userId: "user-12345",
    http_status: 200,
    duration_ms: 360  // 总耗时
  }
]

优点：
✓ 一个查询就能看到整个请求的链路
✓ 能快速定位哪个服务有问题
✓ 能看到每个服务的耗时
*/

// ========================================
// 5. 其他工具类
// ========================================

class ValidationException extends RuntimeException {
    public ValidationException(String message) {
        super(message);
    }
}

class MessageRequest {
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    private String content;
}

class Message {
    // id, createdAt等字段
}

class PointResponse {
    // 可选的响应机构
}

// ========================================
// 6. Spring Boot配置
// ========================================

/*
在application.yml中添加：

logging:
  level:
    root: INFO
    com.example: DEBUG
  pattern:
    # 日志格式包含traceId
    console: "[%X{traceId}] %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
    file: "[%X{traceId}] %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"

spring:
  # 自动注册Filter
  servlet:
    filter:
      order: -100  # 确保在其他Filter之前执行
*/

