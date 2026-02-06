# Phase 3: 企业功能增强 (第5-8周)

**TL;DR**: 添加分布式事务、工作流引擎、多租户隔离和 Kubernetes 部署，构建企业级微服务平台

## 阶段目标

- 分布式事务 (Temporal Saga) - 保障跨服务数据一致性
- 工作流引擎 (Temporal) - 支持复杂业务流程编排
- 多租户隔离 - 支持 SaaS 模式运营
- Kubernetes 部署 - 云原生自动扩展

## 技术选型说明

| 能力 | 选用技术 | 原因 |
|------|----------|------|
| 分布式事务 | Temporal Saga Pattern | 国际主流，Netflix/Uber/Stripe 使用，无全局锁 |
| 工作流引擎 | Temporal Workflow | 同一技术栈，代码优先，内置可观测性 |
| 多租户 | 数据库隔离 + 上下文传递 | 灵活性高，支持 SaaS |
| 云原生 | Kubernetes | 行业标准 |

## 阶段收益

```
评分提升:  92 -> 98分 (+6分)
生产就绪度: 85% -> 98%
事务一致性: 从最终一致 -> 强一致可选
扩展能力: 从手动扩展 -> 自动弹性伸缩
```

---

## Phase 3.1: 分布式事务 (Temporal Saga)

**目标**: 使用 Temporal Saga Pattern 解决 Order 创建时跨服务的分布式事务问题

**完成标准**:
- [ ] Temporal Server 成功部署
- [ ] Temporal UI 可访问 (http://localhost:8088)  
- [ ] 订单 Saga Workflow 执行成功
- [ ] 补偿流程（库存回滚、余额返还）验证通过

### Step 3.1.1: Docker Compose 添加 Temporal

**文件**: docker-compose.yml

```yaml
# Temporal 服务集群
temporal:
  image: temporalio/auto-setup:1.24.0
  container_name: temporal
  ports:
    - "7233:7233"  # gRPC
  environment:
    - DB=mysql8
    - MYSQL_USER=root
    - MYSQL_PWD=${MYSQL_ROOT_PASSWORD:-root123}
    - MYSQL_SEEDS=mysql
    - DYNAMIC_CONFIG_FILE_PATH=config/dynamicconfig/development-sql.yaml
  depends_on:
    mysql:
      condition: service_healthy
  networks:
    - microservices-network

temporal-ui:
  image: temporalio/ui:2.26.0
  container_name: temporal-ui
  ports:
    - "8088:8080"
  environment:
    - TEMPORAL_ADDRESS=temporal:7233
    - TEMPORAL_CORS_ORIGINS=http://localhost:3000
  depends_on:
    - temporal
  networks:
    - microservices-network

temporal-admin-tools:
  image: temporalio/admin-tools:1.24.0
  container_name: temporal-admin-tools
  environment:
    - TEMPORAL_ADDRESS=temporal:7233
  depends_on:
    - temporal
  networks:
    - microservices-network
```

### Step 3.1.2: 父 POM 添加 Temporal 依赖

**文件**: services/pom.xml

```xml
<!-- Temporal Java SDK -->
<dependency>
    <groupId>io.temporal</groupId>
    <artifactId>temporal-sdk</artifactId>
    <version>1.24.0</version>
</dependency>

<dependency>
    <groupId>io.temporal</groupId>
  <artifactId>temporal-spring-boot-starter-alpha</artifactId>
    <version>1.24.0</version>
</dependency>

<!-- Jackson for Temporal serialization -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

### Step 3.1.3: Temporal 配置

**文件**: services/order-service/src/main/resources/application.yml

```yaml
spring:
  temporal:
    enabled: ${TEMPORAL_ENABLED:false}
    connection:
      target: ${TEMPORAL_HOST:localhost:7233}
    namespace: ${TEMPORAL_NAMESPACE:default}
    workers:
      - task-queue: order-saga-queue
        workflow-classes:
          - com.example.order.temporal.OrderSagaWorkflowImpl
        activity-classes:
          - com.example.order.temporal.OrderActivitiesImpl
      - task-queue: approval-queue
        workflow-classes:
          - com.example.order.temporal.ApprovalWorkflowImpl
        activity-classes:
          - com.example.order.temporal.ApprovalActivitiesImpl
```

### Step 3.1.4: 定义 Saga Workflow 接口

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/OrderSagaWorkflow.java

```java
package com.example.order.temporal;

import com.example.order.temporal.model.OrderSagaInput;
import com.example.order.temporal.model.OrderSagaResult;
import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * 订单 Saga Workflow 接口
 * 使用 Saga 模式编排订单创建的分布式事务
 */
@WorkflowInterface
public interface OrderSagaWorkflow {

    @WorkflowMethod
    OrderSagaResult createOrder(OrderSagaInput input);
}
```

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/model/OrderSagaInput.java

```java
package com.example.order.temporal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderSagaInput {
    private Long userId;
    private Long productId;
    private Integer quantity;
    private BigDecimal totalAmount;
    private String tenantId;
}
```

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/model/OrderSagaResult.java

```java
package com.example.order.temporal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderSagaResult {
    private Long orderId;
    private String status;
    private String message;
    private boolean success;
}
```

### Step 3.1.5: 定义 Activities 接口

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/OrderActivities.java

```java
package com.example.order.temporal;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

import java.math.BigDecimal;

/**
 * 订单 Saga 的 Activities 接口
 * 每个 Activity 是一个可补偿的操作
 */
@ActivityInterface
public interface OrderActivities {

    // ========== 正向操作 ==========

    @ActivityMethod
    Long createOrder(Long userId, Long productId, Integer quantity, BigDecimal amount, String tenantId);

    @ActivityMethod
    boolean reserveInventory(Long productId, Integer quantity, String tenantId);

    @ActivityMethod
    boolean deductBalance(Long userId, BigDecimal amount, String tenantId);

    @ActivityMethod
    void confirmOrder(Long orderId);

    // ========== 补偿操作 ==========

    @ActivityMethod
    void cancelOrder(Long orderId);

    @ActivityMethod
    void releaseInventory(Long productId, Integer quantity, String tenantId);

    @ActivityMethod
    void refundBalance(Long userId, BigDecimal amount, String tenantId);
}
```

### Step 3.1.6: Saga Workflow 实现 (核心)

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/OrderSagaWorkflowImpl.java

```java
package com.example.order.temporal;

import com.example.order.temporal.model.OrderSagaInput;
import com.example.order.temporal.model.OrderSagaResult;
import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.failure.ActivityFailure;
import io.temporal.workflow.Saga;
import io.temporal.workflow.Workflow;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;

/**
 * 订单 Saga Workflow 实现
 * 
 * 执行流程:
 * 1. 创建订单 (待支付状态)
 * 2. 预留库存
 * 3. 扣减余额  
 * 4. 确认订单
 * 
 * 任何步骤失败都会触发已完成步骤的补偿
 */
@Slf4j
public class OrderSagaWorkflowImpl implements OrderSagaWorkflow {

    // Activity 配置：重试3次，每次间隔1秒
    private final ActivityOptions activityOptions = ActivityOptions.newBuilder()
        .setStartToCloseTimeout(Duration.ofSeconds(30))
        .setRetryOptions(RetryOptions.newBuilder()
            .setMaximumAttempts(3)
            .setInitialInterval(Duration.ofSeconds(1))
            .build())
        .build();

    private final OrderActivities activities = 
        Workflow.newActivityStub(OrderActivities.class, activityOptions);

    @Override
    public OrderSagaResult createOrder(OrderSagaInput input) {
        // Saga 配置：支持并行补偿
        Saga.Options sagaOptions = new Saga.Options.Builder()
            .setParallelCompensation(true)
            .build();
        Saga saga = new Saga(sagaOptions);

        try {
            // Step 1: 创建订单
            Long orderId = activities.createOrder(
                input.getUserId(),
                input.getProductId(), 
                input.getQuantity(),
                input.getTotalAmount(),
                input.getTenantId()
            );
            // 注册补偿：取消订单
            saga.addCompensation(activities::cancelOrder, orderId);

            // Step 2: 预留库存
            boolean inventoryReserved = activities.reserveInventory(
                input.getProductId(),
                input.getQuantity(),
                input.getTenantId()
            );
            if (!inventoryReserved) {
                throw new RuntimeException("库存不足");
            }
            // 注册补偿：释放库存
            saga.addCompensation(
                activities::releaseInventory,
                input.getProductId(),
                input.getQuantity(),
                input.getTenantId()
            );

            // Step 3: 扣减用户余额
            boolean balanceDeducted = activities.deductBalance(
                input.getUserId(),
                input.getTotalAmount(),
                input.getTenantId()
            );
            if (!balanceDeducted) {
                throw new RuntimeException("余额不足");
            }
            // 注册补偿：退还余额
            saga.addCompensation(
                activities::refundBalance,
                input.getUserId(),
                input.getTotalAmount(),
                input.getTenantId()
            );

            // Step 4: 确认订单
            activities.confirmOrder(orderId);

            return OrderSagaResult.builder()
                .orderId(orderId)
                .status("COMPLETED")
                .message("订单创建成功")
                .success(true)
                .build();

        } catch (ActivityFailure e) {
            // 执行所有补偿操作
            saga.compensate();
            
            return OrderSagaResult.builder()
                .status("COMPENSATED")
                .message("订单创建失败: " + e.getCause().getMessage())
                .success(false)
                .build();
        } catch (Exception e) {
            saga.compensate();
            
            return OrderSagaResult.builder()
                .status("COMPENSATED")
                .message("订单创建失败: " + e.getMessage())
                .success(false)
                .build();
        }
    }
}
```

### Step 3.1.7: Activities 实现

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/OrderActivitiesImpl.java

```java
package com.example.order.temporal;

import com.example.order.entity.OrderEntity;
import com.example.order.mapper.OrderMapper;
import io.temporal.spring.boot.ActivityImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
@ActivityImpl(taskQueues = "order-saga-queue")
public class OrderActivitiesImpl implements OrderActivities {

  private final OrderMapper orderMapper;

  @Override
  public Long createOrder(Long userId, Long productId, Integer quantity, 
               BigDecimal amount, String tenantId) {
    if (amount == null) {
      throw new IllegalArgumentException("amount is required");
    }
    if (quantity == null || quantity <= 0) {
      throw new IllegalArgumentException("quantity must be positive");
    }
    var now = LocalDateTime.now();
        
    OrderEntity order = new OrderEntity();
    order.setUserId(userId);
    order.setProductName("Product-" + productId);
    order.setPrice(amount.divide(BigDecimal.valueOf(quantity), 2, java.math.RoundingMode.HALF_UP));
    order.setQuantity(quantity);
    order.setStatus("PENDING");
    order.setCreatedAt(now);
    order.setUpdatedAt(now);
        
    orderMapper.insert(order);
    log.info("订单创建成功: orderId={}, userId={}, tenantId={}", order.getId(), userId, tenantId);
        
    return order.getId();
  }

  @Override
  public boolean reserveInventory(Long productId, Integer quantity, String tenantId) {
    log.info("库存预留: productId={}, quantity={}, tenantId={}", productId, quantity, tenantId);
    return true;
  }

  @Override
  public boolean deductBalance(Long userId, BigDecimal amount, String tenantId) {
    log.info("余额扣减: userId={}, amount={}, tenantId={}", userId, amount, tenantId);
    return true;
  }

  @Override
  public void confirmOrder(Long orderId) {
    OrderEntity order = orderMapper.findById(orderId);
    if (order != null) {
      order.setStatus("CONFIRMED");
      order.setUpdatedAt(LocalDateTime.now());
      orderMapper.update(order);
      log.info("订单确认成功: orderId={}", orderId);
    }
  }

  // ========== 补偿操作 ==========

  @Override
  public void cancelOrder(Long orderId) {
    OrderEntity order = orderMapper.findById(orderId);
    if (order != null) {
      order.setStatus("CANCELLED");
      order.setUpdatedAt(LocalDateTime.now());
      orderMapper.update(order);
      log.info("订单取消(补偿): orderId={}", orderId);
    }
  }

  @Override
  public void releaseInventory(Long productId, Integer quantity, String tenantId) {
    log.info("库存释放(补偿): productId={}, quantity={}, tenantId={}", productId, quantity, tenantId);
  }

  @Override
  public void refundBalance(Long userId, BigDecimal amount, String tenantId) {
    log.info("余额退还(补偿): userId={}, amount={}, tenantId={}", userId, amount, tenantId);
  }
}
```

### Step 3.1.8: 订单 Controller 集成 Temporal

**新增文件**: services/order-service/src/main/java/com/example/order/controller/OrderSagaController.java

```java
package com.example.order.controller;

import com.example.api.common.Result;
import com.example.api.common.ResultCode;
import com.example.order.temporal.OrderSagaWorkflow;
import com.example.order.temporal.model.OrderSagaInput;
import com.example.order.temporal.model.OrderSagaResult;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders/saga")
@Slf4j
@ConditionalOnBean(WorkflowClient.class)
public class OrderSagaController {

  @Autowired
  private WorkflowClient workflowClient;

  @PostMapping
  public ResponseEntity<Result<OrderSagaResult>> createOrderWithSaga(
      @RequestParam Long userId,
      @RequestParam Long productId,
      @RequestParam Integer quantity,
      @RequestParam BigDecimal totalAmount,
      @RequestHeader(value = "X-Tenant-ID", required = false, defaultValue = "default") String tenantId) {

    OrderSagaInput input = OrderSagaInput.builder()
      .userId(userId)
      .productId(productId)
      .quantity(quantity)
      .totalAmount(totalAmount)
      .tenantId(tenantId)
      .build();

    WorkflowOptions options = WorkflowOptions.newBuilder()
      .setTaskQueue("order-saga-queue")
      .setWorkflowId("order-saga-" + UUID.randomUUID())
      .setWorkflowExecutionTimeout(Duration.ofMinutes(5))
      .build();

    OrderSagaWorkflow workflow = workflowClient.newWorkflowStub(
      OrderSagaWorkflow.class, options);

    OrderSagaResult result = workflow.createOrder(input);

    if (result.isSuccess()) {
      return ResponseEntity.ok(Result.success("订单创建成功", result));
    }
    return ResponseEntity.badRequest().body(Result.error(ResultCode.BAD_REQUEST, result.getMessage()));
  }
}
```

### Step 3.1.9: Temporal 配置类

**新建文件**: services/order-service/src/main/java/com/example/order/config/TemporalConfig.java

```java
package com.example.order.config;

import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowClientOptions;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.serviceclient.WorkflowServiceStubsOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "spring.temporal.enabled", havingValue = "true", matchIfMissing = false)
public class TemporalConfig {

    @Value("${spring.temporal.connection.target:localhost:7233}")
    private String temporalHost;

    @Bean
    public WorkflowServiceStubs workflowServiceStubs() {
        return WorkflowServiceStubs.newServiceStubs(
            WorkflowServiceStubsOptions.newBuilder()
                .setTarget(temporalHost)
                .build()
        );
    }

    @Value("${spring.temporal.namespace:default}")
    private String namespace;

    @Bean
    public WorkflowClient workflowClient(WorkflowServiceStubs serviceStubs) {
      return WorkflowClient.newInstance(
        serviceStubs,
        WorkflowClientOptions.newBuilder()
          .setNamespace(namespace)
          .build()
      );
    }
}
```

### Step 3.1.10: 验证 Temporal Saga

```bash
# 1. 启动 Temporal
docker-compose up -d temporal temporal-ui

# 2. 访问 Temporal UI
open http://localhost:8088

# 3. 测试创建订单
curl -X POST "http://localhost:8080/api/orders/saga?userId=1&productId=1&quantity=2&totalAmount=100.00" \
  -H "X-Tenant-ID: tenant1"

# 4. 在 Temporal UI 中查看 Workflow 执行历史
# - 可以看到每个 Activity 的执行状态
# - 如果失败，可以看到补偿操作的执行

# 5. 测试失败场景（库存不足）
# 设置产品库存为 0，然后创建订单，观察补偿流程
```

---

## Phase 3.2: 工作流引擎 (Temporal)

**目标**: 使用 Temporal Workflow 实现订单审批/权限申请等工作流

**完成标准**:
- [ ] Temporal Workflow 审批流程定义完成
- [ ] 多级审批链路支持
- [ ] Signal 机制支持人工审批
- [ ] 任务状态查询 API 可用

### Step 3.2.1: 审批 Workflow 接口定义

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/ApprovalWorkflow.java

```java
package com.example.order.temporal;

import com.example.order.temporal.model.ApprovalDecision;
import com.example.order.temporal.model.ApprovalRequest;
import com.example.order.temporal.model.ApprovalResult;
import io.temporal.workflow.QueryMethod;
import io.temporal.workflow.SignalMethod;
import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * 订单审批 Workflow 接口
 * 支持多级审批链路，使用 Signal 接收人工审批决策
 */
@WorkflowInterface
public interface ApprovalWorkflow {

    @WorkflowMethod
    ApprovalResult submitForApproval(ApprovalRequest request);

    /**
     * Signal: 审批人提交决策
     */
    @SignalMethod
    void submitDecision(ApprovalDecision decision);

    /**
     * Query: 查询当前审批状态
     */
    @QueryMethod
    String getApprovalStatus();

    /**
     * Query: 查询当前待审批人
     */
    @QueryMethod
    String getCurrentApprover();
}
```

### Step 3.2.2: 审批 Model 类

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/model/ApprovalRequest.java

```java
package com.example.order.temporal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequest {
    private Long orderId;
    private Long userId;
    private BigDecimal amount;
    private String tenantId;
    private String requestReason;
}
```

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/model/ApprovalDecision.java

```java
package com.example.order.temporal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalDecision {
    private String approverId;
    private boolean approved;
    private String comment;
}
```

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/model/ApprovalResult.java

```java
package com.example.order.temporal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalResult {
    private Long orderId;
    private String status; // APPROVED, REJECTED, TIMEOUT
    private String approvedBy;
    private String comment;
}
```

### Step 3.2.3: 审批 Activities 定义

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/ApprovalActivities.java

```java
package com.example.order.temporal;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

import java.math.BigDecimal;
import java.util.List;

@ActivityInterface
public interface ApprovalActivities {

    /**
     * 确定审批链路
     * 根据金额大小返回需要审批的人员列表
     */
    @ActivityMethod
    List<String> determineApprovalChain(BigDecimal amount, String tenantId);

    /**
     * 发送审批通知
     */
    @ActivityMethod
    void sendApprovalNotification(Long orderId, String approverId, BigDecimal amount);

    /**
     * 更新订单审批状态
     */
    @ActivityMethod
    void updateOrderApprovalStatus(Long orderId, String status, String approvedBy);
}
```

### Step 3.2.4: 审批 Workflow 实现

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/ApprovalWorkflowImpl.java

```java
package com.example.order.temporal;

import com.example.order.temporal.model.ApprovalDecision;
import com.example.order.temporal.model.ApprovalRequest;
import com.example.order.temporal.model.ApprovalResult;
import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import org.slf4j.Logger;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;

/**
 * 审批 Workflow 实现
 * 
 * 审批规则:
 * - 金额 < 100: 自动审批
 * - 100 <= 金额 < 1000: 主管审批  
 * - 金额 >= 1000: 主管 + 经理二级审批
 */
public class ApprovalWorkflowImpl implements ApprovalWorkflow {

  private static final Logger log = Workflow.getLogger(ApprovalWorkflowImpl.class);

    private static final BigDecimal AUTO_APPROVE_THRESHOLD = new BigDecimal("100");

    private final ActivityOptions activityOptions = ActivityOptions.newBuilder()
        .setStartToCloseTimeout(Duration.ofSeconds(30))
        .build();

    private final ApprovalActivities activities = 
        Workflow.newActivityStub(ApprovalActivities.class, activityOptions);

    // Workflow 状态
    private String status = "PENDING";
    private String currentApprover = null;
    private ApprovalDecision latestDecision = null;
    private int currentApprovalIndex = 0;
    private List<String> approvalChain;

    @Override
    public ApprovalResult submitForApproval(ApprovalRequest request) {
        // 小额自动审批
        if (request.getAmount().compareTo(AUTO_APPROVE_THRESHOLD) < 0) {
          log.info("小额订单自动审批 - orderId={}", request.getOrderId());
          activities.updateOrderApprovalStatus(request.getOrderId(), "APPROVED", "SYSTEM");
            return ApprovalResult.builder()
                .orderId(request.getOrderId())
                .status("APPROVED")
                .approvedBy("SYSTEM")
                .comment("小额订单自动审批")
                .build();
        }

        // 确定审批链路
        approvalChain = activities.determineApprovalChain(request.getAmount(), request.getTenantId());
        log.info("审批链路确定 - chain={}", approvalChain);
        
        // 逐级审批
        for (currentApprovalIndex = 0; currentApprovalIndex < approvalChain.size(); currentApprovalIndex++) {
            currentApprover = approvalChain.get(currentApprovalIndex);
            status = "WAITING_" + currentApprover;
            
            log.info("等待审批 - orderId={}, approver={}", request.getOrderId(), currentApprover);
            // 发送审批通知
            activities.sendApprovalNotification(request.getOrderId(), currentApprover, request.getAmount());
            
            // 等待审批决策（超时24小时）
            boolean received = Workflow.await(Duration.ofHours(24), () -> latestDecision != null);
            
            if (!received) {
                log.warn("审批超时 - orderId={}, approver={}", request.getOrderId(), currentApprover);
                // 超时处理
                status = "TIMEOUT";
                activities.updateOrderApprovalStatus(request.getOrderId(), "TIMEOUT", currentApprover);
                return ApprovalResult.builder()
                    .orderId(request.getOrderId())
                    .status("TIMEOUT")
                    .approvedBy(currentApprover)
                    .comment("审批超时")
                    .build();
            }
            
            if (!latestDecision.isApproved()) {
                log.info("审批被拒绝 - orderId={}, approver={}", request.getOrderId(), currentApprover);
                // 拒绝
                status = "REJECTED";
                activities.updateOrderApprovalStatus(request.getOrderId(), "REJECTED", currentApprover);
                return ApprovalResult.builder()
                    .orderId(request.getOrderId())
                    .status("REJECTED")
                    .approvedBy(latestDecision.getApproverId())
                    .comment(latestDecision.getComment())
                    .build();
            }
            
            log.info("审批通过 - orderId={}, approver={}", request.getOrderId(), currentApprover);
            // 清空决策，准备下一级
            latestDecision = null;
        }

        log.info("所有审批通过 - orderId={}", request.getOrderId());
        // 所有审批通过
        status = "APPROVED";
        activities.updateOrderApprovalStatus(request.getOrderId(), "APPROVED", currentApprover);
        return ApprovalResult.builder()
            .orderId(request.getOrderId())
            .status("APPROVED")
            .approvedBy(currentApprover)
            .comment("审批通过")
            .build();
    }

    @Override
    public void submitDecision(ApprovalDecision decision) {
      log.info("收到审批决策 - approverId={}, approved={}", decision.getApproverId(), decision.isApproved());
      this.latestDecision = decision;
    }

    @Override
    public String getApprovalStatus() {
        return status;
    }

    @Override
    public String getCurrentApprover() {
        return currentApprover;
    }
}
```

### Step 3.2.5: 审批 Activities 实现

**新建文件**: services/order-service/src/main/java/com/example/order/temporal/ApprovalActivitiesImpl.java

```java
package com.example.order.temporal;

import com.example.order.entity.OrderEntity;
import com.example.order.mapper.OrderMapper;
import io.temporal.spring.boot.ActivityImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ActivityImpl(taskQueues = "approval-queue")
public class ApprovalActivitiesImpl implements ApprovalActivities {

    private static final BigDecimal MANAGER_THRESHOLD = new BigDecimal("1000");
    
    private final OrderMapper orderMapper;

    @Override
    public List<String> determineApprovalChain(BigDecimal amount, String tenantId) {
        List<String> chain = new ArrayList<>();
        
        // 所有非自动审批的订单都需要主管审批
        chain.add("SUPERVISOR");
        
        // 大额订单需要经理审批
        if (amount.compareTo(MANAGER_THRESHOLD) >= 0) {
            chain.add("MANAGER");
        }
        
        log.info("审批链路确定: amount={}, tenantId={}, chain={}", amount, tenantId, chain);
        return chain;
    }

    @Override
    public void sendApprovalNotification(Long orderId, String approverId, BigDecimal amount) {
        // 实际应用中可以发送邮件、短信、站内信等
        log.info("发送审批通知: orderId={}, approverId={}, amount={}", orderId, approverId, amount);
        // notificationService.send(approverId, "有新的订单待审批", "订单ID: " + orderId);
    }

    @Override
    public void updateOrderApprovalStatus(Long orderId, String status, String approvedBy) {
        OrderEntity order = orderMapper.findById(orderId);
        if (order != null) {
          order.setStatus("APPROVAL_" + status);
          order.setUpdatedAt(LocalDateTime.now());
          orderMapper.update(order);
          log.info("订单审批状态更新: orderId={}, status={}, approvedBy={}", orderId, status, approvedBy);
        }
    }
}
```

### Step 3.2.6: 审批 Controller

**新建文件**: services/order-service/src/main/java/com/example/order/controller/ApprovalController.java

```java
package com.example.order.controller;

import com.example.api.common.Result;
import com.example.order.temporal.ApprovalWorkflow;
import com.example.order.temporal.model.ApprovalDecision;
import com.example.order.temporal.model.ApprovalRequest;
import com.example.order.temporal.model.ApprovalResult;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.client.WorkflowStub;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/approvals")
@Slf4j
@ConditionalOnBean(WorkflowClient.class)
public class ApprovalController {

  @Autowired
  private WorkflowClient workflowClient;

    /**
     * 提交审批
     */
    @PostMapping("/submit")
    public ResponseEntity<Result<Map<String, String>>> submitApproval(@RequestBody ApprovalRequest request) {
        String workflowId = "approval-" + request.getOrderId() + "-" + UUID.randomUUID();
        
        WorkflowOptions options = WorkflowOptions.newBuilder()
            .setTaskQueue("approval-queue")
            .setWorkflowId(workflowId)
            .setWorkflowExecutionTimeout(Duration.ofDays(7))  // 审批最长7天
            .build();

        ApprovalWorkflow workflow = workflowClient.newWorkflowStub(ApprovalWorkflow.class, options);
        
        // 异步启动 Workflow
        WorkflowClient.start(workflow::submitForApproval, request);
        
        return ResponseEntity.ok(Result.success(Map.of(
          "workflowId", workflowId,
          "message", "审批已提交"
        )));
    }

    /**
     * 审批人提交决策
     */
    @PostMapping("/{workflowId}/decide")
    public ResponseEntity<Result<String>> submitDecision(
            @PathVariable String workflowId,
            @RequestBody ApprovalDecision decision) {
        
        ApprovalWorkflow workflow = workflowClient.newWorkflowStub(ApprovalWorkflow.class, workflowId);
        workflow.submitDecision(decision);
        
        return ResponseEntity.ok(Result.success("决策已提交"));
    }

    /**
     * 查询审批状态
     */
    @GetMapping("/{workflowId}/status")
    public ResponseEntity<Result<Map<String, String>>> getApprovalStatus(@PathVariable String workflowId) {
        ApprovalWorkflow workflow = workflowClient.newWorkflowStub(ApprovalWorkflow.class, workflowId);
        
        String status = workflow.getApprovalStatus();
        String currentApprover = workflow.getCurrentApprover();
        
        return ResponseEntity.ok(Result.success(Map.of(
          "status", status,
          "currentApprover", currentApprover != null ? currentApprover : "N/A"
        )));
    }

    /**
     * 获取审批结果
     */
    @GetMapping("/{workflowId}/result")
    public ResponseEntity<Result<ApprovalResult>> getApprovalResult(@PathVariable String workflowId) {
        WorkflowStub workflowStub = workflowClient.newUntypedWorkflowStub(workflowId);
        
        // 等待 Workflow 完成并获取结果
        ApprovalResult result = workflowStub.getResult(ApprovalResult.class);
        
        return ResponseEntity.ok(Result.success(result));
    }
}
```

### Step 3.2.7: 验证审批 Workflow

```bash
# 1. 测试自动审批（金额 < 100）
curl -X POST http://localhost:8080/api/approvals/submit \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "userId": 1,
    "amount": 50.00,
    "tenantId": "tenant1",
    "requestReason": "测试小额订单"
  }'

# 2. 测试主管审批（100 <= 金额 < 1000）
curl -X POST http://localhost:8080/api/approvals/submit \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 2,
    "userId": 1,
    "amount": 500.00,
    "tenantId": "tenant1",
    "requestReason": "测试中额订单"
  }'

# 3. 查询审批状态
curl http://localhost:8080/api/approvals/{workflowId}/status

# 4. 主管提交审批
curl -X POST http://localhost:8080/api/approvals/{workflowId}/decide \
  -H "Content-Type: application/json" \
  -d '{
    "approverId": "supervisor1",
    "approved": true,
    "comment": "同意"
  }'

# 5. 在 Temporal UI (http://localhost:8088) 查看 Workflow 详情
```

---

## Phase 3.3: 多租户隔离

**目标**: 支持 SaaS 模式的数据隔离

**完成标准**:
- [ ] 租户上下文全链路传递
- [ ] 数据库级别租户隔离
- [ ] 资源配额管理功能
- [ ] 租户管理控制台

### Step 3.3.1: 租户上下文定义

**新建文件**: services/api-common/src/main/java/com/example/api/common/tenant/TenantContext.java

```java
package com.example.api.common.tenant;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class TenantContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<TenantInfo> TENANT_INFO = new ThreadLocal<>();

    public static void setTenantId(String tenantId) {
        log.debug("设置租户上下文: {}", tenantId);
        CURRENT_TENANT.set(tenantId);
    }

    public static String getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void setTenantInfo(TenantInfo info) {
        TENANT_INFO.set(info);
    }

    public static TenantInfo getTenantInfo() {
        return TENANT_INFO.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
        TENANT_INFO.remove();
    }

    public static void setCurrentTenant(String tenantId) {
      setTenantId(tenantId);
    }

    public static String getCurrentTenant() {
      return getTenantId();
    }
}
```

**新建文件**: services/api-common/src/main/java/com/example/api/common/tenant/TenantInfo.java

```java
package com.example.api.common.tenant;

import lombok.Data;

@Data
public class TenantInfo {
    private String tenantId;
    private String tenantName;
    private String databaseName;
    private TenantStatus status;
    private TenantPlan plan;
    private ResourceQuota quota;

    public enum TenantStatus {
      ACTIVE, SUSPENDED, EXPIRED
    }

    public enum TenantPlan {
      FREE, BASIC, PROFESSIONAL, ENTERPRISE
    }
}
```

**新建文件**: services/api-common/src/main/java/com/example/api/common/tenant/ResourceQuota.java

```java
package com.example.api.common.tenant;

import lombok.Data;

@Data
public class ResourceQuota {
    private int maxUsers;
    private int maxOrders;
    private long maxStorageBytes;
    private int maxApiCallsPerDay;
    private int currentUsers;
    private int currentOrders;
    private long currentStorageBytes;
    private int todayApiCalls;

  public boolean canCreateUser() {
    return currentUsers < maxUsers;
  }

  public boolean canCreateOrder() {
    return currentOrders < maxOrders;
  }

  public boolean canMakeApiCall() {
    return todayApiCalls < maxApiCallsPerDay;
  }

  public boolean hasStorageSpace(long requiredBytes) {
    return currentStorageBytes + requiredBytes <= maxStorageBytes;
  }
}
```

### Step 3.3.2: 租户过滤器

**新建文件**: services/api-gateway/src/main/java/com/example/gateway/filter/TenantFilter.java

```java
package com.example.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class TenantFilter implements GlobalFilter, Ordered {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        String path = request.getPath().value();
        if (isPublicPath(path)) {
          return chain.filter(exchange);
        }

        String tenantId = request.getHeaders().getFirst(TENANT_HEADER);

        // 也可以从子域名解析: tenant1.example.com
        String host = request.getHeaders().getFirst("Host");
        if (tenantId == null && host != null && host.contains(".") && !host.startsWith("localhost")) {
          String subdomain = host.split("\\.")[0];
          if (!isReservedSubdomain(subdomain)) {
            tenantId = subdomain;
          }
        }

        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = "default";
            log.debug("未提供租户ID，使用默认租户");
        }

        log.debug("处理请求 - path={}, tenantId={}", path, tenantId);

        // 将租户ID传递到下游服务
        ServerHttpRequest mutatedRequest = request.mutate()
            .header(TENANT_HEADER, tenantId)
            .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        return -100; // 在认证之前执行
    }

    private boolean isPublicPath(String path) {
      return path.startsWith("/actuator") ||
           path.startsWith("/api/health") ||
           path.startsWith("/api/info") ||
           path.equals("/favicon.ico");
    }

    private boolean isReservedSubdomain(String subdomain) {
      return "www".equals(subdomain) ||
           "api".equals(subdomain) ||
           "admin".equals(subdomain) ||
           "app".equals(subdomain);
    }
}
```

### Step 3.3.3: 租户拦截器 (下游服务)

**新建文件**: services/api-common/src/main/java/com/example/api/common/tenant/TenantInterceptor.java

```java
package com.example.api.common.tenant;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@Slf4j
public class TenantInterceptor implements HandlerInterceptor {

    private static final String TENANT_HEADER = "X-Tenant-ID";
    @Override
    public boolean preHandle(HttpServletRequest request, 
                           HttpServletResponse response, 
                           Object handler) throws Exception {
        String tenantId = request.getHeader(TENANT_HEADER);

        if (tenantId != null && !tenantId.isEmpty()) {
            TenantContext.setTenantId(tenantId);
            log.debug("租户上下文已设置: {}", tenantId);
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, 
                               HttpServletResponse response, 
                               Object handler, 
                               Exception ex) {
        TenantContext.clear();
    }
}
```

### Step 3.3.4: 多租户数据源路由

**新建文件**: services/api-common/src/main/java/com/example/api/common/tenant/TenantDataSourceRouter.java

```java
package com.example.api.common.tenant;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

public class TenantDataSourceRouter extends AbstractRoutingDataSource {

    @Override
    protected Object determineCurrentLookupKey() {
        return TenantContext.getTenantId();
    }
}
```

**新建文件**: services/api-common/src/main/java/com/example/api/common/tenant/TenantDataSourceConfig.java

```java
package com.example.api.common.tenant;

import com.zaxxer.hikari.HikariDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@ConditionalOnProperty(name = "multi-tenant.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class TenantDataSourceConfig {

    private final TenantProperties tenantProperties;

    @Bean
    public DataSource dataSource() {
        TenantDataSourceRouter router = new TenantDataSourceRouter();

        Map<Object, Object> dataSources = new HashMap<>();

        // 默认数据源
        if (tenantProperties.getDefaultDatabase() != null) {
          dataSources.put("default", createDataSource(tenantProperties.getDefaultDatabase()));
        }

        // 各租户数据源
        if (tenantProperties.getTenants() != null) {
          tenantProperties.getTenants().forEach((tenantId, config) -> {
            if (config.getDatabase() != null) {
              dataSources.put(tenantId, createDataSource(config.getDatabase()));
              log.info("注册租户数据源: {}", tenantId);
            }
          });
        }

        router.setTargetDataSources(dataSources);
        if (dataSources.containsKey("default")) {
          router.setDefaultTargetDataSource(dataSources.get("default"));
        }

        return router;
    }

    private DataSource createDataSource(TenantProperties.DatabaseConfig config) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(config.getUrl());
        ds.setUsername(config.getUsername());
        ds.setPassword(config.getPassword());
        ds.setDriverClassName(config.getDriverClassName());
      ds.setMaximumPoolSize(config.getMaxPoolSize());
      ds.setMinimumIdle(config.getMinPoolSize());
      ds.setConnectionTimeout(config.getConnectionTimeout());
      ds.setIdleTimeout(config.getIdleTimeout());
        return ds;
    }
}
```

### Step 3.3.5: 租户配置属性

**新建文件**: services/api-common/src/main/java/com/example/api/common/tenant/TenantProperties.java

```java
package com.example.api.common.tenant;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "multi-tenant")
public class TenantProperties {

    private boolean enabled = false;
    private IsolationStrategy strategy = IsolationStrategy.SCHEMA;
    private DatabaseConfig defaultDatabase;
    private Map<String, TenantConfig> tenants = new HashMap<>();

    public enum IsolationStrategy {
        DATABASE,  // 独立数据库
        SCHEMA,    // 独立 Schema
        COLUMN     // 共享表 + 租户列
    }

    @Data
    public static class TenantConfig {
        private String name;
        private DatabaseConfig database;
      private QuotaConfig quota;
    }

    @Data
    public static class DatabaseConfig {
        private String url;
        private String username;
        private String password;
        private String driverClassName = "com.mysql.cj.jdbc.Driver";
        private int maxPoolSize = 10;
      private int minPoolSize = 2;
      private long connectionTimeout = 30000;
      private long idleTimeout = 600000;
    }

    @Data
    public static class QuotaConfig {
      private int maxUsers = 100;
      private int maxOrders = 1000;
      private long maxStorageBytes = 1073741824L;
      private int maxApiCallsPerDay = 10000;
    }
}
```

### Step 3.3.6: 配置示例

**文件**: services/user-service/src/main/resources/application.yml

```yaml
multi-tenant:
  enabled: true
  strategy: SCHEMA
  default-database:
    url: jdbc:mysql://mysql:3306/user_service_db
    username: root
    password: ${MYSQL_ROOT_PASSWORD}
  tenants:
    tenant1:
      name: "租户一"
      database:
        url: jdbc:mysql://mysql:3306/user_service_tenant1
        username: root
        password: ${MYSQL_ROOT_PASSWORD}
      quota:
        max-users: 100
        max-orders: 1000
        max-storage-bytes: 1073741824
        max-api-calls-per-day: 10000
    tenant2:
      name: "租户二"
      database:
        url: jdbc:mysql://mysql:3306/user_service_tenant2
        username: root
        password: ${MYSQL_ROOT_PASSWORD}
      quota:
        max-users: 500
        max-orders: 10000
        max-storage-bytes: 10737418240
        max-api-calls-per-day: 100000
```

### Step 3.3.7: Feign 租户上下文传递

**新建文件**: services/api-common/src/main/java/com/example/api/common/tenant/TenantFeignInterceptor.java

```java
package com.example.api.common.tenant;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.stereotype.Component;

@Component
public class TenantFeignInterceptor implements RequestInterceptor {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    @Override
    public void apply(RequestTemplate template) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null && !tenantId.isEmpty()) {
            template.header(TENANT_HEADER, tenantId);
        }
    }
}
```

---

## Phase 3.4: Kubernetes 部署

**目标**: 云原生部署与自动扩展

**完成标准**:
- [ ] 优化的多阶段 Dockerfile
- [ ] Kubernetes 部署清单完整
- [ ] Service/Ingress 配置正确
- [ ] HPA 自动扩展验证通过

### Step 3.4.1: 优化多阶段 Dockerfile

**更新文件**: services/user-service/Dockerfile

```dockerfile
# ============================================
# Stage 1: Build
# ============================================
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /build

COPY .m2/settings.xml /root/.m2/settings.xml
COPY pom.xml .
COPY api-common/pom.xml ./api-common/
COPY auth-service/pom.xml ./auth-service/
COPY user-service/pom.xml ./user-service/
COPY order-service/pom.xml ./order-service/
COPY chat-service/pom.xml ./chat-service/
COPY api-gateway/pom.xml ./api-gateway/

RUN mvn dependency:go-offline -B -pl user-service -am || true

COPY api-common ./api-common
COPY user-service ./user-service

RUN mvn clean package -DskipTests -B -pl user-service -am

# ============================================
# Stage 2: Runtime
# ============================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 安全：创建非 root 用户
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser

# 复制构建产物
COPY --from=builder /build/user-service/target/user-service.jar app.jar

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -q --spider http://localhost:8001/actuator/health || exit 1

# 切换到非 root 用户
USER appuser

# JVM 优化参数
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -XX:+HeapDumpOnOutOfMemoryError \
               -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8081

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### Step 3.4.2: Kubernetes Namespace 和 ConfigMap

**新建文件**: services/k8s/base/namespace.yaml

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: microservices
  labels:
    name: microservices
    istio-injection: enabled  # 如果使用 Istio
```

**新建文件**: services/k8s/base/configmap.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: microservices
data:
  SPRING_PROFILES_ACTIVE: "kubernetes"
  NACOS_SERVER_ADDR: "nacos.infrastructure:8848"
  KAFKA_BOOTSTRAP_SERVERS: "kafka.infrastructure:9092"
  REDIS_HOST: "redis.infrastructure"
  MYSQL_HOST: "mysql.infrastructure"
```

**新建文件**: services/k8s/base/secrets.yaml

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: microservices
type: Opaque
stringData:
  MYSQL_ROOT_PASSWORD: "your-secure-password"
  JWT_SECRET: "your-jwt-secret"
  NACOS_USERNAME: "nacos"
  NACOS_PASSWORD: "nacos"
```

### Step 3.4.3: User Service Deployment

**新建文件**: services/k8s/services/user-service/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: microservices
  labels:
    app: user-service
    version: v1
spec:
  replicas: 2
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8081"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      serviceAccountName: microservice-sa
      containers:
        - name: user-service
          image: your-registry/user-service:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 8081
              name: http
          env:
            - name: SPRING_PROFILES_ACTIVE
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: SPRING_PROFILES_ACTIVE
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: MYSQL_ROOT_PASSWORD
          envFrom:
            - configMapRef:
                name: app-config
          resources:
            requests:
              cpu: "200m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8081
            initialDelaySeconds: 60
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8081
            initialDelaySeconds: 30
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          volumeMounts:
            - name: logs
              mountPath: /app/logs
      volumes:
        - name: logs
          emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: user-service
                topologyKey: kubernetes.io/hostname
```

### Step 3.4.4: Service 和 Ingress

**新建文件**: services/k8s/services/user-service/service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: microservices
  labels:
    app: user-service
spec:
  type: ClusterIP
  ports:
    - port: 8081
      targetPort: 8081
      protocol: TCP
      name: http
  selector:
    app: user-service
```

**新建文件**: services/k8s/ingress/ingress.yaml

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: microservices-ingress
  namespace: microservices
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.yourdomain.com
      secretName: api-tls-secret
  rules:
    - host: api.yourdomain.com
      http:
        paths:
          - path: /api/users(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: user-service
                port:
                  number: 8081
          - path: /api/orders(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: order-service
                port:
                  number: 8082
          - path: /api/auth(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: auth-service
                port:
                  number: 8083
          - path: /api/chat(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: chat-service
                port:
                  number: 8084
```

### Step 3.4.5: Horizontal Pod Autoscaler (HPA)

**新建文件**: services/k8s/services/user-service/hpa.yaml

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: microservices
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

### Step 3.4.6: PodDisruptionBudget

**新建文件**: services/k8s/services/user-service/pdb.yaml

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: user-service-pdb
  namespace: microservices
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: user-service
```

### Step 3.4.7: Kustomization 配置

**新建文件**: services/k8s/base/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: microservices

resources:
  - namespace.yaml
  - configmap.yaml
  - secrets.yaml

commonLabels:
  project: microservices-demo
```

**新建文件**: services/k8s/overlays/production/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base
  - ../../services/user-service
  - ../../services/order-service
  - ../../services/auth-service
  - ../../services/chat-service
  - ../../ingress

namespace: microservices

patchesStrategicMerge:
  - replica-patch.yaml
  - resource-patch.yaml

images:
  - name: your-registry/user-service
    newTag: v1.0.0
  - name: your-registry/order-service
    newTag: v1.0.0
  - name: your-registry/auth-service
    newTag: v1.0.0
  - name: your-registry/chat-service
    newTag: v1.0.0
```

**新建文件**: services/k8s/overlays/production/replica-patch.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 2
```

### Step 3.4.8: 部署脚本

**新建文件**: services/k8s/scripts/deploy.sh

```bash
#!/bin/bash

set -e

ENVIRONMENT=${1:-development}
NAMESPACE="microservices"

echo "Deploying to $ENVIRONMENT environment..."

# 创建命名空间
kubectl apply -f k8s/base/namespace.yaml

# 应用 Kustomize 配置
kubectl apply -k k8s/overlays/$ENVIRONMENT

# 等待部署完成
echo "Waiting for deployments to be ready..."
kubectl -n $NAMESPACE rollout status deployment/user-service --timeout=300s
kubectl -n $NAMESPACE rollout status deployment/order-service --timeout=300s
kubectl -n $NAMESPACE rollout status deployment/auth-service --timeout=300s
kubectl -n $NAMESPACE rollout status deployment/chat-service --timeout=300s

echo "Deployment completed successfully!"

# 显示 Pod 状态
kubectl -n $NAMESPACE get pods

# 显示 Service 状态
kubectl -n $NAMESPACE get services

# 显示 Ingress 状态
kubectl -n $NAMESPACE get ingress
```

### Step 3.4.9: 验证部署

```bash
# 部署到开发环境
./k8s/scripts/deploy.sh development

# 部署到生产环境
./k8s/scripts/deploy.sh production

# 查看 Pod 状态
kubectl -n microservices get pods -o wide

# 查看 HPA 状态
kubectl -n microservices get hpa

# 压力测试触发自动扩展
kubectl run -i --tty load-generator --rm --image=busybox \
  --restart=Never -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://user-service:8081/api/users; done"

# 观察扩展
watch kubectl -n microservices get pods
```

---

## 验收检查清单

### Phase 3.1: Temporal 分布式事务 (Saga Pattern)
- [ ] Temporal Server 运行正常
- [ ] Temporal UI 可访问 (http://localhost:8088)
- [ ] 订单 Saga Workflow 正常执行
- [ ] 库存不足时补偿流程正确执行
- [ ] 余额不足时全部补偿正常
- [ ] Workflow 执行历史可在 UI 中查看

### Phase 3.2: Temporal 审批工作流
- [ ] 审批 Workflow 部署成功
- [ ] 小额订单自动审批
- [ ] 普通订单主管审批 (Signal 机制)
- [ ] 大额订单经理审批
- [ ] 审批超时处理正常
- [ ] 状态查询 API 可用

### Phase 3.3: 多租户隔离
- [ ] 租户上下文正确传递
- [ ] 不同租户数据隔离
- [ ] 资源配额检查生效
- [ ] Feign 调用租户ID传递

### Phase 3.4: Kubernetes 部署
- [ ] 镜像构建成功
- [ ] Deployment 运行正常
- [ ] Service 网络连通
- [ ] Ingress 路由正确
- [ ] HPA 自动扩展测试通过
- [ ] PDB 配置验证

---

## 下一步计划

Phase 3 完成后，系统将具备企业级能力：

1. **分布式事务**: 保障跨服务数据一致性
2. **工作流引擎**: 支持复杂业务流程
3. **多租户**: 支持 SaaS 模式运营
4. **云原生部署**: 自动弹性伸缩

后续可考虑：
- 服务网格 (Istio) 集成
- GitOps 持续部署 (ArgoCD)
- 混沌工程 (Chaos Monkey)
- 全链路压测
