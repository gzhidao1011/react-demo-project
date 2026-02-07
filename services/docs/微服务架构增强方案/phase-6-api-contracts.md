# Phase 6: API 文档与契约 (第13-14周)

**TL;DR**: 统一 OpenAPI/AsyncAPI, 建立可验证的 API 契约与 CI 校验流程

## 阶段目标

- REST API 文档标准化 (OpenAPI 3)
- 事件模型标准化 (AsyncAPI)
- API 变更可验证, 可回归
- 对外团队协作有明确契约与版本策略

---

## Step 6.1: REST API 统一 OpenAPI

- 引入 springdoc-openapi
- 统一 API 分组与版本
- 网关层聚合文档 (可选)

**完成标准**:
- 5 个服务的 OpenAPI 可访问
- 对外 API 具备统一版本策略 (v1/v2)

---

## Step 6.2: 事件契约 AsyncAPI

- 为 Kafka 事件定义 AsyncAPI 文档
- 标准化事件命名与字段
- 发布事件契约到文档站点或仓库

**完成标准**:
- user-created-events 事件有 AsyncAPI 定义
- 事件字段变更需通过契约校验

---

## Step 6.3: CI 集成契约校验

- OpenAPI lint/validate
- AsyncAPI lint/validate
- PR 阶段阻断不兼容变更

---

## Step 6.4: 契约测试 (可选)

- 消费者驱动契约 (Pact)
- 自动回归关键端点与事件

---

## 验收标准

- [ ] REST API 有统一 OpenAPI 输出
- [ ] Kafka 事件有 AsyncAPI 文档
- [ ] CI 对契约变更有校验与阻断
- [ ] API 版本管理规则明确
