# 第三阶段：Token 刷新机制

**预计时间**：3-4 天

## 概述

本阶段实现 Token 刷新机制，包括 Redis 集成、Token 轮换服务、刷新接口和登出接口。确保 Token 安全性和可管理性。

## 3.1 Redis 集成

### 步骤 3.1.1：添加 Redis 依赖

- 打开文件：`services/user-service/pom.xml`
- 添加依赖：
  ```xml
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-redis</artifactId>
  </dependency>
  ```

- **验收标准**：依赖下载成功

### 步骤 3.1.2：配置 Redis

- 打开文件：`services/user-service/src/main/resources/application.yml`
- 添加 Redis 配置：
  ```yaml
  spring:
    data:
      redis:
        host: ${REDIS_HOST:localhost}
        port: ${REDIS_PORT:6379}
        password: ${REDIS_PASSWORD:}
        database: 0
  ```

- 启动 Redis 服务（Docker 或本地）
- **验收标准**：Redis 连接成功，配置加载正常

### 步骤 3.1.3：创建 RedisTemplate 配置

- 创建文件：`services/user-service/src/main/java/com/example/user/config/RedisConfig.java`
- 配置 RedisTemplate（String 序列化）
- **验收标准**：RedisTemplate Bean 创建成功

## 3.2 Token 轮换服务

### 步骤 3.2.1：创建 TokenRotationService

- 创建文件：`services/user-service/src/main/java/com/example/user/service/TokenRotationService.java`
- 实现 `storeRefreshToken()` 方法（存储到 Redis）
- 实现 `validateRefreshToken()` 方法（验证 Token 有效性）
- 实现 `markTokenAsUsed()` 方法（标记 Token 已使用）
- 实现 `revokeToken()` 方法（撤销 Token，加入黑名单）
- 实现 `checkTokenReuse()` 方法（检测 Token 重用）
- **验收标准**：Token 轮换逻辑实现完整，单元测试通过

### 步骤 3.2.2：修改登录接口集成 Token 存储

- 修改 `AuthController.login()` 方法
- 登录成功后调用 `TokenRotationService.storeRefreshToken()`
- 将 Refresh Token 存储到 Redis（Key: `refresh_token:{userId}:{deviceId}`）
- **验收标准**：登录后 Refresh Token 正确存储到 Redis

## 3.3 刷新 Token 接口

### 步骤 3.3.1：实现刷新接口

- 在 `AuthController` 中添加 `POST /api/v1/auth/refresh` 方法
- 验证 Refresh Token 有效性（从 Redis 查询）
- 检测 Token 重用（如果旧 Token 被重用，撤销所有 Token）
- 生成新的 Access Token 和 Refresh Token
- 标记旧 Refresh Token 已使用
- 存储新 Refresh Token 到 Redis
- 返回新的 Token（遵循 OAuth 2.0 格式）
- 添加单元测试
- **验收标准**：刷新接口功能正常，Token 轮换正确，测试通过

### 步骤 3.3.2：实现登出接口

- 在 `AuthController` 中添加 `POST /api/v1/auth/logout` 方法
- 验证 Access Token
- 从 Token 中提取 Refresh Token ID
- 调用 `TokenRotationService.revokeToken()` 将 Token 加入黑名单
- 返回成功响应
- 添加单元测试
- **验收标准**：登出接口功能正常，Token 正确撤销，测试通过

### 步骤 3.3.3：集成测试

- 测试完整流程：登录 → 刷新 Token → 登出
- 测试 Token 重用检测
- 测试 Token 黑名单功能
- **验收标准**：集成测试通过，所有场景正常

## 相关文件

- `services/user-service/pom.xml` - 添加 Redis 依赖
- `services/user-service/src/main/resources/application.yml` - Redis 配置
- `services/user-service/src/main/java/com/example/user/config/RedisConfig.java` - Redis 配置类
- `services/user-service/src/main/java/com/example/user/service/TokenRotationService.java` - Token 轮换服务
- `services/user-service/src/main/java/com/example/user/controller/AuthController.java` - 刷新和登出接口

## 依赖关系

- **依赖第一阶段**：需要 JWT 服务已实现
- **依赖 Redis**：需要 Redis 服务运行

## 验收标准总结

- ✅ Redis 连接成功，配置加载正常
- ✅ Token 轮换逻辑实现完整，单元测试通过
- ✅ 登录后 Refresh Token 正确存储到 Redis
- ✅ 刷新接口功能正常，Token 轮换正确，测试通过
- ✅ 登出接口功能正常，Token 正确撤销，测试通过
- ✅ 集成测试通过，所有场景正常
