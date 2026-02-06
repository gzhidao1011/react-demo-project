# 注意事项与故障排查

## 版本兼容性

```
✓ Java 17 + Spring Boot 3.2.0 + Spring Cloud 2023.0.0
✓ Skywalking 9.7.0 + micrometer-tracing 1.2.0
✓ Prometheus 2.47+ + Grafana 10+
✓ ELK 8.10+
✓ Kafka 7.5.0 (Confluent)
✓ Spring Kafka 3.1.0
```

## Phase 2 实现验证 (2026-02-05)

```
编译验证:
✅ api-common      - SUCCESS
✅ user-service    - SUCCESS (KafkaProducerConfig, UserEventPublisher)
✅ auth-service    - SUCCESS (KafkaConsumerConfig, UserEventListener)
✅ order-service   - SUCCESS (KafkaConsumerConfig, UserEventListener)
✅ api-gateway     - SUCCESS
⚠️ chat-service    - 已有编译错误（与 Kafka 无关，ConversationMeta 构造器问题）

事件发布调用点:
✅ InternalApiController.createUser()        - 用户注册
✅ UserManagementService.createUser()        - 管理员创建
✅ AdminInitializationService.initializeAdmin() - Admin 初始化
```

## 性能考虑

- Skywalking 采样率: 100% (开发) -> 10-20% (生产)
- Prometheus 数据保留: 30 天 (推荐)
- Elasticsearch 分片: 3 分片 x 1 副本 (开发) -> 3 x 3 (生产)
- Kafka 分区: 3 个 (开发) -> 按吞吐调整 (生产)

## 安全加固

- Elasticsearch 启用认证 (xpack.security.enabled=true)
- Kafka 启用 SASL 认证
- Prometheus 隐藏在网关后 (避免公网暴露)
- Kibana/Grafana 改强密码
- 采样数据脱敏 (PII 处理)

## 故障排查

**Phase 1 - 可观测性**
- Skywalking 无链路: 检查 -javaagent 参数与 skywalking-agent.jar 路径
- Prometheus 采集 DOWN: 检查防火墙与 /actuator/prometheus 访问
- Kibana 无日志: 检查 logstash.conf TCP 端口与 logback 配置

**Phase 2 - Kafka**
- Kafka 消费不到: 检查 groupId 与 bootstrap-servers 配置
- 无法连接 Kafka: Docker 环境用 kafka:29092，本地开发用 localhost:9092
- 序列化错误: 确保 JsonDeserializer.TRUSTED_PACKAGES 包含 com.example.*
- 事件丢失: 检查 acks=all 配置和 Consumer auto-offset-reset 设置
