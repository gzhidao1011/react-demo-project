# 微服务日志管理系统配置指南

## 概述
本项目实现了统一的企业级日志管理系统，支持多环境日志采集、统一格式（JSON）输出和可视化查询。

### 架构
```
┌─────────────────────────────────────┐
│     微服务应用                        │
│  (logback-spring.xml configured)    │
└──────────────┬──────────────────────┘
               │
               ├─ 开发环境: 本地JSON文件
               │
               └─ 生产环境: JSON + TCP至Logstash
                           │
                           v
                    ┌─────────────┐
                    │  Logstash   │  日志处理与增强
                    └──────┬──────┘
                           │
                           v
                    ┌─────────────┐
                    │ Elasticsearch│  日志存储与索引
                    └──────┬──────┘
                           │
                           v
                    ┌─────────────┐
                    │  Kibana     │  可视化查询
                    └─────────────┘
```

## 配置文件清单

### 1. logback-spring.xml（所有服务）
**位置**: `services/{service-name}/src/main/resources/logback-spring.xml`

**特性**:
- ✓ 环境感知配置（local/dev/docker/prod）
- ✓ JSON格式标准化输出
- ✓ 日志滚动策略（按大小和时间）
- ✓ 自动归档（30天保留）
- ✓ TCP连接到Logstash（生产环境）

**包含的appenders**:
- `CONSOLE`: 开发用控制台输出
- `FILE_JSON`: 本地JSON文件持久化（100MB/文件）
- `LOGSTASH_TCP`: TCP流式发送至Logstash:5000

### 2. application.yml / application-docker.yml
**配置示例**:
```yaml
spring:
  application:
    name: {service-name}
  datasource:
    hikari:
      maximum-pool-size: 10
  redis:
    host: redis
    port: 6379

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
```

### 3. pom.xml 依赖

**所有服务已添加的依赖**:
```xml
<!-- Logstash Logback Encoder（JSON 日志输出） -->
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
</dependency>
```

**版本**: 7.4（由根pom.xml统一管理）

## 环境配置

### 开发环境 (local/dev)
```
日志输出:
├─ 控制台 (DEBUG级别)
└─ 本地文件: logs/{service-name}.log (滚动JSON格式)

日志级别:
- Root: DEBUG
- org.springframework: INFO
- 应用代码: DEBUG
```

### 生产环境 (docker/prod)
```
日志输出:
├─ 本地文件: logs/{service-name}.log (JSON格式)
└─ Logstash TCP: logstash:5000 (异步发送)

日志级别:
- Root: INFO
- org.springframework: WARN
- org.apache.dubbo: WARN

流量控制:
- TCP队列: 512条消息
- 重连延迟: 10秒
```

## JSON日志格式示例

```json
{
  "@timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "logger_name": "com.example.chat.service.ChatService",
  "message": "Chat session created",
  "thread_name": "http-nio-8086-exec-1",
  "application": "chat-service",
  "environment": "docker",
  "version": "1.0.0",
  "hostname": "chat-service-pod-123",
  "stack_trace": null,
  "mdc": {
    "user_id": "user-123",
    "request_id": "req-abc-456"
  }
}
```

## Docker Compose 集成

### Logstash 服务配置（docker-compose.yml中添加）
```yaml
logstash:
  image: docker.elastic.co/logstash/logstash:8.10.0
  ports:
    - "5000:5000/tcp"
  environment:
    - "discovery.type=single-node"
  volumes:
    - ./docker/logstash/pipeline:/usr/share/logstash/pipeline
  depends_on:
    - elasticsearch

elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
  environment:
    - xpack.security.enabled=false
    - discovery.type=single-node
  ports:
    - "9200:9200"
  volumes:
    - elasticsearch_data:/usr/share/elasticsearch/data

kibana:
  image: docker.elastic.co/kibana/kibana:8.10.0
  ports:
    - "5601:5601"
  environment:
    - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
  depends_on:
    - elasticsearch
```

### Logstash Pipeline 配置（docker/logstash/pipeline/logstash.conf）
```conf
input {
  tcp {
    port => 5000
    codec => json
  }
}

filter {
  # 添加额外的处理逻辑
  mutate {
    add_field => { 
      "[@metadata][index_name]" => "%{application}-%{+YYYY.MM.dd}" 
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index_name]}"
  }
}
```

## 微服务日志配置清单

| 服务 | 状态 | logback-spring.xml | logstash依赖 | 配置文件 |
|------|------|-------------------|-------------|---------|
| api-gateway | ✓ | ✓ | ✓ | application-docker.yml |
| auth-service | ✓ | ✓ | ✓ | application-docker.yml |
| chat-service | ✓ | ✓ | ✓ | application-docker.yml |
| order-service | ✓ | ✓ | ✓ | application-docker.yml |
| user-service | ✓ | ✓ | ✓ | application-docker.yml |

## 日志查询示例（Kibana）

### 查询所有错误日志
```
level: "ERROR"
```

### 按服务查询
```
application: "chat-service" AND level: "WARN"
```

### 按时间范围查询
```
@timestamp: [2024-01-15T00:00:00 TO 2024-01-16T00:00:00]
```

### 追踪特定请求
```
mdc.request_id: "req-abc-456"
```

## 监控与告警

### Kibana告警规则示例
1. **错误率告警**: 5分钟内错误日志数 > 5
2. **响应时间告警**: 应用延迟 > 2000ms
3. **服务不可用告警**: 特定服务日志停止更新 > 5分钟

## 本地开发建议

### 1. 查看实时日志
```bash
# 查看特定服务日志
tail -f logs/chat-service.log | jq

# 查看JSON格式
tail -f logs/chat-service.log | jq '.message, .level'
```

### 2. 日志分析工具
```bash
# 统计错误数量
grep ERROR logs/*.log | wc -l

# 查找特定异常
grep "SQLException" logs/*.log
```

### 3. 集成IDE
- VS Code: 安装 "Logstash" 或 "Log File Highlighter" 插件
- JetBrains IDE: 原生支持日志查看和搜索

## 常见问题

### Q1: 本地开发时如何禁用Logstash TCP输出？
**A**: 使用`local`或`dev`profile，自动启用CONSOLE + FILE_JSON appenders

### Q2: 日志文件过大如何处理？
**A**: 已配置自动滚动，单文件100MB时自动创建新文件，30天自动删除旧文件

### Q3: 如何追踪分布式请求？
**A**: 在请求进入后立即生成request_id，添加到MDC（Mapped Diagnostic Context）
```java
MDC.put("request_id", UUID.randomUUID().toString());
// 业务逻辑
MDC.remove("request_id");  // cleanup
```

### Q4: 生产环境Logstash连接失败怎么办？
**A**: 
1. TCP连接会自动重试（10秒延迟）
2. 消息会在本地队列缓存（512条）
3. 缓存满后丢弃新消息（可配置）
4. 本地JSON文件始终可用作备份

## 升级计划

### Phase 2: 扩展功能
- [ ] 集成Jaeger追踪链路
- [ ] 添加APM性能监控
- [ ] 自定义Kibana仪表板
- [ ] 日志异常自动告警

### Phase 3: 优化
- [ ] 日志采样策略（高流量环境）
- [ ] 敏感信息过滤
- [ ] 日志压缩存储
- [ ] 成本优化分析

---
**最后更新**: 2024-01-15
**维护者**: 开发团队
