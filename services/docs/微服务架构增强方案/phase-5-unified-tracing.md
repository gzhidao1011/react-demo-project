# Phase 5: 统一追踪 (第11-12周)

**TL;DR**: 统一 Trace 传递与日志关联, 补齐分布式链路的全链路一致性

## 阶段目标

- 统一 Trace 上下文 (HTTP + RPC + Kafka)
- 日志与 Trace 关联 (traceId/spanId)
- 网关到服务链路完整可视
- 采样与异常策略一致

## 现状提醒

父 POM 已包含 SkyWalking/Micrometer 相关依赖, 但是否在所有服务完整接入需要确认。

---

## Step 5.1: 明确 Trace 传播标准

- HTTP: W3C Trace Context 或 B3
- RPC/Dubbo: 统一透传 Trace
- Kafka: 消息头携带 Trace 上下文

**完成标准**:
- 网关 -> 服务 -> Kafka -> 服务的 traceId 一致

---

## Step 5.2: 服务端接入规范化

- 统一 agent/SDK 版本与启动参数
- 统一 service name 规则
- 统一采样率策略 (错误 100% 采样)

**示例**: 统一以 spring.application.name 作为服务名

---

## Step 5.3: 日志关联 TraceId

**文件**: services/*/src/main/resources/logback-spring.xml

```xml
<pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg traceId=%X{traceId} spanId=%X{spanId}%n</pattern>
```

**完成标准**:
- Kibana 或日志平台可按 traceId 查询完整调用链

---

## Step 5.4: 网关链路与超时统一

- 网关生成/透传 traceId
- 统一超时与重试策略, 避免链路断裂
- 关键错误标记进入追踪链

---

## 验收标准

- [ ] 5 个服务 traceId 一致可追踪
- [ ] 网关与下游服务链路完整
- [ ] Kafka 消息链路可追踪
- [ ] 日志与 TraceId 关联可用
- [ ] 采样/错误策略统一
