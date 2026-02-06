# Phase 3: 企业功能增强 (第5-8周)

## 概览

- 分布式事务 (Seata)
- 工作流引擎 (Activiti)
- 多租户隔离
- Kubernetes 部署

## Phase 3.1: 分布式事务 (Seata)

**目标**: 解决 Order 创建时 User 余额扣除的分布式事务问题

**核心步骤**:
- Seata Server 部署
- TC/TM/RM 配置
- 事务注解标记
- 补偿流程设计

## Phase 3.2: 工作流引擎 (Activiti)

**目标**: 订单审批/权限申请等工作流

**核心步骤**:
- Activiti 集成
- BPMN 流程定义
- 流程实例管理
- 任务分派与追踪

## Phase 3.3: 多租户隔离

**目标**: 支持 SaaS 模式的数据隔离

**核心步骤**:
- 租户上下文传递
- 数据路由与隔离
- 资源配额管理
- 租户自助管理

## Phase 3.4: Kubernetes 部署

**目标**: 云原生部署与自动扩展

**核心步骤**:
- Dockerfile 优化
- Service/Ingress 配置
- 资源请求与限制
- 自动水平扩展
