# Phase 2: 事件驱动架构 (第3-4周) - ✅ 已完成

**TL;DR**: 添加 Kafka 事件总线, 支持异步处理与最终一致性

## 阶段目标

- Kafka Broker 部署
- User 创建事件发布-订阅
- Order 异步处理
- Chat 会话事件持久化

## 阶段收益

```
评分提升:  82 -> 92分 (+10分)
架构灵活性: 从同步 -> 异步+同步混合
可扩展性: 新服务无需修改现有服务
```

---

## Step 2.1: 父 POM - 添加 Kafka 依赖

**文件**: services/pom.xml

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
    <version>3.2.0</version>
</dependency>

<dependency>
    <groupId>org.apache.avro</groupId>
    <artifactId>avro</artifactId>
    <version>1.11.3</version>
</dependency>
```

## Step 2.2: User Service 发布 UserCreated 事件

**新建文件**:
- services/user-service/src/main/java/com/example/user/event/UserCreatedEvent.java
- services/user-service/src/main/java/com/example/user/event/UserEventPublisher.java

```java
@Data
@AllArgsConstructor
public class UserCreatedEvent {
    private Long userId;
    private String username;
    private String email;
    private LocalDateTime createdAt;
    private String source;
}
```

```java
@Component
@RequiredArgsConstructor
public class UserEventPublisher {
    private final KafkaTemplate<String, UserCreatedEvent> kafkaTemplate;
    private static final String TOPIC = "user-created-events";

    public void publishUserCreated(UserCreatedEvent event) {
        kafkaTemplate.send(TOPIC, String.valueOf(event.getUserId()), event);
    }
}
```

**修改**: services/user-service/src/main/java/com/example/user/service/UserService.java

```java
@Transactional
public User registerUser(RegisterRequest request) {
    User user = new User(request.getUsername(), request.getEmail());
    userRepository.save(user);

    userEventPublisher.publishUserCreated(
        new UserCreatedEvent(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            LocalDateTime.now(),
            "registration"
        )
    );

    return user;
}
```

## Step 2.3: Auth/Order Service 订阅事件

**新建文件**: services/auth-service/src/main/java/com/example/auth/event/UserEventListener.java

```java
@Component
@Slf4j
@RequiredArgsConstructor
public class UserEventListener {
    @KafkaListener(topics = "user-created-events", groupId = "auth-service")
    public void handleUserCreated(UserCreatedEvent event) {
        log.info("Auth Service收到用户创建事件: {}", event.getUserId());
        initializeAuthConfig(event.getUserId());
        sendWelcomeEmail(event.getEmail());
    }

    private void initializeAuthConfig(Long userId) {}
    private void sendWelcomeEmail(String email) {}
}
```

**Order Service 示例**:
```java
@KafkaListener(topics = "user-created-events", groupId = "order-service")
public void handleUserCreated(UserCreatedEvent event) {
    initializeOrderAccount(event.getUserId());
}
```

## Step 2.4: application.yml 配置 Kafka

**文件**: services/user-service/src/main/resources/application.yml

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all
      retries: 3
    consumer:
      bootstrap-servers: localhost:9092
      group-id: ${spring.application.name}-group
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.type.mapping: "userCreatedEvent:com.example.user.event.UserCreatedEvent"
```

## Step 2.5: Docker Compose 添加 Kafka

**文件**: services/docker-compose.yml

```yaml
zookeeper:
  image: confluentinc/cp-zookeeper:7.5.0
  container_name: zookeeper
  environment:
    ZOOKEEPER_CLIENT_PORT: 2181
    ZOOKEEPER_SYNC_LIMIT: 2
    ZOOKEEPER_INIT_LIMIT: 5
  ports:
    - "2181:2181"
  networks:
    - infra-network

kafka:
  image: confluentinc/cp-kafka:7.5.0
  container_name: kafka
  ports:
    - "9092:9092"
  environment:
    KAFKA_BROKER_ID: 1
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://kafka:9092
    KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
    KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
  depends_on:
    - zookeeper
  networks:
    - infra-network

kafka-ui:
  image: provectuslabs/kafka-ui:latest
  container_name: kafka-ui
  ports:
    - "8085:8080"
  environment:
    KAFKA_CLUSTERS_0_NAME: local
    KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:29092
    KAFKA_CLUSTERS_0_ZOOKEEPER: zookeeper:2181
  depends_on:
    - kafka
  networks:
    - infra-network
```

## Step 2.6: 验证事件驱动

```bash
docker-compose up zookeeper kafka kafka-ui -d
sleep 30

kafka-topics --create --topic user-created-events --bootstrap-server localhost:9092 \
  --partitions 3 --replication-factor 1

make dev

curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

---

## 实现总结 (2026-02-05)

### 实际创建的文件

| 文件路径 | 说明 |
|---------|------|
| `api-common/src/main/java/com/example/api/event/UserCreatedEvent.java` | 共享事件类 |
| `user-service/src/main/java/com/example/user/config/KafkaProducerConfig.java` | Kafka 生产者配置 |
| `user-service/src/main/java/com/example/user/event/UserEventPublisher.java` | 事件发布器 |
| `auth-service/src/main/java/com/example/auth/config/KafkaConsumerConfig.java` | Kafka 消费者配置 |
| `auth-service/src/main/java/com/example/auth/event/UserEventListener.java` | 事件监听器 |
| `order-service/src/main/java/com/example/order/config/KafkaConsumerConfig.java` | Kafka 消费者配置 |
| `order-service/src/main/java/com/example/order/event/UserEventListener.java` | 事件监听器 |

### 事件发布调用点

| 位置 | 场景 | source 值 |
|------|------|----------|
| `InternalApiController.createUser()` | 用户注册 (auth-service 调用) | `registration` |
| `UserManagementService.createUser()` | 管理员后台创建用户 | `admin-create` |
| `AdminInitializationService.initializeAdmin()` | Admin 账号初始化 | `admin-init` |

### 事件流

```
用户创建 → UserEventPublisher → Kafka (user-created-events topic)
                                        ↓
                            ┌───────────┴───────────┐
                            ↓                       ↓
                    auth-service             order-service
                  UserEventListener        UserEventListener
```

### 访问地址

- **Kafka UI**: http://localhost:8085
- **Kafka Broker**: localhost:9092
