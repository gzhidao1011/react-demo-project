# 资源清单

## Phase 1 & 2 新建文件

```
services/
├── docker/
│   ├── prometheus.yml               [已创建] Phase 1
│   ├── logstash.conf                [已创建] Phase 1
│   ├── alert-rules.yml              [已创建] Phase 1
│   └── grafana/
│       └── provisioning/            [已创建] Phase 1
│
├── api-common/src/main/java/com/example/api/event/
│   └── UserCreatedEvent.java        [已创建] Phase 2 - 共享事件类
│
├── auth-service/src/main/
│   ├── resources/logback-spring.xml [已创建] Phase 1
│   └── java/com/example/auth/
│       ├── config/KafkaConsumerConfig.java  [已创建] Phase 2
│       └── event/UserEventListener.java     [已创建] Phase 2
│
├── user-service/src/main/
│   ├── resources/logback-spring.xml [已创建] Phase 1
│   └── java/com/example/user/
│       ├── config/KafkaProducerConfig.java  [已创建] Phase 2
│       └── event/
│           ├── UserCreatedEvent.java        [已创建] Phase 2 (deprecated wrapper)
│           └── UserEventPublisher.java      [已创建] Phase 2
│
├── order-service/src/main/
│   ├── resources/logback-spring.xml [已创建] Phase 1
│   └── java/com/example/order/
│       ├── config/KafkaConsumerConfig.java  [已创建] Phase 2
│       └── event/UserEventListener.java     [已创建] Phase 2
│
├── chat-service/src/main/resources/
│   └── logback-spring.xml           [已创建] Phase 1
│
├── api-gateway/src/main/resources/
│   └── logback-spring.xml           [已创建] Phase 1
│
└── docs/微服务架构增强方案/          [已创建] 拆分文档
    ├── README.md
    ├── overview.md
    ├── phase-1-observability.md
    ├── phase-2-event-driven.md
    ├── phase-3-enterprise.md
    ├── phase-4-config-center.md
    ├── phase-5-unified-tracing.md
    ├── phase-6-api-contracts.md
    ├── checklists.md
    ├── timeline-and-kpi.md
    ├── resources-and-files.md
    └── notes-and-troubleshooting.md
```

## Phase 1 & 2 修改的文件

```
services/
├── pom.xml                          [已修改] Skywalking/Micrometer/Logstash 依赖
├── docker-compose.yml               [已修改] ELK/Prometheus/Grafana/Skywalking/Kafka
│
├── auth-service/
│   ├── pom.xml                      [已修改] spring-kafka 依赖
│   └── src/main/resources/application.yml [已修改] Kafka 配置
│
├── user-service/
│   ├── pom.xml                      [已修改] spring-kafka 依赖
│   ├── src/main/resources/application.yml [已修改] Kafka 配置
│   └── src/main/java/com/example/user/
│       ├── controller/internal/InternalApiController.java [已修改] 事件发布
│       ├── service/UserManagementService.java             [已修改] 事件发布
│       └── service/AdminInitializationService.java        [已修改] 事件发布
│
├── order-service/
│   ├── pom.xml                      [已修改] spring-kafka 依赖
│   └── src/main/resources/application.yml [已修改] Kafka 配置
│
├── chat-service/
│   └── src/main/resources/application.yml [已修改] Prometheus 端点
│
└── api-gateway/
    └── src/main/resources/application.yml [已修改] Prometheus 端点
```
