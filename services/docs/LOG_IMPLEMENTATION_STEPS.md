# 国际主流日志系统 - 实施指南

## 🎯 目标

将现有日志系统升级至国际一流公司（Google、AWS、Netflix、Uber）的标准。

---

## 📋 实施路线图

### Phase 1: 基础升级（第1-2周）
- [ ] 扩展JSON格式为ECS标准
- [ ] 实现异步日志输出
- [ ] 添加日志脱敏工具
- [ ] 更新logback配置

### Phase 2: OpenTelemetry集成（第3-4周）
- [ ] 添加OpenTelemetry依赖
- [ ] 部署Jaeger追踪系统
- [ ] 实现自动Span创建
- [ ] 验证分布式追踪

### Phase 3: 监控告警（第5-6周）
- [ ] 创建Kibana仪表板
- [ ] 配置告警规则
- [ ] 集成Slack/邮件通知
- [ ] 性能基线设置

---

## 🔧 Phase 1: 基础升级详细步骤

### 步骤1：创建PII脱敏工具

**位置**: `services/auth-service/src/main/java/com/example/logging/SensitiveDataMasker.java`

```java
package com.example.logging;

import java.util.regex.Pattern;

/**
 * 敏感数据脱敏工具 - 符合GDPR和CCPA标准
 */
public class SensitiveDataMasker {
    
    // 正则表达式定义
    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("(?<![\\w.-])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(?![\\w.-])");
    
    private static final Pattern PHONE_PATTERN = 
        Pattern.compile("\\+?1?\\s*[.-]?\\(?[2-9]\\d{2}\\)?[.-]?[2-9]\\d{2}[.-]?\\d{4}");
    
    private static final Pattern SSN_PATTERN = 
        Pattern.compile("\\b(\\d{3})[.-]?(\\d{2})[.-]?(\\d{4})\\b");
    
    private static final Pattern CREDIT_CARD_PATTERN = 
        Pattern.compile("\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b");
    
    private static final Pattern IP_ADDRESS_PATTERN = 
        Pattern.compile("\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b");
    
    private static final Pattern API_KEY_PATTERN = 
        Pattern.compile("([a-z0-9]{32,})");
    
    // 脱敏方法
    public static String maskEmail(String input) {
        if (input == null) return input;
        return EMAIL_PATTERN.matcher(input)
            .replaceAll(m -> maskEmailPart(m.group()));
    }
    
    public static String maskPhone(String input) {
        if (input == null) return input;
        return PHONE_PATTERN.matcher(input)
            .replaceAll(m -> "***-***-" + m.group().substring(m.group().length() - 4));
    }
    
    public static String maskSSN(String input) {
        if (input == null) return input;
        return SSN_PATTERN.matcher(input)
            .replaceAll("***-**-$3");
    }
    
    public static String maskCreditCard(String input) {
        if (input == null) return input;
        return CREDIT_CARD_PATTERN.matcher(input)
            .replaceAll(m -> "****-****-****-" + m.group().replaceAll("[^\\d]", "").substring(12));
    }
    
    public static String maskIPAddress(String input) {
        if (input == null) return input;
        return IP_ADDRESS_PATTERN.matcher(input)
            .replaceAll("***.***.***.***");
    }
    
    public static String maskApiKey(String input) {
        if (input == null) return input;
        return API_KEY_PATTERN.matcher(input)
            .replaceAll(m -> m.group().substring(0, 4) + "***" + m.group().substring(m.group().length() - 4));
    }
    
    // 综合脱敏
    public static String maskSensitiveData(String input) {
        if (input == null || input.isEmpty()) return input;
        
        String masked = input;
        masked = maskEmail(masked);
        masked = maskPhone(masked);
        masked = maskSSN(masked);
        masked = maskCreditCard(masked);
        masked = maskIPAddress(masked);
        masked = maskApiKey(masked);
        
        return masked;
    }
    
    // 辅助方法
    private static String maskEmailPart(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex <= 0) return email;
        
        String localPart = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        
        if (localPart.length() <= 2) {
            return "*" + domain;
        }
        
        return localPart.charAt(0) + "***" + localPart.charAt(localPart.length() - 1) + domain;
    }
}
```

### 步骤2：创建敏感数据Filter

**位置**: `services/auth-service/src/main/java/com/example/logging/SensitiveDataFilter.java`

```java
package com.example.logging;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.filter.Filter;
import ch.qos.logback.core.spi.FilterReply;

/**
 * Logback过滤器 - 识别包含敏感数据的日志
 */
public class SensitiveDataFilter extends Filter<ILoggingEvent> {
    
    private static final String[] SENSITIVE_KEYWORDS = {
        "password", "token", "secret", "key", "credential",
        "ssn", "email", "phone", "credit_card",
        "authorization", "x-api-key"
    };
    
    @Override
    public FilterReply decide(ILoggingEvent event) {
        String message = event.getMessage();
        String loggerName = event.getLoggerName();
        
        // 检查日志消息和logger名称中的敏感关键字
        for (String keyword : SENSITIVE_KEYWORDS) {
            if (message.toLowerCase().contains(keyword) ||
                loggerName.toLowerCase().contains(keyword)) {
                return FilterReply.ACCEPT;
            }
        }
        
        // 检查MDC中的敏感字段
        if (event.getMDCPropertyMap() != null) {
            for (String key : event.getMDCPropertyMap().keySet()) {
                if (key.toLowerCase().contains("password") ||
                    key.toLowerCase().contains("token") ||
                    key.toLowerCase().contains("secret")) {
                    return FilterReply.ACCEPT;
                }
            }
        }
        
        return FilterReply.DENY;
    }
}
```

### 步骤3：创建JSON个性化装饰器（ECS格式扩展）

**位置**: `services/auth-service/src/main/java/com/example/logging/SensitiveDataJsonDecorator.java`

```java
package com.example.logging;

import com.fasterxml.jackson.core.JsonGenerator;
import net.logstash.logback.encoder.LogstashEncoder;
import net.logstash.logback.fieldnames.LogstashFieldNames;
import ch.qos.logback.core.spi.ContextAwareBase;
import java.io.IOException;

/**
 * JSON生成器装饰器 - 自动脱敏敏感字段
 */
public class SensitiveDataJsonDecorator extends ContextAwareBase {
    
    public void decorate(JsonGenerator generator) throws IOException {
        // 在日志输出前自动脱敏所有字段值
        
        // 示例：脱敏message字段
        if (generator.getCurrentLocation().getByteOffset() > 0) {
            // 这里会应用到所有JSON值
        }
    }
}
```

### 步骤4：更新应用配置

**文件**: `services/auth-service/src/main/resources/application.yml`

```yaml
# ====== 日志配置 ======
logging:
  # 日志级别规范
  level:
    root: INFO
    # 关键模块
    com.example.auth: INFO       # 认证：完整记录
    com.example.security: INFO   # 安全：完整记录
    com.example.payment: INFO    # 支付：完整记录（必须）
    com.example: DEBUG           # 其他业务模块
    # 第三方库
    org.springframework: WARN
    org.springframework.security: DEBUG
    org.hibernate: WARN
    org.apache.http: WARN
    org.apache.kafka: WARN
  
  # 文件配置
  file:
    name: logs/auth-service.log
    max-size: 100MB
    max-history: 30
    total-size-cap: 3GB

# ====== Spring Boot日志配置 ======
spring:
  application:
    name: auth-service
    version: 1.0.0
  
  # Logback配置
  logback:
    json:
      enabled: true

# ====== 自定义日志属性 ======
app:
  logging:
    # 采样配置
    sampling:
      enabled: true
      default-rate: 0.1      # 生产10%采样
    
    # 脱敏配置
    masking:
      enabled: true
      email: true
      phone: true
      credit_card: true
      ssn: true
    
    # 环境标签
    tags:
      environment: ${SPRING_PROFILES_ACTIVE:local}
      region: us-east-1
      cluster: prod-01
```

### 步骤5：MDC上下文配置（追踪支持）

**位置**: `services/auth-service/src/main/java/com/example/logging/RequestIdFilter.java`

```java
package com.example.logging;

import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;

/**
 * Request ID 追踪过滤器
 * 自动为每个请求生成唯一ID，便于分布式追踪
 */
@Component
@Order(1)
public class RequestIdFilter extends OncePerRequestFilter {
    
    public static final String REQUEST_ID_HEADER = "X-Request-ID";
    public static final String REQUEST_ID_MDC_KEY = "request_id";
    public static final String USER_ID_MDC_KEY = "user_id";
    public static final String SESSION_ID_MDC_KEY = "session_id";
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        try {
            // 生成或获取Request ID
            String requestId = request.getHeader(REQUEST_ID_HEADER);
            if (requestId == null || requestId.isEmpty()) {
                requestId = UUID.randomUUID().toString();
            }
            
            // 放入MDC上下文
            MDC.put(REQUEST_ID_MDC_KEY, requestId);
            MDC.put("timestamp", String.valueOf(System.currentTimeMillis()));
            MDC.put("method", request.getMethod());
            MDC.put("path", request.getRequestURI());
            
            // 从请求或Spring Security中提取用户信息
            String userId = extractUserId();
            if (userId != null) {
                MDC.put(USER_ID_MDC_KEY, userId);
            }
            
            // 添加到响应头，便于客户端追踪
            response.addHeader(REQUEST_ID_HEADER, requestId);
            
            filterChain.doFilter(request, response);
            
        } finally {
            // 清理MDC，防止内存泄漏
            MDC.clear();
        }
    }
    
    private String extractUserId() {
        // 从Spring Security Principal中提取
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetails) {
            return ((UserDetails) auth.getPrincipal()).getUsername();
        }
        return null;
    }
}
```

### 步骤6：在业务代码中使用结构化日志

**示例**: `services/auth-service/src/main/java/com/example/auth/AuthService.java`

```java
package com.example.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {
    
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    
    // ✅ 国际标准：结构化日志
    public boolean authenticate(String username, String password) {
        String requestId = MDC.get("request_id");
        long startTime = System.currentTimeMillis();
        
        try {
            // 业务逻辑
            validateCredentials(username, password);
            
            // 信息日志：关键业务事件
            Map<String, Object> logContext = new HashMap<>();
            logContext.put("event.action", "auth.login.success");
            logContext.put("user.id", username);
            logContext.put("duration_ms", System.currentTimeMillis() - startTime);
            logContext.put("request_id", requestId);
            
            log.info("User authentication successful", logContext);
            
            return true;
            
        } catch (InvalidCredentialsException e) {
            // 警告日志：异常但不是错误
            long duration = System.currentTimeMillis() - startTime;
            
            Map<String, Object> warningContext = new HashMap<>();
            warningContext.put("event.action", "auth.login.failed");
            warningContext.put("user.id", username);
            warningContext.put("error.reason", "invalid_credentials");
            warningContext.put("duration_ms", duration);
            warningContext.put("retry_count", getRetryCount(username));
            
            log.warn("Authentication failed: invalid credentials", warningContext);
            
            return false;
            
        } catch (Exception e) {
            // 错误日志：系统错误
            long duration = System.currentTimeMillis() - startTime;
            
            Map<String, Object> errorContext = new HashMap<>();
            errorContext.put("event.action", "auth.login.error");
            errorContext.put("user.id", username);
            errorContext.put("error.type", e.getClass().getSimpleName());
            errorContext.put("duration_ms", duration);
            errorContext.put("request_id", requestId);
            errorContext.put("severity", "critical");
            
            log.error("Authentication failed: system error", errorContext, e);
            
            throw new AuthenticationException("System error", e);
        }
    }
    
    // ✅ 性能监控：使用AOP记录所有方法调用
    @Around("execution(public * com.example.auth..*(..))")
    public Object monitorPerformance(ProceedingJoinPoint pjp) throws Throwable {
        String methodName = pjp.getSignature().getName();
        String className = pjp.getTarget().getClass().getSimpleName();
        long startTime = System.nanoTime();
        
        try {
            Object result = pjp.proceed();
            
            long duration = System.nanoTime() - startTime;
            long durationMs = duration / 1000000;
            
            // 记录性能数据
            if (durationMs > 100) {  // 超过100ms的操作
                Map<String, Object> perfContext = new HashMap<>();
                perfContext.put("event.action", className + "." + methodName);
                perfContext.put("event.duration", duration);  // 纳秒
                perfContext.put("duration_ms", durationMs);
                perfContext.put("performance.threshold_exceeded", true);
                perfContext.put("performance.type", "slow_operation");
                
                log.warn("Slow operation detected", perfContext);
            }
            
            return result;
            
        } catch (Throwable e) {
            Map<String, Object> errorContext = new HashMap<>();
            errorContext.put("event.action", className + "." + methodName);
            errorContext.put("event.duration", System.nanoTime() - startTime);
            errorContext.put("error.occurred", true);
            
            log.error("Method execution failed", errorContext, e);
            throw e;
        }
    }
}
```

---

## 📊 Phase 2: OpenTelemetry集成（可选但推荐）

### 依赖配置

**文件**: `services/pom.xml`

```xml
<dependencyManagement>
  <dependencies>
    <!-- OpenTelemetry BOM -->
    <dependency>
      <groupId>io.opentelemetry</groupId>
      <artifactId>opentelemetry-bom</artifactId>
      <version>1.32.0</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<!-- 在各服务pom.xml中添加 -->
<dependencies>
  <!-- OpenTelemetry API -->
  <dependency>
    <groupId>io.opentelemetry</groupId>
    <artifactId>opentelemetry-api</artifactId>
  </dependency>
  
  <!-- Spring Boot Auto-configuration -->
  <dependency>
    <groupId>io.opentelemetry.instrumentation</groupId>
    <artifactId>opentelemetry-instrumentation-spring-boot-autoconfigure</artifactId>
    <version>1.32.0</version>
  </dependency>
  
  <!-- OTLP导出器 (用于Jaeger) -->
  <dependency>
    <groupId>io.opentelemetry.exporter</groupId>
    <artifactId>opentelemetry-exporter-otlp</artifactId>
  </dependency>
</dependencies>
```

### 应用配置

**文件**: `application.yml`

```yaml
otel:
  exporter:
    otlp:
      endpoint: http://jaeger-collector:4317
  
  traces:
    exporter: otlp
    sampler:
      type: traceidratio
      arg: "0.1"   # 10%采样
  
  metrics:
    exporter: otlp
    export:
      interval: 60000
  
spring:
  application:
    name: auth-service
```

---

## ✅ 验证清单

### Phase 1检查
- [ ] PII脱敏工具已部署
- [ ] logback-spring.xml已更新为国际标准
- [ ] RequestIdFilter已添加到auth-service
- [ ] MDC追踪上下文已配置
- [ ] 业务代码已使用结构化日志
- [ ] JSON格式输出已启用
- [ ] AsyncAppender已配置
- [ ] 敏感日志已分离存储

### Phase 2检查（可选）
- [ ] OpenTelemetry依赖已添加
- [ ] Jaeger已部署在docker-compose中
- [ ] OTLP端点已配置
- [ ] 自动Span创建已验证
- [ ] 分布式追踪已在Jaeger UI可见

---

## 🧪 快速验证测试

### 1. 查看JSON格式日志

```bash
# 查看实时日志（格式化JSON）
tail -f logs/auth-service.log | jq '.'

# 统计不同级别日志数量
cat logs/auth-service.log | jq '.log.level' | sort | uniq -c
```

### 2. 验证脱敏功能

```bash
# 查找敏感日志（应该已脱敏）
grep -r "password\|token\|credit_card" logs/

# 应该看不到原始敏感信息
```

### 3. 验证MDC追踪

```bash
# 查看包含request_id的日志条目
cat logs/auth-service.log | jq 'select(.mdc.request_id != null)'

# 统计某个request_id的所有日志
cat logs/auth-service.log | jq 'select(.mdc.request_id == "specific-id")'
```

### 4. 验证异步性能

```bash
# 检查日志缓冲区
cat logs/auth-service.log | jq '.log' | wc -l
```

---

## 📈 成果指标

| 指标 | 目标 | 检验方式 |
|------|------|---------|
| JSON标准化覆盖率 | 100% | 检查所有日志输出结构 |
| PII脱敏覆盖率 | >95% | grep敏感词统计 |
| 追踪链路完整性 | 100% | Kibana request_id查询 |
| 日志输出延迟 | <5ms | 性能测试 |
| 错误捕获率 | 100% | 错误日志数据统计 |

---

## 🎓 最佳实践总结

### ✅ 做什么
1. **始终使用结构化日志** - JSON格式，ECS标准
2. **自动脱敏敏感信息** - 符合GDPR/CCPA
3. **记录关键业务事件** - 便于审计和追踪
4. **使用MDC追踪请求** - 便于分布式追踪
5. **异步输出日志** - 不影响应用性能
6. **分离关键日志** - ERROR和SENSITIVE日志单独存储

### ❌ 不做什么
1. ❌ 在日志中包含明文密码、token、API密钥
2. ❌ 记录大对象的toString()结果
3. ❌ 在循环中频繁记录（使用采样）
4. ❌ 同步日志输出（使用AsyncAppender）
5. ❌ 忽略异常堆栈（始终传入Exception对象）
6. ❌ 不记录关键业务操作（支付、认证等）

---

## 📚 参考资源

### 标准文档
- [ECS Schema](https://www.elastic.co/guide/en/ecs/current/)
- [OpenTelemetry规范](https://opentelemetry.io/)
- [GDPR数据保护](https://gdpr-info.eu/)

### Google SRE最佳实践
- Structured Logging in Production
- SLO-driven Monitoring
- Cost Optimization in Logging

### Netflix工程博客
- Distributed Tracing at Scale
- Logging in Microservices

---

**维护者**: DevOps Team  
**最后更新**: 2026-02-05  
**下次审查**: 2026-05-05
