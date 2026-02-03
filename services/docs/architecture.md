# Services 微服务架构文档

## 目录

- [1. 架构概览](#1-架构概览)
- [2. 技术栈](#2-技术栈)
- [3. 模块说明](#3-模块说明)
- [4. 服务通信](#4-服务通信)
- [5. 端口规划](#5-端口规划)
- [6. API 接口](#6-api-接口)
- [7. 启动指南](#7-启动指南)
- [8. 项目结构](#8-项目结构)
- [9. 流量控制（Sentinel）](#9-流量控制sentinel)
- [10. 分布式事务（Saga Pattern）](#10-分布式事务saga-pattern)

---

## 1. 架构概览

本项目是一个基于 **Spring Boot 3 + Spring Cloud + Dubbo** 的微服务示例项目，展示了微服务架构的核心概念和实践。

### 1.1 架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              客户端请求                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API Gateway (端口 8080)                              │
│                      Spring Cloud Gateway + Nacos                           │
│                                                                             │
│  路由规则：                                                                   │
│  • /api/users/**  → user-service                                            │
│  • /api/orders/** → order-service                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
┌───────────────────────────────┐     ┌───────────────────────────────┐
│      user-service             │     │      order-service            │
│      (端口 8001)               │     │      (端口 8002)               │
│                               │     │                               │
│  HTTP REST API:               │     │  HTTP REST API:               │
│  • GET /api/users             │     │  • GET /api/orders            │
│  • GET /api/users/{id}        │     │  • GET /api/orders/{id}       │
│                               │     │  • POST /api/orders           │
│  Dubbo RPC 服务:               │     │                               │
│  • UserService (端口 20880)    │◄────│  Dubbo RPC 调用               │
│                               │     │  • @DubboReference            │
└───────────────────────────────┘     └───────────────────────────────┘
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Nacos (端口 8848)                                  │
│                       服务注册中心 & 配置中心                                   │
│                                                                             │
│  注册的服务：                                                                 │
│  • user-service  (HTTP: 8001)                                               │
│  • order-service (HTTP: 8002)                                               │
│  • api-gateway   (HTTP: 8080)                                               │
│  • providers:com.example.api.service.UserService (Dubbo: 20880)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心特性

| 特性 | 实现方式 |
|------|---------|
| **服务注册发现** | Nacos |
| **API 网关** | Spring Cloud Gateway |
| **负载均衡** | Spring Cloud LoadBalancer |
| **服务间通信** | Dubbo RPC |
| **流量控制** | Sentinel（限流、熔断、降级） |
| **共享模型** | api-common 模块 |

---

## 2. 技术栈

### 2.1 框架版本

| 组件 | 版本 | 说明 |
|------|------|------|
| **Java** | 17 | LTS 版本 |
| **Spring Boot** | 3.2.0 | 核心框架 |
| **Spring Cloud** | 2023.0.0 | 微服务套件 |
| **Spring Cloud Alibaba** | 2023.0.1.0 | Nacos 集成 |
| **Apache Dubbo** | 3.2.10 | RPC 框架 |
| **Nacos** | 2.x | 注册中心 |

### 2.2 依赖说明

```xml
<!-- 核心依赖 -->
spring-boot-starter-web          <!-- Web 服务 -->
spring-cloud-starter-gateway     <!-- API 网关 -->
spring-cloud-starter-loadbalancer <!-- 负载均衡 -->
spring-cloud-starter-alibaba-nacos-discovery <!-- 服务发现 -->
dubbo-spring-boot-starter        <!-- Dubbo RPC -->
spring-boot-starter-actuator     <!-- 健康检查 -->
lombok                           <!-- 代码简化 -->
```

---

## 3. 模块说明

### 3.1 模块依赖关系

```
microservices-demo (父 POM)
├── api-common        # 共享模块（模型 + 接口）
├── user-service      # 用户服务（依赖 api-common）
├── order-service     # 订单服务（依赖 api-common）
└── api-gateway       # API 网关
```

### 3.2 各模块详解

#### 📦 api-common（共享模块）

**职责**：定义服务间共享的模型类和接口

```
api-common/
└── src/main/java/com/example/api/
    ├── model/
    │   └── User.java           # 用户模型（实现 Serializable）
    └── service/
        └── UserService.java    # Dubbo 服务接口
```

**关键代码**：

```java
// User.java - 必须实现 Serializable 以支持 Dubbo 序列化
@Data
public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;
    private String name;
    private String email;
    private String phone;
}

// UserService.java - Dubbo 服务接口
public interface UserService {
    User getUserById(Long id);
    List<User> getAllUsers();
}
```

---

#### 👤 user-service（用户服务）

**职责**：提供用户相关的 REST API 和 Dubbo RPC 服务

```
user-service/
└── src/main/java/com/example/user/
    ├── UserServiceApplication.java     # 启动类
    ├── controller/
    │   └── UserController.java         # REST 控制器
    └── service/impl/
        └── UserServiceImpl.java        # Dubbo 服务实现
```

**配置要点**（application.yml）：

```yaml
server:
  port: 8001                    # HTTP 端口

dubbo:
  application:
    name: user-service
    register-mode: interface    # 关键：只注册接口级服务，避免与 Gateway 冲突
  protocol:
    port: 20880                 # Dubbo RPC 端口
```

**服务实现**：

```java
@DubboService  // 标记为 Dubbo 服务提供者
@Service
public class UserServiceImpl implements UserService {
    // 实现 UserService 接口方法
}
```

---

#### 📦 order-service（订单服务）

**职责**：提供订单相关的 REST API，并通过 Dubbo 调用 user-service

```
order-service/
└── src/main/java/com/example/order/
    ├── OrderServiceApplication.java    # 启动类
    ├── controller/
    │   └── OrderController.java        # REST 控制器 + Dubbo 消费者
    └── model/
        └── Order.java                  # 订单模型
```

**Dubbo 服务调用**：

```java
@RestController
public class OrderController {
    
    @DubboReference  // 注入远程 Dubbo 服务
    private UserService userService;
    
    @PostMapping("/api/orders")
    public Order createOrder(@RequestBody Order order) {
        // 通过 Dubbo RPC 调用 user-service
        User user = userService.getUserById(order.getUserId());
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        // ...
    }
}
```

---

#### 🚪 api-gateway（API 网关）

**职责**：统一入口，路由转发，负载均衡

```
api-gateway/
└── src/main/java/com/example/gateway/
    └── ApiGatewayApplication.java      # 启动类
```

**路由配置**（application.yml）：

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service        # lb:// 表示使用负载均衡
          predicates:
            - Path=/api/users/**
        
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
```

---

## 4. 服务通信

### 4.1 通信方式

本项目同时使用两种通信方式：

| 通信方式 | 使用场景 | 示例 |
|---------|---------|------|
| **HTTP REST** | 客户端 → 服务 | 浏览器访问 `/api/users` |
| **Dubbo RPC** | 服务 → 服务 | order-service 调用 user-service |

### 4.2 通信流程图

```
┌──────────┐    HTTP     ┌──────────┐    HTTP     ┌──────────────┐
│  客户端   │ ─────────► │ Gateway  │ ─────────► │ user-service │
└──────────┘   :8080     └──────────┘   :8001     └──────────────┘

┌──────────────┐   Dubbo RPC    ┌──────────────┐
│order-service │ ─────────────► │ user-service │
│   :20881     │    :20880      │   :20880     │
└──────────────┘                └──────────────┘
```

### 4.3 服务发现流程

```
1. 启动 Nacos (端口 8848)

2. 启动 user-service
   → 向 Nacos 注册 HTTP 服务 (user-service:8001)
   → 向 Nacos 注册 Dubbo 接口 (UserService:20880)

3. 启动 order-service
   → 向 Nacos 注册 HTTP 服务 (order-service:8002)
   → 从 Nacos 发现 UserService 接口地址
   → 建立 Dubbo 连接到 user-service:20880

4. 启动 api-gateway
   → 从 Nacos 发现 user-service 和 order-service
   → 路由请求到对应服务
```

---

## 5. 端口规划

| 服务 | HTTP 端口 | Dubbo 端口 | 说明 |
|------|----------|-----------|------|
| **Nacos** | 8848 | - | 注册中心 |
| **api-gateway** | 8080 | - | API 网关 |
| **user-service** | 8001 | 20880 | 用户服务 |
| **order-service** | 8002 | 20881 | 订单服务 |

---

## 6. API 接口

### 6.1 通过 Gateway 访问（推荐）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `http://localhost:8080/api/users` | 获取所有用户 |
| GET | `http://localhost:8080/api/users/{id}` | 获取单个用户 |
| GET | `http://localhost:8080/api/orders` | 获取所有订单 |
| GET | `http://localhost:8080/api/orders/{id}` | 获取单个订单 |
| POST | `http://localhost:8080/api/orders` | 创建订单 |

### 6.2 直接访问服务

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `http://localhost:8001/api/users` | 直接访问 user-service |
| GET | `http://localhost:8002/api/orders` | 直接访问 order-service |

### 6.3 接口示例

**获取所有用户**：

```bash
curl http://localhost:8080/api/users
```

响应：

```json
[
  {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138000"
  },
  {
    "id": 2,
    "name": "李四",
    "email": "lisi@example.com",
    "phone": "13900139000"
  }
]
```

**创建订单**：

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "productName": "iPhone 15", "price": 7999.00, "quantity": 1}'
```

响应：

```json
{
  "id": 1,
  "userId": 1,
  "productName": "iPhone 15",
  "price": 7999.00,
  "quantity": 1,
  "status": "待支付"
}
```

---

## 7. 启动指南

### 7.1 前置条件

1. **JDK 17+**
2. **Maven 3.8+**
3. **Nacos Server 2.x**（[下载地址](https://github.com/alibaba/nacos/releases)）

### 7.2 启动顺序

```bash
# 1. 启动 Nacos（在 Nacos 目录下）
# Windows
bin\startup.cmd -m standalone

# Linux/Mac
sh bin/startup.sh -m standalone

# 2. 编译项目（在 services 目录下）
cd services
mvn clean install

# 3. 启动 user-service
cd user-service
mvn spring-boot:run

# 4. 启动 order-service（新终端）
cd order-service
mvn spring-boot:run

# 5. 启动 api-gateway（新终端）
cd api-gateway
mvn spring-boot:run
```

### 7.3 验证服务

```bash
# 1. 检查 Nacos 控制台
浏览器访问: http://localhost:8848/nacos
账号/密码: nacos/nacos

# 2. 测试 API
curl http://localhost:8080/api/users
curl http://localhost:8080/api/orders
```

---

## 8. 项目结构

```
services/
├── pom.xml                          # 父 POM（依赖版本管理）
├── docs/
│   ├── architecture.md              # 架构文档（本文件）
│   └── java-microservices-guide.md  # 微服务开发指南
│
├── api-common/                      # 共享模块
│   ├── pom.xml
│   └── src/main/java/com/example/api/
│       ├── model/
│       │   └── User.java            # 用户模型
│       └── service/
│           └── UserService.java     # Dubbo 接口
│
├── user-service/                    # 用户服务
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/example/user/
│       │   ├── UserServiceApplication.java
│       │   ├── controller/
│       │   │   └── UserController.java
│       │   └── service/impl/
│       │       └── UserServiceImpl.java
│       └── resources/
│           └── application.yml
│
├── order-service/                   # 订单服务
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/example/order/
│       │   ├── OrderServiceApplication.java
│       │   ├── controller/
│       │   │   └── OrderController.java
│       │   └── model/
│       │       └── Order.java
│       └── resources/
│           └── application.yml
│
└── api-gateway/                     # API 网关
    ├── pom.xml
    └── src/main/
        ├── java/com/example/gateway/
        │   ├── ApiGatewayApplication.java
        │   └── config/
        │       └── SentinelGatewayConfig.java  # Sentinel 限流配置
        └── resources/
            └── application.yml
```

---

## 附录

### A. 常见问题

#### Q1: Gateway 访问报 500 错误

**原因**：Dubbo 的应用级服务和 Spring Cloud 服务发现冲突

**解决**：在 Dubbo 配置中添加 `register-mode: interface`

```yaml
dubbo:
  application:
    register-mode: interface
```

#### Q2: Dubbo 调用失败

**检查项**：
1. Nacos 是否启动
2. 服务提供者是否注册成功
3. 接口是否实现 Serializable

#### Q3: 端口冲突

**解决**：修改 `application.yml` 中的端口配置

### B. 扩展方向

- [ ] 添加配置中心（Nacos Config）
- [ ] 添加链路追踪（SkyWalking / Zipkin）
- [ ] 添加熔断降级（Sentinel）✅ 已实现
- [ ] 添加分布式事务（Seata）
- [ ] 添加消息队列（RocketMQ）
- [ ] 添加数据库（MySQL + MyBatis-Plus）

---

## 9. 流量控制（Sentinel）

### 9.1 功能概述

API Gateway 集成了 **Alibaba Sentinel** 实现流量控制：

| 功能 | 说明 |
|------|------|
| **限流** | 限制每秒请求数（QPS） |
| **熔断** | 服务异常时快速失败 |
| **降级** | 返回友好的限流响应 |
| **监控** | 实时流量监控（需启动控制台） |

### 9.2 限流规则

| 路由 | QPS 限制 | 突发流量 | 说明 |
|------|---------|---------|------|
| `user-service` | 100/秒 | +20 | 用户服务 |
| `order-service` | 50/秒 | +10 | 订单服务（操作较重） |

### 9.3 限流响应

当请求被限流时，返回 HTTP 429 状态码：

```json
{
  "code": 429,
  "message": "请求过于频繁，请稍后再试",
  "success": false,
  "timestamp": 1705825200000
}
```

### 9.4 Sentinel 控制台（可选）

如需使用可视化监控，需要启动 Sentinel Dashboard：

```bash
# 下载 Sentinel Dashboard
# https://github.com/alibaba/Sentinel/releases

# 启动控制台（端口 8858）
java -Dserver.port=8858 -jar sentinel-dashboard-1.8.7.jar

# 访问控制台
浏览器打开: http://localhost:8858
账号/密码: sentinel/sentinel
```

### 9.5 配置文件说明

```yaml
# api-gateway/application.yml
spring:
  cloud:
    sentinel:
      transport:
        port: 8719              # 与控制台通信的端口
        dashboard: localhost:8858  # 控制台地址
      eager: true               # 启动时就连接控制台
      scg:
        fallback:
          mode: response        # 限流后返回响应
          response-status: 429  # HTTP 状态码
```

### 9.6 代码配置

限流规则在 `SentinelGatewayConfig.java` 中配置：

```java
// 用户服务：每秒 100 个请求
rules.add(new GatewayFlowRule("user-service")
        .setCount(100)        // QPS 阈值
        .setIntervalSec(1)    // 统计窗口 1 秒
        .setBurst(20));       // 突发流量允许 +20

// 订单服务：每秒 50 个请求
rules.add(new GatewayFlowRule("order-service")
        .setCount(50)
        .setIntervalSec(1)
        .setBurst(10));
```

---

## 10. 分布式事务（Saga Pattern）

### 10.1 概述

项目使用 **Saga Pattern（编排式）** 管理微服务架构中的分布式事务，确保跨服务操作的数据一致性。

**实现位置**：`auth-service/src/main/java/com/example/auth/saga/`

### 10.2 核心组件

| 组件 | 说明 | 文件 |
|------|------|------|
| **SagaContext** | Saga 上下文，存储执行状态和数据 | `SagaContext.java` |
| **SagaStep** | Saga 步骤，定义执行和补偿逻辑 | `SagaStep.java` |
| **SagaOrchestrator** | Saga 编排器，管理执行和补偿 | `SagaOrchestrator.java` |
| **RegistrationSaga** | 注册流程 Saga 实现 | `RegistrationSaga.java` |

### 10.3 注册流程 Saga

**Saga 步骤**：

1. **创建用户**（`createUser`）
   - 操作：调用 `userClient.createUser()`
   - 补偿：调用 `userClient.deleteUser()`

2. **发送邮箱验证邮件**（`sendEmailVerification`）
   - 操作：调用 `userClient.sendEmailVerification()`
   - 补偿：无需补偿（邮件发送是幂等的）

**执行流程**：

```
用户注册请求
  ↓
Step 1: 创建用户
  ├─ 成功 → 继续
  └─ 失败 → 抛出异常
  ↓
Step 2: 发送验证邮件
  ├─ 成功 → 返回成功
  └─ 失败 → 执行补偿（删除用户）→ 抛出异常
```

### 10.4 优势

- ✅ **数据一致性**：注册失败时自动回滚，不会留下脏数据
- ✅ **可扩展性**：易于添加新的 Saga 步骤或新的 Saga
- ✅ **可观测性**：Saga ID 用于追踪整个流程
- ✅ **错误处理**：自动补偿机制，补偿失败时记录告警

### 10.5 使用示例

```java
@Service
public class AuthService {
    private final RegistrationSaga registrationSaga;
    
    public RegisterResponse register(RegisterRequest request) {
        // 密码策略验证
        validatePassword(request.getPassword());
        
        // 使用 Saga Pattern 执行注册流程
        return registrationSaga.execute(request);
    }
}
```

### 10.6 详细文档

更多详细信息请参考：[Saga Pattern 实现文档](./saga-pattern.md)
