# 📖 微服务日志系统：实用操作指南

_符合国际标准，适用于日常开发和生产环境_

---

## 快速开始（5分钟）

### 步骤1：启动基础设施

```bash
cd e:\open-sources\react-demo-project

# 启动ELK Stack
docker-compose up -d elasticsearch logstash kibana

# 启动Skywalking（可选，用于链路追踪）
docker-compose up -d skywalking-oap skywalking-ui

# 启动所有微服务
docker-compose up -d api-gateway auth-service user-service order-service chat-service

# 验证状态
docker-compose ps
```

### 步骤2：验证日志系统

```bash
# 检查Elasticsearch是否运行
curl http://localhost:9200/_cat/indices

# 检查Kibana是否可访问
open http://localhost:5601

# 检查Logstash是否接收数据（查看日志）
docker logs logstash | tail -20
```

### 步骤3：访问Kibana仪表板

```
http://localhost:5601
```

**首次访问步骤**：
1. 左侧菜单 → **Stack Management**
2. **Index Management** → 查看 `logs-*` 索引是否存在
3. **Data Views** → 创建数据视图（如果未存在）
4. 左侧菜单 → **Discover** → 选择 `logs` 数据视图，查看日志

---

## 用户场景

### 场景1：查找特定用户的所有操作

**需求**：用户反馈某次操作异常，需要追踪该用户的所有关联操作

**步骤**：

```
1. Kibana首页 → Discover
2. 数据视图：选择 "logs"
3. 搜索栏输入：
   context.user_id: "user-123"
4. 时间范围：选择相关时间段
5. 排序：@timestamp 降序
6. 结果中可看到：
   - 用户的登录/登出事件
   - 所有API调用
   - 错误信息
```

**KQL查询示例**：
```
context.user_id: "user-123" AND @timestamp >= "2026-02-05T10:00:00Z"
```

---

### 场景2：追踪一个请求跨越所有微服务的完整链路

**需求**：用户发起一个复杂请求，涉及多个微服务，需要了解请求如何流转

**步骤**：

```
1. Kibana → Discover
2. 找到初始请求的日志（如api-gateway记录）
3. 复制该请求的 trace.trace_id 或 context.request_id
4. 搜索栏输入：
   trace.trace_id: "4bf92f3577b34da6a3ce929d0e0e4736"
5. 按 @timestamp 排序，看到请求在各个服务中的流转
```

**关键字段解读**：

```json
{
  "trace": {
    "trace_id": "4bf92f35...",        // 完整链路唯一标识
    "span_id": "00f067aa...",         // 本次调用唯一标识
    "trace_flags": "01"               // 是否采样（1=采样）
  },
  "context": {
    "request_id": "req-abc-456",      // 业务请求ID
    "correlation_id": "corr-xyz-789"  // 相关事务ID
  }
}
```

---

### 场景3：识别性能问题

**需求**：某个API响应变慢，需要找出瓶颈

**步骤**：

```
1. Kibana → Discover
2. 搜索条件：
   attributes.http.url: "/api/orders" AND 
   attributes.http.status_code: 200
3. 在右侧选择 duration_ms 列
4. 排序 duration_ms 降序
5. 查看最慢的请求详情
6. 对比正常请求的耗时分布
```

**深入分析（使用可视化）**：

```
1. Discover → Save as visualization
2. 选择 "Line chart" 或 "Area chart"
3. X轴：date_histogram(@timestamp) [按5分钟分组]
4. Y轴：avg(duration_ms) [平均响应时间]
5. 可以看到性能趋势图
```

---

### 场景4：实时监控错误

**需求**：需要第一时间发现应用错误，配置告警

**步骤**：

```
1. Kibana → Stack Management → Rules and Connectors
2. Create Rule → Log threshold
3. 配置条件：
   - Index: logs-*
   - Condition: level is ERROR
   - Group by: service_name
   - 阈值: count > 5 in last 5 minutes
4. Actions：
   - Connector: Slack（或钉钉）
   - Message: "{{service_name}} 发生错误: {{message}}"
5. Save and enable
```

**告警内容示例**：

```
[ERROR ALERT] auth-service
错误数: 12
时间: 2026-02-05 14:30:00
详情: Invalid token signature
处理: 立即查看 → [Kibana Link]
```

---

### 场景5：合规性审计

**需求**：审计所有用户登录操作，用于安全合规

**步骤**：

```
1. Kibana → Discover
2. 搜索条件：
   service_name: "auth-service" AND
   level: "INFO" AND
   message: ("User login" OR "User logout")
3. 导出数据：
   - 右上角 → Share → Generate CSV
4. 存档保存（支持长期保留）
```

**查询示例**：
```
service_name: "auth-service" AND 
level: "INFO" AND 
message: "User login successful" AND
@timestamp >= "2026-01-01T00:00:00Z" AND
@timestamp <= "2026-01-31T23:59:59Z"
```

---

## 开发环境最佳实践

### 1. 本地开发中查看日志

```bash
# 方式A：直接查看文件（不需要ELK）
tail -f logs/auth-service.log | jq '.'

# 方式B：通过Kibana查询（完整功能）
# 访问 http://localhost:5601 → Discover → logs
```

### 2. 在代码中添加结构化日志

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

@RestController
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        // 记录关键业务事件
        log.info("User login attempt",
            kv("username", req.getUsername()),
            kv("ip", getClientIp()),
            kv("timestamp", System.currentTimeMillis())
        );
        
        try {
            // 设置MDC用于追踪
            String requestId = UUID.randomUUID().toString();
            MDC.put("request_id", requestId);
            MDC.put("user_id", req.getUsername());
            
            // 业务逻辑...
            LoginResponse resp = authenticate(req);
            
            // 成功日志（ERROR/WARN/INFO级别）
            log.info("User login successful",
                kv("user_id", resp.getUserId()),
                kv("duration_ms", 45)
            );
            
            return resp;
        } catch (Exception e) {
            // 错误日志（ERROR级别）
            log.error("User login failed",
                kv("username", req.getUsername()),
                kv("error_type", e.getClass().getSimpleName()),
                kv("error_msg", e.getMessage())
            );
            throw e;
        } finally {
            // 清理MDC
            MDC.remove("request_id");
            MDC.remove("user_id");
        }
    }
}
```

**辅助工具类** (自定义):

```java
public class LogHelper {
    public static Object kv(String key, Object value) {
        return Map.of(key, value);
    }
}

// 使用
log.info("Event", kv("user_id", "123"), kv("action", "login"));
```

### 3. 日志采样配置

```xml
<!-- logback-spring.xml -->
<turboFilter class="ch.qos.logback.classic.turbo.MDCFilter">
    <!-- 只记录特定用户的DEBUG日志 -->
    <MDCKey>debug_user_id</MDCKey>
    <Value>admin</Value>
    <OnMatch>ACCEPT</OnMatch>
    <OnMismatch>NEUTRAL</OnMismatch>
</turboFilter>

<!-- 采样过滤器 -->
<turboFilter class="ch.qos.logback.classic.turbo.DynamicThrottlingFilter">
    <!-- 生产环境下采样90%的INFO及以下日志 -->
    <DefaultThreshold>INFO</DefaultThreshold>
    <DefaultMaxValuesPerSecond>100</DefaultMaxValuesPerSecond>
</turboFilter>
```

---

## 生产环境检查清单

在部署到生产前，确保以下项目已完成：

### 日志配置
- [ ] 所有微服务使用JSON格式日志
- [ ] trace_id / request_id 正确传播
- [ ] 敏感数据（密码、Token）已脱敏
- [ ] 日志级别合理设置（非DEBUG）

### 存储和保留
- [ ] Elasticsearch配置ILM策略
- [ ] HOT/WARM/COLD分层完成
- [ ] 备份策略实施（日增量+周全量）
- [ ] 保留期设置合理（90天-1年）

### 监控告警
- [ ] 配置错误告警规则
- [ ] 配置性能基线告警
- [ ] 告警通知渠道确认（Slack/钉钉/邮件）
- [ ] 告警响应流程建立

### 安全审计
- [ ] 访问控制配置（RBAC）
- [ ] 敏感操作日志永久保留
- [ ] 日志前向保护（防篡改）
- [ ] 合规性检查清单完成

---

## 常见问题排查

### Q: Logstash无法连接到Elasticsearch

**症状**: `[ERROR] Connection refused`

**排查步骤**:
```bash
# 1. 检查Elasticsearch是否运行
docker ps | grep elasticsearch

# 2. 检查Logstash配置
docker logs logstash | grep -i error

# 3. 检查网络连接
docker exec logstash ping elasticsearch

# 4. 检查端口映射
curl http://localhost:9200/
```

**解决方案**:
```yaml
# docker-compose.yml
logstash:
  environment:
    - ELASTICSEARCH_HOST=elasticsearch:9200  # ✅ 使用容器名
    # 不要用 localhost（在Docker容器内无效）
```

---

### Q: Kibana无法创建数据视图

**症状**: "No matching indices"

**排查步骤**:
```bash
# 1. 检查是否有索引
curl http://localhost:9200/_cat/indices

# 2. 检查Logstash是否工作正常
docker logs logstash

# 3. 检查应用是否发送日志
docker logs api-gateway | grep -i "logstash"
```

---

### Q: Skywalking链路追踪无数据

**症状**: Skywalking UI显示"No Data"

**排查步骤**:
```bash
# 1. 检查Skywalking OAP是否启动
docker logs skywalking-oap | grep "started"

# 2. 检查应用Agent配置
docker logs auth-service | grep -i "skywalking"

# 3. 确认Skywalking Agent已下载
docker exec auth-service ls -la /app/skywalking-agent/
```

**解决方案** (如Agent下载失败):
```bash
# 手动下载Agent到本地，通过Docker Volume挂载
wget https://archive.apache.org/dist/skywalking/9.3.0/apache-skywalking-java-agent-9.3.0.tar.gz
tar -xzf apache-skywalking-java-agent-9.3.0.tar.gz
```

---

## 高级用法

### 1. 创建自定义仪表板

```
1. Kibana首页 → Dashboards → Create Dashboard
2. Add a panel → Create new visualization
3. 选择可视化类型：
   - Line chart：响应时间趋势
   - Bar chart：错误数按服务统计
   - Pie chart：日志级别分布
   - Table：最新错误详情
4. 保存Dashboard
```

### 2. 使用脚本导出日志

```bash
#!/bin/bash
# export_logs.sh - 导出过去24小时的ERROR日志

KIBANA_URL="http://localhost:5601"
INDEX="logs-*"
TIME_RANGE="24h"

curl -X POST "$KIBANA_URL/api/saved_objects/report/download" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "indexPattern": "'$INDEX'",
    "query": "level: ERROR",
    "timeRange": "'$TIME_RANGE'",
    "format": "csv"
  }' > error_logs_$(date +%Y%m%d).csv
```

### 3. 与外部系统集成

```
Kibana Rules → Alert Actions 支持：
- Slack: 实时通知团队
- PagerDuty: 升级告警
- Email: 定时报告
- Webhook: 自定义集成
```

---

## 参考资源

### 文档
- [ELK Stack基础文档](services/docs/LOG_MANAGEMENT_GUIDE.md)
- [部署指南](services/docs/LOG_DEPLOYMENT_GUIDE.md)
- [国际标准最佳实践](services/docs/BEST_PRACTICES_INTERNATIONAL_STANDARDS.md)

### Kibana快捷链接
- **Discover**: http://localhost:5601/app/discover
- **Alerts**: http://localhost:5601/app/alerts
- **Dashboards**: http://localhost:5601/app/dashboards
- **Stack Management**: http://localhost:5601/app/management

---

**版本**: 1.0  
**最后更新**: 2026-02-05  
**维护**: DevOps Team
