# 🚀 微服务日志系统：快速参考卡

## 一句话总结

**三行命令启动 → 一个界面查询 → 一套标准规范 → 企业级可观测性**

```bash
docker-compose up -d elasticsearch logstash kibana  # 基础设施
docker-compose up -d api-gateway auth-service ...   # 微服务
open http://localhost:5601                           # 查看日志
```

---

## 核心概念 (30秒速查)

### 什么是可观测性三柱？

| 柱子 | 用途 | 工具 | 查询入口 |
|-----|------|------|---------|
| 📋 **Logs** | 详细事件记录 | ELK + Logback | `Kibana > Discover` |
| 🔗 **Traces** | 链路追踪 | Skywalking | `http://localhost:8899` |
| 📊 **Metrics** | 性能指标 | Prometheus | `http://localhost:9090` |

### 国际标准 vs 国内常见

| 国际标准 | 国内常见 |
|--------|--------|
| ✅ OpenTelemetry | Skywalking |
| ✅ W3C Trace Context | 自定义头部 |
| ✅ Structured Logging | 文本日志 |
| ✅ OTEL Collector | 直连ELK |

---

## 快速操作 (按用例)

### 1️⃣ 查找用户 "user-123" 的所有日志

```
Kibana > Discover > 搜索栏输入:
context.user_id: "user-123"
```

### 2️⃣ 追踪请求 "req-abc-456" 跨越的所有微服务

```
Kibana > Discover > 搜索栏输入:
context.request_id: "req-abc-456"
```

### 3️⃣ 找出过去1小时的所有ERROR日志

```
Kibana > Discover > 搜索栏输入:
level: ERROR
时间范围: 最近1小时
```

### 4️⃣ 某个API的平均响应时间

```
Kibana > Visualize > Line Chart > 
X: @timestamp (按5分钟分组)
Y: avg(attributes.duration_ms)
Filter: attributes.http.url: "/api/orders"
```

### 5️⃣ 配置错误告警（Slack通知）

```
Kibana > Stack Management > Rules & Connectors >
Create Rule > Log threshold >
Condition: level is ERROR AND service_name is auth-service
Trigger: Count > 5 in 5 minutes
Action: Send to Slack
```

---

## 日志格式速查表

### JSON日志字段含义

```json
{
  "timestamp": "ISO8601时间",
  "level": "ERROR|WARN|INFO|DEBUG",
  "service_name": "应用标识",
  "message": "可读描述",
  
  "trace": {
    "trace_id": "⭐ 完整请求链路ID",
    "span_id": "单次调用ID"
  },
  
  "context": {
    "user_id": "👤 用户标识",
    "request_id": "📝 请求ID",
    "correlation_id": "🔗 事务関联ID"
  },
  
  "attributes": {
    "http.method": "POST|GET",
    "http.status_code": 200|401|500,
    "duration_ms": 45
  }
}
```

### 日志级别使用规范

| 级别 | 何时使用 | 示例 |
|-----|---------|------|
| **ERROR** | 严重错误，需要立即处理 | 数据库连接失败、业务逻辑错误 |
| **WARN** | 可能的问题，需要关注 | 重试机制触发、性能降级 |
| **INFO** | 重要商业事件 | 用户登录、订单创建、配置变更 |
| **DEBUG** | 开发调试（生产不启用） | 方法参数、中间结果 |

---

## Kibana查询速查表

### KQL (Kibana Query Language)

```
# 基本操作
field: value                    # 等于
field: [start TO end]          # 范围
NOT field: value               # 否定
field: * OR other: *           # OR条件

# 常见场景
level: ERROR                   # 查ERROR日志
level: ERROR AND service_name: auth-service  # 多条件AND
message: "Failed"              # 文本搜索
duration_ms >= 1000            # 数值比较
@timestamp: "2026-02-05"       # 日期过滤

# 复杂查询
(level: ERROR OR level: WARN) AND 
service_name: (auth-service OR user-service) AND
@timestamp >= "2026-02-05T10:00:00Z"
```

### 聚合分析

```
| stats 语法：
| stats count() as total by service_name
| stats avg(duration_ms) as avg_time by attributes.http.url
| stats count() as error_count by level | sort error_count desc

# 例：按服务统计错误数
level: ERROR | stats count() as error_count by service_name
```

---

## Docker命令速查

### 日志查看

```bash
# 查看容器日志
docker logs elasticsearch          # 最近日志
docker logs -f logstash           # 实时日志
docker logs --tail 50 kibana      # 最后50行

# 进入容器
docker exec -it elasticsearch bash
curl http://localhost:9200/_cat/indices  # 查看索引

# 重启服务
docker-compose restart logstash
docker-compose up -d --force-recreate elasticsearch
```

### 数据管理

```bash
# 查看Elasticsearch状态
curl http://localhost:9200/_cluster/health | jq '.'

# 删除过期索引
curl -X DELETE "http://localhost:9200/logs-2026-01-*"

# 导出日志数据
curl -X GET "http://localhost:9200/logs-*/_search?size=10000" | jq '.' > logs.json
```

---

## 故障排查速查表

| 问题 | 检查命令 | 解决方案 |
|-----|---------|--------|
| Logstash无连接 | `docker logs logstash` | 检查host.docker.internal改为elasticsearch |
| Kibana无数据 | `curl http://localhost:9200/_cat/indices` | 等待应用发送日志或手动创建index |
| 应用无法连Logstash | `docker exec app ss -tlnp \| grep 5000` | 检查Logstash是否监听5000端口 |
| 查询响应慢 | `curl http://localhost:9200/_cat/shards?v` | 检查索引大小，考虑分片策略 |
| Skywalking无链路 | `docker logs app \| grep skywalking` | 验证-javaagent参数和jar文件存在 |

---

## 生产部署检查清单 ✅

在上线前确认：

```
日志配置:
  ☐ 所有服务输出JSON格式
  ☐ trace_id/request_id正确传播
  ☐ 敏感数据已脱敏
  
存储管理:
  ☐ Elasticsearch ILM策略已配置
  ☐ 保留期设置合理（90天以上）
  ☐ 备份策略已实施
  
告警监控:
  ☐ ERROR级别告警已配置
  ☐ 性能基线告警已配置
  ☐ 通知渠道测试通过
  
安全审计:
  ☐ RBAC访问控制已启用
  ☐ 敏感操作永久保留
  ☐ 审计日志定期备份
```

---

## 文档导航 🗺️

| 文档 | 适合场景 | 位置 |
|-----|---------|------|
| **用户指南** | 日常使用、故障排查 | `LOGGING_SYSTEM_USER_GUIDE.md` |
| **管理指南** | 配置说明、最佳实践 | `LOG_MANAGEMENT_GUIDE.md` |
| **部署指南** | DevOps部署、性能调优 | `LOG_DEPLOYMENT_GUIDE.md` |
| **国际标准** | 技术选型、架构理解 | `BEST_PRACTICES_INTERNATIONAL_STANDARDS.md` |
| **实现总结** | 项目完成度、覆盖范围 | `LOG_SYSTEM_IMPLEMENTATION_SUMMARY.md` |

---

## 常见快捷键 ⌨️

| 快捷键 | 功能 | 位置 |
|--------|------|------|
| Ctrl+H | 打开帮助 | Kibana首页 |
| Ctrl+K | 快速搜索 | Kibana导航 |
| T | 切换时间范围 | Discover页面 |
| R | 刷新 | 任何查询页面 |
| → / ← | 上/下一条日志 | 日志详情查看 |

---

## 关键指标速查 📊

### SLA标准（来自Google SRE）

| 指标 | 目标值 | 预警值 |
|-----|--------|--------|
| 应用可用性 | 99.9% | < 99.5% |
| 平均响应时间 | < 200ms | > 500ms |
| ERROR日志数 | < 10/min | > 50/min |
| 日志采集延迟 | < 1s | > 5s |

### Elasticsearch容量规划

```
日志量数据量：假设平均200B/条日志

生产环境容量算法：
== 每天日志数 * 平均日志大小 * 保留天数 * 副本数 * 1.5(磁盘开销)

示例：
== 1M日志/天 * 200B * 90天 * 1 * 1.5 = 27GB
推荐：100GB硬盘（留余量）
```

---

## 什么时候查Kibana？

```
事件发生 → 立即查询时间范围内of所有日志
             ↓
         按service_name筛选
             ↓
         按trace_id或request_id关联
             ↓
         检查错误堆栈和上下文
             ↓
         定位问题根因
```

---

**打印本页参考！** 📱

版本: 1.0 | 更新: 2026-02-05 | 维护: DevOps Team
