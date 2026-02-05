# 微服务日志系统部署指南

## 快速启动

### 1. 启动 ELK Stack 和基础设施
```bash
cd e:/open-sources/react-demo-project
docker-compose up -d mysql nacos elasticsearch logstash kibana
```

### 2. 构建微服务
```bash
cd services
mvn clean package -DskipTests -P docker
```

### 3. 启动所有微服务
```bash
cd ..
docker-compose up -d api-gateway auth-service user-service order-service chat-service
```

### 4. 访问服务

| 服务 | 地址 | 用途 |
|------|------|------|
| Kibana | http://localhost:5601 | 日志查询与分析 |
| Elasticsearch | http://localhost:9200 | 日志存储API |
| Logstash | localhost:5000 | TCP日志接收 |
| API Gateway | http://localhost:8888 | 后端API入口 |
| Nacos | http://localhost:8848 | 服务注册与配置 |

## 验证清单

### ✓ 环境变量检查
```bash
# 确认Docker环境变量
echo $COMPOSE_FILE  # 应为 docker-compose.yml
echo $DOCKER_HOST   # Docker daemon地址
```

### ✓ 容器健康检查
```bash
# 查看所有服务状态
docker-compose ps

# 预期输出：所有服务 STATUS 为 Up (healthy) 或 Up
```

### ✓ 日志联通性测试

#### 步骤1：查看服务日志
```bash
# 查看chat-service日志
docker-compose logs chat-service | grep "logback\|Logstash"

# 预期包含信息：
# - "CONSOLE appender initialized"
# - "FILE_JSON appender initialized"
# - "LOGSTASH_TCP appender initialized"
```

#### 步骤2：触发应用请求
```bash
# 调用API以生成日志
curl http://localhost:8888/api/chat/v1/conversations
```

#### 步骤3：在Kibana中查看日志

**访问**: http://localhost:5601

**步骤**:
1. 左侧菜单 → "Discover"
2. 创建索引模式: `logs-*`
3. 时间字段: `@timestamp`
4. 查看日志流

### ✓ 日志格式验证

```bash
# 查看本地日志文件
tail -f logs/chat-service.log | jq '.'

# 验证JSON结构包含：
# - "@timestamp": ISO8601格式时间
# - "level": 日志级别
# - "logger_name": 记录器名称
# - "message": 日志消息
# - "application": 应用名称
# - "environment": 运行环境
```

## 常见问题排查

### 问题1: Logstash无法接收来自服务的日志

**症状**: Kibana中没有新日志出现

**排查步骤**:

```bash
# 1. 检查Logstash是否运行
docker-compose ps logstash
# 预期: Up (healthy)

# 2. 检查Logstash日志
docker-compose logs logstash | tail -50
# 查找错误信息

# 3. 检查网络连接
docker exec chat-service nc -zv logstash 5000
# 预期: Connection succeeded

# 4. 检查logstash.conf语法
docker exec logstash logstash -t
# 预期: Configuration OK

# 5. 重启Logstash
docker-compose restart logstash
```

### 问题2: Elasticsearch连接失败

**症状**: 日志堆积在Logstash，不进入Elasticsearch

**排查步骤**:

```bash
# 1. 检查Elasticsearch健康状态
curl http://localhost:9200/_cluster/health

# 预期输出:
#{
#  "cluster_name" : "microservices-cluster",
#  "status" : "green",
#  "timed_out" : false,
#  "number_of_nodes" : 1,
#  ...
#}

# 2. 检查磁盘空间
curl http://localhost:9200/_cat/nodes?v

# 3. 检查内存使用
docker stats elasticsearch
```

### 问题3: 服务无法连接Logstash TCP

**症状**: 应用日志显示警告，无法发送到Logstash

**排查步骤**:

```bash
# 1. 验证Logstash端口映射
docker-compose ps logstash
# 预期: 5000:5000/tcp

# 2. 测试TCP连接
docker exec chat-service telnet logstash 5000
# 预期: Connected to logstash

# 3. 检查应用配置
docker-compose exec chat-service cat /etc/config/application-docker.yml
# 确认 logstash 地址正确

# 4. 查看应用日志中的连接错误
docker-compose logs chat-service | grep -i "logstash\|tcp"
```

### 问题4: Kibana无法访问

**症状**: http://localhost:5601 无响应

**排查步骤**:

```bash
# 1. 检查Kibana容器状态
docker-compose ps kibana

# 2. 查看Kibana启动日志
docker-compose logs kibana | grep -i "error\|ready"

# 3. 检查Elasticsearch连接
docker-compose exec kibana curl http://elasticsearch:9200/

# 4. 重新启动Kibana
docker-compose restart kibana
```

## 监控仪表板设置

### 创建Kibana仪表板

**步骤**:

1. **创建可视化**:
   - Navigate to Visualize
   - Create → Choose visualization type
   
2. **日志错误率**:
   ```
   Type: Pie chart
   Metrics: Count
   Buckets: Terms on "level" field
   ```

3. **服务健康状态**:
   ```
   Type: Area chart
   Metrics: Count
   X-axis: Date histogram on @timestamp
   Buckets: Terms on "application" field
   ```

4. **错误堆栈追踪**:
   ```
   Type: Data table
   Columns: @timestamp, application, level, message, stack_trace
   Filter: level = "ERROR"
   ```

## 性能调优建议

### 对于高流量环境

```yaml
# services/{service}/src/main/resources/logback-spring.xml

<!-- 增加异步处理能力 -->
<appender name="ASYNC_LOGSTASH" class="ch.qos.logback.classic.AsyncAppender">
    <queueSize>512</queueSize>
    <discardingThreshold>0</discardingThreshold>
    <appender-ref ref="LOGSTASH_TCP"/>
</appender>
```

### Elasticsearch优化

```bash
# 增加JVM内存（用于生产环境）
# 在docker-compose.yml中修改

elasticsearch:
  environment:
    ES_JAVA_OPTS: "-Xms1g -Xmx1g"  # 改为1GB
```

### Logstash优化

```bash
# 增加工作线程数（docker-compose.yml）
logstash:
  environment:
    LS_JAVA_OPTS: "-Xmx512m -Xms512m"  # 改为512MB
    PIPELINE_WORKERS: 4  # 增加管道线程
```

## 日志保留政策

### Elasticsearch索引生命周期（ILM）

```bash
# 设置30天后删除旧索引
curl -X PUT "localhost:9200/_ilm/policy/logs-policy?pretty" \
-H 'Content-Type: application/json' \
-d'{
  "policy": "logs-policy",
  "phases": {
    "hot": {
      "min_age": "0ms",
      "actions": {}
    },
    "delete": {
      "min_age": "30d",
      "actions": {
        "delete": {}
      }
    }
  }
}'
```

## 本地开发环境建议

### 仅使用文件日志（不启动ELK）

```bash
# 在服务启动时使用local profile
docker run \
  -e SPRING_PROFILES_ACTIVE=local \
  -v $(pwd)/logs:/app/logs \
  microservices-demo/chat-service:latest
```

### 实时日志查看

```bash
# 创建别名简化操作
alias logs='tail -f logs/*.log | jq'
alias logs-errors='tail -f logs/*.log | jq select(.level=="ERROR")'
alias logs-app='tail -f logs/*.log | jq select(.application=="'

# 使用
logs                      # 查看所有日志
logs-errors              # 仅查看错误
logs-app chat-service"   # 查看特定服务
```

## CI/CD集成建议

### GitLab CI/CD

```yaml
# .gitlab-ci.yml

stages:
  - build
  - test
  - deploy
  - monitor

verify_logs:
  stage: test
  script:
    - mvn clean test -pl services/chat-service
    - grep -q "logback" target/classes/logback-spring.xml
    - echo "✓ Logback配置验证通过"
  only:
    - merge_requests
    
deploy_with_logs:
  stage: deploy
  script:
    - docker-compose up -d elasticsearch logstash kibana
    - docker-compose up -d api-gateway auth-service
    - sleep 30
    - curl http://localhost:5601/api/status
    - echo "✓ ELK Stack已启动"
  only:
    - main
```

## 备份与恢复

### 备份Elasticsearch数据

```bash
# 创建快照
curl -X PUT "localhost:9200/_snapshot/backup" \
-H 'Content-Type: application/json' \
-d'{ 
  "type": "fs",
  "settings": {
    "location": "/mnt/backups/elasticsearch"
  }
}'

# 创建快照
curl -X PUT "localhost:9200/_snapshot/backup/snapshot-1?wait_for_completion=true"

# 列出快照
curl "localhost:9200/_snapshot/backup/_all?pretty"
```

### 恢复Elasticsearch数据

```bash
# 恢复特定快照
curl -X POST "localhost:9200/_snapshot/backup/snapshot-1/_restore?pretty" \
-H 'Content-Type: application/json' \
-d'{
  "indices": "logs-*",
  "ignore_unavailable": true,
  "include_global_state": false
}'
```

## 下一步

完成：✓ 日志系统配置
下一步：
- [ ] 配置日志告警规则
- [ ] 集成Jaeger分布式追踪
- [ ] 设置自定义Kibana仪表板
- [ ] 配置日志采样策略
- [ ] 添加敏感信息过滤

---
**文档版本**: 1.0.0  
**最后更新**: 2024-01-15  
**维护者**: DevOps团队
