# Saga Pattern 实现文档

## 概述

本文档描述了项目中 Saga Pattern（编排式）的实现，用于管理微服务架构中的分布式事务。

## 什么是 Saga Pattern？

Saga Pattern 是一种管理分布式事务的模式，通过一系列本地事务来维护跨多个微服务的数据一致性。每个本地事务更新数据库并触发下一个步骤。如果任何步骤失败，补偿事务会撤销之前的更改。

### 两种协调方式

1. **编排式（Orchestration）**：中央编排器显式命令每个服务执行操作（本项目采用）
2. **编排式（Choreography）**：服务发布领域事件，自动触发其他服务的操作

本项目采用**编排式（Orchestration）**方式，因为：
- ✅ 更好的可见性和错误处理
- ✅ 减少服务间的隐式依赖
- ✅ 更容易监控和调试
- ✅ 适合复杂的业务流程

## 架构设计

### 核心组件

```
auth-service/
└── saga/
    ├── SagaContext.java          # Saga 上下文（存储状态和数据）
    ├── SagaStep.java             # Saga 步骤（定义执行和补偿逻辑）
    ├── SagaOrchestrator.java     # Saga 编排器（管理执行和补偿）
    └── RegistrationSaga.java    # 注册流程 Saga（具体业务实现）
```

### 类图

```
┌─────────────────┐
│ SagaContext     │
├─────────────────┤
│ + sagaId        │
│ + completedSteps│
│ + data          │
└─────────────────┘
         ▲
         │
         │ uses
         │
┌─────────────────┐
│ SagaStep        │
├─────────────────┤
│ + name          │
│ + order         │
│ + action        │
│ + compensation  │
└─────────────────┘
         ▲
         │
         │ contains
         │
┌─────────────────┐      ┌──────────────────┐
│ SagaOrchestrator│─────▶│ RegistrationSaga │
├─────────────────┤      ├──────────────────┤
│ + execute()     │      │ + execute()      │
│ + compensate()  │      └──────────────────┘
└─────────────────┘
```

## 实现细节

### 1. SagaContext（Saga 上下文）

存储 Saga 执行过程中的状态和数据：

```java
public class SagaContext {
    private String sagaId;                    // Saga ID（用于追踪）
    private Set<String> completedSteps;       // 已完成的步骤
    private Map<String, Object> data;         // 数据存储
}
```

**用途**：
- 追踪已完成的步骤（用于补偿）
- 存储步骤间的数据传递
- 提供 Saga ID 用于日志和监控

### 2. SagaStep（Saga 步骤）

定义执行逻辑和补偿逻辑：

```java
public class SagaStep {
    private final String name;                // 步骤名称
    private final int order;                  // 执行顺序
    private final Supplier<Object> action;    // 执行逻辑
    private final Runnable compensation;      // 补偿逻辑
}
```

**特点**：
- 每个步骤都有明确的执行顺序
- 每个步骤都有对应的补偿操作
- 补偿操作在步骤失败时自动执行

### 3. SagaOrchestrator（Saga 编排器）

管理 Saga 的执行和补偿：

```java
@Component
public class SagaOrchestrator {
    public Object execute(List<SagaStep> steps, SagaContext context) {
        // 1. 按顺序执行步骤
        // 2. 如果任何步骤失败，逆序执行补偿
        // 3. 返回执行结果或抛出异常
    }
}
```

**执行流程**：
1. 按 `order` 排序步骤
2. 顺序执行每个步骤
3. 如果步骤失败，逆序执行已完成步骤的补偿操作
4. 补偿失败时记录日志（不中断补偿流程）

### 4. RegistrationSaga（注册流程 Saga）

实现用户注册的 Saga：

```java
@Service
public class RegistrationSaga {
    public RegisterResponse execute(RegisterRequest request) {
        // Step 1: 创建用户
        // Step 2: 发送邮箱验证邮件
        
        // 补偿：如果 Step 2 失败，删除已创建的用户
    }
}
```

**Saga 步骤**：

| 步骤 | 名称 | 顺序 | 操作 | 补偿 |
|------|------|------|------|------|
| Step 1 | `createUser` | 1 | 调用 `userClient.createUser()` | 调用 `userClient.deleteUser()` |
| Step 2 | `sendEmailVerification` | 2 | 调用 `userClient.sendEmailVerification()` | 无需补偿（邮件发送是幂等的） |

## 使用示例

### 注册流程 Saga 执行流程

```
1. 用户调用 /api/auth/register
   ↓
2. AuthService.register() 调用 RegistrationSaga.execute()
   ↓
3. SagaOrchestrator 开始执行 Saga
   ↓
4. Step 1: 创建用户
   ├─ 成功 → 标记为已完成，继续
   └─ 失败 → 执行补偿（无），抛出异常
   ↓
5. Step 2: 发送邮箱验证邮件
   ├─ 成功 → 标记为已完成，返回成功
   └─ 失败 → 执行补偿（删除用户），抛出异常
   ↓
6. 返回注册成功响应
```

### 补偿流程示例

```
Step 2 失败
   ↓
SagaOrchestrator 检测到异常
   ↓
逆序执行补偿：
   ↓
1. Step 2 补偿（无需操作）
   ↓
2. Step 1 补偿：删除用户
   ├─ 成功 → 记录日志
   └─ 失败 → 记录错误日志，发送告警（TODO）
   ↓
3. 抛出原始异常
```

## 优势

### 1. 数据一致性

- ✅ 如果注册失败，不会留下脏数据（用户已创建但邮件未发送）
- ✅ 补偿操作确保数据回滚

### 2. 可扩展性

- ✅ 易于添加新的 Saga 步骤
- ✅ 易于修改步骤顺序
- ✅ 易于添加新的 Saga（如订单 Saga、支付 Saga）

### 3. 可观测性

- ✅ Saga ID 用于追踪整个流程
- ✅ 详细的日志记录每个步骤的执行情况
- ✅ 补偿操作的执行情况也被记录

### 4. 错误处理

- ✅ 自动补偿机制
- ✅ 补偿失败时的告警机制（TODO）
- ✅ 清晰的错误信息

## 最佳实践

### 1. 步骤设计

- ✅ **步骤应该是原子的**：每个步骤应该是一个独立的操作
- ✅ **补偿应该是幂等的**：多次执行补偿应该产生相同的结果
- ✅ **步骤顺序要合理**：先执行不可逆的操作，后执行可逆的操作

### 2. 错误处理

- ✅ **补偿失败要记录**：补偿失败时记录详细日志
- ✅ **补偿失败要告警**：补偿失败时发送告警通知（TODO）
- ✅ **补偿失败要人工介入**：补偿失败时可能需要人工处理

### 3. 监控和日志

- ✅ **记录 Saga ID**：每个 Saga 都有唯一的 ID
- ✅ **记录步骤执行情况**：记录每个步骤的开始、成功、失败
- ✅ **记录补偿执行情况**：记录补偿操作的执行情况

## 未来改进

### 1. 补偿失败处理

当前补偿失败时只记录日志，未来可以：

- [ ] 发送告警通知（邮件、Slack、钉钉等）
- [ ] 记录到死信队列（Dead Letter Queue）
- [ ] 提供人工介入的界面

### 2. Saga 状态持久化

当前 Saga 状态只在内存中，未来可以：

- [ ] 持久化到数据库（支持 Saga 恢复）
- [ ] 支持 Saga 的暂停和恢复
- [ ] 支持 Saga 的查询和监控

### 3. Saga 框架集成

当前是自定义实现，未来可以：

- [ ] 集成 Temporal（企业级 Saga 框架）
- [ ] 集成 Conductor（Netflix 的 Saga 框架）
- [ ] 集成 Seata（分布式事务框架）

### 4. 异步 Saga

当前是同步执行，未来可以：

- [ ] 支持异步 Saga（长时间运行的 Saga）
- [ ] 支持 Saga 的超时和重试
- [ ] 支持 Saga 的并行执行

## 相关文档

- [微服务架构文档](./architecture.md)
- [分布式事务最佳实践](https://microservices.io/patterns/data/saga.html)
- [Saga Pattern 详解](https://www.baeldung.com/cs/saga-pattern-microservices)

## 参考资源

- [Pattern: Saga](https://microservices.io/patterns/data/saga.html)
- [Saga distributed transactions pattern](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga)
- [Mastering Saga patterns for distributed transactions in microservices](https://temporal.io/blog/mastering-saga-patterns-for-distributed-transactions-in-microservices)
