# 微服务日志系统 - 国际主流最佳实践指南

## 🌍 概述

本指南基于国外主流公司（Google、AWS、Netflix、Uber等）的日志系统最佳实践，帮助优化现有ELK Stack实现。

---

## 1️⃣ 结构化日志规范（Structured Logging）

### 推荐标准：ECS（Elastic Common Schema）

当前JSON格式应扩展为ECS兼容：

```json
{
  "@timestamp": "2024-02-05T10:30:45.123Z",
  
  // 核心字段
  "log.level": "INFO",
  "log.logger": "com.example.chat.ChatController",
  "message": "User message processed",
  
  // ECS标准字段
  "service": {
    "name": "chat-service",
    "version": "1.0.0",
    "environment": "production",
    "node": {
      "name": "pod-chat-service-42a5"
    }
  },
  
  // 主机信息
  "host": {
    "hostname": "chat-service-42a5",
    "ip": "10.0.1.5",
    "os": {
      "platform": "linux"
    }
  },
  
  // HTTP请求上下文
  "http": {
    "request": {
      "method": "POST",
      "body": {
        "bytes": 512
      }
    },
    "response": {
      "status_code": 200,
      "body": {
        "bytes": 1024
      }
    }
  },
  
  // 性能指标
  "event": {
    "duration": 145000000,  // 纳秒
    "action": "chat.message.send"
  },
  
  // 追踪信息（OpenTelemetry/Jaeger格式）
  "trace": {
    "id": "abc123def456",
    "span": {
      "id": "span-789"
    }
  },
  
  // 用户上下文
  "user": {
    "id": "user-123",
    "name": "john.doe"
  },
  
  // 自定义字段（业务相关）
  "custom": {
    "request_id": "req-abc-456",
    "room_id": "room-xyz",
    "message_type": "text"
  },
  
  // 错误信息
  "error": {
    "type": "NullPointerException",
    "message": "User object is null",
    "stack_trace": "com.example.chat.ChatService.sendMessage(ChatService.java:45)..."
  }
}
```

### 实现方式

在 `logback-spring.xml` 中配置ECS兼容的JSON encoder：

```xml
<appender name="FILE_JSON">
  <file>logs/chat-service.log</file>
  <encoder class="net.logstash.logback.encoder.LogstashEncoder">
    <customFields>
      {
        "service.name": "chat-service",
        "service.version": "${project.version}",
        "service.environment": "${SPRING_PROFILES_ACTIVE:local}",
        "host.ip": "${HOSTNAME:unknown}"
      }
    </customFields>
    <!-- 包含MDC上下文 -->
    <includeContext>true</includeContext>
    <!-- 包含日志级别 -->
    <includeLevelName>true</includeLevelName>
    <!-- 包含线程名 -->
    <includeThreadName>true</includeThreadName>
  </encoder>
</appender>
```

---

## 2️⃣ 日志级别规范

### 国际标准日志级别定义

| 级别 | 用途 | 示例 |
|------|------|------|
| **ERROR** | 需要立即处理的错误 | 数据库连接失败、外部API异常 |
| **WARN** | 潜在问题、非预期情况 | 重试失败、性能下降、资源不足 |
| **INFO** | 关键业务事件 | 用户登录、订单创建、支付成功 |
| **DEBUG** | 开发调试信息 | 方法入参、中间变量、SQL执行 |
| **TRACE** | 详细追踪（仅本地） | 行级执行流、内层调用链 |

### 应用配置

```yaml
# applications.yml - 遵循国际规范
logging:
  level:
    root: INFO
    # 关键业务模块
    com.example.auth: INFO      # 认证：所有操作必须记录
    com.example.payment: INFO   # 支付：法规要求
    com.example.user: DEBUG     # 用户：开发阶段debug
    # 第三方库
    org.springframework: WARN    # Spring框架
    org.hibernate: WARN         # ORM警告
    org.apache.http: WARN       # HTTP客户端
```

### 代码规范

```java
// ✅ 好的做法
log.info("User login successful", 
    Map.of(
        "user_id", userId,
        "ip_address", ipAddress,
        "duration_ms", System.currentTimeMillis() - startTime
    ));

// ❌ 不好的做法
log.info("User: " + user + " logged in at " + new Date());

// ✅ 错误处理
try {
    processPayment(order);
} catch (PaymentException e) {
    log.error("Payment processing failed", 
        Map.of(
            "order_id", order.getId(),
            "error_code", e.getErrorCode(),
            "retry_count", retryCount
        ), 
        e);  // 在最后传入异常对象
}
```

---

## 3️⃣ 分布式追踪整合（OpenTelemetry）

### 推荐方案：OpenTelemetry + Jaeger

#### 添加依赖到 `services/pom.xml`

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
    
    <!-- OpenTelemetry Auto-instrumentation -->
    <dependency>
      <groupId>io.opentelemetry.javaagent</groupId>
      <artifactId>opentelemetry-javaagent</artifactId>
      <version>1.32.0</version>
      <scope>provided</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

#### 应用配置 `application.yml`

```yaml
otel:
  exporter:
    otlp:
      endpoint: http://jaeger-collector:4317  # gRPC endpoint
  metrics:
    exporter: otlp
  traces:
    exporter: otlp
  
spring:
  application:
    name: chat-service
```

#### 代码集成示例

```java
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.api.trace.Span;

@Component
public class ChatService {
    private static final Tracer tracer = 
        GlobalOpenTelemetry.getTracer("chat-service");
    
    public void sendMessage(String message, String userId) {
        // 自动创建Span
        try (Scope scope = tracer
            .spanBuilder("chat.message.send")
            .setAttribute("user.id", userId)
            .setAttribute("message.length", message.length())
            .startAndMakeCurrentScope()) {
            
            Span currentSpan = Span.current();
            currentSpan.setAttributes(Attributes.of(
                AttributeKey.stringKey("conversation.id"), conversationId,
                AttributeKey.longKey("timestamp"), System.currentTimeMillis()
            ));
            
            // 业务逻辑
            processMessage(message);
            
        } catch (Exception e) {
            Span.current()
                .recordException(e)
                .setStatus(StatusCode.ERROR, "Message processing failed");
            throw e;
        }
    }
}
```

#### Docker Compose 扩展

在 `docker-compose.yml` 添加Jaeger：

```yaml
jaeger-collector:
  image: jaegertracing/jaeger:latest
  environment:
    COLLECTOR_OTLP_ENABLED: "true"
  ports:
    - "4317:4317"    # gRPC receiver

jaeger-query:
  image: jaegertracing/jaeger:latest
  environment:
    COLLECTOR_URL: "http://jaeger-collector:14268"
  ports:
    - "16686:16686"  # UI端口
```

---

## 4️⃣ 日志采样策略（Cost Optimization）

### 国外大公司的做法

Google、Netflix等在高流量环境下使用的采样策略：

```yaml
# application.yml
logging:
  sampling:
    # 生产环境采样
    enabled: true
    default-rate: 0.1  # 记录10%的日志
    
    # 按级别采样
    rates:
      ERROR: 1.0         # 错误全部记录
      WARN: 0.5          # 警告50%采样
      INFO: 0.1          # 信息10%采样
      DEBUG: 0.01        # 调试1%采样
    
    # 按模块采样
    module-rates:
      com.example.payment: 1.0      # 支付模块全记录
      com.example.analytics: 0.01   # 分析模块1%采样
```

### 代码实现

```java
@Component
public class SamplingFilter extends OncePerRequestFilter {
    private final Random random = new Random();
    private final LogSamplingConfig config;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) {
        double samplingRate = config.getSamplingRate(request.getRequestURI());
        
        if (random.nextDouble() < samplingRate) {
            // 记录完整日志
            MDC.put("sampled", "true");
        } else {
            // 仅记录关键信息
            MDC.put("sampled", "false");
        }
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("sampled");
        }
    }
}
```

---

## 5️⃣ 安全性与合规（Security & Compliance）

### PII（个人身份信息）保护

```java
// 日志脱敏工具
public class SensitiveDataMasker {
    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    
    private static final Pattern PHONE_PATTERN = 
        Pattern.compile("\\d{3}[-.]?\\d{3}[-.]?\\d{4}");
    
    private static final Pattern SSN_PATTERN = 
        Pattern.compile("\\d{3}-\\d{2}-\\d{4}");
    
    public static String maskSensitiveData(String input) {
        return input
            .replaceAll(EMAIL_PATTERN.pattern(), "***@***.***")
            .replaceAll(PHONE_PATTERN.pattern(), "***-***-****")
            .replaceAll(SSN_PATTERN.pattern(), "***-**-****");
    }
}
```

### Logback配置集成

```xml
<appender name="FILE_JSON">
  <encoder class="net.logstash.logback.encoder.LogstashEncoder">
    <!-- 自定义字段脱敏 -->
    <jsonGeneratorDecorator>
      <class>com.example.logging.SensitiveDataDecorator</class>
    </jsonGeneratorDecorator>
  </encoder>
</appender>
```

### 敏感日志分离

```xml
<!-- 仅存储敏感日志到加密存储 -->
<appender name="SENSITIVE_LOGS">
  <file>logs/sensitive.log</file>
  <filter class="ch.qos.logback.core.filter.ThresholdFilter">
    <level>WARN</level>
  </filter>
  <filter class="com.example.logging.SensitiveDataFilter"/>
  <encoder class="net.logstash.logback.encoder.LogstashEncoder">
    <customFields>
      {
        "log.classification": "SENSITIVE"
      }
    </customFields>
  </encoder>
</appender>
```

---

## 6️⃣ 性能优化

### 异步日志输出（Async Appender）

```xml
<!-- 包装为异步appender -->
<appender name="ASYNC_FILE_JSON" class="ch.qos.logback.classic.AsyncAppender">
  <queueSize>512</queueSize>           <!-- 缓冲队列大小 -->
  <discardingThreshold>0</discardingThreshold>  <!-- 不丢弃日志 -->
  <appender-ref ref="FILE_JSON"/>
</appender>

<appender name="ASYNC_LOGSTASH" class="ch.qos.logback.classic.AsyncAppender">
  <queueSize>1024</queueSize>
  <appender-ref ref="LOGSTASH_TCP"/>
</appender>

<root level="INFO">
  <appender-ref ref="ASYNC_FILE_JSON"/>
  <appender-ref ref="ASYNC_LOGSTASH"/>
</root>
```

### 性能指标监控

```java
// 在关键业务操作中记录耗时
@Around("execution(public * com.example..*(..))") 
public Object monitorPerformance(ProceedingJoinPoint pjp) throws Throwable {
    String methodName = pjp.getSignature().getName();
    long startTime = System.currentTimeMillis();
    
    try {
        Object result = pjp.proceed();
        
        long duration = System.currentTimeMillis() - startTime;
        if (duration > 100) {  // 超过100ms的操作
            log.warn("Slow operation detected",
                Map.of(
                    "method", methodName,
                    "duration_ms", duration,
                    "threshold_ms", 100
                ));
        }
        
        return result;
    } catch (Exception e) {
        log.error("Operation failed",
            Map.of("method", methodName), e);
        throw e;
    }
}
```

---

## 7️⃣ 查询与可视化（Kibana最佳实践）

### 推荐仪表板

#### 1. 系统健康仪表板
```
指标：
- 每秒日志量 (EPS)
- 错误率趋势
- 各服务响应时间分布
- 异常堆栈排名
```

#### 2. 业务监控仪表板
```
指标：
- 用户操作转化漏斗
- 支付成功率
- API延迟分布
- 并发用户数
```

#### 3. 实时告警仪表板
```
触发条件：
- ERROR日志超过90p延迟
- 错误率 > 1%
- 响应时间 > 1s
```

### Kibana查询示例

```
# 查找特定用户的完整请求链路
user.id: "user-123" AND trace.id: *

# 性能问题诊断
event.duration > 5000000000  # > 5秒

# 错误堆栈聚合分析
error.type: * | stats count() by error.type

# 服务依赖关系
service.name: * AND event.action: *
```

---

## 8️⃣ 监控告警规则

### Elasticsearch告警（与Logstash集成）

```json
{
  "name": "High Error Rate Alert",
  "scheduleTrigger": {
    "interval": "1m"
  },
  "searchSource": {
    "query": {
      "bool": {
        "must": [
          {
            "range": {
              "@timestamp": {
                "gte": "now-5m"
              }
            }
          },
          {
            "match": {
              "log.level": "ERROR"
            }
          }
        ]
      }
    }
  },
  "trigger": {
    "threshold": 100,
    "thresholdComparator": "GREATER_THAN"
  },
  "actions": [
    {
      "type": "slack",
      "message": "Error rate exceeded 100 in last 5 minutes"
    }
  ]
}
```

---

## 9️⃣ 对接第三方平台

### Datadog/New Relic集成

#### 方式1：直接导出（推荐）
```xml
<!-- 添加依赖 -->
<dependency>
  <groupId>com.datadoghq</groupId>
  <artifactId>dd-java-agent</artifactId>
  <version>1.20.0</version>
</dependency>
```

#### Docker启动
```dockerfile
ENV DD_AGENT_HOST=datadog-agent
ENV DD_AGENT_PORT=8126
ENV DD_SERVICE=chat-service
ENV DD_ENV=production
ENV DD_VERSION=1.0.0

# 使用javaagent
ENTRYPOINT ["java", "-javaagent:./dd-java-agent.jar", "-jar", "app.jar"]
```

### Prometheus指标导出

```java
@Component
public class LogMetricsExporter {
    private final MeterRegistry meterRegistry;
    
    public LogMetricsExporter(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }
    
    public void recordLog(String level, String service) {
        Counter.builder("logs.total")
            .tag("level", level)
            .tag("service", service)
            .register(meterRegistry)
            .increment();
    }
}
```

---

## 🔟 文件组织最佳实践

### 日志文件命名规范

```
logs/
├── chat-service/
│   ├── chat-service-2024-02-05.log      # 按日期
│   ├── chat-service-2024-02-05.json     # JSON格式
│   ├── chat-service-ERROR-2024-02.log   # 错误日志
│   └── chat-service-SENSITIVE.log       # 敏感数据
├── user-service/
│   └── ...
└── archives/
    ├── 2024-01/
    └── 2024-02/
```

### 日志保留政策

```
开发环境：7天
测试环境：30天
生产环境：90天（冷存储）
合规日志：1年
```

---

## 总结对比

| 维度 | 当前状态 | 国际主流 | 改进建议 |
|------|---------|---------|---------|
| 日志格式 | JSON | ✅ ECS标准 | 扩展自定义字段 |
| 追踪支持 | MDC | OpenTelemetry | 集成Jaeger |
| 采样策略 | 全量记录 | 分级采样 | 实现成本优化 |
| 安全性 | 基础 | PII遮蔽 | 添加脱敏模块 |
| 性能 | 同步 | 异步处理 | AsyncAppender |
| 监控告警 | 基础 | 智能告警 | Elastic Rules |
| 多云集成 | ELK仅限 | 多平台支持 | 添加Datadog导出 |

---

## 📚 推荐资源

### 官方标准
- [Elastic Common Schema (ECS)](https://www.elastic.co/guide/en/ecs/current/index.html)
- [OpenTelemetry](https://opentelemetry.io/)
- [SLO最佳实践](https://cloud.google.com/architecture/devops-measurement-cre-blog)

### 参考文章
- CNCF日志白皮书
- Google SRE Book
- Netflix Hystrix日志架构

### 工具
- Kibana Canvas - 自定义可视化
- Elasticsearch Watcher - 告警
- Logstash Grok调试器

---

## ✅ 实施检查清单

- [ ] 扩展JSON格式为ECS标准
- [ ] 添加OpenTelemetry SDK
- [ ] 部署Jaeger追踪系统
- [ ] 实现日志采样策略
- [ ] 添加PII脱敏工具
- [ ] 配置AsyncAppender
- [ ] 创建业务监控仪表板
- [ ] 设置告警规则
- [ ] 对接Datadog/New Relic
- [ ] 文档日志规范

---

**上次更新**: 2026-02-05  
**维护者**: DevOps Team
