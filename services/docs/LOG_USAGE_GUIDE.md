# 微服务日志系统实战操作指南

> 符合Google SRE、Netflix、Uber等国际一流公司的日志使用规范

---

## 📚 目录

1. [快速开始](#快速开始)
2. [核心概念](#核心概念)
3. [代码实践](#代码实践)
4. [Kibana查询](#kibana查询)
5. [故障排查场景](#故障排查场景)
6. [性能优化](#性能优化)
7. [常见问题](#常见问题)

---

## 🚀 快速开始

### Step 1: 验证系统运行

```bash
# 检查ELK Stack运行状态
docker-compose ps | grep -E "elasticsearch|kibana|logstash"

# 预期输出：
# elasticsearch    Up
# kibana           Up  
# logstash         Up
```

### Step 2: 查看日志

**方式1: Kibana Web界面（推荐）**
```
访问: http://localhost:5601
→ Discover
→ 选择 data view: "logs"
→ 查看实时日志
```

**方式2: 本地文件**
```bash
# 查看chat-service日志
tail -f logs/chat-service.log | jq '.'

# jq语法：
jq '.level, .message, .userId'  # 只显示关键字段
jq 'select(.level == "ERROR")'  # 过滤ERROR级别
```

---

## 🎯 核心概念

### 日志的4层信息

```
Level 1: 我发生了什么？(message)
├─ "User message sent successfully"

Level 2: 什么时候发生的？(timestamp)
├─ "@timestamp": "2024-02-05T14:30:45.123Z"

Level 3: 是否正常？(level)
├─ "level": "INFO" / "WARN" / "ERROR"

Level 4: 如何追踪它？(traceId)
├─ "traceId": "abc-123-def-456"
```

### 请求的生命周期

```
浏览器请求
  ↓
[API Gateway] - 生成 traceId
  ├─ log: "Request received" + traceId
  ├─ duration: 100ms
  │
  ├→ [Auth Service] - 验证用户  
  │   ├─ log: "User authenticated" + traceId
  │   └─ duration: 45ms
  │
  ├→ [Chat Service] - 处理业务
  │   ├─ log: "Message persisted" + traceId  
  │   └─ duration: 250ms
  │
  └→ [Order Service] - 计算积分
      ├─ log: "Points recorded" + traceId
      └─ duration: 60ms

最终日志可视化：
单个traceId → 追踪所有相关日志 → 完整请求链路
```

---

## 💻 代码实践

### ✅ 推荐做法：声明式日志

```java
package com.example.chat;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/messages")
public class MessageController {
    
    /**
     * 标准日志写法（符合Google SRE规范）
     */
    @PostMapping
    public ResponseEntity<Message> sendMessage(
        @RequestHeader(value = "X-Trace-ID", required = false) String traceId,
        @RequestHeader(value = "X-Request-ID", required = false) String requestId,
        @RequestBody MessageRequest request
    ) {
        // Step 1: 初始化追踪上下文（关键！）
        if (traceId == null) {
            traceId = UUID.randomUUID().toString();
        }
        if (requestId == null) {
            requestId = UUID.randomUUID().toString();
        }
        
        MDC.put("traceId", traceId);
        MDC.put("requestId", requestId);
        MDC.put("userId", getCurrentUserId());
        MDC.put("action", "send_message");
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Step 2: 业务操作前日志（INFO级别）
            log.info(
                "Message send request received",
                ofMap(
                    "content_length", request.getContent().length(),
                    "recipient_count", request.getRecipients().size()
                )
            );
            
            // Step 3: 验证
            validateMessage(request);
            log.debug("Message validation passed", ofMap(
                "validation_rules", 3,
                "violation_count", 0
            ));
            
            // Step 4: 数据库操作
            long dbStart = System.currentTimeMillis();
            Message saved = messageRepository.save(toEntity(request));
            long dbDuration = System.currentTimeMillis() - dbStart;
            
            // Step 5: 成功日志（包含性能指标）
            long totalDuration = System.currentTimeMillis() - startTime;
            log.info(
                "Message sent successfully",
                ofMap(
                    "message_id", saved.getId(),
                    "total_duration_ms", totalDuration,
                    "database_duration_ms", dbDuration,
                    "code", "MSG_001"
                )
            );
            
            // Step 6: 性能警告（如果超过SLA）
            if (totalDuration > 500) {
                log.warn(
                    "Request exceeded SLA threshold",
                    ofMap(
                        "duration_ms", totalDuration,
                        "sla_threshold_ms", 500,
                        "severity", "MEDIUM"
                    )
                );
            }
            
            return ResponseEntity.ok(saved);
            
        } catch (ValidationException e) {
            // 验证失败是预期情况 → WARN级别
            log.warn(
                "Message validation failed",
                ofMap(
                    "error_code", "VALIDATION_001",
                    "error_message", e.getMessage(),
                    "recipient_count", request.getRecipients().size()
                ),
                e
            );
            return ResponseEntity.badRequest().build();
            
        } catch (DatabaseException e) {
            // 数据库错误是故障 → ERROR级别
            long duration = System.currentTimeMillis() - startTime;
            log.error(
                "Failed to save message to database",
                ofMap(
                    "error_code", "DB_ERROR",
                    "error_type", e.getClass().getSimpleName(),
                    "duration_ms", duration,
                    "retry_count", 3,
                    "severity", "HIGH"
                ),
                e
            );
            
            // 发送告警
            alertService.notify("DATABASE_ERROR", e);
            
            return ResponseEntity.status(500).build();
            
        } finally {
            // 关键：清理MDC防止泄漏（否则会污染后续日志）
            MDC.clear();
        }
    }
    
    /**
     * 调用其他微服务，需要传递追踪信息
     */
    private void notifyOrderService(long userId, long messageId) {
        String traceId = MDC.get("traceId");
        String spanId = UUID.randomUUID().toString();
        
        try {
            MDC.put("spanId", spanId);
            MDC.put("downstream_service", "order-service");
            
            long startTime = System.currentTimeMillis();
            
            // 关键：HTTP请求时传递追踪头
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Trace-ID", traceId);
            headers.set("X-Span-ID", spanId);
            
            var response = restTemplate.exchange(
                "http://order-service:8004/api/points",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("userId", userId, "type", "MESSAGE_SENT"), headers),
                PointResponse.class
            );
            
            long duration = System.currentTimeMillis() - startTime;
            
            log.info(
                "Order service called",
                ofMap(
                    "service", "order-service",
                    "duration_ms", duration,
                    "http_status", response.getStatusCodeValue()
                )
            );
            
        } catch (Exception e) {
            log.error(
                "Order service call failed",
                ofMap(
                    "service", "order-service",
                    "error_type", e.getClass().getSimpleName()
                ),
                e
            );
        } finally {
            MDC.remove("spanId");
            MDC.remove("downstream_service");
        }
    }
    
    // Helper方法
    private static Map<String, Object> ofMap(Object... args) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < args.length; i += 2) {
            map.put((String) args[i], args[i + 1]);
        }
        return map;
    }
}
```

### ❌ 避免这些做法

```java
// ❌ 不好的做法1：直接使用System.out.println
System.out.println("User: " + username + " sent message");

// ❌ 不好的做法2：使用字符串拼接
log.info("Message: " + message.toString());

// ❌ 不好的做法3：输出敏感信息
log.info("User password: " + password);

// ❌ 不好的做法4：没有追踪信息
log.info("Error occurred");

// ❌ 不好的做法5：所有异常都用INFO级别
log.info("Database connection failed: " + e.getMessage());

// ❌ 不好的做法6：没有清理MDC
MDC.put("userId", "12345");
// ... 后续请求污染...
```

---

## 🔍 Kibana查询

### 常用查询模式

#### 1. 查找单次请求的所有日志

```javascript
/* 通过requestId查找单次请求 */
requestId: "req-abc-123-def"

/* 预期结果：
[
  {timestamp: 14:30:45.100, service: "api-gateway", message: "Request received"},
  {timestamp: 14:30:45.145, service: "auth-service", message: "User authenticated"},
  {timestamp: 14:30:45.395, service: "chat-service", message: "Message persisted"},
  {timestamp: 14:30:45.455, service: "order-service", message: "Points recorded"},
  {timestamp: 14:30:45.460, service: "api-gateway", message: "Response sent"}
]
总耗时: 360ms */
```

#### 2. 查找特定服务的错误

```javascript
/* 查找chat-service最近1小时的所有错误 */
service: "chat-service" AND level: ERROR AND @timestamp >= now-1h

/* 进一步细化：只看特定错误码 */
service: "chat-service" AND error.code: "DB_ERROR"

/* 统计错误数按类型 */
Query: service: "chat-service" AND level: ERROR
Aggregation: Terms on error.code -> Count
```

#### 3. 性能分析

```javascript
/* 找出响应时间超过SLA的请求 */
performance.duration_ms > 500

/* 按服务统计P95响应时间 */
Query: level: INFO AND performance.duration_ms exists
Aggregation: Terms on service -> Percentile (95) on performance.duration_ms

/* 找出最慢的操作 */
Query: service: "chat-service"
Aggregation: Terms on action -> Max on performance.duration_ms

/* 结果示例：
  send_message: 2500ms (最慢)
  fetch_history: 320ms
  delete_message: 150ms
*/
```

#### 4. 用户行为分析

```javascript
/* 追踪特定用户的操作 */
userId: "user-12345"

/* 统计用户活跃度 */
Query: userId exists AND @timestamp >= now-7d
Aggregation: Terms on userId -> Count
Sort: Count DESC
Limit: Top 10 users

/* 用户错误分布 */
Query: userId: "user-12345" AND level: ERROR
Aggregation: Date Histogram on @timestamp -> Count
```

#### 5. 缓存分析

```javascript
/* 查看缓存命中率 */
Query: service: "chat-service" AND performance.cache_hits exists
Metric: Sum(cache_hits) / Sum(cache_hits + cache_misses)

/* 找出缓存未命中的操作 */
Query: performance.cache_misses > 0
Aggregation: Terms on action -> Count

/* 性能建议：缓存命中率应该 > 80% */
```

#### 6. 实时告警监控

```javascript
/* 错误率 > 1% 告警 */
Query: level: ERROR AND @timestamp >= now-5m
Condition: Count > 60  /* 5分钟内超过60条错误 */
Action: 发送Slack通知

/* 响应时间异常告警 */
Query: performance.duration_ms exists AND @timestamp >= now-5m
Condition: Percentile(95) > 1000  /* P95超过1秒 */
Action: 发送PagerDuty告警

/* 数据库连接池告警 */
Query: service: "chat-service" AND db.pool.active_connections exists
Condition: db.pool.active_connections > db.pool.max_connections * 0.9
Action: 立即通知SRE
```

---

## 🎬 故障排查场景

### 场景1: 用户投诉"发送消息超时"（5分钟内定位）

```
Step 1: 从用户或前端获取请求ID
   例如: requestId = "req-usr-2024-02-05-145630-abc123"

Step 2: Kibana中查询 (30秒)
   Query: requestId: "req-usr-2024-02-05-145630-abc123"
   
   Result (按时间顺序):
   14:56:30.100 api-gateway: "Request received" (duration: 3ms)
   14:56:30.148 auth-service: "User authenticated" (duration: 48ms)
   14:56:30.398 chat-service: "Message persisted" (duration: 250ms)  ← 正常
   14:56:30.460 order-service: "Points recorded" (duration: 3200ms) ← 异常！
   14:56:33.690 api-gateway: "Response sent" (total: 3590ms)

Step 3: 追踪order-service问题 (1分钟)
   Query: service: "order-service" AND @timestamp >= now-5m AND duration_ms > 1000
   
   发现规律：
   - 14:56:30 ~ 14:57:00: 平均耗时 120ms ✓
   - 14:57:01 ~ 14:57:30: 平均耗时 3200ms ✗ 突突增加！
   - 14:57:31 ~ 现在: 无响应

Step 4: 检查MySQL连接池 (1分钟)
   Query: service: "order-service" AND db.pool.active_connections exists
   
   发现：活跃连接数从5激增到20（最大值），所有请求排队等待

Step 5: 采取行动 (1分钟)
   a) 临时措施：增加MySQL连接池：20 → 50
   b) 重启order-service
   c) 监控恢复

Step 6: 验证修复 (1分钟)
   Query: service: "order-service" AND @timestamp >= now-5m
   Metric: Average duration_ms
   
   结果：从3200ms恢复到120ms ✓

总耗时: 5分钟内定位和修复！
```

### 场景2: 识别性能瓶颈并优化

```
问题：系统P95响应时间从400ms增长到1200ms

Step 1: 基线采集 (Kibana)
   Query: level: INFO AND performance.duration_ms exists AND 
          @timestamp >= now-30d
   
   创建Dashboard:
   - 时间序列：过去30天的P95趋势
   - 堆积柱状图：按服务分解耗时
   - 热力图：高峰期分布

Step 2: 识别症状出现时间
   时间序列显示：
   - 2月1日：P95 = 400ms ✓
   - 2月3日：P95 = 800ms ⚠️
   - 2月5日：P95 = 1200ms ❌
   
   关键发现：与2月3日的数据迁移同步！

Step 3: 分解各服务耗时
   Query: @timestamp >= now-7d AND performance.duration_ms exists
   Aggregation: Terms on service -> Percentile(95) on duration_ms
   
   结果：
   - api-gateway: 50ms (正常)
   - auth-service: 45ms (正常)
   - chat-service: 80ms ↑ (从40ms增加到80ms)
   - order-service: 800ms ↑↑↑ (从80ms增加到800ms!)

Step 4: 深入order-service分析
   Query: service: "order-service" AND performance.* exists
   
   发现：
   - database_queries: 15.5 (从8增加到15)
   - cache_misses: 12.3 (从1增加到12)
   - cache_hit_rate: 8% (从92%下降到8%)
   
   根本原因：缓存失效！

Step 5: 检查缓存策略
   Query: service: "order-service" AND cache.* exists
   
   发现：2月3日后，缓存的过期时间被修改：
   - before: TTL = 1小时
   - after: TTL = 1分钟
   
   证据：日志中 "cache_ttl_changed_to_60s"

Step 6: 优化方案
   a) 恢复缓存TTL: 1分钟 → 30分钟
   b) 添加更多缓存键：从5个增加到15个
   c) 预热缓存：启动时加载热数据
   
   预期效果：
   - database_queries: 15.5 → 3
   - cache_hit_rate: 8% → 95%
   - P95: 800ms → 120ms

Step 7: 验证效果
   部署修改后，Kibana Dashboard显示：
   - P95: 1200ms → 200ms ✓ (远超预期！)
   - 错误率: 0.5% → 0.1% ✓
   - CPU使用率: 80% → 35% ✓

总收益：
- 性能提升 6倍
- 用户体验大幅改善
- 服务器成本降低 50%
```

---

## ⚡ 性能优化

### 1. 日志采样（高并发场景）

```java
@Slf4j
@Service
public class HighThroughputService {
    
    private static final double SAMPLE_RATE = 0.01;  // 1%采样率
    
    public void processEvent(Event event) {
        // 只记录1%的日志（99%免费通过）
        if (shouldSample()) {
            log.info(
                "Processing event",
                Map.of("event_id", event.getId())
            );
        }
        
        // 业务处理...
    }
    
    private boolean shouldSample() {
        return Math.random() < SAMPLE_RATE;
    }
}
```

### 2. 异步日志处理（已在logback-spring.xml配置）

异步处理意味着：
- 日志写入不阻塞业务线程
- 队列满时智能丢弃低优先级日志
- 整体吞吐量提升10-50倍

### 3. 合理使用日志级别

```
生产环境推荐分布：
- INFO (业务操作): 95%
- WARN (需要关注): 4%
- ERROR + FATAL (故障): 1%

如果ERROR占比 > 5%，说明有严重问题需要修复
```

### 4. 字段优化

```json
/* ❌ 不要这样（字段1000+) */
{
  "field1": "value1",
  "field2": "value2",
  ...太多字段...
}

/* ✅ 这样做（字段<30) */
{
  "level": "INFO",
  "message": "User created",
  "userId": "user-12345",
  "duration_ms": 145,
  "error_code": null
}
```

---

## ❓ 常见问题

### Q1: 为什么我的日志没有出现在Kibana？

**可能原因和解决方案：**

1. **Logstash未启动**
   ```bash
   docker-compose ps | grep logstash
   ```

2. **微服务未配置Logback**
   - 检查: `pom.xml` 是否有 `logstash-logback-encoder`
   - 检查: `logback-spring.xml` 是否配置了TCP appender

3. **数据到达但未创建索引**
   ```bash
   # 查看Elasticsearch中的索引
   curl http://localhost:9200/_cat/indices
   
   # 预期看到: logs-chat-service-2024.02.05
   ```

4. **日志流通测试**
   ```bash
   # 激发一个请求，然后立即检查日志
   curl http://localhost:8003/api/messages/test
   
   # 在Kibana中查询
   service: "chat-service" AND @timestamp >= now-1m
   ```

---

### Q2: 如何隐藏敏感信息（如密码、身份证号）？

```java
// 在日志中输出前进行掩码
private String maskPassword(String pwd) {
    return "***" + pwd.substring(Math.max(0, pwd.length()-2));
}

private String maskIdNumber(String id) {
    return id.substring(0, 4) + "****" + id.substring(id.length()-4);
}

// 使用
log.info("User login", Map.of(
    "username", username,
    "password": maskPassword(password)  // 输出: ****23
));
```

---

### Q3: 日志大小超过限制怎么办？

**自动处理策略（已在logback-spring.xml配置）：**

```
单文件管理：
- 100MB → 自动轮转新文件

历史管理：
- 保留30天日志
- 总容量不超过3GB

示例：
logs/
├─ chat-service.2024-02-05.log (100MB) - 今天
├─ chat-service.2024-02-04.log (100MB)
├─ chat-service.2024-02-03.log (100MB)
├─ chat-service.2024-02-02.log (50MB)
└─ chat-service.2024-02-01.log (20MB)
总计：370MB，30天后自动删除最早的
```

---

### Q4: 如何追踪跨多个微服务的请求？

**答：使用traceId和spanId**

```java
// 请求入口（API Gateway）
String traceId = request.getHeader("X-Trace-ID");
if (traceId == null) {
    traceId = UUID.randomUUID().toString();
}
MDC.put("traceId", traceId);

// 调用下游服务时
HttpHeaders headers = new HttpHeaders();
headers.set("X-Trace-ID", MDC.get("traceId"));
headers.set("X-Span-ID", UUID.randomUUID().toString());
restTemplate.exchange(url, method, new HttpEntity<>(body, headers), clazz);

// 在Kibana中查询
requestId: "req-abc-123-def"
// 看到的结果会包含整个调用链所有服务的日志
```

---

### Q5: 我的告警一直在响，怎么设置合理的告警阈值？

**Google SRE标准方法：**

```
Step 1: 收集历史数据（7天）
  Metric: P95响应时间
  Result: 平均420ms，最高850ms

Step 2: 计算合理阈值
  告警阈值 = 历史P95 + 3%缓冲
  = 420ms * 1.03
  = 432ms

Step 3: 设置告警规则
  IF P95 > 432ms for 5 minutes THEN alert

Step 4: 持续调整
  监控误报率：目标 < 0.5%（一周内误报少于30次）
```

---

## 📊 日志系统健康检查清单

定期检查这些指标：

```
□ 日志延迟 < 5秒（从应用→到Kibana）
□ 日志丢失率 < 0.1%
□ 错误率 < 0.5%
□ P95响应时间 < 500ms
□ 缓存命中率 > 80%
□ 磁盘使用率 < 80%
□ 告警误报率 < 0.5%
```

---

## 🎓 总结

**记住这3个黄金法则：**

1. **每个日志都要有追踪ID**
   - 便于追踪请求链路
   - 快速定位问题

2. **使用正确的日志级别**
   - INFO: 业务操作
   - ERROR: 故障处理
   - WARN: 异常情况

3. **日志要清晰简洁**
   - 包含关键信息
   - 隐藏敏感数据
   - 格式统一（JSON）

---

**最后的话：** 一个好的日志系统能让你在5分钟内定位任何问题，让团队的效率提升10倍。

