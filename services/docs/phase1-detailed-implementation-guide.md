# Phase 1 详细实施指南：可观测性三角形

**目标**: 2周内完成Skywalking + Prometheus + ELK集成  
**评分提升**: 70 → 82分  
**团队规模**: 2-3人  
**验收标准**: 所有5个服务链路/指标/日志完整可见

---

## 一、前置准备（Day 0 - 2小时）

### 1.1 环境检查清单
```
□ Java 17 LTS已安装
  $ java -version
  
□ Maven 3.9+已安装
  $ mvn -version
  
□ Docker Desktop已启动
  $ docker --version
  $ docker-compose --version

□ Git仓库已同步
  $ git status
  
□ 磁盘空间充足（>20GB）
  $ df -h

□ 网络畅通（可访问GitHub/Maven中央仓库）
  $ ping repo1.maven.org
```

### 1.2 环境配置
```bash
# 设置Maven加速器
cat > ~/.m2/settings.xml << 'EOF'
<settings>
  <mirrors>
    <mirror>
      <id>aliyun</id>
      <mirrorOf>central</mirrorOf>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
  </mirrors>
</settings>
EOF

# 设置Docker国内镜像（可选）
cat > ~/.docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://registry.docker-cn.com"
  ]
}
EOF

# 重启Docker
sudo systemctl restart docker  # Linux
# 或在Docker Desktop中更改设置
```

### 1.3 创建目录结构
```bash
cd services

# 创建配置文件目录
mkdir -p docker/{prometheus,grafana/provisioning/{datasources,dashboards},logstash}

# 创建日志目录
mkdir -p logs
```

---

## 二、Task 1 详细步骤：Skywalking链路追踪（Day 1-3）

### Step 1.1.1: 准备docker-compose.yml配置

**当前状态**: 在 `services/docker-compose.yml` 中定位以下部分

**查找现有基础设施配置**:
```bash
grep -n "networks:" services/docker-compose.yml
# 找到网络定义部分
```

**修改步骤**（在mysql服务之后添加）:

在文件末尾的 `services:` 下添加：
```yaml
  skywalking-oap:
    image: apache/skywalking-oap-server:9.7.0
    container_name: skywalking-oap
    restart: unless-stopped
    environment:
      SW_STORAGE: h2                    # 使用H2数据库（开发环境足够）
      SW_H2_DRIVER: org.h2.Driver
      SW_STORAGE_H2_DRIVER_PATH: -1
      # 可选：Prometheus支持
      SW_PROMETHEUS_FETCHER: default
      SW_PROMETHEUS_FETCHER_ACTIVE: true
    ports:
      - "11800:11800"  # gRPC采集端口（Agent上报）
      - "12800:12800"  # HTTP查询端口（UI查询）
      - "9411:9411"    # Zipkin兼容端口（可选）
    volumes:
      - skywalking_data:/var/skywalking  # 数据持久化
    networks:
      - infra-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:12800/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 40s

  skywalking-ui:
    image: apache/skywalking-ui:9.7.0
    container_name: skywalking-ui
    restart: unless-stopped
    ports:
      - "8899:8080"       # Web界面
    environment:
      SW_OAP_ADDRESS: skywalking-oap:12800  # OAP服务地址
      SW_LOG_LEVEL: info
    depends_on:
      skywalking-oap:
        condition: service_healthy      # 等待OAP健康检查通过
    networks:
      - infra-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**在 `volumes:` 节点下添加**:
```yaml
volumes:
  # 其他volumes...
  skywalking_data:  # 存储Skywalking数据
```

**验证修改**:
```bash
# 检查YAML语法
docker-compose config > /dev/null && echo "✓ YAML语法正确"

# 验证服务定义
docker-compose config | grep -A 5 "skywalking-oap"
```

### Step 1.1.2: 启动Skywalking服务

```bash
# 方案A: 单独启动Skywalking（快速测试）
cd services
docker-compose up skywalking-oap skywalking-ui -d

# 等待服务启动（约30秒）
sleep 30

# 方案B: 与其他基础设施一起启动
make up  # 如果Makefile中已定义

# 方案C: 从已有的docker-compose启动全部
docker-compose up -d --scale mysql=1
```

**验证启动成功**:
```bash
# 检查容器状态
docker ps | grep skywalking

# 检查日志
docker logs skywalking-oap | tail -20
docker logs skywalking-ui | tail -20

# 测试连接
curl -v http://localhost:12800/health
# 预期: "UP" 或 HTTP 200

# 浏览器测试
# 打开 http://localhost:8899
# 应看到Skywalking UI界面（初始为空）
```

**故障排查**:
| 问题 | 原因 | 解决方案 |
|------|------|--------|
| 端口已被占用 | 本地已有Skywalking | `lsof -i :11800` 然后kill |
| 容器启动失败 | 内存不足 | `docker system prune -a` 清理|
| OAP启动超时 | H2数据库初始化慢 | 增加healthcheck timeout |

### Step 1.2: 更新父POM - 微调版本管理

**文件**: `services/pom.xml`

**定位** `<dependencyManagement>` 节点（约第30行）

**在Spring Cloud Alibaba之后添加**（保持版本兼容性）:
```xml
            <!-- 在 Spring Cloud Alibaba 之后添加 -->

            <!-- Skywalking Java Agent & Tracing SDK -->
            <dependency>
                <groupId>org.apache.skywalking</groupId>
                <artifactId>apm-toolkit-trace</artifactId>
                <version>9.7.0</version>
            </dependency>
            <dependency>
                <groupId>org.apache.skywalking</groupId>
                <artifactId>apm-toolkit-logback-1.x</artifactId>
                <version>9.7.0</version>
            </dependency>

            <!-- Micrometer Tracing (Spring Boot 3.x官方) -->
            <dependency>
                <groupId>io.micrometer</groupId>
                <artifactId>micrometer-tracing-bom</artifactId>
                <version>1.2.0</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>io.micrometer</groupId>
                <artifactId>micrometer-tracing-bridge-brave</artifactId>
                <version>1.2.0</version>
            </dependency>
```

**版本兼容性矩阵**:
```
Spring Boot 3.2.0 ← ✓ Skywalking 9.7.0
                   ✓ Micrometer 1.2.0
                   ✓ JDK 17+

其他版本组合：
Spring Boot 3.1.x → Skywalking 9.5.x
Spring Boot 3.0.x → Skywalking 9.3.x
```

**验证POM修改**:
```bash
# 检查依赖树（查看是否有冲突）
mvn dependency:tree | grep skywalking

# 验证POM语法
mvn validate
```

### Step 1.3: 更新每个服务的JVM启动参数

**(方案A) 使用Docker启动（推荐生产）**

**修改每个服务的 Dockerfile** (如 `services/auth-service/Dockerfile`)

```dockerfile
FROM openjdk:17-slim AS builder

# Stage 1: 构建Agent
FROM openjdk:17-slim

# 下载Skywalking Agent
RUN apt-get update && apt-get install -y wget curl \
    && wget -q https://archive.apache.org/dist/skywalking/9.7.0/apache-skywalking-java-agent-9.7.0.tar.gz \
    && tar -xzf apache-skywalking-java-agent-9.7.0.tar.gz \
    && rm apache-skywalking-java-agent-9.7.0.tar.gz \
    && apt-get clean

# 设置工作目录
WORKDIR /app

# 复制构建好的JAR
COPY target/auth-service.jar .

# 配置JVM参数（包含Skywalking Agent）
ENV SERVICE_NAME=auth-service
ENV SW_AGENT_NAMESPACE=spring-cloud
ENV SW_AGENT_NAME=${SERVICE_NAME}
ENV SW_AGENT_INSTANCE_NAME=${SERVICE_NAME}-${HOSTNAME}
ENV SW_GRPC_LOG_SERVER_ADDRESS=skywalking-oap:11800
ENV JAVA_OPTS="\
  -javaagent:/skywalking-agent/skywalking-agent.jar \
  -Dskywalking.agent.service_name=${SERVICE_NAME} \
  -Dskywalking.collector.backend_service=skywalking-oap:11800 \
  -Dskywalking.logging.level=info"

EXPOSE 8002

# 启动应用
ENTRYPOINT exec java ${JAVA_OPTS} -jar auth-service.jar
```

**必须修改的5个Dockerfile**:
- [ ] `services/auth-service/Dockerfile`
- [ ] `services/user-service/Dockerfile`
- [ ] `services/order-service/Dockerfile`
- [ ] `services/chat-service/Dockerfile`
- [ ] `services/api-gateway/Dockerfile`

**快速更新脚本**:
```bash
#!/bin/bash
# 批量更新所有Dockerfile的Agent配置

for dir in auth-service user-service order-service chat-service api-gateway; do
    port=$([[ "$dir" == "auth-service" ]] && echo 8002 || echo $(echo 8001 + ${dir:0:1} | bc))
    
    sed -i "s|SERVICE_NAME=.*|SERVICE_NAME=${dir}|g" services/$dir/Dockerfile
    sed -i "s|EXPOSE .*|EXPOSE ${port}|g" services/$dir/Dockerfile
done

echo "✓ 所有Dockerfile已更新"
```

**(方案B) 本地开发模式（使用Makefile）**

**文件**: `services/Makefile`

**查找 dev target**，替换内容:
```makefile
dev:
	@echo "Starting all microservices with Skywalking..."
	
	# 下载 Skywalking Agent (仅首次)
	@if [ ! -d "skywalking-agent" ]; then \
		echo "下载Skywalking Agent..."; \
		wget -q https://archive.apache.org/dist/skywalking/9.7.0/apache-skywalking-java-agent-9.7.0.tar.gz; \
		tar -xzf apache-skywalking-java-agent-9.7.0.tar.gz; \
		rm apache-skywalking-java-agent-9.7.0.tar.gz; \
	fi
	
	@echo "启动所有微服务..."
	
	# 启动auth-service (port: 8002)
	cd auth-service && mvn spring-boot:run \
	  -Dspring-boot.run.jvmArguments="\
	    -javaagent:$$PWD/../skywalking-agent/skywalking-agent.jar \
	    -Dskywalking.agent.service_name=auth-service \
	    -Dskywalking.collector.backend_service=localhost:11800" > /tmp/auth.log 2>&1 &
	
	# 启动user-service (port: 8001)
	cd user-service && mvn spring-boot:run \
	  -Dspring-boot.run.jvmArguments="\
	    -javaagent:$$PWD/../skywalking-agent/skywalking-agent.jar \
	    -Dskywalking.agent.service_name=user-service \
	    -Dskywalking.collector.backend_service=localhost:11800" > /tmp/user.log 2>&1 &
	
	# 启动其他服务...
	
	@echo "✓ 所有服务启动中，请等待30秒..."
	@sleep 30
	@echo "✓ 启动完成！访问 http://localhost:8899 查看链路"
```

### Step 1.4: 集成Skywalking到应用代码（可选，增强追踪）

**增强跨服务追踪** - 在关键业务逻辑处添加自定义span

**文件**: `services/auth-service/src/main/java/com/example/auth/controller/AuthController.java`

```java
package com.example.auth.controller;

import org.apache.skywalking.apm.toolkit.trace.Trace;
import org.apache.skywalking.apm.toolkit.trace.TraceContext;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @PostMapping("/login")
    @Trace(operationName = "user.login")  // 命名此操作
    public LoginResponse login(@RequestBody LoginRequest request) {
        // Skywalking会自动追踪该方法
        String traceId = TraceContext.traceId();  // 获取当前链路ID
        
        try {
            return handleLogin(request, traceId);
        } catch (Exception e) {
            // Skywalking会自动记录异常
            throw e;
        }
    }
    
    @Trace(operationName = "user.verify-email")
    private void verifyEmail(String email) {
        // 自定义业务追踪
        TraceContext.putCorrelationValue("email", email);
    }
}
```

**验证集成**:
```bash
# 编译
mvn clean install

# 启动应用后发送请求
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Test@1234"}'

# 在Skywalking UI查看
# http://localhost:8899 → Services → auth-service → Traces
```

### Step 1.5: 完整验证：Skywalking链路追踪

**验证清单**（按顺序执行）:

```bash
# 1️⃣ 检查OAP服务健康状态
curl -s http://localhost:12800/health | jq .
# 预期: {"status":"UP"}

# 2️⃣ 访问Skywalking UI
# 打开浏览器: http://localhost:8899
# 预期: 看到Dashboard页面

# 3️⃣ 启动所有服务（如未启动）
make up        # 启动基础设施
make dev-full  # 启动所有微服务
sleep 30       # 等待服务启动并注册

# 4️⃣ 生成测试流量（触发链路追踪）
for i in {1..5}; do
  curl -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test'$i'","password":"Test@1234"}' \
    -w "\n%{http_code}\n"
done

# 5️⃣ 在Skywalking UI验证流量
# 等待5-10秒后刷新页面
# http://localhost:8899 → Services
# 预期: 显示5个服务 (auth-service, user-service, order-service, chat-service, api-gateway)

# 6️⃣ 查看拓扑图
# http://localhost:8899 → Topology
# 预期: 显示完整的服务调用关系
#   api-gateway → auth-service → user-service
#   auth-service ↔ user-service (双向)

# 7️⃣ 查看单条链路详情
# http://localhost:8899 → Traces → 点击某条trace
# 预期: 显示
#   - Trace ID
#   - 跨度时间分解（API Gateway: 2ms → Auth: 5ms → User: 3ms）
#   - 错误标记（如有）
#   - 调用堆栈

# 8️⃣ 测试错误捕获
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"invalid","password":"wrong"}'

# 预期: 在Traces中看到异常堆栈跟踪
```

**关键指标验证**:
```
✓ Services Count:         5 (auth, user, order, chat, gateway)
✓ Topology Links:         8+ (完整覆盖)
✓ Response Time P95:      < 100ms
✓ Error Rate:             0% (正常场景)
✓ Trace Sampling:         100% (开发环境)
```

**Skywalking完成检查清单**:
```
□ docker-compose.yml: skywalking-oap & skywalking-ui 已添加
□ pom.xml: Skywalking依赖已添加
□ 5个Dockerfile: Agent启动参数已配置
□ Skywalking UI可访问: http://localhost:8899
□ 5个服务在Services列表中显示
□ 至少1条完整的跨服务链路可见
□ 拓扑图显示正确的调用关系
□ 性能指标（响应时间、错误率）可见

得分: 6分
预计耗时: 2-3天
```

---

## 三、Task 2 详细步骤：Prometheus + Grafana（Day 3-5）

### Step 2.1: POM依赖更新

**文件**: `services/pom.xml`

**在dependencyManagement下添加**（与Skywalking并列）:
```xml
            <!-- Prometheus Metrics -->
            <dependency>
                <groupId>io.micrometer</groupId>
                <artifactId>micrometer-registry-prometheus</artifactId>
                <version>1.12.0</version>
            </dependency>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-actuator</artifactId>
            </dependency>
```

**版本说明**:
```
micrometer-registry-prometheus 1.12.0
  ├─ 支持 Prometheus client library 0.15+
  ├─ 兼容 Prometheus 2.30+
  └─ Spring Boot 3.2.0 推荐版本
```

### Step 2.2: 每个服务增强application.yml

**关键修改**（在每个服务中重复）:

**文件列表**:
- `services/auth-service/src/main/resources/application.yml`
- `services/user-service/src/main/resources/application.yml`
- `services/order-service/src/main/resources/application.yml`
- `services/chat-service/src/main/resources/application.yml`
- `services/api-gateway/src/main/resources/application.yml`

**添加内容**（整体替换management节点）:
```yaml
management:
  # 暴露Actuator端点
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus  # 新增prometheus
      base-path: /actuator
  
  # Prometheus指标导出配置
  metrics:
    export:
      prometheus:
        enabled: true
    distribution:
      percentiles-histogram:
        http.server.requests: true  # 启用直方图追踪响应时间
      slo:                          # 定义SLO边界
        http.server.requests: 50,100,200,500,1000,2000
    tags:
      application: ${spring.application.name}
      environment: ${spring.profiles.active:local}
      region: cn-beijing  # 可选：地域标签
  
  # 健康检查配置
  health:
    livenessState:
      enabled: true
    readinessState:
      enabled: true
```

**验证方式**:
```bash
# 检查端点可访问性
curl -s http://localhost:8002/actuator | jq .

# 查看Prometheus端点
curl -s http://localhost:8002/actuator/prometheus | head -20
```

### Step 2.3: Docker Compose配置Prometheus & Grafana

**文件**: `services/docker-compose.yml`

**添加services**（在skywalking-ui之后）:
```yaml
  prometheus:
    image: prom/prometheus:v2.47.2  # 指定版本确保稳定性
    container_name: prometheus
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'  # 保留30天历史数据
      - '--web.enable-lifecycle'              # 允许热配置重载
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml:ro  # 只读配置
      - ./docker/alert-rules.yml:/etc/prometheus/alert-rules.yml:ro
      - prometheus_data:/prometheus
    networks:
      - infra-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9090/-/healthy"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s

  grafana:
    image: grafana/grafana:10.2.0
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_USER: admin           # 改为强密码
      GF_SECURITY_ADMIN_PASSWORD: Admin@123456
      GF_SECURITY_JWT_ENABLED: 'true'        # 启用JWT认证
      GF_SECURITY_JWT_HEADER_NAME: 'Authorization'
      GF_USERS_ALLOW_SIGN_UP: 'false'        # 禁止自助注册
      GF_LOG_LEVEL: info
      # 数据源自动配置
      GF_PROVISIONING_PATH: /etc/grafana/provisioning
    volumes:
      - ./docker/grafana/provisioning:/etc/grafana/provisioning:ro
      - grafana_data:/var/lib/grafana
    depends_on:
      prometheus:
        condition: service_healthy
    networks:
      - infra-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  prometheus_data:
  grafana_data:
```

### Step 2.4: 创建Prometheus配置文件

**文件**: `docker/prometheus.yml` (新建)

```yaml
# Prometheus 配置文件

global:
  scrape_interval: 15s              # 每15秒采集一次
  scrape_timeout: 10s                # 采集超时
  evaluation_interval: 15s           # 评估告警规则间隔
  external_labels:
    monitor: 'microservices'
    cluster: 'local'

# 告警规则文件
rule_files:
  - '/etc/prometheus/alert-rules.yml'

# 告警管理器配置
alerting:
  alertmanagers:
    - static_configs:
        - targets: []  # 后续可配置Alertmanager

# 采集配置
scrape_configs:
  # 1. API Gateway
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:8080']
    metrics_path: '/actuator/prometheus'
    scrape_interval: 10s  # 网关采集更频繁
    relabel_configs:      # 标签重写
      - source_labels: [__address__]
        target_label: instance
        replacement: 'api-gateway-1'

  # 2. Auth Service
  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:8002']
    metrics_path: '/actuator/prometheus'
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'auth-service-1'

  # 3. User Service
  - job_name: 'user-service'
    static_configs:
      - targets: ['user-service:8001']
    metrics_path: '/actuator/prometheus'
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'user-service-1'

  # 4. Order Service
  - job_name: 'order-service'
    static_configs:
      - targets: ['order-service:8003']
    metrics_path: '/actuator/prometheus'

  # 5. Chat Service
  - job_name: 'chat-service'
    static_configs:
      - targets: ['chat-service:8004']
    metrics_path: '/actuator/prometheus'
    scrape_interval: 20s  # Chat流式响应可能较慢

  # 6. Prometheus自身指标
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
```

### Step 2.5: 创建告警规则

**文件**: `docker/alert-rules.yml` (新建)

```yaml
groups:
  - name: microservices_alerts
    interval: 30s
    rules:
      # 规则1: 高错误率告警
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "{{ $labels.job }} 错误率过高"
          description: "{{ $labels.job }} 最近5分钟错误率: {{ $value | humanizePercentage }}"

      # 规则2: 响应时间过长
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1
        for: 10m
        annotations:
          summary: "{{ $labels.job }} P95响应时间过长"
          description: "P95: {{ $value | humanizeDuration }}"

      # 规则3: 服务不可用
      - alert: ServiceDown
        expr: up{job=~"auth-service|user-service|order-service|chat-service|api-gateway"} == 0
        for: 1m
        annotations:
          summary: "服务 {{ $labels.job }} 不可用"
          description: "{{ $labels.job }} 无法连接"
```

### Step 2.6: Grafana数据源和仪表盘

**创建目录**:
```bash
mkdir -p docker/grafana/provisioning/{datasources,dashboards}
```

**文件**: `docker/grafana/provisioning/datasources/prometheus.yml` (新建)

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    access: proxy
    isDefault: true
    editable: false
    jsonData:
      timeInterval: 15s
```

**文件**: `docker/grafana/provisioning/dashboards/provider.yml` (新建)

```yaml
apiVersion: 1

providers:
  - name: 'Microservices Dashboards'
    orgId: 1
    folder: 'Microservices'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUpdateFromUI: true
    options:
      path: /etc/grafana/provisioning/dashboards
```

**文件**: `docker/grafana/provisioning/dashboards/microservices-dashboard.json` (新建)

```json
{
  "dashboard": {
    "title": "Microservices Overview",
    "uid": "microservices-overview",
    "version": 1,
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate (RPS)",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[1m])) by (job)"
          }
        ],
        "type": "graph"
      },
      {
        "id": 2,
        "title": "Response Time P95",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)"
          }
        ],
        "type": "graph"
      },
      {
        "id": 3,
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[1m])) by (job)"
          }
        ],
        "type": "stat"
      },
      {
        "id": 4,
        "title": "JVM Memory Usage",
        "targets": [
          {
            "expr": "jvm_memory_used_bytes / jvm_memory_max_bytes"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

### Step 2.7: 完整验证Prometheus + Grafana

```bash
# 1️⃣ 启动Prometheus和Grafana
docker-compose up prometheus grafana -d
sleep 20  # 等待启动

# 2️⃣ 验证Prometheus连接
curl -s http://localhost:9090/-/healthy
# 预期: UI输出或200 OK

# 3️⃣ 检查采集目标
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {labels:.labels.job, health:.health}'

# 预期输出:
# {
#   "labels": "auth-service",
#   "health": "up"
# },
# ...

# 4️⃣ Prometheus UI查询
# 打开 http://localhost:9090
# → Status → Targets → 验证所有服务状态为 "UP"

# 5️⃣ 查询指标
curl -s 'http://localhost:9090/api/v1/query?query=http_requests_total' | jq '.'

# 6️⃣ Grafana登录
# 打开 http://localhost:3000
# 用户名: admin, 密码: Admin@123456

# 7️⃣ 导入仪表盘
# 左侧菜单 → Dashboards → Import → 上传 microservices-dashboard.json

# 8️⃣ 生成测试流量
for i in {1..50}; do
  curl -s -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"user'$i'","password":"Test@1234"}' > /dev/null &
done
wait

# 9️⃣ 在Grafana查看实时指标
# Dashboard → Microservices Overview
# 应看到:
#   ✓ Request Rate 上升(峰值约50 RPS)
#   ✓ Response Time 显示
#   ✓ Error Rate & Memory曲线
```

**Prometheus + Grafana完成检查清单**:
```
□ docker-compose.yml: prometheus & grafana 已添加
□ 5个服务application.yml: metrics端点已开启
□ docker/prometheus.yml: 采集配置完成
□ docker/alert-rules.yml: 告警规则已创建
□ Grafana数据源配置: http://prometheus:9090
□ 仪表盘导入: microservices-dashboard.json
□ Prometheus Status页: 所有5个服务显示 "UP"
□ Grafana可显示实时指标曲线
□ 至少3个关键指标可视化 (RPS, P95, Error Rate)

得分: 4分
预计耗时: 2-3天
```

---

## 四、Task 3 详细步骤：ELK日志聚合（Day 5-7）

### Step 3.1: POM依赖

**文件**: `services/pom.xml`

```xml
            <!-- Logback JSON编码器 -->
            <dependency>
                <groupId>net.logstash.logback</groupId>
                <artifactId>logstash-logback-encoder</artifactId>
                <version>7.4</version>
            </dependency>
```

### Step 3.2: 创建 logback-spring.xml 配置

**需要为5个服务创建文件**:

**文件模板** (以auth-service为例):
`services/auth-service/src/main/resources/logback-spring.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <!-- Spring属性占位符 -->
    <springProperty name="APP_NAME" source="spring.application.name" defaultValue="app"/>
    <springProperty name="LOG_LEVEL" source="logging.level.root" defaultValue="INFO"/>
    <springProperty name="LOG_FILE" source="logging.file.name" defaultValue="logs/${APP_NAME}.log"/>
    
    <!-- ===== 开发环境: 控制台输出 ===== -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <charset>UTF-8</charset>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- ===== JSON文件输出（用于ELK采集） ===== -->
    <appender name="FILE_JSON" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_FILE}</file>
        <!-- 日志滚动策略 -->
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <!-- 按日期和大小滚动 -->
            <fileNamePattern>logs/${APP_NAME}-%d{yyyy-MM-dd}.%i.log.json</fileNamePattern>
            <maxFileSize>100MB</maxFileSize>        <!-- 单文件最大100MB -->
            <maxHistory>30</maxHistory>              <!-- 最多保留30天 -->
            <totalSizeCap>3GB</totalSizeCap>        <!-- 总大小上限3GB -->
        </rollingPolicy>
        <!-- JSON编码器 -->
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>
                {
                  "application": "${APP_NAME}",
                  "environment": "${spring.profiles.active:local}",
                  "version": "1.0.0",
                  "hostname": "${HOSTNAME:unknown}"
                }
            </customFields>
            <includeMdc>true</includeMdc>
            <includeStructuredArguments>true</includeStructuredArguments>
            <fieldName>@timestamp</fieldName>
        </encoder>
    </appender>
    
    <!-- ===== TCP输出到Logstash（生产环境） ===== -->
    <appender name="LOGSTASH_TCP" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
        <destination>logstash:5000</destination>  <!-- Logstash服务地址 -->
        <keepAliveDuration>5 minutes</keepAliveDuration>
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>{"application":"${APP_NAME}"}</customFields>
            <includeContext>true</includeContext>
            <includeMdcAndContext>true</includeMdcAndContext>
        </encoder>
        <!-- 连接失败处理 -->
        <connectionDelay>10000</connectionDelay>  <!-- 重连延迟10秒 -->
        <queueSize>512</queueSize>
        <discardingThreshold>0</discardingThreshold>
    </appender>
    
    <!-- ===== 按环境启用不同日志策略 ===== -->
    
    <!-- 开发环境: 控制台+本地JSON -->
    <springProfile name="local,dev">
        <root level="DEBUG">
            <appender-ref ref="CONSOLE"/>
            <appender-ref ref="FILE_JSON"/>
        </root>
        
        <!-- 安静一些噪声 -->
        <logger name="org.springframework" level="INFO"/>
        <logger name="org.apache.dubbo" level="INFO"/>
        <logger name="org.mybatis" level="INFO"/>
    </springProfile>
    
    <!-- 生产环境: JSON + TCP到Logstash -->
    <springProfile name="prod">
        <root level="INFO">
            <appender-ref ref="FILE_JSON"/>
            <appender-ref ref="LOGSTASH_TCP"/>
        </root>
        
        <logger name="org.springframework" level="WARN"/>
        <logger name="org.apache.dubbo" level="WARN"/>
    </springProfile>
</configuration>
```

**快速为所有服务生成配置**:
```bash
#!/bin/bash
for service in auth-service user-service order-service chat-service api-gateway; do
    cp services/auth-service/src/main/resources/logback-spring.xml \
       services/$service/src/main/resources/logback-spring.xml
    
    # 替换应用名
    sed -i "s|auth-service|${service}|g" \
        services/$service/src/main/resources/logback-spring.xml
done

echo "✓ 所有logback-spring.xml已创建"
```

### Step 3.3: Docker Compose ELK配置

**文件**: `services/docker-compose.yml`

**添加ELK堆栈**（在Prometheus之后）:
```yaml
  # ========== Elasticsearch ==========
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.2
    container_name: elasticsearch
    restart: unless-stopped
    environment:
      cluster.name: microservices-cluster
      discovery.type: single-node  # 单节点集群
      xpack.security.enabled: false  # 开发环境禁用安全（生产应启用）
      "ES_JAVA_OPTS": "-Xms512m -Xmx512m"  # JVM内存配置
    ports:
      - "9200:9200"  # REST API端口
      - "9300:9300"  # 节点通信端口
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - infra-network
    healthcheck:
      test: curl --fail http://localhost:9200/_cluster/health || exit 1
      interval: 30s
      timeout: 10s
      retries: 5

  # ========== Logstash ==========
  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.2
    container_name: logstash
    restart: unless-stopped
    volumes:
      - ./docker/logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
      - ./docker/logstash-patterns:/usr/share/logstash/patterns:ro
    ports:
      - "5000:5000/tcp"  # TCP输入（应用日志）
      - "9600:9600"      # Monitoring API
    environment:
      LS_JAVA_OPTS: "-Xmx256m -Xms256m"
      LOG_LEVEL: info
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - infra-network
    healthcheck:
      test: curl --fail http://localhost:9600 || exit 1
      interval: 30s
      timeout: 10s
      retries: 3

  # ========== Kibana ==========
  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.2
    container_name: kibana
    restart: unless-stopped
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
      ELASTICSEARCH_USERNAME: elastic  # 如启用认证
      ELASTICSEARCH_PASSWORD: changeme
      KIBANA_DEFAULTAPPID: discover
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - infra-network
    healthcheck:
      test: curl --fail http://localhost:5601/api/status || exit 1
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  elasticsearch_data:
```

### Step 3.4: Logstash配置

**文件**: `docker/logstash.conf` (新建)

```conf
input {
  # TCP输入 - 从应用接收JSON日志
  tcp {
    port => 5000
    codec => json_lines {
      charset => "UTF-8"
    }
    type => "app-logs"
  }
}

filter {
  if [type] == "app-logs" {
    # 解析应用名和环境
    if [application] {
      mutate {
        add_field => {
          "[@metadata][index_prefix]" => "logs-%{[application]}"
          "[@metadata][index_date]" => "%{+YYYY.MM.dd}"
        }
      }
    } else {
      mutate {
        add_field => {
          "[@metadata][index_prefix]" => "logs-unknown"
          "[@metadata][index_date]" => "%{+YYYY.MM.dd}"
        }
      }
    }
    
    # 提取关键字段便于搜索
    if [message] {
      grok {
        match => {
          "message" => "(?<log_message>.*)"
        }
        overwrite => [ "message" ]
      }
    }
    
    # 增强错误日志
    if [level] == "ERROR" or [level] == "WARN" {
      mutate {
        add_tag => [ "alert" ]
        add_field => { "severity" => "high" }
      }
      
      # 提取堆栈跟踪
      if [stacktrace] {
        mutate {
          add_tag => [ "has_stacktrace" ]
        }
      }
    }
    
    # 时间戳处理
    if [@timestamp] {
      date {
        match => [ "@timestamp", "ISO8601" ]
      }
    }
  }
}

output {
  # 输出到Elasticsearch
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index_prefix]}-%{[@metadata][index_date]}"
    document_type => "_doc"  # ES 7.x+ 使用_doc
    codec => json
  }
  
  # 控制台输出（调试用）
  if [@metadata][debug] {
    stdout {
      codec => rubydebug
    }
  }
}
```

**性能优化版本** (可选，用于高日志量场景):
```conf
output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index_prefix]}-%{[@metadata][index_date]}"
    document_type => "_doc"
    codec => json
    # 批量参数
    bulk_path => "/_bulk"
    flush_size => 1000  # 1000条后刷新
    idle_flush_time => 5  # 或5秒
    # 线程池
    pool_size => 8
    workers => 4
    # 重试
    retry_initial_interval => 2
    retry_max_interval => 64
    max_retries => 3
  }
}
```

### Step 3.5: 完整验证ELK日志聚合

```bash
# 1️⃣ 启动ELK Stack
docker-compose up elasticsearch logstash kibana -d
sleep 30  # 等待Elasticsearch启动

# 2️⃣ 验证Elasticsearch健康
curl -s http://localhost:9200/_cluster/health | jq '.'
# 预期: "status": "green"

# 3️⃣ 验证Logstash就绪
curl -s http://localhost:9600 | jq '.version'

# 4️⃣ 启动应用（如未启动）
make dev

# 5️⃣ 生成一些日志
echo "发送50个登录请求以生成日志与错误..."
for i in {1..50}; do
  # 正常请求（应该成功）
  if [ $((i % 10)) -ne 0 ]; then
    curl -s -X POST http://localhost:8080/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"username\":\"user$i\",\"password\":\"Test@1234\"}" > /dev/null
  else
    # 故意失败的请求（触发错误日志）
    curl -s -X POST http://localhost:8080/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"username\":\"invalid\",\"password\":\"wrong\"}" > /dev/null
  fi
done

# 等待日志到达Elasticsearch
sleep 10

# 6️⃣ 验证日志已进入Elasticsearch
curl -s 'http://localhost:9200/_cat/indices' | grep logs
# 预期输出: logs-auth-service, logs-user-service 等

# 7️⃣ 查询日志条数
curl -s 'http://localhost:9200/logs-*/_count' | jq '.count'
# 预期: > 50条日志

# 8️⃣ 查看具体日志内容
curl -s 'http://localhost:9200/logs-auth-service-*/_search?size=1' | jq '.hits.hits[0]._source'

# 9️⃣ 打开Kibana
# 浏览器: http://localhost:5601

# 🔟 在Kibana中创建索引模式
# 侧菜单 → Stack Management → Index Patterns → Create index pattern
# Index pattern: logs-*
# Timestamp field: @timestamp
# → Create index pattern

# 诊断UI出现数据可视化
# Home → Discover → 选择 "logs-*" 索引
# 应该显示所有日志条目，可按字段搜索/过滤

# 测试搜索功能
# 在查询栏输入: level: "ERROR"
# 应该只显示错误日志

# 查看错误堆栈
# 点击某条ERROR日志 → 展开查看完整stacktrace

# 创建可视化 (可选)
# Visualize → Create visualization → Area chart
# Metrics: Count, Buckets: Date histogram (@timestamp)
# 应显示日志随时间的趋势
```

**ELK完成检查清单**:
```
□ pom.xml: logstash-logback-encoder 已添加
□ 5个服务: logback-spring.xml 已创建
□ docker-compose.yml: ELK三件套已添加
□ docker/logstash.conf: 管道配置完成
□ Elasticsearch健康检查通过 (green)
□ Logstash监听TCP 5000端口
□ Kibana Web界面可访问
□ 索引模式已创建: logs-*
□ 能在Discover中查看所有日志
□ 错误日志与INFO日志均可见
□ 至少1条ERROR日志包含完整堆栈跟踪

得分: 2分
预计耗时: 2天
```

---

## 五、Phase 1 最终验收（Day 7）

### 完整系统验证

```bash
# 检查所有容器运行状态
docker ps | grep -E "skywalking|prometheus|grafana|elasticsearch|logstash|kibana"

# 预期: 10个容器都在运行

# ===== Skywalking验证 =====
curl -s http://localhost:8899/api/services | jq '.data[] | .name'
# 预期输出: auth-service, user-service, order-service, chat-service, api-gateway

# ===== Prometheus验证 =====
curl -s 'http://localhost:9090/api/v1/query?query=up' | jq '.data.result | length'
# 预期: 5 (5个服务都是up状态)

# ===== Kibana验证 =====
curl -s 'http://localhost:9200/_cat/indices' | wc -l
# 预期: > 5 (至少5个日志索引)

# ===== 性能基准测试 =====
echo "发起100个请求并记录处理时间..."
time for i in {1..100}; do
  curl -s -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"perf'$i'","password":"Test@1234"}' > /dev/null
done

# 预期: 100个请求在30秒内完成（100 RPS）
```

### 评分确认

```
Skywalking链路追踪: ✓
  得分: 6分
  关键指标:
    ├─ 5个服务注册
    ├─ 跨服务链路完整
    ├─ P95响应时间 < 100ms
    └─ 错误采样率 100%

Prometheus指标收集: ✓
  得分: 4分
  关键指标:
    ├─ 5个服务采集状态 UP
    ├─ 数据保留 30天
    ├─ 3个关键仪表盘
    └─ 告警规则已配置

ELK日志聚合: ✓
  得分: 2分
  关键指标:
    ├─ 所有日志JSON格式
    ├─ 可按服务/级别/关键字搜索
    ├─ 堆栈跟踪完整保存
    └─ 日志保留 30天

━━━━━━━━━━━━━━━━━━
Phase 1 总计: 12分 ✓
评分: 70 → 82分
```

---

## 六、故障排查速查表

| 问题 | 症状 | 解决方案 |
|------|------|--------|
| **Skywalking无数据** | UI中Services为空 | 1. 检查Agent启动参数<br>2. 验证skywalking-oap:11800网络畅通<br>3. 查看应用日志中是否有启动Agent |
| **Prometheus采集失败** | 所有target显示 DOWN | 1. 检查服务/actuator/prometheus端点<br>2. 验证Docker网络<br>3. 检查防火墙 |
| **Kibana没有日志** | Index Patterns为空 | 1. 检查logstash.conf中TCP端口<br>2. 验证应用logback配置<br>3. 查看logstash日志: docker logs logstash |
| **Grafana无数据源** | Data Sources为空 | 1. 手动添加Prometheus数据源<br>2. 检查URL: http://prometheus:9090<br>3. 保存并测试 |
| **磁盘空间不足** | 容器无法启动 | docker system prune -a && docker system prune --volumes |
| **内存用尽** | 随机容器奔溃 | 提高Docker Desktop内存分配 (>8GB) |

---

## 七、迭代优化建议

### Phase 1.5 (Week 2.5 执行)

当基础可观测性就绪后，可进行以下优化：

1. **Skywalking采样率优化**
   - 开发: 100% （记录所有请求）
   - 生产: 10-20% （采样减少存储）

2. **Prometheus持久化**
   ```yaml
   volumes:
     - ./prometheus_data:/prometheus
     - ./prometheus.yml:/etc/prometheus/prometheus.yml
   ```

3. **ELK性能优化**
   - 增加副本数: 3分片×2副本
   - 配置生命周期策略: hot→warm→cold
   - 启用压缩

4. **告警平台集成**
   - Alertmanager用于告警聚合
   - 邮件/钉钉/企业微信通知
   - Slack integration

---

**下一步**: Phase 2 - 事件驱动架构 (第3-4周)

预期产出：
- Kafka消息队列
- 异步事件处理
- 最终一致性保证
