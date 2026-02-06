# Phase 3: 企业功能增强 (第5-8周)

**TL;DR**: 添加分布式事务、工作流引擎、多租户隔离和 Kubernetes 部署，构建企业级微服务平台

## 阶段目标

- 分布式事务 (Seata) - 保障跨服务数据一致性
- 工作流引擎 (Activiti) - 支持复杂业务流程编排
- 多租户隔离 - 支持 SaaS 模式运营
- Kubernetes 部署 - 云原生自动扩展

## 阶段收益

```
评分提升:  92 -> 98分 (+6分)
生产就绪度: 85% -> 98%
事务一致性: 从最终一致 -> 强一致可选
扩展能力: 从手动扩展 -> 自动弹性伸缩
```

---

## Phase 3.1: 分布式事务 (Seata)

**目标**: 解决 Order 创建时 User 余额扣除的分布式事务问题

**完成标准**:
- [ ] Seata Server 成功部署
- [ ] 5个服务集成 Seata Client
- [ ] 订单创建跨服务事务测试通过
- [ ] 事务回滚补偿机制验证

### Step 3.1.1: Docker Compose 添加 Seata Server

**文件**: services/docker-compose.yml

```yaml
seata-server:
  image: seataio/seata-server:1.8.0
  container_name: seata-server
  hostname: seata-server
  ports:
    - "8091:8091"
    - "7091:7091"
  environment:
    SEATA_PORT: 8091
    STORE_MODE: db
    SEATA_IP: seata-server
  volumes:
    - ./docker/seata/resources:/seata-server/resources
  depends_on:
    - mysql
    - nacos
  networks:
    - infra-network
```

### Step 3.1.2: Seata Server 配置文件

**新建文件**: services/docker/seata/resources/application.yml

```yaml
server:
  port: 7091

spring:
  application:
    name: seata-server

logging:
  config: classpath:logback-spring.xml
  file:
    path: ${user.home}/logs/seata
  extend:
    logstash-appender:
      destination: 127.0.0.1:4560
    kafka-appender:
      bootstrap-servers: 127.0.0.1:9092
      topic: logback_to_logstash

console:
  user:
    username: seata
    password: seata

seata:
  config:
    type: nacos
    nacos:
      server-addr: nacos:8848
      namespace: seata
      group: SEATA_GROUP
      username: nacos
      password: nacos
      data-id: seataServer.properties
  registry:
    type: nacos
    nacos:
      application: seata-server
      server-addr: nacos:8848
      group: SEATA_GROUP
      namespace: seata
      cluster: default
      username: nacos
      password: nacos
  store:
    mode: db
    db:
      datasource: druid
      db-type: mysql
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://mysql:3306/seata?rewriteBatchedStatements=true
      user: root
      password: ${MYSQL_ROOT_PASSWORD:root123456}
      min-conn: 5
      max-conn: 100
      global-table: global_table
      branch-table: branch_table
      lock-table: lock_table
      distributed-lock-table: distributed_lock
      query-limit: 100
      max-wait: 5000
  security:
    secretKey: SeataSecretKey0c382ef121d778043159209298fd40bf3850a017
    tokenValidityInMilliseconds: 1800000
```

### Step 3.1.3: Seata 数据库初始化脚本

**新建文件**: services/docker/mysql/init/03-seata-init.sql

```sql
-- Seata Server 数据库
CREATE DATABASE IF NOT EXISTS seata;
USE seata;

-- 全局事务表
CREATE TABLE IF NOT EXISTS `global_table` (
  `xid` VARCHAR(128) NOT NULL,
  `transaction_id` BIGINT,
  `status` TINYINT NOT NULL,
  `application_id` VARCHAR(32),
  `transaction_service_group` VARCHAR(32),
  `transaction_name` VARCHAR(128),
  `timeout` INT,
  `begin_time` BIGINT,
  `application_data` VARCHAR(2000),
  `gmt_create` DATETIME,
  `gmt_modified` DATETIME,
  PRIMARY KEY (`xid`),
  KEY `idx_status_gmt_modified` (`status`, `gmt_modified`),
  KEY `idx_transaction_id` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 分支事务表
CREATE TABLE IF NOT EXISTS `branch_table` (
  `branch_id` BIGINT NOT NULL,
  `xid` VARCHAR(128) NOT NULL,
  `transaction_id` BIGINT,
  `resource_group_id` VARCHAR(32),
  `resource_id` VARCHAR(256),
  `branch_type` VARCHAR(8),
  `status` TINYINT,
  `client_id` VARCHAR(64),
  `application_data` VARCHAR(2000),
  `gmt_create` DATETIME(6),
  `gmt_modified` DATETIME(6),
  PRIMARY KEY (`branch_id`),
  KEY `idx_xid` (`xid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 锁表
CREATE TABLE IF NOT EXISTS `lock_table` (
  `row_key` VARCHAR(128) NOT NULL,
  `xid` VARCHAR(128),
  `transaction_id` BIGINT,
  `branch_id` BIGINT NOT NULL,
  `resource_id` VARCHAR(256),
  `table_name` VARCHAR(32),
  `pk` VARCHAR(36),
  `status` TINYINT NOT NULL DEFAULT '0',
  `gmt_create` DATETIME,
  `gmt_modified` DATETIME,
  PRIMARY KEY (`row_key`),
  KEY `idx_branch_id` (`branch_id`),
  KEY `idx_xid` (`xid`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 分布式锁表
CREATE TABLE IF NOT EXISTS `distributed_lock` (
  `lock_key` CHAR(20) NOT NULL,
  `lock_value` VARCHAR(20) NOT NULL,
  `expire` BIGINT,
  PRIMARY KEY (`lock_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `distributed_lock` (lock_key, lock_value, expire) VALUES ('AsyncCommitting', ' ', 0);
INSERT INTO `distributed_lock` (lock_key, lock_value, expire) VALUES ('RetryCommitting', ' ', 0);
INSERT INTO `distributed_lock` (lock_key, lock_value, expire) VALUES ('RetryRollbacking', ' ', 0);
INSERT INTO `distributed_lock` (lock_key, lock_value, expire) VALUES ('TxTimeoutCheck', ' ', 0);

-- 业务服务 UNDO_LOG 表 (每个业务数据库都需要)
-- 在 user_service_db, order_service_db 中执行
USE user_service_db;
CREATE TABLE IF NOT EXISTS `undo_log` (
  `branch_id` BIGINT NOT NULL COMMENT 'branch transaction id',
  `xid` VARCHAR(128) NOT NULL COMMENT 'global transaction id',
  `context` VARCHAR(128) NOT NULL COMMENT 'undo_log context,such as serialization',
  `rollback_info` LONGBLOB NOT NULL COMMENT 'rollback info',
  `log_status` INT NOT NULL COMMENT '0:normal status,1:defense status',
  `log_created` DATETIME(6) NOT NULL COMMENT 'create datetime',
  `log_modified` DATETIME(6) NOT NULL COMMENT 'modify datetime',
  UNIQUE KEY `ux_undo_log` (`xid`, `branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AT transaction mode undo table';

USE order_service_db;
CREATE TABLE IF NOT EXISTS `undo_log` (
  `branch_id` BIGINT NOT NULL COMMENT 'branch transaction id',
  `xid` VARCHAR(128) NOT NULL COMMENT 'global transaction id',
  `context` VARCHAR(128) NOT NULL COMMENT 'undo_log context,such as serialization',
  `rollback_info` LONGBLOB NOT NULL COMMENT 'rollback info',
  `log_status` INT NOT NULL COMMENT '0:normal status,1:defense status',
  `log_created` DATETIME(6) NOT NULL COMMENT 'create datetime',
  `log_modified` DATETIME(6) NOT NULL COMMENT 'modify datetime',
  UNIQUE KEY `ux_undo_log` (`xid`, `branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AT transaction mode undo table';
```

### Step 3.1.4: 父 POM 添加 Seata 依赖

**文件**: services/pom.xml

```xml
<!-- Seata 分布式事务 -->
<dependency>
    <groupId>io.seata</groupId>
    <artifactId>seata-spring-boot-starter</artifactId>
    <version>1.8.0</version>
</dependency>

<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
    <exclusions>
        <exclusion>
            <groupId>io.seata</groupId>
            <artifactId>seata-spring-boot-starter</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

### Step 3.1.5: 服务配置 Seata Client

**文件**: services/order-service/src/main/resources/application.yml

```yaml
seata:
  enabled: true
  application-id: ${spring.application.name}
  tx-service-group: my_tx_group
  registry:
    type: nacos
    nacos:
      application: seata-server
      server-addr: ${spring.cloud.nacos.discovery.server-addr}
      namespace: seata
      group: SEATA_GROUP
      username: nacos
      password: nacos
  config:
    type: nacos
    nacos:
      server-addr: ${spring.cloud.nacos.discovery.server-addr}
      namespace: seata
      group: SEATA_GROUP
      username: nacos
      password: nacos
  service:
    vgroup-mapping:
      my_tx_group: default
  data-source-proxy-mode: AT
```

### Step 3.1.6: 订单服务 - 分布式事务实现

**新建文件**: services/order-service/src/main/java/com/example/order/service/OrderTransactionService.java

```java
package com.example.order.service;

import com.example.order.entity.Order;
import com.example.order.repository.OrderRepository;
import com.example.order.client.UserServiceClient;
import io.seata.spring.annotation.GlobalTransactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderTransactionService {

    private final OrderRepository orderRepository;
    private final UserServiceClient userServiceClient;

    /**
     * 创建订单 - 分布式事务
     * 1. 创建订单记录
     * 2. 扣减用户余额
     * 任一步骤失败，全局回滚
     */
    @GlobalTransactional(name = "create-order-tx", rollbackFor = Exception.class)
    public Order createOrderWithTransaction(Long userId, BigDecimal amount, String productName) {
        log.info("开始创建订单, userId={}, amount={}", userId, amount);

        // Step 1: 创建订单
        Order order = new Order();
        order.setUserId(userId);
        order.setAmount(amount);
        order.setProductName(productName);
        order.setStatus("PENDING");
        orderRepository.save(order);
        log.info("订单创建成功, orderId={}", order.getId());

        // Step 2: 扣减用户余额 (远程调用)
        boolean deductSuccess = userServiceClient.deductBalance(userId, amount);
        if (!deductSuccess) {
            throw new RuntimeException("余额扣减失败，触发全局回滚");
        }
        log.info("余额扣减成功, userId={}, amount={}", userId, amount);

        // Step 3: 更新订单状态
        order.setStatus("CONFIRMED");
        orderRepository.save(order);

        return order;
    }
}
```

**新建文件**: services/order-service/src/main/java/com/example/order/client/UserServiceClient.java

```java
package com.example.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;

@FeignClient(name = "user-service", path = "/api/users")
public interface UserServiceClient {

    @PostMapping("/balance/deduct")
    boolean deductBalance(@RequestParam("userId") Long userId,
                         @RequestParam("amount") BigDecimal amount);
}
```

### Step 3.1.7: 用户服务 - 余额扣减接口

**新建文件**: services/user-service/src/main/java/com/example/user/controller/BalanceController.java

```java
package com.example.user.controller;

import com.example.user.service.BalanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/users/balance")
@RequiredArgsConstructor
public class BalanceController {

    private final BalanceService balanceService;

    @PostMapping("/deduct")
    public boolean deductBalance(@RequestParam Long userId,
                                @RequestParam BigDecimal amount) {
        return balanceService.deductBalance(userId, amount);
    }

    @PostMapping("/add")
    public boolean addBalance(@RequestParam Long userId,
                             @RequestParam BigDecimal amount) {
        return balanceService.addBalance(userId, amount);
    }
}
```

**新建文件**: services/user-service/src/main/java/com/example/user/service/BalanceService.java

```java
package com.example.user.service;

import com.example.user.entity.UserBalance;
import com.example.user.repository.UserBalanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@Slf4j
@RequiredArgsConstructor
public class BalanceService {

    private final UserBalanceRepository userBalanceRepository;

    @Transactional
    public boolean deductBalance(Long userId, BigDecimal amount) {
        log.info("扣减余额, userId={}, amount={}", userId, amount);

        UserBalance balance = userBalanceRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("用户余额记录不存在"));

        if (balance.getBalance().compareTo(amount) < 0) {
            log.warn("余额不足, current={}, required={}", balance.getBalance(), amount);
            return false;
        }

        balance.setBalance(balance.getBalance().subtract(amount));
        userBalanceRepository.save(balance);

        log.info("余额扣减成功, newBalance={}", balance.getBalance());
        return true;
    }

    @Transactional
    public boolean addBalance(Long userId, BigDecimal amount) {
        UserBalance balance = userBalanceRepository.findByUserId(userId)
            .orElseGet(() -> {
                UserBalance newBalance = new UserBalance();
                newBalance.setUserId(userId);
                newBalance.setBalance(BigDecimal.ZERO);
                return newBalance;
            });

        balance.setBalance(balance.getBalance().add(amount));
        userBalanceRepository.save(balance);
        return true;
    }
}
```

### Step 3.1.8: 验证分布式事务

```bash
# 启动 Seata Server
docker-compose up -d seata-server

# 查看 Seata 控制台
open http://localhost:7091

# 创建订单测试
curl -X POST http://localhost:8080/api/orders/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": 1,
    "amount": 100.00,
    "productName": "测试商品"
  }'

# 验证事务回滚（余额不足场景）
curl -X POST http://localhost:8080/api/orders/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": 1,
    "amount": 999999.00,
    "productName": "超额商品"
  }'
```

---

## Phase 3.2: 工作流引擎 (Activiti)

**目标**: 订单审批/权限申请等工作流

**完成标准**:
- [ ] Activiti 7 成功集成
- [ ] 订单审批流程定义完成
- [ ] 流程实例管理 API 可用
- [ ] 任务分派与追踪功能正常

### Step 3.2.1: 父 POM 添加 Activiti 依赖

**文件**: services/pom.xml

```xml
<!-- Activiti 工作流引擎 -->
<dependency>
    <groupId>org.activiti</groupId>
    <artifactId>activiti-spring-boot-starter</artifactId>
    <version>7.1.0.M6</version>
</dependency>

<dependency>
    <groupId>org.activiti</groupId>
    <artifactId>activiti-spring-security</artifactId>
    <version>7.1.0.M6</version>
</dependency>
```

### Step 3.2.2: Order Service 集成 Activiti

**文件**: services/order-service/src/main/resources/application.yml

```yaml
spring:
  activiti:
    database-schema-update: true
    history-level: full
    check-process-definitions: true
    process-definition-location-prefix: classpath:/processes/
    process-definition-location-suffixes:
      - "**.bpmn"
      - "**.bpmn20.xml"
```

### Step 3.2.3: 订单审批流程定义 (BPMN)

**新建文件**: services/order-service/src/main/resources/processes/order-approval.bpmn20.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:activiti="http://activiti.org/bpmn"
             targetNamespace="http://www.activiti.org/processdef">

  <process id="orderApproval" name="订单审批流程" isExecutable="true">
    
    <!-- 开始事件 -->
    <startEvent id="startEvent" name="订单提交"/>
    
    <!-- 订单金额判断 -->
    <exclusiveGateway id="amountGateway" name="金额判断"/>
    
    <!-- 小额订单自动审批 -->
    <serviceTask id="autoApproveTask" name="自动审批"
                 activiti:delegateExpression="${autoApprovalDelegate}"/>
    
    <!-- 普通订单 - 主管审批 -->
    <userTask id="supervisorApproval" name="主管审批"
              activiti:candidateGroups="supervisor">
      <documentation>订单金额: ${amount}, 需要主管审批</documentation>
    </userTask>
    
    <!-- 大额订单 - 经理审批 -->
    <userTask id="managerApproval" name="经理审批"
              activiti:candidateGroups="manager">
      <documentation>大额订单: ${amount}, 需要经理审批</documentation>
    </userTask>
    
    <!-- 审批结果判断 -->
    <exclusiveGateway id="approvalGateway" name="审批结果"/>
    
    <!-- 审批通过处理 -->
    <serviceTask id="approvedTask" name="审批通过"
                 activiti:delegateExpression="${orderApprovedDelegate}"/>
    
    <!-- 审批拒绝处理 -->
    <serviceTask id="rejectedTask" name="审批拒绝"
                 activiti:delegateExpression="${orderRejectedDelegate}"/>
    
    <!-- 结束事件 -->
    <endEvent id="endEvent" name="流程结束"/>
    
    <!-- 流程连线 -->
    <sequenceFlow id="flow1" sourceRef="startEvent" targetRef="amountGateway"/>
    
    <sequenceFlow id="flow2" sourceRef="amountGateway" targetRef="autoApproveTask">
      <conditionExpression xsi:type="tFormalExpression">
        ${amount &lt; 100}
      </conditionExpression>
    </sequenceFlow>
    
    <sequenceFlow id="flow3" sourceRef="amountGateway" targetRef="supervisorApproval">
      <conditionExpression xsi:type="tFormalExpression">
        ${amount &gt;= 100 &amp;&amp; amount &lt; 10000}
      </conditionExpression>
    </sequenceFlow>
    
    <sequenceFlow id="flow4" sourceRef="amountGateway" targetRef="managerApproval">
      <conditionExpression xsi:type="tFormalExpression">
        ${amount &gt;= 10000}
      </conditionExpression>
    </sequenceFlow>
    
    <sequenceFlow id="flow5" sourceRef="autoApproveTask" targetRef="approvedTask"/>
    
    <sequenceFlow id="flow6" sourceRef="supervisorApproval" targetRef="approvalGateway"/>
    <sequenceFlow id="flow7" sourceRef="managerApproval" targetRef="approvalGateway"/>
    
    <sequenceFlow id="flow8" sourceRef="approvalGateway" targetRef="approvedTask">
      <conditionExpression xsi:type="tFormalExpression">${approved}</conditionExpression>
    </sequenceFlow>
    
    <sequenceFlow id="flow9" sourceRef="approvalGateway" targetRef="rejectedTask">
      <conditionExpression xsi:type="tFormalExpression">${!approved}</conditionExpression>
    </sequenceFlow>
    
    <sequenceFlow id="flow10" sourceRef="approvedTask" targetRef="endEvent"/>
    <sequenceFlow id="flow11" sourceRef="rejectedTask" targetRef="endEvent"/>
    
  </process>
</definitions>
```

### Step 3.2.4: 工作流服务实现

**新建文件**: services/order-service/src/main/java/com/example/order/workflow/WorkflowService.java

```java
package com.example.order.workflow;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.activiti.engine.RuntimeService;
import org.activiti.engine.TaskService;
import org.activiti.engine.runtime.ProcessInstance;
import org.activiti.engine.task.Task;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class WorkflowService {

    private final RuntimeService runtimeService;
    private final TaskService taskService;

    /**
     * 启动订单审批流程
     */
    public String startOrderApproval(Long orderId, BigDecimal amount, Long userId) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("orderId", orderId);
        variables.put("amount", amount);
        variables.put("userId", userId);
        variables.put("approved", false);

        ProcessInstance instance = runtimeService.startProcessInstanceByKey(
            "orderApproval",
            String.valueOf(orderId),
            variables
        );

        log.info("启动订单审批流程, processId={}, orderId={}", 
                 instance.getProcessInstanceId(), orderId);
        return instance.getProcessInstanceId();
    }

    /**
     * 获取待办任务
     */
    public List<TaskDTO> getMyTasks(String username, List<String> groups) {
        List<Task> tasks = taskService.createTaskQuery()
            .taskCandidateOrAssigned(username)
            .taskCandidateGroupIn(groups)
            .list();

        return tasks.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * 完成任务
     */
    public void completeTask(String taskId, boolean approved, String comment) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", approved);
        variables.put("comment", comment);

        taskService.complete(taskId, variables);
        log.info("任务完成, taskId={}, approved={}", taskId, approved);
    }

    /**
     * 认领任务
     */
    public void claimTask(String taskId, String userId) {
        taskService.claim(taskId, userId);
        log.info("任务认领, taskId={}, userId={}", taskId, userId);
    }

    private TaskDTO convertToDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setTaskId(task.getId());
        dto.setTaskName(task.getName());
        dto.setProcessInstanceId(task.getProcessInstanceId());
        dto.setCreateTime(task.getCreateTime());
        dto.setAssignee(task.getAssignee());
        return dto;
    }
}
```

**新建文件**: services/order-service/src/main/java/com/example/order/workflow/TaskDTO.java

```java
package com.example.order.workflow;

import lombok.Data;
import java.util.Date;

@Data
public class TaskDTO {
    private String taskId;
    private String taskName;
    private String processInstanceId;
    private Date createTime;
    private String assignee;
    private Long orderId;
    private String orderStatus;
}
```

### Step 3.2.5: 工作流委托处理器

**新建文件**: services/order-service/src/main/java/com/example/order/workflow/delegate/AutoApprovalDelegate.java

```java
package com.example.order.workflow.delegate;

import com.example.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("autoApprovalDelegate")
@Slf4j
@RequiredArgsConstructor
public class AutoApprovalDelegate implements JavaDelegate {

    private final OrderService orderService;

    @Override
    public void execute(DelegateExecution execution) {
        Long orderId = (Long) execution.getVariable("orderId");
        log.info("自动审批通过, orderId={}", orderId);
        execution.setVariable("approved", true);
    }
}
```

**新建文件**: services/order-service/src/main/java/com/example/order/workflow/delegate/OrderApprovedDelegate.java

```java
package com.example.order.workflow.delegate;

import com.example.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("orderApprovedDelegate")
@Slf4j
@RequiredArgsConstructor
public class OrderApprovedDelegate implements JavaDelegate {

    private final OrderService orderService;

    @Override
    public void execute(DelegateExecution execution) {
        Long orderId = (Long) execution.getVariable("orderId");
        log.info("订单审批通过, orderId={}", orderId);
        orderService.updateOrderStatus(orderId, "APPROVED");
    }
}
```

**新建文件**: services/order-service/src/main/java/com/example/order/workflow/delegate/OrderRejectedDelegate.java

```java
package com.example.order.workflow.delegate;

import com.example.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("orderRejectedDelegate")
@Slf4j
@RequiredArgsConstructor
public class OrderRejectedDelegate implements JavaDelegate {

    private final OrderService orderService;

    @Override
    public void execute(DelegateExecution execution) {
        Long orderId = (Long) execution.getVariable("orderId");
        String comment = (String) execution.getVariable("comment");
        log.info("订单审批拒绝, orderId={}, reason={}", orderId, comment);
        orderService.updateOrderStatus(orderId, "REJECTED");
    }
}
```

### Step 3.2.6: 工作流 REST API

**新建文件**: services/order-service/src/main/java/com/example/order/controller/WorkflowController.java

```java
package com.example.order.controller;

import com.example.order.workflow.TaskDTO;
import com.example.order.workflow.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflow")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskDTO>> getMyTasks(
            @RequestParam String username,
            @RequestParam List<String> groups) {
        return ResponseEntity.ok(workflowService.getMyTasks(username, groups));
    }

    @PostMapping("/tasks/{taskId}/claim")
    public ResponseEntity<Void> claimTask(
            @PathVariable String taskId,
            @RequestParam String userId) {
        workflowService.claimTask(taskId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<Void> completeTask(
            @PathVariable String taskId,
            @RequestParam boolean approved,
            @RequestParam(required = false) String comment) {
        workflowService.completeTask(taskId, approved, comment);
        return ResponseEntity.ok().build();
    }
}
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

**新建文件**: services/api-common/src/main/java/com/example/common/tenant/TenantContext.java

```java
package com.example.common.tenant;

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
}
```

**新建文件**: services/api-common/src/main/java/com/example/common/tenant/TenantInfo.java

```java
package com.example.common.tenant;

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

**新建文件**: services/api-common/src/main/java/com/example/common/tenant/ResourceQuota.java

```java
package com.example.common.tenant;

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
}
```

### Step 3.3.2: 租户过滤器

**新建文件**: services/api-gateway/src/main/java/com/example/gateway/filter/TenantFilter.java

```java
package com.example.gateway.filter;

import com.example.common.tenant.TenantContext;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class TenantFilter implements GlobalFilter, Ordered {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // 从 Header 获取租户ID
        String tenantId = request.getHeaders().getFirst(TENANT_HEADER);

        // 也可以从子域名解析: tenant1.example.com
        String host = request.getHeaders().getFirst("Host");
        if (tenantId == null && host != null && host.contains(".")) {
            tenantId = host.split("\\.")[0];
        }

        if (tenantId == null || tenantId.isEmpty()) {
            exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
            return exchange.getResponse().setComplete();
        }

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
}
```

### Step 3.3.3: 租户拦截器 (下游服务)

**新建文件**: services/api-common/src/main/java/com/example/common/tenant/TenantInterceptor.java

```java
package com.example.common.tenant;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@Slf4j
@RequiredArgsConstructor
public class TenantInterceptor implements HandlerInterceptor {

    private static final String TENANT_HEADER = "X-Tenant-ID";
    private final TenantService tenantService;

    @Override
    public boolean preHandle(HttpServletRequest request, 
                           HttpServletResponse response, 
                           Object handler) throws Exception {
        String tenantId = request.getHeader(TENANT_HEADER);

        if (tenantId != null) {
            TenantContext.setTenantId(tenantId);

            // 加载租户信息
            TenantInfo tenantInfo = tenantService.getTenantInfo(tenantId);
            if (tenantInfo == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.getWriter().write("Tenant not found");
                return false;
            }

            if (tenantInfo.getStatus() != TenantInfo.TenantStatus.ACTIVE) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("Tenant is not active");
                return false;
            }

            TenantContext.setTenantInfo(tenantInfo);
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

**新建文件**: services/api-common/src/main/java/com/example/common/tenant/TenantDataSourceRouter.java

```java
package com.example.common.tenant;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

public class TenantDataSourceRouter extends AbstractRoutingDataSource {

    @Override
    protected Object determineCurrentLookupKey() {
        return TenantContext.getTenantId();
    }
}
```

**新建文件**: services/api-common/src/main/java/com/example/common/tenant/TenantDataSourceConfig.java

```java
package com.example.common.tenant;

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
        dataSources.put("default", createDataSource(
            tenantProperties.getDefaultDatabase()));

        // 各租户数据源
        tenantProperties.getTenants().forEach((tenantId, config) -> {
            dataSources.put(tenantId, createDataSource(config.getDatabase()));
            log.info("注册租户数据源: {}", tenantId);
        });

        router.setTargetDataSources(dataSources);
        router.setDefaultTargetDataSource(dataSources.get("default"));

        return router;
    }

    private DataSource createDataSource(DatabaseConfig config) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(config.getUrl());
        ds.setUsername(config.getUsername());
        ds.setPassword(config.getPassword());
        ds.setDriverClassName(config.getDriverClassName());
        ds.setMaximumPoolSize(config.getMaxPoolSize());
        return ds;
    }
}
```

### Step 3.3.5: 租户配置属性

**新建文件**: services/api-common/src/main/java/com/example/common/tenant/TenantProperties.java

```java
package com.example.common.tenant;

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
        private ResourceQuota quota;
    }

    @Data
    public static class DatabaseConfig {
        private String url;
        private String username;
        private String password;
        private String driverClassName = "com.mysql.cj.jdbc.Driver";
        private int maxPoolSize = 10;
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

**新建文件**: services/api-common/src/main/java/com/example/common/tenant/TenantFeignInterceptor.java

```java
package com.example.common.tenant;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.stereotype.Component;

@Component
public class TenantFeignInterceptor implements RequestInterceptor {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    @Override
    public void apply(RequestTemplate template) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null) {
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
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# 先复制 pom.xml，利用 Docker 缓存
COPY pom.xml .
COPY api-common/pom.xml api-common/
COPY user-service/pom.xml user-service/

# 下载依赖（这层会被缓存）
RUN mvn dependency:go-offline -B

# 复制源代码
COPY api-common/src api-common/src
COPY user-service/src user-service/src

# 构建
RUN mvn clean package -DskipTests -pl user-service -am

# ============================================
# Stage 2: Runtime
# ============================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 安全：创建非 root 用户
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser

# 复制构建产物
COPY --from=builder /app/user-service/target/user-service-*.jar app.jar

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -q --spider http://localhost:8081/actuator/health || exit 1

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

### Phase 3.1: Seata 分布式事务
- [ ] Seata Server 运行正常
- [ ] Seata 控制台可访问 (http://localhost:7091)
- [ ] 订单创建事务成功提交
- [ ] 余额不足时事务正确回滚
- [ ] UNDO_LOG 表记录正常

### Phase 3.2: Activiti 工作流
- [ ] Activiti 数据库表创建成功
- [ ] 订单审批流程部署成功
- [ ] 小额订单自动审批
- [ ] 普通订单主管审批
- [ ] 大额订单经理审批
- [ ] 审批拒绝流程正常

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
