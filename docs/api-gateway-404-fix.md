# API Gateway 404 错误修复指南

## 问题描述

访问 `/api/auth/register` 接口时返回 404 错误：

```json
{
  "timestamp": "2026-01-28T15:54:39.708+00:00",
  "path": "/api/auth/register",
  "status": 404,
  "error": "Not Found",
  "requestId": "16e87851-13"
}
```

## 问题原因

**根本原因**：`application-docker.yml` 配置文件中缺少认证路由配置。

### 配置对比

**`application.yml`（开发环境）** ✅ 包含认证路由：
```yaml
routes:
  - id: auth-service
    uri: lb://user-service
    predicates:
      - Path=/api/auth/**
```

**`application-docker.yml`（Docker 环境）** ❌ 缺少认证路由：
```yaml
routes:
  # 只有 user-service 和 order-service 路由
  # 缺少 auth-service 路由！
```

## 解决方案

### 方案 1：重新构建 API Gateway 镜像（推荐）

配置文件已修复，需要重新构建镜像：

```bash
# 1. 停止 API Gateway
docker-compose -f docker-compose.prod.yml stop api-gateway

# 2. 重新构建镜像
docker-compose -f docker-compose.prod.yml build api-gateway

# 3. 启动服务
docker-compose -f docker-compose.prod.yml up -d api-gateway

# 4. 查看日志确认路由已加载
docker-compose -f docker-compose.prod.yml logs -f api-gateway
```

### 方案 2：使用已修复的配置重新构建（生产环境）

如果使用远程镜像仓库：

```bash
# 1. 重新构建并推送镜像
docker-compose -f docker-compose.prod.yml build api-gateway
docker tag gzhidao1010/api-gateway:latest gzhidao1010/api-gateway:v1.0.1
docker push gzhidao1010/api-gateway:v1.0.1

# 2. 更新 docker-compose.prod.yml 使用新标签
# 设置环境变量
export TAG=v1.0.1

# 3. 重新启动
docker-compose -f docker-compose.prod.yml up -d api-gateway
```

### 方案 3：临时修复（不推荐，仅用于测试）

如果需要快速测试，可以进入容器手动修改配置：

```bash
# 1. 进入容器
docker exec -it api-gateway sh

# 2. 编辑配置文件（需要安装编辑器）
# 注意：容器重启后配置会丢失

# 3. 重启 Spring Boot 应用
# 这需要应用支持动态重载配置
```

## 已修复的配置

**文件**：`services/api-gateway/src/main/resources/application-docker.yml`

**修复内容**：
```yaml
routes:
  # 用户服务路由
  - id: user-service
    uri: lb://user-service
    predicates:
      - Path=/api/users/**
  
  # 订单服务路由
  - id: order-service
    uri: lb://order-service
    predicates:
      - Path=/api/orders/**
  
  # ✅ 新增：认证相关路由（已修复）
  - id: auth-service
    uri: lb://user-service
    predicates:
      - Path=/api/auth/**
```

## 验证修复

### 1. 检查路由配置

```bash
# 查看 API Gateway 日志，确认路由已加载
docker-compose -f docker-compose.prod.yml logs api-gateway | grep -i route
```

### 2. 测试 API 端点

```powershell
# PowerShell 测试
$body = @{
    email = "test@example.com"
    password = "Test123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -UseBasicParsing
```

### 3. 通过 Nginx 代理测试

```powershell
# 通过 Nginx 代理测试（模拟实际访问）
Invoke-WebRequest -Uri "http://web.example.com:8888/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -UseBasicParsing
```

## 路由配置说明

### 完整的路由配置

API Gateway 应该包含以下路由：

| 路由 ID | 路径模式 | 目标服务 | 说明 |
|---------|---------|---------|------|
| `user-service` | `/api/users/**` | `user-service` | 用户管理相关 API |
| `order-service` | `/api/orders/**` | `order-service` | 订单管理相关 API |
| `auth-service` | `/api/auth/**` | `user-service` | 认证相关 API（注册、登录、刷新 Token）|

### 路由匹配规则

- `/api/auth/register` → 匹配 `auth-service` 路由 → 转发到 `user-service`
- `/api/auth/login` → 匹配 `auth-service` 路由 → 转发到 `user-service`
- `/api/auth/refresh` → 匹配 `auth-service` 路由 → 转发到 `user-service`
- `/api/users/**` → 匹配 `user-service` 路由 → 转发到 `user-service`
- `/api/orders/**` → 匹配 `order-service` 路由 → 转发到 `order-service`

## 相关文件

- `services/api-gateway/src/main/resources/application.yml` - 开发环境配置
- `services/api-gateway/src/main/resources/application-docker.yml` - Docker 环境配置（已修复）
- `services/user-service/src/main/java/com/example/user/controller/AuthController.java` - 认证控制器

## 预防措施

### 1. 配置同步检查清单

在修改路由配置时，确保：

- [ ] `application.yml` 和 `application-docker.yml` 配置一致
- [ ] 所有环境配置文件都已更新
- [ ] 路由 ID 唯一
- [ ] 路径模式不冲突

### 2. 配置验证脚本

创建配置验证脚本 `scripts/verify-gateway-config.sh`：

```bash
#!/bin/bash
# 验证 API Gateway 配置一致性

echo "检查配置文件..."

# 检查认证路由是否存在
if grep -q "auth-service" services/api-gateway/src/main/resources/application.yml && \
   grep -q "auth-service" services/api-gateway/src/main/resources/application-docker.yml; then
    echo "✅ 认证路由配置一致"
else
    echo "❌ 认证路由配置不一致！"
    exit 1
fi

echo "✅ 配置检查通过"
```

### 3. CI/CD 检查

在 CI/CD 流程中添加配置检查：

```yaml
# .github/workflows/ci.yml
- name: Verify Gateway Config
  run: |
    # 检查配置文件一致性
    diff <(grep -A 3 "auth-service" services/api-gateway/src/main/resources/application.yml) \
         <(grep -A 3 "auth-service" services/api-gateway/src/main/resources/application-docker.yml)
```

## 常见问题

### Q1: 为什么重启容器不生效？

**A**: 配置文件是在构建镜像时打包进去的，重启容器不会重新加载配置文件。需要重新构建镜像。

### Q2: 如何在不重新构建的情况下测试？

**A**: 可以使用 Spring Cloud Config 或 Nacos 配置中心实现动态配置，但需要额外配置。

### Q3: 如何确认路由已加载？

**A**: 查看 API Gateway 启动日志，应该能看到路由加载信息。或者访问 `/actuator/gateway/routes` 端点（如果已启用）。

## 相关文档

- [API 结构规范](../.cursor/rules/06-API结构.mdc)
- [Docker Compose 配置分析](./docker-compose-analysis.md)
- [API Gateway 配置技能](../.cursor/skills/api-gateway-config/SKILL.md)
